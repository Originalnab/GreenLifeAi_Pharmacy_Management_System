import uuid
from decimal import Decimal
from django.db import models
from apps.core.models import UUIDModel, TimestampedModel, BranchAwareModel

class ExpenseCategory(UUIDModel):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'expense_categories'
        verbose_name_plural = 'Expense Categories'

    def __str__(self):
        return f"{self.name} ({self.code})"

class Expense(UUIDModel, BranchAwareModel):
    category = models.ForeignKey(
        ExpenseCategory,
        on_delete=models.RESTRICT,
        related_name='expenses'
    )
    voucher_number = models.CharField(max_length=50, unique=True)
    amount = models.DecimalField(max_digits=15, decimal_places=4)
    payment_method = models.CharField(max_length=50, default='CASH')  # CASH, BANK_TRANSFER, CARD
    disbursed_to = models.CharField(max_length=255)
    purpose = models.TextField()
    approved_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.RESTRICT,
        related_name='approved_expenses'
    )
    receipt_url = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'expenses'
        indexes = [
            models.Index(fields=['voucher_number']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.voucher_number}: {self.disbursed_to} - {self.amount}"

class DailyCashUp(UUIDModel, BranchAwareModel):
    cash_up_date = models.DateField()
    opening_float = models.DecimalField(max_digits=15, decimal_places=4)
    total_cash_sales = models.DecimalField(max_digits=15, decimal_places=4, default=Decimal('0.0000'))
    total_card_sales = models.DecimalField(max_digits=15, decimal_places=4, default=Decimal('0.0000'))
    total_transfer_sales = models.DecimalField(max_digits=15, decimal_places=4, default=Decimal('0.0000'))
    total_expenses_cash = models.DecimalField(max_digits=15, decimal_places=4, default=Decimal('0.0000'))
    expected_cash_in_drawer = models.DecimalField(max_digits=15, decimal_places=4)
    actual_counted_cash = models.DecimalField(max_digits=15, decimal_places=4)
    cash_variance = models.DecimalField(max_digits=15, decimal_places=4)
    status = models.CharField(max_length=50, default='BALANCED')  # BALANCED, OVERAGE, SHORTAGE
    reconciled_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.RESTRICT,
        related_name='cash_ups_reconciled'
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'daily_cash_ups'
        unique_together = ('branch', 'cash_up_date')

    def __str__(self):
        return f"Cash-Up {self.cash_up_date} ({self.status}): Var {self.cash_variance}"

class BusinessLoan(UUIDModel, BranchAwareModel):
    borrower_name = models.CharField(max_length=255)
    principal_amount = models.DecimalField(max_digits=15, decimal_places=4)
    interest_rate_percent = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    total_repayable_amount = models.DecimalField(max_digits=15, decimal_places=4)
    total_repaid_amount = models.DecimalField(max_digits=15, decimal_places=4, default=Decimal('0.0000'))
    status = models.CharField(max_length=50, default='ACTIVE')  # ACTIVE, REPAID, DEFAULTED
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'business_loans'

    def __str__(self):
        return f"Loan {self.borrower_name}: {self.principal_amount}"
