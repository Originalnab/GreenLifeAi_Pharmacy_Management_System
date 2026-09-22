from rest_framework import serializers
from .models import (
    CashShift, Sale, SaleLine, SaleTender,
    DraftSale, SaleReturn, CustomerCreditNote, CreditPayment
)

class CashShiftSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    reconciled_by_name = serializers.CharField(source='reconciled_by.name', read_only=True)

    class Meta:
        model = CashShift
        fields = [
            'id', 'branch', 'user', 'user_name', 'shift_number',
            'opening_float', 'opened_at', 'closed_at', 'status',
            'closing_counted_cash', 'closing_system_expected_cash',
            'discrepancy_amount', 'reconciled_by', 'reconciled_by_name',
            'reconciliation_notes'
        ]
        read_only_fields = ['id', 'opened_at']

class SaleLineSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.brand_name', read_only=True)
    product_code = serializers.CharField(source='product.product_code', read_only=True)
    batch_number = serializers.CharField(source='batch.batch_number', read_only=True)

    class Meta:
        model = SaleLine
        fields = [
            'id', 'product', 'product_name', 'product_code',
            'batch', 'batch_number', 'packaging_unit_name',
            'multiplier_to_base', 'quantity_dispensed_units',
            'total_quantity_base', 'unit_selling_price', 'unit_cost_price',
            'discount_percent', 'total_line_amount', 'total_line_cost',
            'total_line_profit', 'dosage_instructions'
        ]
        read_only_fields = ['id']

class SaleTenderSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaleTender
        fields = [
            'id', 'tender_method', 'amount_tendered', 'amount_paid',
            'change_given', 'transaction_reference', 'tender_notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class SaleSerializer(serializers.ModelSerializer):
    cashier_name = serializers.CharField(source='cashier.name', read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    pharmacist_name = serializers.CharField(source='pharmacist_verified_by.name', read_only=True)
    lines = SaleLineSerializer(many=True, read_only=True)
    tenders = SaleTenderSerializer(many=True, read_only=True)

    class Meta:
        model = Sale
        fields = [
            'id', 'branch', 'cash_shift', 'cashier', 'cashier_name',
            'customer', 'customer_name', 'receipt_number', 'sale_type',
            'subtotal', 'discount_amount', 'tax_amount', 'total_amount',
            'total_cost_amount', 'gross_profit_amount', 'status',
            'is_credit_sale', 'credit_due_date', 'credit_amount_paid',
            'pharmacist_verified_by', 'pharmacist_name',
            'prescribing_doctor_name', 'doctor_license_number',
            'patient_prescription_number', 'lines', 'tenders', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class DraftSaleSerializer(serializers.ModelSerializer):
    cashier_name = serializers.CharField(source='cashier.name', read_only=True)

    class Meta:
        model = DraftSale
        fields = [
            'id', 'branch', 'cashier', 'cashier_name',
            'draft_number', 'title', 'notes', 'cart_payload',
            'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'branch', 'cashier', 'draft_number', 'created_at', 'updated_at']

    def to_internal_value(self, data):
        data = data.copy()
        if not data.get('title') and data.get('customer_name'):
            data['title'] = data['customer_name']
        elif not data.get('title'):
            data['title'] = 'Dispensary Draft Sale'
        if not data.get('cart_payload') and data.get('cart_data'):
            data['cart_payload'] = data['cart_data']
        return super().to_internal_value(data)

class SaleReturnSerializer(serializers.ModelSerializer):
    returned_by_name = serializers.CharField(source='returned_by.name', read_only=True)
    original_receipt_number = serializers.CharField(source='original_sale.receipt_number', read_only=True)

    class Meta:
        model = SaleReturn
        fields = [
            'id', 'branch', 'original_sale', 'original_receipt_number',
            'return_number', 'returned_by', 'returned_by_name',
            'refund_method', 'total_refund_amount', 'return_reason',
            'is_restocked_to_inventory', 'condition_assessment', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class CustomerCreditNoteSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    issued_by_name = serializers.CharField(source='issued_by.name', read_only=True)

    class Meta:
        model = CustomerCreditNote
        fields = [
            'id', 'branch', 'customer', 'customer_name',
            'credit_note_number', 'original_amount', 'remaining_balance',
            'status', 'issued_by', 'issued_by_name', 'expiry_date', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class CreditPaymentSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.name', read_only=True)

    class Meta:
        model = CreditPayment
        fields = [
            'id', 'customer', 'customer_name', 'sale',
            'receipt_number', 'amount_paid', 'payment_method',
            'reference', 'recorded_by', 'recorded_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
