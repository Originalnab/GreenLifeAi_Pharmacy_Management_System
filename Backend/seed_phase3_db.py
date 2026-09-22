import os
import django
from datetime import date, timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'greenlife.settings')
django.setup()

from apps.administration.models import Organization, Branch, StorageLocation
from apps.authentication.models import User
from apps.catalogue.models import Product
from apps.parties.models import Supplier
from apps.inventory.models import Batch, StockBalance, StockMovement
from apps.procurement.models import PurchaseOrder, PurchaseOrderLine, GoodsReceiptNote
from apps.procurement.services import GRNProcessingEngine

def seed_phase3():
    print("--- Seeding Phase 3: Supply Chain, Procurement & FEFO Inventory ---")
    branch = Branch.objects.first()
    pharmacist = User.objects.filter(role='Pharmacist').first() or User.objects.first()
    stock_officer = User.objects.filter(role='Stock Officer').first() or pharmacist
    supplier_mega = Supplier.objects.filter(code='SUP-MEGA-001').first() or Supplier.objects.first()
    supplier_evans = Supplier.objects.filter(code='SUP-EVANS-002').first() or supplier_mega

    loc_dispensary = StorageLocation.objects.filter(code='LOC-DISP-01').first()
    loc_bulk = StorageLocation.objects.filter(code='LOC-BULK-02').first()
    loc_cold = StorageLocation.objects.filter(code='LOC-COLD-04').first()

    today = date.today()

    # 1. Purchase Orders
    po1 = PurchaseOrder.objects.create(
        branch=branch,
        supplier=supplier_mega,
        po_number='PO-2026-0091',
        status='COMPLETED',
        total_estimated_cost=Decimal('4200.0000'),
        created_by=stock_officer,
        approved_by=pharmacist
    )

    po2 = PurchaseOrder.objects.create(
        branch=branch,
        supplier=supplier_evans,
        po_number='PO-2026-0092',
        status='SUBMITTED',
        total_estimated_cost=Decimal('1850.0000'),
        created_by=stock_officer
    )

    prods = {p.product_code: p for p in Product.objects.all()}
    print(f"Products available for PO/GRN: {len(prods)}")

    # Add PO lines
    if 'MED-AMOX-500' in prods:
        PurchaseOrderLine.objects.create(
            purchase_order=po1,
            product=prods['MED-AMOX-500'],
            quantity_ordered_base=Decimal('5000.00'),
            unit_cost_base=Decimal('0.3500')
        )
    if 'MED-LONART-DS' in prods:
        PurchaseOrderLine.objects.create(
            purchase_order=po1,
            product=prods['MED-LONART-DS'],
            quantity_ordered_base=Decimal('600.00'),
            unit_cost_base=Decimal('1.8000')
        )

    # 2. Goods Receipt Note (GRN) posting via GRNProcessingEngine
    grn1 = GoodsReceiptNote.objects.create(
        branch=branch,
        purchase_order=po1,
        supplier=supplier_mega,
        grn_number='GRN-2026-0418',
        supplier_invoice_number='INV-MEGA-88412',
        total_invoice_amount=Decimal('0.0000'),
        received_by=stock_officer,
        storage_location=loc_dispensary
    )

    lines_to_post = []
    if 'MED-AMOX-500' in prods:
        # Safe Batch: 14 months out
        lines_to_post.append({
            'product_id': prods['MED-AMOX-500'].id,
            'batch_number': 'AMX-2026-B1',
            'expiry_date': today + timedelta(days=420),
            'quantity_received_base': Decimal('3000.00'),
            'unit_cost_base': Decimal('0.3500')
        })
        # Warning Near-Expiry Batch: 65 days out
        lines_to_post.append({
            'product_id': prods['MED-AMOX-500'].id,
            'batch_number': 'AMX-2025-W9',
            'expiry_date': today + timedelta(days=65),
            'quantity_received_base': Decimal('500.00'),
            'unit_cost_base': Decimal('0.3500')
        })

    if 'MED-LONART-DS' in prods:
        # Stable Batch: 8 months out
        lines_to_post.append({
            'product_id': prods['MED-LONART-DS'].id,
            'batch_number': 'LNT-2026-01',
            'expiry_date': today + timedelta(days=240),
            'quantity_received_base': Decimal('600.00'),
            'unit_cost_base': Decimal('1.8000')
        })

    if 'MED-PARA-500' in prods:
        # Critical Expiry Batch: 18 days out (for testing FEFO alert)
        lines_to_post.append({
            'product_id': prods['MED-PARA-500'].id,
            'batch_number': 'PCM-2024-C3',
            'expiry_date': today + timedelta(days=18),
            'quantity_received_base': Decimal('800.00'),
            'unit_cost_base': Decimal('0.0500')
        })
        # Stable Batch: 18 months out
        lines_to_post.append({
            'product_id': prods['MED-PARA-500'].id,
            'batch_number': 'PCM-2026-A1',
            'expiry_date': today + timedelta(days=540),
            'quantity_received_base': Decimal('10000.00'),
            'unit_cost_base': Decimal('0.0500')
        })

    if 'MED-AUGM-625' in prods:
        lines_to_post.append({
            'product_id': prods['MED-AUGM-625'].id,
            'batch_number': 'AUG-2026-X4',
            'expiry_date': today + timedelta(days=365),
            'quantity_received_base': Decimal('700.00'),
            'unit_cost_base': Decimal('2.5000')
        })

    GRNProcessingEngine.post_grn(grn1, lines_to_post, stock_officer)
    print(f"GRN {grn1.grn_number} posted successfully with {len(lines_to_post)} batch lines!")
    print(f"Total Batches now active: {Batch.objects.count()}")
    print(f"Total Stock Movements recorded: {StockMovement.objects.count()}")
    print("--- Phase 3 Seeding Successfully Completed ---")

if __name__ == '__main__':
    seed_phase3()
