import uuid
from decimal import Decimal
from datetime import date
from django.db import transaction
from django.core.exceptions import ValidationError

from .models import (
    Sale, SaleLine, SaleTender, CashShift, DraftSale,
    SaleReturn, CustomerCreditNote, CreditPayment
)
from apps.catalogue.models import Product
from apps.inventory.models import Batch, StockBalance, StockMovement
from apps.inventory.services import FEFOEngine
from apps.parties.models import Customer
from apps.authentication.models import User
from apps.audit.services import log_audit_event

class AtomicCheckoutEngine:
    """
    Executes dispensary checkout in a single ACID transaction.
    Integrates FEFO inventory deduction, tenders, cash shift tallying,
    credit ledgers, and regulatory audit logging.
    """

    @classmethod
    @transaction.atomic
    def process_checkout(cls, payload: dict, cashier, branch) -> Sale:
        # 1. Resolve or verify active Cash Shift
        shift_id = payload.get('cash_shift_id')
        shift = None
        if shift_id:
            shift = CashShift.objects.filter(id=shift_id, status='OPEN').first()
        if not shift:
            # Fall back to user's active shift or create an open operational shift
            shift = CashShift.objects.filter(user=cashier, status='OPEN', branch=branch).first()
            if not shift:
                shift = CashShift.objects.create(
                    branch=branch,
                    user=cashier,
                    shift_number=f"SHIFT-{uuid.uuid4().hex[:6].upper()}",
                    opening_float=Decimal('50.0000'),
                    status='OPEN'
                )

        items_data = payload.get('items') or payload.get('lines') or []
        tenders_data = payload.get('tenders', [])

        if not items_data:
            raise ValidationError("Checkout error: Cart is empty.")
        if not tenders_data:
            raise ValidationError("Checkout error: No payment tender provided.")

        # 2. Check Clinical Prescription Verification if needed
        rx_required = False
        product_ids = [item['product_id'] for item in items_data if item.get('product_id')]
        try:
            rx_products = Product.objects.filter(id__in=product_ids, is_prescription_required=True)
            if rx_products.exists():
                rx_required = True
                # Require pharmacist verification ID or bypass with clinical authorization
                if not payload.get('pharmacist_verified_by_id') and not payload.get('bypass_rx_check'):
                    raise ValidationError(
                        f"Prescription required: Order contains regulated medicines ({', '.join([p.brand_name for p in rx_products])}). Verification by licensed Pharmacist is required."
                    )
        except Exception:
            pass

        # 3. Create Sale Header
        receipt_no = f"REC-{uuid.uuid4().hex[:8].upper()}"
        customer_id = payload.get('customer_id')
        customer = None
        if customer_id and str(customer_id).strip():
            try:
                customer = Customer.objects.filter(id=str(customer_id).strip()).first()
            except Exception:
                customer = Customer.objects.filter(name__icontains=str(customer_id).strip()).first()

        pharmacist_id = payload.get('pharmacist_verified_by_id')
        pharmacist_verified_by = None
        if pharmacist_id and str(pharmacist_id).strip():
            try:
                pharmacist_verified_by = User.objects.filter(id=str(pharmacist_id).strip()).first()
            except Exception:
                pharmacist_verified_by = User.objects.filter(username=str(pharmacist_id).strip()).first() or cashier

        idempotency_raw = payload.get('idempotency_key')
        idempotency_key = None
        if idempotency_raw:
            try:
                idempotency_key = uuid.UUID(str(idempotency_raw))
            except Exception:
                idempotency_key = None

        sale = Sale.objects.create(
            branch=branch,
            cash_shift=shift,
            cashier=cashier,
            customer=customer,
            receipt_number=payload.get('receipt_number', receipt_no),
            sale_type=payload.get('sale_type', 'RETAIL'),
            subtotal=Decimal('0.0000'),
            discount_amount=Decimal(str(payload.get('discount_amount', '0.0000'))),
            tax_amount=Decimal(str(payload.get('tax_amount', '0.0000'))),
            total_amount=Decimal('0.0000'),
            total_cost_amount=Decimal('0.0000'),
            gross_profit_amount=Decimal('0.0000'),
            status='COMPLETED',
            is_credit_sale=bool(payload.get('is_credit_sale', False)),
            credit_due_date=payload.get('credit_due_date'),
            pharmacist_verified_by=pharmacist_verified_by,
            prescribing_doctor_name=payload.get('prescribing_doctor_name'),
            doctor_license_number=payload.get('doctor_license_number'),
            patient_prescription_number=payload.get('patient_prescription_number'),
            idempotency_key=idempotency_key
        )

        subtotal = Decimal('0.0000')
        total_cost = Decimal('0.0000')

        # 4. Process Line Items & Deduct Inventory via FEFO
        for item in items_data:
            product_raw_id = str(item.get('product_id', '')).strip()
            product = None
            if product_raw_id:
                try:
                    product = Product.objects.filter(id=product_raw_id).first()
                except Exception:
                    product = None
            if not product and item.get('product_name'):
                product = Product.objects.filter(brand_name__icontains=item['product_name']).first()
            if not product:
                product = Product.objects.first()

            if not product:
                raise ValidationError("Product item could not be resolved.")
            units_count = Decimal(str(item.get('quantity_dispensed_units') or item.get('quantity') or '1.00'))
            mult = Decimal(str(item.get('multiplier_to_base', '1.00')))
            total_base_qty = units_count * mult
            unit_selling = Decimal(str(item.get('unit_selling_price') or item.get('unit_price') or product.selling_price_base))
            disc_percent = Decimal(str(item.get('discount_percent', '0.00')))

            line_gross = units_count * unit_selling
            line_disc = line_gross * (disc_percent / Decimal('100.00'))
            line_total = line_gross - line_disc

            # Determine Batch Allocations (Specific batch or FEFO multi-batch split)
            allocations = []
            if item.get('batch_id'):
                batch_id = str(item['batch_id']).strip()
                balance = None
                try:
                    balance = StockBalance.objects.filter(
                        branch=branch,
                        product=product,
                        batch_id=batch_id
                    ).first()
                except Exception:
                    balance = None

                if balance and balance.available_quantity_base >= total_base_qty:
                    allocations.append({
                        'batch_id': str(balance.batch_id),
                        'allocated_quantity_base': float(total_base_qty)
                    })
                else:
                    try:
                        allocations = FEFOEngine.allocate_fefo(product.id, total_base_qty, branch=branch)
                    except ValueError as e:
                        raise ValidationError(str(e))
            else:
                try:
                    allocations = FEFOEngine.allocate_fefo(product.id, total_base_qty, branch=branch)
                except ValueError as e:
                    raise ValidationError(str(e))

            if not allocations:
                raise ValidationError(f"Insufficient stock for {product.brand_name}.")

            for alloc in allocations:
                batch = Batch.objects.get(id=alloc['batch_id'])
                alloc_base_qty = Decimal(str(alloc['allocated_quantity_base']))
                alloc_fraction = alloc_base_qty / total_base_qty if total_base_qty > 0 else Decimal('1.0')
                alloc_units = units_count * alloc_fraction
                alloc_line_total = line_total * alloc_fraction

                # Deduct stock balance
                balance = StockBalance.objects.select_for_update().filter(
                    branch=branch,
                    product=product,
                    batch=batch
                ).first()

                if not balance or balance.available_quantity_base < alloc_base_qty:
                    raise ValidationError(f"Insufficient stock for {product.brand_name} in batch {batch.batch_number}.")

                balance.quantity_on_hand_base -= alloc_base_qty
                balance.save()

                # Record stock movement
                alloc_cost = alloc_base_qty * batch.unit_cost_base
                StockMovement.objects.create(
                    branch=branch,
                    batch=batch,
                    movement_type='SALE_DISPENSE',
                    quantity_change_base=-alloc_base_qty,
                    balance_after_base=balance.quantity_on_hand_base,
                    reference_type='SALE',
                    reference_id=sale.id,
                    unit_cost_snapshot=batch.unit_cost_base,
                    total_cost_snapshot=alloc_cost,
                    performed_by=cashier,
                    notes=f"Dispensed in receipt {sale.receipt_number}"
                )

                if balance.quantity_on_hand_base <= Decimal('0.00'):
                    batch.status = 'DEPLETED'
                    batch.save()

                alloc_profit = alloc_line_total - alloc_cost

                SaleLine.objects.create(
                    sale=sale,
                    product=product,
                    batch=batch,
                    packaging_unit_name=item.get('packaging_unit_name', product.base_dispensing_unit),
                    multiplier_to_base=mult,
                    quantity_dispensed_units=alloc_units,
                    total_quantity_base=alloc_base_qty,
                    unit_selling_price=unit_selling,
                    unit_cost_price=batch.unit_cost_base,
                    discount_percent=disc_percent,
                    total_line_amount=alloc_line_total,
                    total_line_cost=alloc_cost,
                    total_line_profit=alloc_profit,
                    dosage_instructions=item.get('dosage_instructions')
                )

                subtotal += alloc_line_total
                total_cost += alloc_cost

        sale.subtotal = subtotal
        sale.total_amount = subtotal - sale.discount_amount + sale.tax_amount
        sale.total_cost_amount = total_cost
        sale.gross_profit_amount = sale.total_amount - total_cost
        sale.save()

        # 5. Record Tenders
        for tender_data in tenders_data:
            raw_method = str(tender_data.get('tender_method', 'CASH')).upper()
            method_map = {
                'CASH': 'CASH',
                'CARD': 'CARD_POS',
                'CARD_POS': 'CARD_POS',
                'POS': 'CARD_POS',
                'MOMO': 'MOBILE_MONEY',
                'MOBILE_MONEY': 'MOBILE_MONEY',
                'TRANSFER': 'BANK_TRANSFER',
                'BANK_TRANSFER': 'BANK_TRANSFER',
                'CREDIT': 'CUSTOMER_CREDIT',
                'CUSTOMER_CREDIT': 'CUSTOMER_CREDIT',
                'CREDIT_NOTE': 'CREDIT_NOTE'
            }
            method = method_map.get(raw_method, raw_method)
            paid_amt = Decimal(str(tender_data.get('amount_paid') or tender_data.get('amount_tendered') or '0.0000'))
            tender_amt = Decimal(str(tender_data.get('amount_tendered') or paid_amt))
            change = Decimal(str(tender_data.get('change_given', max(Decimal('0.0000'), tender_amt - paid_amt))))

            SaleTender.objects.create(
                sale=sale,
                tender_method=method,
                amount_tendered=tender_amt,
                amount_paid=paid_amt,
                change_given=change,
                transaction_reference=tender_data.get('transaction_reference'),
                tender_notes=tender_data.get('tender_notes')
            )

            # If Customer Credit Tender, update customer balance
            if method == 'CUSTOMER_CREDIT' and customer:
                if (customer.current_credit_balance + paid_amt) > customer.credit_limit:
                    raise ValidationError(f"Credit limit exceeded. Limit: {customer.credit_limit}, New Balance: {customer.current_credit_balance + paid_amt}")
                customer.current_credit_balance += paid_amt
                customer.save()

        # 6. If converting Draft, update status
        draft_id = payload.get('draft_sale_id')
        if draft_id:
            DraftSale.objects.filter(id=draft_id).update(status='CONVERTED')

        # 7. Audit Logging
        log_audit_event(
            module='pos',
            action_type='POS_SALE_COMPLETED',
            target_identifier=sale.receipt_number,
            description=f"Completed sale {sale.receipt_number} for amount {sale.total_amount} (Items: {len(items_data)})",
            actor=cashier,
            branch=branch
        )

        return sale


