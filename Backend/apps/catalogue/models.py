import uuid
from decimal import Decimal
from django.db import models
from apps.core.models import UUIDModel, TimestampedModel, BranchAwareModel

class Category(UUIDModel, TimestampedModel):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'Categories'

    def __str__(self):
        return f"{self.name} ({self.code})"

class DosageForm(UUIDModel):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    default_base_unit = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'dosage_forms'

    def __str__(self):
        return f"{self.name} ({self.code})"

class UnitOfMeasure(UUIDModel):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    symbol = models.CharField(max_length=20)
    type = models.CharField(max_length=50)  # 'COUNT', 'VOLUME', 'WEIGHT'

    class Meta:
        db_table = 'units_of_measure'

    def __str__(self):
        return f"{self.name} ({self.symbol})"

class DosagePreset(UUIDModel):
    name = models.CharField(max_length=100, unique=True)
    instruction = models.CharField(max_length=255)
    frequency = models.CharField(max_length=50)
    duration_days = models.IntegerField(default=5)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'dosage_presets'

    def __str__(self):
        return self.name

class Product(UUIDModel, TimestampedModel, BranchAwareModel):
    product_code = models.CharField(max_length=50, unique=True)
    brand_name = models.CharField(max_length=255)
    generic_name = models.CharField(max_length=255)
    barcode = models.CharField(max_length=100, blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.RESTRICT, related_name='products')
    dosage_form = models.ForeignKey(DosageForm, on_delete=models.RESTRICT, related_name='products')
    strength = models.CharField(max_length=100, blank=True, null=True)

    # Packaging Multipliers
    base_dispensing_unit = models.CharField(max_length=50, default='Piece')
    strip_multiplier = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('1.00'))
    pack_box_multiplier = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('1.00'))

    # Base Pricing (Atomic Unit)
    cost_price_base = models.DecimalField(max_digits=15, decimal_places=4, default=Decimal('0.0000'))
    selling_price_base = models.DecimalField(max_digits=15, decimal_places=4, default=Decimal('0.0000'))

    # Safeguards
    reorder_level_base = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('50.00'))
    maximum_stock_base = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('1000.00'))

    # Clinical & Regulatory
    is_prescription_required = models.BooleanField(default=False)
    is_controlled_substance = models.BooleanField(default=False)
    storage_condition = models.CharField(max_length=100, default='Ambient 15-25°C')
    pregnancy_category = models.CharField(max_length=10, default='B')
    max_daily_dose = models.CharField(max_length=100, blank=True, null=True)
    clinical_notes = models.TextField(blank=True, null=True)

    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'products'
        indexes = [
            models.Index(fields=['product_code']),
            models.Index(fields=['brand_name']),
            models.Index(fields=['generic_name']),
            models.Index(fields=['barcode']),
        ]

    def __str__(self):
        return f"{self.brand_name} ({self.product_code})"

class ProductPackagingUnit(UUIDModel, TimestampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='packaging_units')
    tier_name = models.CharField(max_length=50)  # 'BASE_UNIT', 'STRIP', 'OUTER_BOX'
    unit_label = models.CharField(max_length=50)
    multiplier_to_base = models.DecimalField(max_digits=10, decimal_places=2)
    wholesale_cost = models.DecimalField(max_digits=15, decimal_places=4)
    retail_selling_price = models.DecimalField(max_digits=15, decimal_places=4)
    barcode = models.CharField(max_length=100, blank=True, null=True)
    is_dispensable = models.BooleanField(default=True)

    class Meta:
        db_table = 'product_packaging_units'
        unique_together = ('product', 'tier_name')

    def __str__(self):
        return f"{self.product.brand_name} - {self.unit_label} (x{self.multiplier_to_base})"

class StockAlertRule(UUIDModel, BranchAwareModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='alert_rules')
    min_days_to_expiry = models.IntegerField(default=90)
    critical_stock_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('20.00'))
    action_required = models.CharField(max_length=100, default='REORDER')
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'stock_alert_rules'

    def __str__(self):
        return f"Rule: {self.product.brand_name} (<={self.critical_stock_threshold})"

class ImportJob(UUIDModel, TimestampedModel, BranchAwareModel):
    file_name = models.CharField(max_length=255)
    total_rows = models.IntegerField(default=0)
    valid_rows = models.IntegerField(default=0)
    status = models.CharField(max_length=50, default='PENDING')  # PENDING, VALIDATED, COMMITTED, FAILED
    errors = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = 'import_jobs'

    def __str__(self):
        return f"Import {self.file_name} ({self.status})"
