import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from apps.core.models import UUIDModel, TimestampedModel

class UserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not username:
            raise ValueError('The Username is required')
        if not email:
            raise ValueError('The Email is required')
        
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'Super Admin')
        extra_fields.setdefault('must_change_password', False)
        extra_fields.setdefault('is_temporary_password', False)
        return self.create_user(username, email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin, UUIDModel, TimestampedModel):
    ROLE_CHOICES = [
        ('Super Admin', 'Super Admin'),
        ('Pharmacy Admin', 'Pharmacy Admin'),
        ('Pharmacist', 'Pharmacist'),
        ('Cashier', 'Cashier'),
        ('Sales Person', 'Sales Person'),
        ('Stock Officer', 'Stock Officer'),
        ('Procurement Officer', 'Procurement Officer'),
        ('Accountant', 'Accountant'),
        ('Auditor', 'Auditor'),
        ('Manager', 'Manager'),
    ]

    branch = models.ForeignKey(
        'administration.Branch',
        on_delete=models.SET_NULL,
        related_name='users',
        null=True,
        blank=True
    )
    username = models.CharField(max_length=100, unique=True)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)
    first_name = models.CharField(max_length=100, blank=True, null=True)
    middle_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    dob = models.DateField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    alternate_phone = models.CharField(max_length=50, blank=True, null=True)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='Pharmacist')
    primary_role = models.CharField(max_length=50, blank=True, null=True)
    assigned_roles = models.JSONField(default=list, blank=True)
    license_number = models.CharField(max_length=100, blank=True, null=True)
    avatar_url = models.TextField(blank=True, null=True)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    must_change_password = models.BooleanField(default=True)
    is_temporary_password = models.BooleanField(default=True)
    password_reset_notice = models.JSONField(blank=True, null=True)

    objects = UserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email', 'name']

    def __str__(self):
        return f"{self.name} (@{self.username} - {self.role})"

    def save(self, *args, **kwargs):
        if self.first_name or self.last_name:
            parts = [self.first_name, self.middle_name, self.last_name]
            self.name = " ".join([p.strip() for p in parts if p and p.strip()]) or self.name
        if not self.primary_role:
            self.primary_role = self.role
        if not self.assigned_roles:
            self.assigned_roles = [self.role] if self.role else ['Pharmacist']
        elif self.role and self.role not in self.assigned_roles:
            self.assigned_roles.append(self.role)
        super().save(*args, **kwargs)

class UserAuthorization(UUIDModel, TimestampedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='authorization')
    max_discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=5.00)
    max_refund_limit = models.DecimalField(max_digits=15, decimal_places=4, default=100.0000)
    stock_adjustment_limit = models.DecimalField(max_digits=15, decimal_places=4, default=0.0000)
    expense_approval_limit = models.DecimalField(max_digits=15, decimal_places=4, default=0.0000)
    po_approval_limit = models.DecimalField(max_digits=15, decimal_places=4, default=0.0000)
    require_two_factor = models.BooleanField(default=False)
    can_override_price = models.BooleanField(default=False)
    can_view_cost_prices = models.BooleanField(default=False)
    can_view_profits = models.BooleanField(default=False)
    sessions_active = models.IntegerField(default=0)
    last_password_change = models.DateTimeField(auto_now_add=True)
    custom_permissions = models.JSONField(blank=True, null=True)

    def __str__(self):
        return f"Authorizations for {self.user.username}"

class CustomRole(UUIDModel, TimestampedModel):
    organization = models.ForeignKey(
        'administration.Organization',
        on_delete=models.CASCADE,
        related_name='custom_roles',
        null=True,
        blank=True
    )
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    permission_matrix = models.JSONField(default=dict)
    role_sensitive_controls = models.JSONField(default=dict)

    def __str__(self):
        return self.name
