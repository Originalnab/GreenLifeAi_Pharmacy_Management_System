import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'greenlife.settings')
django.setup()

from apps.authentication.models import User
from seed_local_db import seed as seed_phase1
from seed_phase2_db import seed_phase2
from seed_phase3_db import seed_phase3
from seed_phase4_db import seed_phase4
from seed_phase5_db import seed_phase5

def run_all_seeds():
    print("==========================================================")
    print("GreenLife AI - Universal Database Seeding Pipeline")
    print("==========================================================")

    # Check if database is already seeded
    if User.objects.filter(username__in=['Admink19', 'superadmin']).exists():
        print("[INFO] Super Admin user already exists. Database already populated.")
        return

    try:
        print("\n>>> Running Phase 1 Seed (Org, Branch, Staff Users)...")
        seed_phase1()
    except Exception as e:
        print(f"[WARN] Phase 1 warning: {e}")

    try:
        print("\n>>> Running Phase 2 Seed (Catalogue, UOMs, Suppliers, Customers)...")
        seed_phase2()
    except Exception as e:
        print(f"[WARN] Phase 2 warning: {e}")

    try:
        print("\n>>> Running Phase 3 Seed (Batches, Stock Balances, GRNs)...")
        seed_phase3()
    except Exception as e:
        print(f"[WARN] Phase 3 warning: {e}")

    try:
        print("\n>>> Running Phase 4 Seed (Cash Shifts, POS Sales Transactions)...")
        seed_phase4()
    except Exception as e:
        print(f"[WARN] Phase 4 warning: {e}")

    try:
        print("\n>>> Running Phase 5 Seed (Expense Categories, Expenses, Loans)...")
        seed_phase5()
    except Exception as e:
        print(f"[WARN] Phase 5 warning: {e}")

    print("\n[SUCCESS] Universal database seeding complete!")

if __name__ == '__main__':
    run_all_seeds()
