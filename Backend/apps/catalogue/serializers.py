from rest_framework import serializers
from decimal import Decimal
from .models import (
    Category, DosageForm, UnitOfMeasure, DosagePreset,
    Product, ProductPackagingUnit, StockAlertRule, ImportJob
)

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'code', 'name', 'description', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class DosageFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = DosageForm
        fields = ['id', 'code', 'name', 'default_base_unit', 'is_active']
        read_only_fields = ['id']

class UnitOfMeasureSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnitOfMeasure
        fields = ['id', 'code', 'name', 'symbol', 'type']
        read_only_fields = ['id']

class DosagePresetSerializer(serializers.ModelSerializer):
    class Meta:
        model = DosagePreset
        fields = ['id', 'name', 'instruction', 'frequency', 'duration_days', 'is_active']
        read_only_fields = ['id']

class ProductPackagingUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductPackagingUnit
        fields = [
            'id', 'product', 'tier_name', 'unit_label',
            'multiplier_to_base', 'wholesale_cost', 'retail_selling_price',
            'barcode', 'is_dispensable', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class StockAlertRuleSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.brand_name', read_only=True)

    class Meta:
        model = StockAlertRule
        fields = [
            'id', 'branch', 'product', 'product_name',
            'min_days_to_expiry', 'critical_stock_threshold',
            'action_required', 'is_active'
        ]
        read_only_fields = ['id']

class ProductSerializer(serializers.ModelSerializer):
    product_code = serializers.CharField(required=False, allow_blank=True)
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), required=False, allow_null=True)
    dosage_form = serializers.PrimaryKeyRelatedField(queryset=DosageForm.objects.all(), required=False, allow_null=True)
    category_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    dosage_form_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    packaging_units = ProductPackagingUnitSerializer(many=True, read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'branch', 'branch_name', 'product_code', 'brand_name', 'generic_name',
            'barcode', 'category', 'category_name', 'dosage_form', 'dosage_form_name',
            'strength', 'base_dispensing_unit', 'strip_multiplier', 'pack_box_multiplier',
            'cost_price_base', 'selling_price_base', 'reorder_level_base', 'maximum_stock_base',
            'is_prescription_required', 'is_controlled_substance', 'storage_condition',
            'pregnancy_category', 'max_daily_dose', 'clinical_notes', 'is_active',
            'packaging_units', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'product_code': {'validators': []}
        }

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        import uuid

        # Check category
        raw_cat = data.get('category') or data.get('categoryId') or data.get('category_id')
        if raw_cat is not None:
            is_valid_uuid = False
            try:
                uuid.UUID(str(raw_cat))
                is_valid_uuid = True
            except Exception:
                is_valid_uuid = False

            if not is_valid_uuid:
                if not data.get('category_name'):
                    data['category_name'] = str(raw_cat)
                data.pop('category', None)
                data.pop('categoryId', None)
                data.pop('category_id', None)

        # Check dosage form
        raw_df = data.get('dosage_form') or data.get('dosageForm') or data.get('dosage_form_id')
        if raw_df is not None:
            is_valid_uuid = False
            try:
                uuid.UUID(str(raw_df))
                is_valid_uuid = True
            except Exception:
                is_valid_uuid = False

            if not is_valid_uuid:
                if not data.get('dosage_form_name'):
                    data['dosage_form_name'] = str(raw_df)
                data.pop('dosage_form', None)
                data.pop('dosageForm', None)
                data.pop('dosage_form_id', None)

        return super().to_internal_value(data)

    def validate(self, attrs):
        import uuid
        # 1. Resolve Category
        category = attrs.get('category')
        cat_name = self.initial_data.get('category_name') or self.initial_data.get('category')
        if not category:
            if cat_name and isinstance(cat_name, str):
                cat = Category.objects.filter(name__iexact=cat_name.strip()).first()
                if not cat:
                    clean_code = ''.join(c for c in cat_name if c.isalnum())[:8].upper() or 'GEN'
                    cat, _ = Category.objects.get_or_create(code=clean_code, defaults={'name': cat_name.strip()})
                attrs['category'] = cat
            else:
                cat = Category.objects.first()
                if not cat:
                    cat = Category.objects.create(code='GEN', name='General Pharmaceuticals')
                attrs['category'] = cat

        # 2. Resolve Dosage Form
        dosage_form = attrs.get('dosage_form')
        form_name = self.initial_data.get('dosage_form_name') or self.initial_data.get('dosage_form')
        if not dosage_form:
            if form_name and isinstance(form_name, str):
                df = DosageForm.objects.filter(name__iexact=form_name.strip()).first()
                if not df:
                    clean_fcode = ''.join(c for c in form_name if c.isalnum())[:4].upper() or 'TAB'
                    df, _ = DosageForm.objects.get_or_create(code=clean_fcode, defaults={'name': form_name.strip(), 'default_base_unit': form_name.strip()})
                attrs['dosage_form'] = df
            else:
                df = DosageForm.objects.first()
                if not df:
                    df = DosageForm.objects.create(code='TAB', name='Tablet', default_base_unit='Tablet')
                attrs['dosage_form'] = df

        # 3. Resolve generic_name if missing
        if not attrs.get('generic_name'):
            attrs['generic_name'] = attrs.get('brand_name', 'General Medicine')

        # 4. Resolve product_code (SKU) if missing or duplicate
        if not attrs.get('product_code'):
            attrs['product_code'] = f"MED-{uuid.uuid4().hex[:6].upper()}"
        elif Product.objects.filter(product_code=attrs['product_code']).exists() and not self.instance:
            attrs['product_code'] = f"{attrs['product_code']}-{uuid.uuid4().hex[:4].upper()}"
        # 5. Clean non-model fields so Model.create() never receives unexpected kwargs
        attrs.pop('category_name', None)
        attrs.pop('dosage_form_name', None)
        attrs.pop('packaging_units', None)

        return attrs

    def create(self, validated_data):
        validated_data.pop('category_name', None)
        validated_data.pop('dosage_form_name', None)
        validated_data.pop('packaging_units', None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop('category_name', None)
        validated_data.pop('dosage_form_name', None)
        validated_data.pop('packaging_units', None)
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['category_name'] = instance.category.name if instance.category else 'General'
        ret['dosage_form_name'] = instance.dosage_form.name if instance.dosage_form else 'Tablet'
        return ret

class ImportJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImportJob
        fields = [
            'id', 'branch', 'file_name', 'total_rows',
            'valid_rows', 'status', 'errors', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
