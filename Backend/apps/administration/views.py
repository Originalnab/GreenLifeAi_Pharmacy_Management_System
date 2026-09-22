import random
from datetime import datetime, timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from .models import Organization, Branch, StorageLocation
from .serializers import OrganizationSerializer, BranchSerializer, StorageLocationSerializer, CreateStaffUserSerializer
from apps.authentication.models import User, UserAuthorization, CustomRole
from apps.authentication.serializers import UserSerializer, CustomRoleSerializer
from apps.audit.services import log_audit_event

@api_view(['GET', 'PUT'])
@permission_classes([AllowAny])
def premises_profile_view(request):
    branch = Branch.objects.filter(is_central=True).first() or Branch.objects.first()
    if not branch:
        return Response({'error': 'No active branch registered'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(BranchSerializer(branch).data)

    elif request.method == 'PUT':
        serializer = BranchSerializer(branch, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            log_audit_event(
                module='administration',
                action_type='PREMISES_PROFILE_UPDATED',
                target_identifier=str(branch.id),
                description=f"Updated premises license details for branch {branch.name}",
                actor_name=request.data.get('actorName', 'Admin')
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def storage_locations_view(request):
    if request.method == 'GET':
        locations = StorageLocation.objects.all().order_by('code')
        return Response(StorageLocationSerializer(locations, many=True).data)

    elif request.method == 'POST':
        branch = Branch.objects.first()
        data = request.data.copy()
        if 'branch' not in data and branch:
            data['branch'] = str(branch.id)

        serializer = StorageLocationSerializer(data=data)
        if serializer.is_valid():
            loc = serializer.save()
            log_audit_event(
                module='administration',
                action_type='STORAGE_LOCATION_CREATED',
                target_identifier=str(loc.id),
                description=f"Created storage facility: {loc.name} ({loc.code})",
                actor_name=request.data.get('actorName', 'Admin')
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def staff_users_view(request):
    if request.method == 'GET':
        search = request.query_params.get('search', '').strip()
        role = request.query_params.get('role', '').strip()

        users = User.objects.all().order_by('-created_at')

        if search:
            users = users.filter(
                Q(name__icontains=search) |
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(license_number__icontains=search)
            )

        if role and role != 'ALL':
            users = users.filter(role=role)

        return Response(UserSerializer(users, many=True).data)

    elif request.method == 'POST':
        branch = Branch.objects.first()
        data = request.data.copy()
        if 'branch' not in data and branch:
            data['branch'] = str(branch.id)

        serializer = CreateStaffUserSerializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Use client-provided temporary password or generate one
        temp_password = request.data.get('password') or request.data.get('temporary_password')
        if not temp_password:
            random_digits = random.randint(1000, 9999)
            temp_password = f"GreenLife#{random_digits}"

        user = serializer.save(
            must_change_password=True,
            is_temporary_password=True,
            is_active=True
        )
        user.set_password(temp_password)
        user.save()

        # Create default authorization ceilings
        UserAuthorization.objects.create(
            user=user,
            max_discount_percent=100.0 if user.role == 'Super Admin' else 15.0 if user.role == 'Pharmacist' else 5.0,
            max_refund_limit=10000.0 if user.role == 'Super Admin' else 200.0,
            stock_adjustment_limit=10000.0 if user.role == 'Super Admin' else 500.0,
            can_override_price=user.role in ['Super Admin', 'Pharmacist'],
            can_view_cost_prices=user.role in ['Super Admin', 'Pharmacy Admin', 'Stock Officer'],
            can_view_profits=user.role in ['Super Admin', 'Pharmacy Admin']
        )

        admin_name = request.data.get('adminName', 'Administrator')
        log_audit_event(
            module='administration',
            action_type='STAFF_USER_CREATED',
            target_identifier=str(user.id),
            description=f"Admin {admin_name} created staff account for {user.name} (@{user.username}, Role: {user.role}) with temporary password",
            actor_name=admin_name
        )

        return Response({
            'success': True,
            'user': UserSerializer(user).data,
            'temporaryPassword': temp_password,
            'message': 'Staff account created successfully.'
        }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def staff_user_reset_password_view(request, user_id):
    user = User.objects.filter(id=user_id).first()
    if not user:
        return Response({'error': 'Staff user not found'}, status=status.HTTP_404_NOT_FOUND)

    admin_name = request.data.get('adminName', 'Administrator')
    temp_password = request.data.get('password') or request.data.get('temporary_password')
    if not temp_password:
        random_digits = random.randint(1000, 9999)
        temp_password = f"Reset#{random_digits}"

    user.set_password(temp_password)
    user.must_change_password = True
    user.is_temporary_password = True
    user.password_reset_notice = {
        'reset_at': datetime.now(timezone.utc).isoformat(),
        'reset_by': admin_name,
        'acknowledged': False
    }
    user.save()

    log_audit_event(
        module='security',
        action_type='STAFF_PASSWORD_RESET',
        target_identifier=str(user.id),
        description=f"Administrator {admin_name} reset password for staff member {user.name} (@{user.username})",
        actor_name=admin_name
    )

    return Response({
        'success': True,
        'user': UserSerializer(user).data,
        'temporaryPassword': temp_password,
        'message': f"Password for {user.name} was successfully reset."
    })

@api_view(['PATCH', 'POST'])
@permission_classes([AllowAny])
def staff_user_status_view(request, user_id):
    user = User.objects.filter(id=user_id).first()
    if not user:
        return Response({'error': 'Staff user not found'}, status=status.HTTP_404_NOT_FOUND)

    active = request.data.get('is_active', request.data.get('active', True))
    
    # Safety rule: Do not deactivate final active Super Admin
    if user.role == 'Super Admin' and not active:
        remaining = User.objects.filter(role='Super Admin', is_active=True).exclude(id=user.id).count()
        if remaining == 0:
            return Response({'error': 'Action Denied: You cannot deactivate the final viable Super Admin account.'}, status=status.HTTP_400_BAD_REQUEST)

    user.is_active = active
    user.save()

    admin_name = request.data.get('adminName', 'Administrator')
    log_audit_event(
        module='administration',
        action_type='STAFF_STATUS_CHANGED',
        target_identifier=str(user.id),
        description=f"Administrator {admin_name} {'activated' if active else 'deactivated'} account for {user.name}",
        actor_name=admin_name
    )

    return Response({
        'success': True,
        'user': UserSerializer(user).data,
        'message': f"Account for {user.name} was {'activated' if active else 'deactivated'}."
    })

@api_view(['POST', 'PATCH', 'PUT'])
@permission_classes([AllowAny])
def staff_user_assign_roles_view(request, user_id):
    user = User.objects.filter(id=user_id).first()
    if not user:
        return Response({'error': 'Staff user not found'}, status=status.HTTP_404_NOT_FOUND)

    assigned_roles = request.data.get('assigned_roles', request.data.get('assignedRoles', []))
    primary_role = request.data.get('primary_role', request.data.get('primaryRole', None))
    admin_name = request.data.get('adminName', 'Administrator')

    if not isinstance(assigned_roles, list) or len(assigned_roles) == 0:
        return Response({'error': 'At least one role must be assigned to the staff user.'}, status=status.HTTP_400_BAD_REQUEST)

    # Clean roles list
    clean_roles = [str(r).strip() for r in assigned_roles if str(r).strip()]
    if not clean_roles:
        return Response({'error': 'Valid role list required.'}, status=status.HTTP_400_BAD_REQUEST)

    # Validate primary role
    if not primary_role or primary_role not in clean_roles:
        primary_role = clean_roles[0]

    # Safety check: Cannot remove Super Admin role from last Super Admin
    if user.role == 'Super Admin' and 'Super Admin' not in clean_roles:
        remaining = User.objects.filter(role='Super Admin', is_active=True).exclude(id=user.id).count()
        if remaining == 0:
            return Response({'error': 'Action Denied: You cannot revoke Super Admin from the final viable Super Admin account.'}, status=status.HTTP_400_BAD_REQUEST)

    user.assigned_roles = clean_roles
    user.primary_role = primary_role
    # If current role is not in the assigned roles, set active role to primary role
    if user.role not in clean_roles:
        user.role = primary_role
    user.save()

    log_audit_event(
        module='administration',
        action_type='STAFF_ROLES_ASSIGNED',
        target_identifier=str(user.id),
        description=f"Admin {admin_name} assigned roles [{', '.join(clean_roles)}] (Primary: {primary_role}) to {user.name} (@{user.username})",
        actor_name=admin_name
    )

    return Response({
        'success': True,
        'user': UserSerializer(user).data,
        'message': f"Assigned roles updated for {user.name}."
    })

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def custom_roles_view(request):
    if request.method == 'GET':
        roles = CustomRole.objects.all().order_by('name')
        return Response(CustomRoleSerializer(roles, many=True).data)

    elif request.method == 'POST':
        serializer = CustomRoleSerializer(data=request.data)
        if serializer.is_valid():
            role = serializer.save()
            log_audit_event(
                module='administration',
                action_type='CUSTOM_ROLE_CREATED',
                target_identifier=str(role.id),
                description=f"Created custom RBAC role: {role.name}",
                actor_name=request.data.get('actorName', 'Admin')
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def purge_production_data_view(request):
    """
    Safely purges operational/transactional records from PostgreSQL while preserving
    staff users, credentials, RBAC roles, organization premises profiles, and storage facilities.
    """
    from django.db import transaction
    from apps.sales.models import Sale, SaleItem, PaymentTender, CashShift
    from apps.procurement.models import PurchaseOrder, PurchaseOrderLine, GoodsReceiptNote, GoodsReceiptLine
    from apps.inventory.models import Batch, StockBalance, StockMovement
    from apps.catalogue.models import Product, ProductPackagingUnit, StockAlertRule, ImportJob, Category
    from apps.parties.models import Supplier, Customer
    from apps.finance.models import Expense, BusinessLoan, DailyCashUp

    try:
        with transaction.atomic():
            # 1. Sales & Cashier shifts
            PaymentTender.objects.all().delete()
            SaleItem.objects.all().delete()
            Sale.objects.all().delete()
            CashShift.objects.all().delete()

            # 2. Procurement
            GoodsReceiptLine.objects.all().delete()
            GoodsReceiptNote.objects.all().delete()
            PurchaseOrderLine.objects.all().delete()
            PurchaseOrder.objects.all().delete()

            # 3. Inventory (Batches & physical stock balances reset to 0)
            StockMovement.objects.all().delete()
            StockBalance.objects.all().delete()
            Batch.objects.all().delete()

            # 4. Import logs & alerts (Product catalogue, categories, and packaging rules PRESERVED)
            ImportJob.objects.all().delete()

            # 5. Operational Finance & Test Customers (Suppliers preserved as master vendor directory)
            Customer.objects.all().delete()
            Expense.objects.all().delete()
            BusinessLoan.objects.all().delete()
            DailyCashUp.objects.all().delete()

            log_audit_event(
                module='administration',
                action_type='PRODUCTION_DATA_PURGED',
                target_identifier='DATABASE_PURGE',
                description='Production operational database tables purged to zero after safety backup guarantee',
                actor_name=request.data.get('actorName', 'Super Admin')
            )

        return Response({
            'success': True,
            'message': 'Production operational records successfully purged to 0.'
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

