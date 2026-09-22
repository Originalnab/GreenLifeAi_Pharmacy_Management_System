from decimal import Decimal
from django.db import models
from apps.core.models import UUIDModel, TimestampedModel, BranchAwareModel

class Supplier(UUIDModel, TimestampedModel):
    organization = models.ForeignKey(
        'administration.Organization',
        on_delete=models.CASCADE,
        related_name='suppliers'
    )
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    tax_number = models.CharField(max_length=100, blank=True, null=True)
    contact_person = models.CharField(max_length=255, blank=True, null=True)
    telephone = models.CharField(max_length=50)
    email = models.CharField(max_length=255, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    payment_terms_days = models.IntegerField(default=30)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'suppliers'
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['name']),
        ]

    def __str__(self):
        return f"{self.name} ({self.code})"

class Customer(UUIDModel, TimestampedModel, BranchAwareModel):
    customer_code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50)
    email = models.CharField(max_length=255, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    credit_limit = models.DecimalField(max_digits=15, decimal_places=4, default=Decimal('0.0000'))
    current_credit_balance = models.DecimalField(max_digits=15, decimal_places=4, default=Decimal('0.0000'))
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'customers'
        indexes = [
            models.Index(fields=['customer_code']),
            models.Index(fields=['name']),
            models.Index(fields=['phone']),
        ]

    def __str__(self):
        return f"{self.name} ({self.customer_code})"
