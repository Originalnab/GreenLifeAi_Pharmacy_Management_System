from rest_framework import serializers
from .models import Batch, StockBalance, StockMovement, StockAdjustment
from .services import FEFOEngine

class BatchSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.brand_name', read_only=True)
    product_code = serializers.CharField(source='product.product_code', read_only=True)
    storage_location_name = serializers.CharField(source='storage_location.name', read_only=True)
    expiry_risk = serializers.SerializerMethodField()
    available_quantity_base = serializers.SerializerMethodField()
    quantity_on_hand_base = serializers.SerializerMethodField()

    class Meta:
        model = Batch
        fields = [
            'id', 'branch', 'product', 'product_name', 'product_code',
            'batch_number', 'expiry_date', 'manufacturing_date',
            'unit_cost_base', 'initial_quantity_base', 'quantity_on_hand_base',
            'available_quantity_base', 'storage_location',
            'storage_location_name', 'status', 'expiry_risk',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_expiry_risk(self, obj):
        return FEFOEngine.get_expiry_status(obj.expiry_date)

    def get_available_quantity_base(self, obj):
        balances = obj.stock_balances.all()
        if balances.exists():
            return float(sum(b.available_quantity_base for b in balances))
        return 0.0

    def get_quantity_on_hand_base(self, obj):
        balances = obj.stock_balances.all()
        if balances.exists():
            return float(sum(b.quantity_on_hand_base for b in balances))
        return 0.0

class StockBalanceSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.brand_name', read_only=True)
    product_code = serializers.CharField(source='product.product_code', read_only=True)
    batch_number = serializers.CharField(source='batch.batch_number', read_only=True)
    expiry_date = serializers.DateField(source='batch.expiry_date', read_only=True)
    storage_location_name = serializers.CharField(source='batch.storage_location.name', read_only=True)
    available_quantity_base = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)

    class Meta:
        model = StockBalance
        fields = [
            'id', 'branch', 'product', 'product_name', 'product_code',
            'batch', 'batch_number', 'expiry_date', 'storage_location_name',
            'quantity_on_hand_base', 'quantity_reserved_base',
            'available_quantity_base', 'updated_at'
        ]
        read_only_fields = ['id', 'updated_at']

class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='batch.product.brand_name', read_only=True)
    batch_number = serializers.CharField(source='batch.batch_number', read_only=True)
    performed_by_name = serializers.CharField(source='performed_by.name', read_only=True)

    class Meta:
        model = StockMovement
        fields = [
            'id', 'branch', 'batch', 'product_name', 'batch_number',
            'movement_type', 'quantity_change_base', 'balance_after_base',
            'reference_type', 'reference_id', 'unit_cost_snapshot',
            'total_cost_snapshot', 'performed_by', 'performed_by_name',
            'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class StockAdjustmentSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='batch.product.brand_name', read_only=True)
    batch_number = serializers.CharField(source='batch.batch_number', read_only=True)
    authorized_by_name = serializers.CharField(source='authorized_by.name', read_only=True)

    class Meta:
        model = StockAdjustment
        fields = [
            'id', 'branch', 'batch', 'product_name', 'batch_number',
            'previous_quantity_base', 'counted_quantity_base', 'variance_base',
            'reason', 'authorized_by', 'authorized_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'branch', 'authorized_by', 'created_at']
