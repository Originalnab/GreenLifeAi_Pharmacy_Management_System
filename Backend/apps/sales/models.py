import uuid
from decimal import Decimal
from django.db import models
from apps.core.models import UUIDModel, TimestampedModel, BranchAwareModel

class CashShift(UUIDModel, BranchAwareModel):
    user = models.ForeignKey(
        'authentication.User',
        on_delete=models.RESTRICT,
        related_name='cash_shifts'
    )
    shift_number = models.CharField(max_length=50, unique=True)
    opening_float = models.DecimalField(max_digits=15, decimal_places=4)
    opened_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=50, default='OPEN')  # OPEN, CLOSED, RECONCILED
    closing_counted_cash = models.DecimalField(max_digits=15, decimal_places=4, null=True, blank=True)
    closing_system_expected_cash = models.DecimalField(max_digits=15, decimal_places=4, null=True, blank=True)
    discrepancy_amount = models.DecimalField(max_digits=15, decimal_places=4, null=True, blank=True)
    reconciled_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reconciled_shifts'
    )
    reconciliation_notes = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'cash_shifts'

    def __str__(self):
        return f"{self.shift_number} ({self.user.name}) - {self.status}"

class Sale(UUIDModel, BranchAwareModel):
    cash_shift = models.ForeignKey(
        CashShift,
        on_delete=models.RESTRICT,
        related_name='sales'
    )
    cashier = models.ForeignKey(
        'authentication.User',
        on_delete=models.RESTRICT,
        related_name='sales_processed'
    )
    customer = models.ForeignKey(
        'parties.Customer',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sales'
    )
    receipt_number = models.CharField(max_length=50, unique=True)
    sale_type = models.CharField(max_length=50, default='RETAIL')  # RETAIL, WHOLESALE, DISPENSARY

    subtotal = models.DecimalField(max_digits=15, decimal_places=4)
    discount_amount = models.DecimalField(max_digits=15, decimal_places=4, default=Decimal('0.0000'))
    tax_amount = models.DecimalField(max_digits=15, decimal_places=4, default=Decimal('0.0000'))
    total_amount = models.DecimalField(max_digits=15, decimal_places=4)
    total_cost_amount = models.DecimalField(max_digits=15, decimal_places=4, default=Decimal('0.0000'))
    gross_profit_amount = models.DecimalField(max_digits=15, decimal_places=4, default=Decimal('0.0000'))

    status = models.CharField(max_length=50, default='COMPLETED')  # COMPLETED, PARTIALLY_REFUNDED, REFUNDED, VOIDED
    is_credit_sale = models.BooleanField(default=False)
    credit_due_date = models.DateField(null=True, blank=True)
    credit_amount_paid = models.DecimalField(max_digits=15, decimal_places=4, default=Decimal('0.0000'))

    # Clinical & Prescription Gating
    pharmacist_verified_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='prescriptions_verified'
    )
    prescribing_doctor_name = models.CharField(max_length=255, blank=True, null=True)
    doctor_license_number = models.CharField(max_length=100, blank=True, null=True)
    patient_prescription_number = models.CharField(max_length=100, blank=True, null=True)

    idempotency_key = models.UUIDField(unique=True, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'sales'
        indexes = [
            models.Index(fields=['receipt_number']),
            models.Index(fields=['created_at']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.receipt_number} - Total: {self.total_amount} ({self.status})"

class SaleLine(UUIDModel):
    sale = models.ForeignKey(
        Sale,
        on_delete=models.CASCADE,
        related_name='lines'
    )
    product = models.ForeignKey(
        'catalogue.Product',
        on_delete=models.RESTRICT,
        related_name='sale_lines'
    )
    batch = models.ForeignKey(
        'inventory.Batch',
        on_delete=models.RESTRICT,
        related_name='sale_lines'
    )
    packaging_unit_name = models.CharField(max_length=50)
    multiplier_to_base = models.DecimalField(max_digits=10, decimal_places=2)
    quantity_dispensed_units = models.DecimalField(max_digits=10, decimal_places=2)
    total_quantity_base = models.DecimalField(max_digits=15, decimal_places=2)

    unit_selling_price = models.DecimalField(max_digits=15, decimal_places=4)
    unit_cost_price = models.DecimalField(max_digits=15, decimal_places=4)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    total_line_amount = models.DecimalField(max_digits=15, decimal_places=4)
    total_line_cost = models.DecimalField(max_digits=15, decimal_places=4)
    total_line_profit = models.DecimalField(max_digits=15, decimal_places=4)

    dosage_instructions = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'sale_lines'

    def __str__(self):
        return f"{self.sale.receipt_number}: {self.product.brand_name} x{self.quantity_dispensed_units} {self.packaging_unit_name}"

class SaleTender(UUIDModel):
    sale = models.ForeignKey(
        Sale,
        on_delete=models.CASCADE,
        related_name='tenders'
    )
    tender_method = models.CharField(max_length=50)  # CASH, CARD_POS, BANK_TRANSFER, CUSTOMER_CREDIT, CREDIT_NOTE
    amount_tendered = models.DecimalField(max_digits=15, decimal_places=4)
    amount_paid = models.DecimalField(max_digits=15, decimal_places=4)
    change_given = models.DecimalField(max_digits=15, decimal_places=4, default=Decimal('0.0000'))
    transaction_reference = models.CharField(max_length=100, blank=True, null=True)
    tender_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'sale_tenders'

    def __str__(self):
        return f"{self.sale.receipt_number} - {self.tender_method}: {self.amount_paid}"

class DraftSale(UUIDModel, TimestampedModel, BranchAwareModel):
    cashier = models.ForeignKey(
        'authentication.User',
        on_delete=models.CASCADE,
        related_name='draft_sales'
    )
    draft_number = models.CharField(max_length=50, unique=True)
    title = models.CharField(max_length=100)
    notes = models.TextField(blank=True, null=True)
    cart_payload = models.JSONField()
    status = models.CharField(max_length=50, default='HELD')  # HELD, CONVERTED, DISCARDED

    class Meta:
        db_table = 'draft_sales'

    def __str__(self):
        return f"Draft {self.draft_number}: {self.title}"

class SaleReturn(UUIDModel, BranchAwareModel):
    original_sale = models.ForeignKey(
        Sale,
        on_delete=models.RESTRICT,
        related_name='returns'
    )
    return_number = models.CharField(max_length=50, unique=True)
    returned_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.RESTRICT,
        related_name='returns_processed'
    )
    refund_method = models.CharField(max_length=50)  # CASH, CREDIT_NOTE, ORIGINAL_CARD
    total_refund_amount = models.DecimalField(max_digits=15, decimal_places=4)
    return_reason = models.CharField(max_length=255)
    is_restocked_to_inventory = models.BooleanField(default=True)
    condition_assessment = models.CharField(max_length=50, default='INTACT')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'sale_returns'

    def __str__(self):
        return f"Return {self.return_number} (Ref Sale {self.original_sale.receipt_number})"

class CustomerCreditNote(UUIDModel, BranchAwareModel):
    customer = models.ForeignKey(
        'parties.Customer',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='credit_notes'
    )
    credit_note_number = models.CharField(max_length=50, unique=True)
    original_sale = models.ForeignKey(
        Sale,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    sale_return = models.ForeignKey(
        SaleReturn,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    original_amount = models.DecimalField(max_digits=15, decimal_places=4)
    remaining_balance = models.DecimalField(max_digits=15, decimal_places=4)
    status = models.CharField(max_length=50, default='ACTIVE')  # ACTIVE, USED, EXPIRED, VOIDED
    issued_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.RESTRICT,
        related_name='credit_notes_issued'
    )
    expiry_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'customer_credit_notes'

    def __str__(self):
        return f"CreditNote {self.credit_note_number}: {self.remaining_balance} remaining"

class CreditPayment(UUIDModel):
    customer = models.ForeignKey(
        'parties.Customer',
        on_delete=models.RESTRICT,
        related_name='credit_payments'
    )
    sale = models.ForeignKey(
        Sale,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='credit_payments'
    )
    receipt_number = models.CharField(max_length=50, unique=True)
    amount_paid = models.DecimalField(max_digits=15, decimal_places=4)
    payment_method = models.CharField(max_length=50)
    reference = models.CharField(max_length=100, blank=True, null=True)
    recorded_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.RESTRICT,
        related_name='credit_payments_recorded'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'credit_payments'

    def __str__(self):
        return f"Payment {self.receipt_number}: {self.customer.name} - {self.amount_paid}"
