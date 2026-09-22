import uuid
from decimal import Decimal
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone

from .models import (
    CashShift, Sale, SaleLine, SaleTender,
    DraftSale, SaleReturn, CustomerCreditNote, CreditPayment
)
from .serializers import (
    CashShiftSerializer, SaleSerializer, DraftSaleSerializer,
    SaleReturnSerializer, CustomerCreditNoteSerializer, CreditPaymentSerializer
)
from .services import (
    AtomicCheckoutEngine, ReturnProcessingEngine, CreditPaymentService
)
from apps.administration.models import Branch
from apps.authentication.models import User

class CashShiftViewSet(viewsets.ModelViewSet):
    queryset = CashShift.objects.all().select_related('user', 'reconciled_by').order_by('-opened_at')
    serializer_class = CashShiftSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        branch = Branch.objects.first()
        user = request.user if request.user.is_authenticated else User.objects.first()
        opening_float = Decimal(str(request.data.get('opening_float', '50.0000')))

        # Check if already has an open shift
        active_shift = CashShift.objects.filter(user=user, status='OPEN').first()
        if active_shift:
            return Response(CashShiftSerializer(active_shift).data, status=status.HTTP_200_OK)

        shift = CashShift.objects.create(
            branch=branch,
            user=user,
            shift_number=f"SHIFT-{uuid.uuid4().hex[:6].upper()}",
            opening_float=opening_float,
            status='OPEN'
        )
        return Response(CashShiftSerializer(shift).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='close')
    def close_shift(self, request, pk=None):
        shift = self.get_object()
        counted_cash = Decimal(str(request.data.get('closing_counted_cash', '0.0000')))

        # Calculate system expected cash: opening_float + cash tenders in this shift
        cash_sales = SaleTender.objects.filter(
            sale__cash_shift=shift,
            tender_method='CASH'
        )
        total_cash_tenders = sum((t.amount_paid for t in cash_sales), Decimal('0.0000'))
        expected_cash = shift.opening_float + total_cash_tenders

        shift.closing_counted_cash = counted_cash
        shift.closing_system_expected_cash = expected_cash
        shift.discrepancy_amount = counted_cash - expected_cash
        shift.status = 'CLOSED'
        shift.closed_at = timezone.now()
        shift.reconciliation_notes = request.data.get('reconciliation_notes', '')
        shift.save()

        return Response(CashShiftSerializer(shift).data)


class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all().select_related('cashier', 'customer', 'pharmacist_verified_by', 'cash_shift').prefetch_related('lines', 'tenders').order_by('-created_at')
    serializer_class = SaleSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param.upper())
        customer_id = self.request.query_params.get('customer')
        if customer_id:
            qs = qs.filter(customer_id=customer_id)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(receipt_number__icontains=search)
        return qs

    @action(detail=False, methods=['post'], url_path='checkout')
    def checkout(self, request):
        """Processes atomic dispensary POS checkout with FEFO stock deduction and multi-tenders."""
        branch = Branch.objects.first()
        cashier = request.user if request.user.is_authenticated else User.objects.filter(role__in=['Cashier', 'Pharmacist']).first() or User.objects.first()

        try:
            sale = AtomicCheckoutEngine.process_checkout(request.data, cashier, branch)
            return Response(SaleSerializer(sale).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class DraftSaleViewSet(viewsets.ModelViewSet):
    queryset = DraftSale.objects.all().select_related('cashier').order_by('-created_at')
    serializer_class = DraftSaleSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        branch = Branch.objects.first()
        cashier = self.request.user if self.request.user.is_authenticated else User.objects.first()
        draft_num = f"DRF-{uuid.uuid4().hex[:6].upper()}"
        serializer.save(branch=branch, cashier=cashier, draft_number=draft_num)


class SaleReturnViewSet(viewsets.ModelViewSet):
    queryset = SaleReturn.objects.all().select_related('original_sale', 'returned_by').order_by('-created_at')
    serializer_class = SaleReturnSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        branch = Branch.objects.first()
        returned_by = request.user if request.user.is_authenticated else User.objects.first()

        try:
            sale_return = ReturnProcessingEngine.process_return(request.data, returned_by, branch)
            return Response(SaleReturnSerializer(sale_return).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CustomerCreditNoteViewSet(viewsets.ModelViewSet):
    queryset = CustomerCreditNote.objects.all().select_related('customer', 'issued_by').order_by('-created_at')
    serializer_class = CustomerCreditNoteSerializer
    permission_classes = [AllowAny]


class CreditPaymentViewSet(viewsets.ModelViewSet):
    queryset = CreditPayment.objects.all().select_related('customer', 'recorded_by').order_by('-created_at')
    serializer_class = CreditPaymentSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        recorded_by = request.user if request.user.is_authenticated else User.objects.first()
        try:
            payment = CreditPaymentService.record_payment(request.data, recorded_by)
            return Response(CreditPaymentSerializer(payment).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
