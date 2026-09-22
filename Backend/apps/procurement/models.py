import uuid
from decimal import Decimal
from django.db import models
from apps.core.models import UUIDModel, TimestampedModel, BranchAwareModel

class PurchaseOrder(UUIDModel, TimestampedModel, BranchAwareModel):
    supplier = models.ForeignKey(
        'parties.Supplier',
        on_delete=models.RESTRICT,
        related_name='purchase_orders'
    )
    po_number = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=50, default='DRAFT')  # DRAFT, SUBMITTED, PARTIAL_RECEIVED, COMPLETED, CANCELLED
    total_estimated_cost = models.DecimalField(max_digits=15, decimal_places=4, default=Decimal('0.0000'))
    created_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.RESTRICT,
        related_name='purchase_orders_created'
    )
    approved_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='purchase_orders_approved'
    )

    class Meta:
        db_table = 'purchase_orders'
        indexes = [
            models.Index(fields=['po_number']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.po_number} - {self.supplier.name} ({self.status})"

class PurchaseOrderLine(UUIDModel):
    purchase_order = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.CASCADE,
        related_name='lines'
    )
    product = models.ForeignKey(
        'catalogue.Product',
        on_delete=models.RESTRICT,
        related_name='po_lines'
    )
    quantity_ordered_base = models.DecimalField(max_digits=15, decimal_places=2)
    unit_cost_base = models.DecimalField(max_digits=15, decimal_places=4)

    class Meta:
        db_table = 'purchase_order_lines'

    @property
    def total_cost(self):
        return self.quantity_ordered_base * self.unit_cost_base

    def __str__(self):
        return f"{self.purchase_order.po_number}: {self.product.brand_name} x{self.quantity_ordered_base}"

class GoodsReceiptNote(UUIDModel, BranchAwareModel):
    purchase_order = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='goods_receipts'
    )
    supplier = models.ForeignKey(
        'parties.Supplier',
        on_delete=models.RESTRICT,
        related_name='goods_receipts'
    )
    grn_number = models.CharField(max_length=50, unique=True)
    supplier_invoice_number = models.CharField(max_length=100, blank=True, null=True)
    total_invoice_amount = models.DecimalField(max_digits=15, decimal_places=4)
    received_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.RESTRICT,
        related_name='grns_received'
    )
    storage_location = models.ForeignKey(
        'administration.StorageLocation',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='grns_stored'
    )
    received_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'goods_receipt_notes'
        indexes = [
            models.Index(fields=['grn_number']),
        ]

    def __str__(self):
        return f"GRN {self.grn_number} - {self.supplier.name}"

class GoodsReceiptLine(UUIDModel):
    goods_receipt_note = models.ForeignKey(
        GoodsReceiptNote,
        on_delete=models.CASCADE,
        related_name='lines'
    )
    product = models.ForeignKey(
        'catalogue.Product',
        on_delete=models.RESTRICT,
        related_name='grn_lines'
    )
    batch_number = models.CharField(max_length=100)
    expiry_date = models.DateField()
    quantity_received_base = models.DecimalField(max_digits=15, decimal_places=2)
    unit_cost_base = models.DecimalField(max_digits=15, decimal_places=4)

    class Meta:
        db_table = 'goods_receipt_lines'

    @property
    def total_cost(self):
        return self.quantity_received_base * self.unit_cost_base

    def __str__(self):
        return f"{self.goods_receipt_note.grn_number}: {self.product.brand_name} ({self.batch_number}) x{self.quantity_received_base}"