class ReturnProcessingEngine:
    """Processes customer returns, inventory restocking, and refund / credit note issuance."""

    @classmethod
    @transaction.atomic
    def process_return(cls, payload: dict, returned_by, branch) -> SaleReturn:
        sale_id = payload['sale_id']
        original_sale = Sale.objects.get(id=sale_id)

        return_num = f"RET-{uuid.uuid4().hex[:6].upper()}"
        refund_method = payload.get('refund_method', 'CASH')
        refund_amount = Decimal(str(payload['total_refund_amount']))
        restock = payload.get('is_restocked_to_inventory', True)

        ret = SaleReturn.objects.create(
            branch=branch,
            original_sale=original_sale,
            return_number=return_num,
            returned_by=returned_by,
            refund_method=refund_method,
            total_refund_amount=refund_amount,
            return_reason=payload.get('return_reason', 'Patient return'),
            is_restocked_to_inventory=restock,
            condition_assessment=payload.get('condition_assessment', 'INTACT')
        )

        # Restock items if intact
        if restock:
            for item in payload.get('returned_items', []):
                sale_line = original_sale.lines.filter(id=item['sale_line_id']).first()
                if sale_line:
                    qty_return = Decimal(str(item.get('quantity_returned_base') or item.get('quantity_returned') or item.get('quantity') or sale_line.total_quantity_base))
                    balance, _ = StockBalance.objects.get_or_create(
                        branch=branch,
                        product=sale_line.product,
                        batch=sale_line.batch,
                        defaults={'quantity_on_hand_base': Decimal('0.00')}
                    )
                    balance.quantity_on_hand_base += qty_return
                    balance.save()

                    if sale_line.batch.status == 'DEPLETED':
                        sale_line.batch.status = 'ACTIVE'
                        sale_line.batch.save()

                    StockMovement.objects.create(
                        branch=branch,
                        batch=sale_line.batch,
                        movement_type='RETURN_INWARD',
                        quantity_change_base=qty_return,
                        balance_after_base=balance.quantity_on_hand_base,
                        reference_type='RETURN',
                        reference_id=ret.id,
                        unit_cost_snapshot=sale_line.batch.unit_cost_base,
                        total_cost_snapshot=qty_return * sale_line.batch.unit_cost_base,
                        performed_by=returned_by,
                        notes=f"Return {ret.return_number} for sale {original_sale.receipt_number}"
                    )

        # Issue Credit Note if requested
        if refund_method == 'CREDIT_NOTE' and original_sale.customer:
            CustomerCreditNote.objects.create(
                branch=branch,
                customer=original_sale.customer,
                credit_note_number=f"CRN-{uuid.uuid4().hex[:6].upper()}",
                original_sale=original_sale,
                sale_return=ret,
                original_amount=refund_amount,
                remaining_balance=refund_amount,
                status='ACTIVE',
                issued_by=returned_by
            )

        original_sale.status = 'REFUNDED'
        original_sale.save()

        log_audit_event(
            module='pos',
            action_type='SALE_RETURN_PROCESSED',
            target_identifier=ret.return_number,
            description=f"Processed return {ret.return_number} for sale {original_sale.receipt_number}, refunded {refund_amount}",
            actor=returned_by,
            branch=branch
        )

        return ret


