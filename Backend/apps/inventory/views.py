from decimal import Decimal
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Batch, StockBalance, StockMovement, StockAdjustment
from .serializers import (
    BatchSerializer, StockBalanceSerializer,
    StockMovementSerializer, StockAdjustmentSerializer
)
from .services import FEFOEngine
from apps.administration.models import Branch
from apps.authentication.models import User

class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.all().select_related('product', 'storage_location', 'branch').order_by('expiry_date')
    serializer_class = BatchSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param.upper())
        product_id = self.request.query_params.get('product')
        if product_id:
            qs = qs.filter(product_id=product_id)
        return qs

    def perform_create(self, serializer):
        branch = Branch.objects.first()
        batch = serializer.save(branch=branch)
        # Initialize stock balance
        StockBalance.objects.get_or_create(
            branch=branch,
            product=batch.product,
            batch=batch,
            defaults={'quantity_on_hand_base': batch.initial_quantity_base}
        )

class StockBalanceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StockBalance.objects.all().select_related('product', 'batch', 'batch__storage_location').order_by('product__brand_name')
    serializer_class = StockBalanceSerializer
    permission_classes = [AllowAny]

class StockMovementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StockMovement.objects.all().select_related('batch', 'batch__product', 'performed_by').order_by('-created_at')
    serializer_class = StockMovementSerializer
    permission_classes = [AllowAny]

class StockAdjustmentViewSet(viewsets.ModelViewSet):
    queryset = StockAdjustment.objects.all().select_related('batch', 'batch__product', 'authorized_by').order_by('-created_at')
    serializer_class = StockAdjustmentSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        branch = Branch.objects.first()
        authorizer = self.request.user if self.request.user.is_authenticated else User.objects.first()
        serializer.save(branch=branch, authorized_by=authorizer)

@api_view(['POST'])
@permission_classes([AllowAny])
def fefo_allocate_view(request):
    """Calculates First-Expiry-First-Out batch allocations for a given product and required quantity."""
    product_id = request.data.get('product_id')
    qty = request.data.get('quantity_base')

    if not product_id or qty is None:
        return Response({'error': 'product_id and quantity_base are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        qty_decimal = Decimal(str(qty))
        allocations = FEFOEngine.allocate_fefo(product_id, qty_decimal)
        return Response({
            'success': True,
            'product_id': product_id,
            'requested_quantity_base': float(qty_decimal),
            'allocations': allocations
        })
    except ValueError as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
