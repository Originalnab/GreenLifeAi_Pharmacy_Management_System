import uuid
from decimal import Decimal
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import (
    PurchaseOrder, PurchaseOrderLine,
    GoodsReceiptNote, GoodsReceiptLine
)
from .serializers import (
    PurchaseOrderSerializer, GoodsReceiptNoteSerializer
)
from .services import GRNProcessingEngine
from apps.administration.models import Branch, StorageLocation
from apps.authentication.models import User

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all().select_related('supplier', 'created_by', 'approved_by').prefetch_related('lines').order_by('-created_at')
    serializer_class = PurchaseOrderSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        data = request.data
        branch = Branch.objects.first()
        user = request.user if request.user.is_authenticated else User.objects.first()

        lines_data = data.get('lines', [])
        if not lines_data:
            return Response({'error': 'Purchase order must have at least one line item.'}, status=status.HTTP_400_BAD_REQUEST)

        # Generate unique PO number
        po_num = f"PO-{uuid.uuid4().hex[:6].upper()}"

        po = PurchaseOrder.objects.create(
            branch=branch,
            supplier_id=data['supplier_id'],
            po_number=data.get('po_number', po_num),
            status=data.get('status', 'SUBMITTED'),
            total_estimated_cost=Decimal('0.0000'),
            created_by=user
        )

        total_cost = Decimal('0.0000')
        for item in lines_data:
            qty = Decimal(str(item['quantity_ordered_base']))
            unit_cost = Decimal(str(item['unit_cost_base']))
            PurchaseOrderLine.objects.create(
                purchase_order=po,
                product_id=item['product_id'],
                quantity_ordered_base=qty,
                unit_cost_base=unit_cost
            )
            total_cost += (qty * unit_cost)

        po.total_estimated_cost = total_cost
        po.save()

        return Response(PurchaseOrderSerializer(po).data, status=status.HTTP_201_CREATED)


class GoodsReceiptNoteViewSet(viewsets.ModelViewSet):
    queryset = GoodsReceiptNote.objects.all().select_related('supplier', 'received_by', 'storage_location').prefetch_related('lines').order_by('-received_at')
    serializer_class = GoodsReceiptNoteSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        data = request.data
        branch = Branch.objects.first()
        user = request.user if request.user.is_authenticated else User.objects.first()
        storage_loc = StorageLocation.objects.filter(id=data.get('storage_location_id')).first() or StorageLocation.objects.first()

        lines_data = data.get('lines', [])
        if not lines_data:
            return Response({'error': 'GRN must have at least one line item with batch info.'}, status=status.HTTP_400_BAD_REQUEST)

        # Generate unique GRN number
        grn_num = f"GRN-{uuid.uuid4().hex[:6].upper()}"

        grn = GoodsReceiptNote.objects.create(
            branch=branch,
            purchase_order_id=data.get('purchase_order_id'),
            supplier_id=data['supplier_id'],
            grn_number=data.get('grn_number', grn_num),
            supplier_invoice_number=data.get('supplier_invoice_number', ''),
            total_invoice_amount=Decimal('0.0000'),
            received_by=user,
            storage_location=storage_loc
        )

        # Atomically process GRN lines and create batches + movements
        posted_grn = GRNProcessingEngine.post_grn(grn, lines_data, user)
        return Response(GoodsReceiptNoteSerializer(posted_grn).data, status=status.HTTP_201_CREATED)
