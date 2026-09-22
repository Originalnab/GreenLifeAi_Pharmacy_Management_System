import uuid
from decimal import Decimal
from rest_framework import serializers
from .models import ExpenseCategory, Expense, DailyCashUp, BusinessLoan

class ExpenseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = ['id', 'code', 'name', 'description', 'is_active']
        read_only_fields = ['id']

    def to_internal_value(self, data):
        data = data.copy()
        if not data.get('code'):
            data['code'] = f"CAT-{uuid.uuid4().hex[:6].upper()}"
        return super().to_internal_value(data)

class ExpenseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.name', read_only=True)

    class Meta:
        model = Expense
        fields = [
            'id', 'branch', 'category', 'category_name', 'voucher_number',
            'amount', 'payment_method', 'disbursed_to', 'purpose',
            'approved_by', 'approved_by_name', 'receipt_url', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class DailyCashUpSerializer(serializers.ModelSerializer):
    reconciled_by_name = serializers.CharField(source='reconciled_by.name', read_only=True)

    class Meta:
        model = DailyCashUp
        fields = [
            'id', 'branch', 'cash_up_date', 'opening_float',
            'total_cash_sales', 'total_card_sales', 'total_transfer_sales',
            'total_expenses_cash', 'expected_cash_in_drawer',
            'actual_counted_cash', 'cash_variance', 'status',
            'reconciled_by', 'reconciled_by_name', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class BusinessLoanSerializer(serializers.ModelSerializer):
    remaining_balance = serializers.SerializerMethodField()

    class Meta:
        model = BusinessLoan
        fields = [
            'id', 'branch', 'borrower_name', 'principal_amount',
            'interest_rate_percent', 'total_repayable_amount',
            'total_repaid_amount', 'remaining_balance', 'status',
            'due_date', 'created_at'
        ]
        read_only_fields = ['id', 'branch', 'created_at']

    def to_internal_value(self, data):
        data = data.copy()
        if not data.get('borrower_name') and data.get('lender_name'):
            data['borrower_name'] = data['lender_name']
        if not data.get('total_repayable_amount') and data.get('principal_amount'):
            principal = Decimal(str(data['principal_amount']))
            rate = Decimal(str(data.get('interest_rate_percent', '0.00')))
            data['total_repayable_amount'] = str((principal * (Decimal('1.0') + (rate / Decimal('100.0')))).quantize(Decimal('0.0001')))
        elif data.get('total_repayable_amount'):
            data['total_repayable_amount'] = str(Decimal(str(data['total_repayable_amount'])).quantize(Decimal('0.0001')))
        return super().to_internal_value(data)

    def get_remaining_balance(self, obj):
        return obj.total_repayable_amount - obj.total_repaid_amount
