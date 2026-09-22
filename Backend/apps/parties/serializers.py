import uuid
from rest_framework import serializers
from .models import Supplier, Customer

class SupplierSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.trading_name', read_only=True)
    phone = serializers.CharField(source='telephone', required=False)

    class Meta:
        model = Supplier
        fields = [
            'id', 'organization', 'organization_name', 'code', 'name',
            'tax_number', 'contact_person', 'telephone', 'phone', 'email',
            'address', 'payment_terms_days', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'organization', 'created_at', 'updated_at']

    def to_internal_value(self, data):
        data = data.copy()
        if not data.get('code'):
            data['code'] = f"SUP-{uuid.uuid4().hex[:6].upper()}"
        if not data.get('telephone') and data.get('phone'):
            data['telephone'] = data['phone']
        return super().to_internal_value(data)

class CustomerSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = Customer
        fields = [
            'id', 'branch', 'branch_name', 'customer_code', 'name',
            'phone', 'email', 'address', 'credit_limit',
            'current_credit_balance', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'branch', 'created_at', 'updated_at']

    def to_internal_value(self, data):
        data = data.copy()
        if not data.get('customer_code'):
            data['customer_code'] = f"CUST-{uuid.uuid4().hex[:6].upper()}"
        return super().to_internal_value(data)
