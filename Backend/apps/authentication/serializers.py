from rest_framework import serializers
from .models import User, UserAuthorization, CustomRole

class UserAuthorizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAuthorization
        fields = [
            'id', 'max_discount_percent', 'max_refund_limit',
            'stock_adjustment_limit', 'expense_approval_limit',
            'po_approval_limit', 'require_two_factor', 'can_override_price',
            'can_view_cost_prices', 'can_view_profits', 'sessions_active',
            'last_password_change', 'custom_permissions'
        ]

class UserSerializer(serializers.ModelSerializer):
    branch_id = serializers.UUIDField(source='branch.id', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    authorization = UserAuthorizationSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'name', 'first_name',
            'middle_name', 'last_name', 'dob', 'phone', 'alternate_phone',
            'role', 'primary_role', 'assigned_roles', 'license_number', 'avatar_url', 'is_active',
            'must_change_password', 'is_temporary_password',
            'password_reset_notice', 'branch_id', 'branch_name',
            'authorization', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField(required=False)
    username = serializers.CharField(required=False)
    password = serializers.CharField(required=True, write_only=True)
    remember_me = serializers.BooleanField(default=False)

    def validate(self, data):
        ident = data.get('identifier') or data.get('username')
        if not ident:
            raise serializers.ValidationError({"identifier": "Either identifier or username is required."})
        data['identifier'] = ident
        return data

class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, min_length=6, write_only=True)

class UnlockScreenSerializer(serializers.Serializer):
    password = serializers.CharField(required=True, write_only=True)

class CustomRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomRole
        fields = '__all__'
