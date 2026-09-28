from rest_framework import serializers
from .models import (
    PurchaseOrder, PurchaseOrderLine,
    GoodsReceiptNote, GoodsReceiptLine
)

class PurchaseOrderLineSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.brand_name', read_only=True)
    product_code = serializers.CharField(source='product.product_code', read_only=True)
    total_cost = serializers.DecimalField(max_digits=15, decimal_places=4, read_only=True)

    class Meta:
        model = PurchaseOrderLine
        fields = [
            'id', 'product', 'product_name', 'product_code',
            'quantity_ordered_base', 'unit_cost_base', 'total_cost'
        ]
        read_only_fields = ['id']

class PurchaseOrderSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    lines = PurchaseOrderLineSerializer(many=True, read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'branch', 'supplier', 'supplier_name', 'po_number',
            'status', 'total_estimated_cost', 'created_by',
            'created_by_name', 'approved_by', 'lines',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class GoodsReceiptLineSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.brand_name', read_only=True)
    product_code = serializers.CharField(source='product.product_code', read_only=True)
    total_cost = serializers.DecimalField(max_digits=15, decimal_places=4, read_only=True)

    class Meta:
        model = GoodsReceiptLine
        fields = [
            'id', 'product', 'product_name', 'product_code',
            'batch_number', 'expiry_date', 'quantity_received_base',
            'unit_cost_base', 'total_cost'
        ]
        read_only_fields = ['id']

class GoodsReceiptNoteSerializer(serializers.ModelSerializer):
    supplier_name = serializers.SerializerMethodField()
    received_by_name = serializers.SerializerMethodField()
    storage_location_name = serializers.SerializerMethodField()
    lines = GoodsReceiptLineSerializer(many=True, read_only=True)

    def get_supplier_name(self, obj):
        if obj.supplier and hasattr(obj.supplier, 'name'):
            return obj.supplier.name
        return 'Direct Stock Intake'

    def get_received_by_name(self, obj):
        if obj.received_by and hasattr(obj.received_by, 'name'):
            return obj.received_by.name
        return 'Administrator'

    def get_storage_location_name(self, obj):
        if obj.storage_location and hasattr(obj.storage_location, 'name'):
            return obj.storage_location.name
        return 'Main Dispensary Shelf'

    class Meta:
        model = GoodsReceiptNote
        fields = [
            'id', 'branch', 'purchase_order', 'supplier', 'supplier_name',
            'grn_number', 'supplier_invoice_number', 'total_invoice_amount',
            'received_by', 'received_by_name', 'storage_location',
            'storage_location_name', 'lines', 'received_at'
        ]
        read_only_fields = ['id', 'received_at']

