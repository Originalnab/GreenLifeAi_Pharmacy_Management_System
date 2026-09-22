import os
import django
from decimal import Decimal
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'greenlife.settings')
django.setup()

from apps.administration.models import Branch
from apps.authentication.models import User
from apps.catalogue.models import Product
from apps.parties.models import Customer
from apps.sales.models import CashShift, Sale, DraftSale
from apps.sales.services import AtomicCheckoutEngine, ReturnProcessingEngine

def seed_phase4():
    print("--- Seeding Phase 4: POS Dispensary, Cash Shifts & Sales History ---")
    branch = Branch.objects.first()
    cashier = User.objects.filter(role='Cashier').first() or User.objects.first()
    pharmacist = User.objects.filter(role='Pharmacist').first() or cashier
    cust_lekki = Customer.objects.filter(customer_code='CUST-CORP-002').first()

    prods = {p.product_code: p for p in Product.objects.all()}

    # 1. Open Operational Cash Shift
    shift, _ = CashShift.objects.get_or_create(
        user=cashier,
        status='OPEN',
        defaults={
            'branch': branch,
            'shift_number': 'SHIFT-2026-081',
            'opening_float': Decimal('50.0000')
        }
    )
    print(f"Active Cash Shift: {shift.shift_number} for {cashier.name}")

    # 2. Sale 1: Over-the-counter Cash Sale (Lonart DS)
    if 'MED-LONART-DS' in prods:
        lonart = prods['MED-LONART-DS']
        if not Sale.objects.filter(receipt_number='REC-2026-00101').exists():
            payload_sale1 = {
                'cash_shift_id': str(shift.id),
                'receipt_number': 'REC-2026-00101',
                'sale_type': 'RETAIL',
                'items': [
                    {
                        'product_id': str(lonart.id),
                        'quantity_dispensed_units': 2,
                        'multiplier_to_base': 6.00,  # Strip
                        'unit_selling_price': 18.00,
                        'packaging_unit_name': 'Strip',
                        'dosage_instructions': 'Take 1 tablet twice daily for 3 days'
                    }
                ],
                'tenders': [
                    {
                        'tender_method': 'CASH',
                        'amount_tendered': 40.00,
                        'amount_paid': 36.00,
                        'change_given': 4.00
                    }
                ]
            }
            s1 = AtomicCheckoutEngine.process_checkout(payload_sale1, cashier, branch)
            print(f"Sale 1 checked out: {s1.receipt_number} Total: {s1.total_amount} Profit: {s1.gross_profit_amount}")

    # 3. Sale 2: Regulated Prescription Sale (Augmentin + Amoxil)
    if 'MED-AUGM-625' in prods and 'MED-AMOX-500' in prods:
        augm = prods['MED-AUGM-625']
        amox = prods['MED-AMOX-500']
        if not Sale.objects.filter(receipt_number='REC-2026-00102').exists():
            payload_rx = {
                'cash_shift_id': str(shift.id),
                'receipt_number': 'REC-2026-00102',
                'sale_type': 'DISPENSARY',
                'pharmacist_verified_by_id': str(pharmacist.id),
                'prescribing_doctor_name': 'Dr. K. Adewale (MBBS, FWACP)',
                'doctor_license_number': 'MDC-2015-8831',
                'patient_prescription_number': 'RX-2026-9041',
                'items': [
                    {
                        'product_id': str(augm.id),
                        'quantity_dispensed_units': 1,
                        'multiplier_to_base': 14.00,  # Box
                        'unit_selling_price': 58.80,
                        'packaging_unit_name': 'Box/Pack',
                        'dosage_instructions': 'Take 1 tablet every 12 hours after food'
                    },
                    {
                        'product_id': str(amox.id),
                        'quantity_dispensed_units': 2,
                        'multiplier_to_base': 10.00,  # Strip
                        'unit_selling_price': 6.00,
                        'packaging_unit_name': 'Strip',
                        'dosage_instructions': 'Take 1 capsule every 8 hours'
                    }
                ],
                'tenders': [
                    {
                        'tender_method': 'CARD_POS',
                        'amount_tendered': 70.80,
                        'amount_paid': 70.80,
                        'transaction_reference': 'POS-STANBIC-998822'
                    }
                ]
            }
            s2 = AtomicCheckoutEngine.process_checkout(payload_rx, cashier, branch)
            print(f"Prescription Sale 2 checked out: {s2.receipt_number} Total: {s2.total_amount}")

    # 4. Sale 3: Customer Credit Sale (Corporate Account)
    if 'MED-PARA-500' in prods and cust_lekki:
        para = prods['MED-PARA-500']
        if not Sale.objects.filter(receipt_number='REC-2026-00103').exists():
            payload_credit = {
                'cash_shift_id': str(shift.id),
                'customer_id': str(cust_lekki.id),
                'receipt_number': 'REC-2026-00103',
                'sale_type': 'WHOLESALE',
                'is_credit_sale': True,
                'credit_due_date': (date.today() + timedelta(days=30)).isoformat(),
                'items': [
                    {
                        'product_id': str(para.id),
                        'quantity_dispensed_units': 5,
                        'multiplier_to_base': 1000.00,  # Bulk Box
                        'unit_selling_price': 90.00,
                        'packaging_unit_name': 'Bulk Box'
                    }
                ],
                'tenders': [
                    {
                        'tender_method': 'CUSTOMER_CREDIT',
                        'amount_tendered': 450.00,
                        'amount_paid': 450.00,
                        'transaction_reference': 'PO-LEKKI-2026-091'
                    }
                ]
            }
            s3 = AtomicCheckoutEngine.process_checkout(payload_credit, cashier, branch)
            print(f"Credit Sale 3 checked out: {s3.receipt_number} Total: {s3.total_amount}, Customer Credit: {cust_lekki.current_credit_balance}")

    # 5. Held / Draft Cart
    if 'MED-AMOX-500' in prods:
        DraftSale.objects.get_or_create(
            draft_number='DRF-2026-001',
            defaults={
                'branch': branch,
                'cashier': cashier,
                'title': 'Mr. Mensah (Pending Prescription Slip)',
                'notes': 'Waiting for doctor stamp verification',
                'cart_payload': {
                    'product_id': str(prods['MED-AMOX-500'].id),
                    'quantity': 2,
                    'tier': 'STRIP'
                },
                'status': 'HELD'
            }
        )
        print("Draft cart seeded successfully.")

    print(f"Total Sales in Database: {Sale.objects.count()}")
    print("--- Phase 4 Seeding Successfully Completed ---")

if __name__ == '__main__':
    seed_phase4()