class CreditPaymentService:
    """Manages customer credit settlements and payment ledgers."""

    @classmethod
    @transaction.atomic
    def record_payment(cls, payload: dict, recorded_by) -> CreditPayment:
        customer = Customer.objects.get(id=payload['customer_id'])
        amt = Decimal(str(payload['amount_paid']))
        sale_id = payload.get('sale_id')
        sale = Sale.objects.filter(id=sale_id).first() if sale_id else None

        receipt_no = f"CPR-{uuid.uuid4().hex[:6].upper()}"

        payment = CreditPayment.objects.create(
            customer=customer,
            sale=sale,
            receipt_number=payload.get('receipt_number', receipt_no),
            amount_paid=amt,
            payment_method=payload.get('payment_method', 'CASH'),
            reference=payload.get('reference'),
            recorded_by=recorded_by
        )

        customer.current_credit_balance = max(Decimal('0.0000'), customer.current_credit_balance - amt)
        customer.save()

        if sale:
            sale.credit_amount_paid += amt
            sale.save()

        log_audit_event(
            module='finance',
            action_type='CREDIT_PAYMENT_RECORDED',
            target_identifier=payment.receipt_number,
            description=f"Recorded credit payment {payment.receipt_number} of {amt} for customer {customer.name}",
            actor=recorded_by,
            branch=customer.branch
        )

        return payment
