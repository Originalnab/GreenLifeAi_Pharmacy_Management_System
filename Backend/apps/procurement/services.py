from decimal import Decimal
from django.db import transaction
from .models import GoodsReceiptNote, GoodsReceiptLine, PurchaseOrder
from apps.inventory.models import Batch, StockBalance, StockMovement
from apps.audit.services import log_audit_event

class GRNProcessingEngine:
    """Processes Goods Receipt Notes into physical inventory batches atomically."""

    @classmethod
    @transaction.atomic
    def post_grn(cls, grn: GoodsReceiptNote, lines_data: list, actor):
        """
        Creates receipt lines, initializes batches, increments stock balances,
        and logs warehouse inward stock movements.
        """
        total_amount = Decimal('0.0000')

        for line_data in lines_data:
            qty_rcv = Decimal(str(line_data['quantity_received_base']))
            unit_cost = Decimal(str(line_data['unit_cost_base']))
            line_total = qty_rcv * unit_cost
            total_amount += line_total

            # 1. Create Goods Receipt Line
            line = GoodsReceiptLine.objects.create(
                goods_receipt_note=grn,
                product_id=line_data['product_id'],
                batch_number=line_data['batch_number'],
                expiry_date=line_data['expiry_date'],
                quantity_received_base=qty_rcv,
                unit_cost_base=unit_cost
            )

            # 2. Get or Create Inventory Batch
            batch, b_created = Batch.objects.get_or_create(
                branch=grn.branch,
                product=line.product,
                batch_number=line.batch_number,
                defaults={
                    'expiry_date': line.expiry_date,
                    'unit_cost_base': unit_cost,
                    'initial_quantity_base': qty_rcv,
                    'storage_location': grn.storage_location,
                    'status': 'ACTIVE'
                }
            )
            if not b_created:
                batch.initial_quantity_base += qty_rcv
                batch.status = 'ACTIVE'
                batch.save()

            # 3. Update or Create Stock Balance
            balance, _ = StockBalance.objects.get_or_create(
                branch=grn.branch,
                product=line.product,
                batch=batch,
                defaults={'quantity_on_hand_base': Decimal('0.00')}
            )
            balance.quantity_on_hand_base += qty_rcv
            balance.save()

            # 4. Log Stock Movement
            StockMovement.objects.create(
                branch=grn.branch,
                batch=batch,
                movement_type='PURCHASE_RECEIPT',
                quantity_change_base=qty_rcv,
                balance_after_base=balance.quantity_on_hand_base,
                reference_type='GRN',
                reference_id=grn.id,
                unit_cost_snapshot=unit_cost,
                total_cost_snapshot=line_total,
                performed_by=actor,
                notes=f"GRN: {grn.grn_number} from {grn.supplier.name}"
            )

        # Update GRN total
        grn.total_invoice_amount = total_amount
        grn.save()

        # If linked to a PO, check if PO should be marked COMPLETED or PARTIAL_RECEIVED
        if grn.purchase_order:
            grn.purchase_order.status = 'COMPLETED'
            grn.purchase_order.save()

        # Audit Event
        log_audit_event(
            module='procurement',
            action_type='GRN_POSTED',
            target_identifier=grn.grn_number,
            description=f"Received GRN {grn.grn_number} with total value {total_amount}",
            actor=actor,
            branch=grn.branch
        )

        return grn
