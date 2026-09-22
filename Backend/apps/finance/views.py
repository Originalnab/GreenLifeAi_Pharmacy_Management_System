import uuid
from decimal import Decimal
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import ExpenseCategory, Expense, DailyCashUp, BusinessLoan
from .serializers import (
    ExpenseCategorySerializer, ExpenseSerializer,
    DailyCashUpSerializer, BusinessLoanSerializer
)
from apps.administration.models import Branch
from apps.authentication.models import User
from apps.sales.models import SaleTender
from apps.audit.services import log_audit_event

class ExpenseCategoryViewSet(viewsets.ModelViewSet):
    queryset = ExpenseCategory.objects.all().order_by('name')
    serializer_class = ExpenseCategorySerializer
    permission_classes = [AllowAny]

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().select_related('category', 'approved_by').order_by('-created_at')
    serializer_class = ExpenseSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        branch = Branch.objects.first()
        approver = request.user if request.user.is_authenticated else User.objects.filter(role__in=['Super Admin', 'Pharmacy Admin']).first() or User.objects.first()

        voucher_no = f"EXP-{uuid.uuid4().hex[:6].upper()}"
        amount = Decimal(str(request.data['amount']))

        expense = Expense.objects.create(
            branch=branch,
            category_id=request.data['category_id'],
            voucher_number=request.data.get('voucher_number', voucher_no),
            amount=amount,
            payment_method=request.data.get('payment_method', 'CASH'),
            disbursed_to=request.data['disbursed_to'],
            purpose=request.data['purpose'],
            approved_by=approver,
            receipt_url=request.data.get('receipt_url')
        )

        log_audit_event(
            module='finance',
            action_type='EXPENSE_DISBURSED',
            target_identifier=expense.voucher_number,
            description=f"Disbursed expense voucher {expense.voucher_number} of {amount} to {expense.disbursed_to}",
            actor=approver,
            branch=branch
        )

        return Response(ExpenseSerializer(expense).data, status=status.HTTP_201_CREATED)

class DailyCashUpViewSet(viewsets.ModelViewSet):
    queryset = DailyCashUp.objects.all().select_related('reconciled_by').order_by('-cash_up_date')
    serializer_class = DailyCashUpSerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'], url_path='reconcile')
    def reconcile_day(self, request):
        branch = Branch.objects.first()
        user = request.user if request.user.is_authenticated else User.objects.first()
        cash_up_date = request.data.get('cash_up_date')
        counted_cash = Decimal(str(request.data.get('actual_counted_cash', '0.0000')))
        opening_float = Decimal(str(request.data.get('opening_float', '50.0000')))

        # Calculate sales on that date
        tenders = SaleTender.objects.filter(
            sale__created_at__date=cash_up_date,
            sale__branch=branch
        )
        total_cash_sales = sum((t.amount_paid for t in tenders if t.tender_method == 'CASH'), Decimal('0.0000'))
        total_card_sales = sum((t.amount_paid for t in tenders if t.tender_method == 'CARD_POS'), Decimal('0.0000'))
        total_transfer_sales = sum((t.amount_paid for t in tenders if t.tender_method == 'BANK_TRANSFER'), Decimal('0.0000'))

        # Calculate cash expenses on that date
        cash_expenses = Expense.objects.filter(
            created_at__date=cash_up_date,
            branch=branch,
            payment_method='CASH'
        )
        total_exp_cash = sum((e.amount for e in cash_expenses), Decimal('0.0000'))

        expected_drawer = opening_float + total_cash_sales - total_exp_cash
        variance = counted_cash - expected_drawer

        status_str = 'BALANCED'
        if variance > Decimal('0.0000'):
            status_str = 'OVERAGE'
        elif variance < Decimal('0.0000'):
            status_str = 'SHORTAGE'

        cash_up, _ = DailyCashUp.objects.update_or_create(
            branch=branch,
            cash_up_date=cash_up_date,
            defaults={
                'opening_float': opening_float,
                'total_cash_sales': total_cash_sales,
                'total_card_sales': total_card_sales,
                'total_transfer_sales': total_transfer_sales,
                'total_expenses_cash': total_exp_cash,
                'expected_cash_in_drawer': expected_drawer,
                'actual_counted_cash': counted_cash,
                'cash_variance': variance,
                'status': status_str,
                'reconciled_by': user,
                'notes': request.data.get('notes', '')
            }
        )

        return Response(DailyCashUpSerializer(cash_up).data, status=status.HTTP_200_OK)

class BusinessLoanViewSet(viewsets.ModelViewSet):
    queryset = BusinessLoan.objects.all().order_by('-created_at')
    serializer_class = BusinessLoanSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        branch = Branch.objects.first()
        serializer.save(branch=branch)
