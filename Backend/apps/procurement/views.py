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

        # Robust Supplier Resolution
        from apps.parties.models import Supplier
        supplier = None
        supp_id = data.get('supplier_id')
        if supp_id:
            try:
                supplier = Supplier.objects.filter(id=supp_id).first()
            except Exception:
                pass
            if not supplier:
                supplier = Supplier.objects.filter(code__iexact=str(supp_id)).first() or \
                           Supplier.objects.filter(name__icontains=str(supp_id)).first()
        if not supplier:
            supplier = Supplier.objects.first()

        # Generate unique PO number
        po_num = data.get('po_number')
        if not po_num or PurchaseOrder.objects.filter(po_number=po_num).exists():
            po_num = f"PO-{uuid.uuid4().hex[:6].upper()}"

        po = PurchaseOrder.objects.create(
            branch=branch,
            supplier=supplier,
            po_number=po_num,
            status=data.get('status', 'SUBMITTED'),
            total_estimated_cost=Decimal('0.0000'),
            created_by=user
        )

        from apps.catalogue.models import Product
        total_cost = Decimal('0.0000')
        for item in lines_data:
            qty = Decimal(str(item.get('quantity_ordered_base', 1)))
            unit_cost = Decimal(str(item.get('unit_cost_base', 0)))

            raw_pid = item.get('product_id')
            product = None
            if raw_pid:
                try:
                    product = Product.objects.filter(id=raw_pid).first()
                except Exception:
                    pass
                if not product:
                    product = Product.objects.filter(product_code=str(raw_pid)).first() or \
                              Product.objects.filter(barcode=str(raw_pid)).first() or \
                              Product.objects.filter(brand_name__iexact=str(raw_pid)).first()
            if not product:
                product = Product.objects.first()

            if product:
                PurchaseOrderLine.objects.create(
                    purchase_order=po,
                    product=product,
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
        try:
            data = request.data
            branch = Branch.objects.first()
            user = request.user if request.user.is_authenticated else User.objects.first()

            lines_data = data.get('lines', [])
            if not lines_data:
                return Response({'error': 'GRN must have at least one line item with batch info.'}, status=status.HTTP_400_BAD_REQUEST)

            # Robust Storage Location Resolution
            storage_loc = None
            loc_id = data.get('storage_location_id')
            if loc_id:
                try:
                    storage_loc = StorageLocation.objects.filter(id=loc_id).first()
                except Exception:
                    pass
            if not storage_loc:
                storage_loc = StorageLocation.objects.first()

            # Robust Supplier Resolution (supports UUID, code, or name)
            from apps.parties.models import Supplier
            supplier = None
            supp_id = data.get('supplier_id')
            if supp_id:
                try:
                    supplier = Supplier.objects.filter(id=supp_id).first()
                except Exception:
                    pass
                if not supplier:
                    supplier = Supplier.objects.filter(code__iexact=str(supp_id)).first() or \
                               Supplier.objects.filter(name__icontains=str(supp_id)).first()
            if not supplier:
                supplier = Supplier.objects.first()

            if not supplier:
                from apps.administration.models import Organization
                org = branch.organization if (branch and hasattr(branch, 'organization') and branch.organization) else Organization.objects.first()
                supplier = Supplier.objects.create(
                    organization=org,
                    code='WH-SUPPLIER',
                    name='Default Wholesale Distributor',
                    telephone='0200000000'
                )

            # Robust Purchase Order Resolution
            po = None
            po_id = data.get('purchase_order_id')
            if po_id:
                try:
                    po = PurchaseOrder.objects.filter(id=po_id).first()
                except Exception:
                    pass

            # Generate or ensure unique GRN / Voucher number
            grn_num = data.get('grn_number')
            if not grn_num or GoodsReceiptNote.objects.filter(grn_number=grn_num).exists():
                grn_num = f"RCV-{uuid.uuid4().hex[:6].upper()}"

            grn = GoodsReceiptNote.objects.create(
                branch=branch,
                purchase_order=po,
                supplier=supplier,
                grn_number=grn_num,
                supplier_invoice_number=data.get('supplier_invoice_number', ''),
                total_invoice_amount=Decimal('0.0000'),
                received_by=user,
                storage_location=storage_loc
            )

            # Atomically process GRN lines and create batches + movements
            posted_grn = GRNProcessingEngine.post_grn(grn, lines_data, user)
            return Response(GoodsReceiptNoteSerializer(posted_grn).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': f"Failed to record stock intake: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

