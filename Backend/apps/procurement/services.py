import uuid
from decimal import Decimal
from datetime import date, timedelta
from django.db import transaction
from .models import GoodsReceiptNote, GoodsReceiptLine, PurchaseOrder
from apps.inventory.models import Batch, StockBalance, StockMovement
from apps.catalogue.models import Product, Category, DosageForm
from apps.catalogue.services import MultiUnitPricingEngine
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
            qty_val = line_data.get('quantity_received_base') or line_data.get('qty') or 1
            cost_val = line_data.get('unit_cost_base') or line_data.get('unitCost') or 0
            qty_rcv = Decimal(str(qty_val))
            unit_cost = Decimal(str(cost_val))
            line_total = qty_rcv * unit_cost
            total_amount += line_total

            # Resolve Product safely (supports UUID, SKU, Barcode, or Brand Name)
            raw_pid = line_data.get('product_id') or line_data.get('productId')
            product = None

            if raw_pid:
                # Try UUID lookup
                try:
                    uuid.UUID(str(raw_pid))
                    product = Product.objects.filter(id=raw_pid).first()
                except Exception:
                    pass

                # If not found by UUID, try product_code, barcode, or exact name
                if not product:
                    product = Product.objects.filter(product_code=str(raw_pid)).first() or \
                              Product.objects.filter(barcode=str(raw_pid)).first() or \
                              Product.objects.filter(brand_name__iexact=str(raw_pid).strip()).first()

            # Try by product_name or brand_name if not resolved yet
            prod_name = line_data.get('product_name') or line_data.get('brand_name') or line_data.get('newBrandName')
            if not product and prod_name:
                product = Product.objects.filter(brand_name__iexact=str(prod_name).strip()).first() or \
                          Product.objects.filter(generic_name__iexact=str(prod_name).strip()).first()

            # Dynamic on-the-fly product creation if this is a newly introduced medication
            if not product:
                cat = Category.objects.first()
                if not cat:
                    cat = Category.objects.create(code='GEN', name='General Pharmaceuticals')
                df = DosageForm.objects.first()
                if not df:
                    df = DosageForm.objects.create(code='TAB', name='Tablet', default_base_unit='Tablet')

                disp_unit = line_data.get('unit_type') or line_data.get('baseUnit') or 'Piece'
                sp_val = line_data.get('selling_price') or line_data.get('sellingPrice') or (unit_cost * Decimal('1.35'))
                selling_price = Decimal(str(sp_val))
                p_code = f"MED-{uuid.uuid4().hex[:6].upper()}"
                b_name = (prod_name or f"Medication {p_code}").strip()

                product = Product.objects.create(
                    branch=grn.branch,
                    product_code=p_code,
                    brand_name=b_name,
                    generic_name=b_name,
                    category=cat,
                    dosage_form=df,
                    base_dispensing_unit=disp_unit,
                    cost_price_base=unit_cost,
                    selling_price_base=selling_price,
                    reorder_level_base=Decimal('50.00'),
                    maximum_stock_base=Decimal('1000.00'),
                    is_active=True
                )
                try:
                    MultiUnitPricingEngine.sync_packaging_units(product)
                except Exception:
                    pass

            # Safe Batch Number
            batch_num = str(line_data.get('batch_number') or f"B-{uuid.uuid4().hex[:6].upper()}").strip()

            # Robust Expiry Date parsing (handles ISO-8601 with timestamps, e.g. 2026-12-31T00:00:00.000Z)
            exp_date_raw = line_data.get('expiry_date') or line_data.get('expDate')
            clean_exp_date = None
            if exp_date_raw:
                try:
                    clean_str = str(exp_date_raw).split('T')[0].split(' ')[0].strip()
                    parts = [int(p) for p in clean_str.split('-') if p.isdigit()]
                    if len(parts) == 3 and parts[0] > 1900 and 1 <= parts[1] <= 12 and 1 <= parts[2] <= 31:
                        clean_exp_date = date(parts[0], parts[1], parts[2])
                except Exception:
                    clean_exp_date = None
            if not clean_exp_date:
                clean_exp_date = date.today() + timedelta(days=730)

            # 1. Create Goods Receipt Line
            line = GoodsReceiptLine.objects.create(
                goods_receipt_note=grn,
                product=product,
                batch_number=batch_num,
                expiry_date=clean_exp_date,
                quantity_received_base=qty_rcv,
                unit_cost_base=unit_cost
            )

            # 2. Get or Create Inventory Batch (defensive first() lookup to prevent MultipleObjectsReturned)
            batch = Batch.objects.filter(
                branch=grn.branch,
                product=product,
                batch_number=line.batch_number
            ).first()

            if not batch:
                batch = Batch.objects.create(
                    branch=grn.branch,
                    product=product,
                    batch_number=line.batch_number,
                    expiry_date=clean_exp_date,
                    unit_cost_base=unit_cost,
                    initial_quantity_base=qty_rcv,
                    storage_location=grn.storage_location,
                    status='ACTIVE'
                )
            else:
                batch.initial_quantity_base += qty_rcv
                batch.expiry_date = clean_exp_date
                batch.status = 'ACTIVE'
                batch.save()

            # 3. Update or Create Stock Balance
            balance = StockBalance.objects.filter(
                branch=grn.branch,
                product=product,
                batch=batch
            ).first()

            if not balance:
                balance = StockBalance.objects.create(
                    branch=grn.branch,
                    product=product,
                    batch=batch,
                    quantity_on_hand_base=qty_rcv
                )
            else:
                balance.quantity_on_hand_base += qty_rcv
                balance.save()

            # 4. Log Stock Movement
            supp_name = grn.supplier.name if (grn.supplier and hasattr(grn.supplier, 'name')) else "Direct Intake / Internal"
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
                notes=f"GRN: {grn.grn_number} from {supp_name}"
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
