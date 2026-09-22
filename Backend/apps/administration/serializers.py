from rest_framework import serializers
from .models import Organization, Branch, StorageLocation
from apps.authentication.models import User, UserAuthorization

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = '__all__'

class BranchSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.trading_name', read_only=True)

    class Meta:
        model = Branch
        fields = '__all__'

class StorageLocationSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = StorageLocation
        fields = '__all__'

class CreateStaffUserSerializer(serializers.ModelSerializer):
    dob = serializers.DateField(required=True)
    phone = serializers.CharField(required=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'name', 'first_name',
            'middle_name', 'last_name', 'dob', 'phone', 'alternate_phone',
            'role', 'license_number', 'branch'
        ]
        read_only_fields = ['id', 'name']
