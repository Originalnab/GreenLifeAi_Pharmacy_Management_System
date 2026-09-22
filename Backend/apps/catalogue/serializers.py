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
    category_name = serializers.CharField(source='category.name', read_only=True)
    dosage_form_name = serializers.CharField(source='dosage_form.name', read_only=True)
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

class ImportJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImportJob
        fields = [
            'id', 'branch', 'file_name', 'total_rows',
            'valid_rows', 'status', 'errors', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
