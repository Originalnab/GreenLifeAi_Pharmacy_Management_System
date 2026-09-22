import os
import django
from decimal import Decimal
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'greenlife.settings')
django.setup()

from apps.administration.models import Branch
from apps.authentication.models import User
from apps.finance.models import ExpenseCategory, Expense, DailyCashUp, BusinessLoan
from apps.sales.models import SaleTender

def seed_phase5():
    print("--- Seeding Phase 5: Finance, Expenses, Daily Cash-Up & Reports ---")
    branch = Branch.objects.first()
    approver = User.objects.filter(role__in=['Super Admin', 'Pharmacy Admin']).first() or User.objects.first()

    # 1. Expense Categories
    cats_data = [
        ('EXP-UTIL', 'Utilities & Diesel Generator Fuel', 'Power backup fuel and municipal electricity charges'),
        ('EXP-COLD', 'Cold-Chain Maintenance & Calibration', 'Vaccine refrigerator servicing, sensors and dataloggers'),
        ('EXP-LIC', 'Professional Licensing & Regulatory Fees', 'PCN renewal, premise inspection and pharmacy council fees'),
        ('EXP-PACK', 'Packaging Materials & Thermal Receipt Rolls', 'Dispensing envelopes, blister packs and printer consumables'),
        ('EXP-LOG', 'Logistics, Freight & Courier Dispatch', 'Delivery transport, emergency inter-branch transfers'),
        ('EXP-CLEAN', 'Clinical Sanitation & PPE Supplies', 'Disinfectants, gloves, masks and laboratory sanitizers')
    ]

    categories = {}
    for code, name, desc in cats_data:
        cat, _ = ExpenseCategory.objects.get_or_create(code=code, defaults={'name': name, 'description': desc})
        categories[code] = cat
    print(f"Expense Categories seeded: {len(categories)}")

    # 2. Expenses
    expenses_data = [
        ('EXP-2026-001', categories['EXP-UTIL'], Decimal('45.0000'), 'CASH', 'Ikeja Diesel Supplies Ltd', '50 Litres Diesel for cold-chain backup generator'),
        ('EXP-2026-002', categories['EXP-PACK'], Decimal('18.5000'), 'CASH', 'Supreme Paper Mills', 'Box of 50 Thermal Receipt Paper Rolls (80mm)'),
        ('EXP-2026-003', categories['EXP-LOG'], Decimal('25.0000'), 'BANK_TRANSFER', 'GIG Logistics Express', 'Urgent cold-chain delivery of Anti-Snake Venoms')
    ]

    for vnum, cat, amt, method, payee, purpose in expenses_data:
        Expense.objects.get_or_create(
            voucher_number=vnum,
            defaults={
                'branch': branch,
                'category': cat,
                'amount': amt,
                'payment_method': method,
                'disbursed_to': payee,
                'purpose': purpose,
                'approved_by': approver
            }
        )
    print(f"Expenses seeded: {len(expenses_data)}")

    # 3. Daily Cash-Up for Today
    today = date.today()
    tenders = SaleTender.objects.filter(sale__created_at__date=today, sale__branch=branch)
    total_cash = sum((t.amount_paid for t in tenders if t.tender_method == 'CASH'), Decimal('0.0000'))
    total_card = sum((t.amount_paid for t in tenders if t.tender_method == 'CARD_POS'), Decimal('0.0000'))
    total_transfer = sum((t.amount_paid for t in tenders if t.tender_method == 'BANK_TRANSFER'), Decimal('0.0000'))

    cash_expenses = Expense.objects.filter(created_at__date=today, branch=branch, payment_method='CASH')
    total_exp = sum((e.amount for e in cash_expenses), Decimal('0.0000'))

    opening_float = Decimal('50.0000')
    expected_drawer = opening_float + total_cash - total_exp
    actual_counted = expected_drawer  # Perfectly balanced drawer

    DailyCashUp.objects.get_or_create(
        branch=branch,
        cash_up_date=today,
        defaults={
            'opening_float': opening_float,
            'total_cash_sales': total_cash,
            'total_card_sales': total_card,
            'total_transfer_sales': total_transfer,
            'total_expenses_cash': total_exp,
            'expected_cash_in_drawer': expected_drawer,
            'actual_counted_cash': actual_counted,
            'cash_variance': Decimal('0.0000'),
            'status': 'BALANCED',
            'reconciled_by': approver,
            'notes': 'Drawer balanced accurately against cash sales receipts and generator fuel expense voucher.'
        }
    )
    print("Daily Cash-Up seeded successfully.")

    # 4. Business Expansion Loan
    BusinessLoan.objects.get_or_create(
        borrower_name='Greenlife Diagnostic & Radiology Centre Expansion',
        defaults={
            'branch': branch,
            'principal_amount': Decimal('25000.0000'),
            'interest_rate_percent': Decimal('8.50'),
            'total_repayable_amount': Decimal('27125.0000'),
            'total_repaid_amount': Decimal('9041.6700'),
            'status': 'ACTIVE',
            'due_date': today + timedelta(days=365)
        }
    )
    print("Business expansion loan seeded.")
    print("--- Phase 5 Seeding Successfully Completed ---")

if __name__ == '__main__':
    seed_phase5()
