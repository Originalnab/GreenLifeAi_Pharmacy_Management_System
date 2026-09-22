import uuid
from decimal import Decimal
from django.db import models
from apps.core.models import UUIDModel, TimestampedModel, BranchAwareModel

class Batch(UUIDModel, TimestampedModel, BranchAwareModel):
    product = models.ForeignKey(
        'catalogue.Product',
        on_delete=models.RESTRICT,
        related_name='batches'
    )
    batch_number = models.CharField(max_length=100)
    expiry_date = models.DateField()
    manufacturing_date = models.DateField(blank=True, null=True)
    unit_cost_base = models.DecimalField(max_digits=15, decimal_places=4)
    initial_quantity_base = models.DecimalField(max_digits=15, decimal_places=2)
    storage_location = models.ForeignKey(
        'administration.StorageLocation',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='batches'
    )
    status = models.CharField(max_length=50, default='ACTIVE')  # ACTIVE, QUARANTINE, EXPIRED, DEPLETED

    class Meta:
        db_table = 'batches'
        unique_together = ('branch', 'product', 'batch_number')
        indexes = [
            models.Index(fields=['batch_number']),
            models.Index(fields=['expiry_date']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.product.brand_name} - Batch {self.batch_number} (Exp: {self.expiry_date})"

class StockBalance(UUIDModel, BranchAwareModel):
    product = models.ForeignKey(
        'catalogue.Product',
        on_delete=models.CASCADE,
        related_name='stock_balances'
    )
    batch = models.ForeignKey(
        Batch,
        on_delete=models.CASCADE,
        related_name='stock_balances'
    )
    quantity_on_hand_base = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
    quantity_reserved_base = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'stock_balances'
        unique_together = ('branch', 'product', 'batch')

    @property
    def available_quantity_base(self):
        return self.quantity_on_hand_base - self.quantity_reserved_base

    def __str__(self):
        return f"{self.product.brand_name} [{self.batch.batch_number}]: {self.quantity_on_hand_base} on-hand"

class StockMovement(UUIDModel, BranchAwareModel):
    batch = models.ForeignKey(
        Batch,
        on_delete=models.RESTRICT,
        related_name='movements'
    )
    movement_type = models.CharField(max_length=50)  # PURCHASE_RECEIPT, SALE_DISPENSE, RETURN_INWARD, STOCK_ADJUSTMENT, LOCATION_TRANSFER
    quantity_change_base = models.DecimalField(max_digits=15, decimal_places=2)
    balance_after_base = models.DecimalField(max_digits=15, decimal_places=2)
    reference_type = models.CharField(max_length=50)  # GRN, SALE, RETURN, ADJUSTMENT
    reference_id = models.UUIDField()
    unit_cost_snapshot = models.DecimalField(max_digits=15, decimal_places=4)
    total_cost_snapshot = models.DecimalField(max_digits=15, decimal_places=4)
    performed_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.RESTRICT,
        related_name='stock_movements_logged'
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'stock_movements'
        indexes = [
            models.Index(fields=['movement_type']),
            models.Index(fields=['reference_type', 'reference_id']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.movement_type} ({self.quantity_change_base}): {self.batch.product.brand_name}"

class StockAdjustment(UUIDModel, BranchAwareModel):
    batch = models.ForeignKey(
        Batch,
        on_delete=models.RESTRICT,
        related_name='adjustments'
    )
    previous_quantity_base = models.DecimalField(max_digits=15, decimal_places=2)
    counted_quantity_base = models.DecimalField(max_digits=15, decimal_places=2)
    variance_base = models.DecimalField(max_digits=15, decimal_places=2)
    reason = models.CharField(max_length=255)
    authorized_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.RESTRICT,
        related_name='stock_adjustments_authorized'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'stock_adjustments'

    def __str__(self):
        return f"Adj {self.batch.batch_number}: {self.variance_base} ({self.reason})"
