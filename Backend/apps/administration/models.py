from django.db import models
from apps.core.models import UUIDModel, TimestampedModel

class Organization(UUIDModel, TimestampedModel):
    code = models.CharField(max_length=50, unique=True)
    legal_name = models.CharField(max_length=255)
    trading_name = models.CharField(max_length=255)
    tax_identification_number = models.CharField(max_length=100, blank=True, null=True)
    headquarters_address = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    currency_code = models.CharField(max_length=10, default='GHS')
    logo_url = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.trading_name

class Branch(UUIDModel, TimestampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='branches')
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    premises_license_number = models.CharField(max_length=100)
    superintendent_name = models.CharField(max_length=255)
    superintendent_pcn_number = models.CharField(max_length=100)
    address = models.TextField()
    phone = models.CharField(max_length=50)
    email = models.EmailField(blank=True, null=True)
    is_central = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.code})"

class StorageLocation(UUIDModel, TimestampedModel):
    LOCATION_TYPES = [
        ('DISPENSARY_SHELF', 'Front Counter Dispensary Shelves'),
        ('COLD_CHAIN_FRIDGE', 'Cold Chain Medical Refrigerator (2-8°C)'),
        ('BULK_WAREHOUSE', 'Central Bulk Warehouse Bay'),
        ('QUARANTINE_BAY', 'Quarantine & Regulatory Isolation Bay'),
    ]

    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='storage_locations')
    code = models.CharField(max_length=50)
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=50, choices=LOCATION_TYPES, default='DISPENSARY_SHELF')
    temperature_range = models.CharField(max_length=50, default='AMBIENT_15_25C')
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('branch', 'code')

    def __str__(self):
        return f"{self.name} - {self.branch.code}"
