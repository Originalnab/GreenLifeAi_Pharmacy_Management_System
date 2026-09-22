import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'greenlife.settings')
django.setup()

from apps.administration.models import Organization, Branch
from apps.catalogue.models import (
    Category, DosageForm, UnitOfMeasure, DosagePreset, Product
)
from apps.catalogue.services import MultiUnitPricingEngine
from apps.parties.models import Supplier, Customer

def seed_phase2():
    print("--- Seeding Phase 2: Master Catalogue, Multi-Unit Master & Suppliers ---")
    org = Organization.objects.first()
    branch = Branch.objects.first()

    if not org or not branch:
        print("Error: Organization or Branch missing. Run seed_local_db.py first.")
        return

    # 1. Categories
    categories_data = [
        ('ANTIBIOTICS', 'Antibiotics & Antimicrobials', 'Broad and narrow-spectrum antibacterial formulations'),
        ('ANTIMALARIALS', 'Antimalarials & ACTs', 'Artemisinin-based combination therapies and prophylaxis'),
        ('ANALGESICS', 'Analgesics, NSAIDs & Antipyretics', 'Pain management and fever-reducing agents'),
        ('ANTIHYPERTENSIVES', 'Antihypertensives & Cardiovascular', 'Blood pressure regulation and cardiac therapies'),
        ('ANTIDIABETICS', 'Antidiabetics & Endocrine', 'Oral hypoglycemic agents and metabolic regulators'),
        ('ANTIHISTAMINES', 'Antihistamines & Respiratory', 'Allergy relief, bronchodilators and cough preparations'),
        ('VITAMINS', 'Vitamins & Nutritional Supplements', 'Multivitamin complexes, minerals and wellness boosters'),
        ('GASTROINTESTINAL', 'Gastrointestinal & Antacids', 'PPIs, H2 blockers, antiemetics and laxatives')
    ]
    categories = {}
    for code, name, desc in categories_data:
        cat, _ = Category.objects.get_or_create(code=code, defaults={'name': name, 'description': desc})
        categories[code] = cat
    print(f"Categories seeded: {len(categories)}")

    # 2. Dosage Forms
    dosage_forms_data = [
        ('TAB', 'Tablet', 'Piece'),
        ('CAP', 'Capsule', 'Piece'),
        ('SYR', 'Syrup', 'Bottle'),
        ('SUSP', 'Suspension', 'Bottle'),
        ('INJ', 'Injection', 'Vial'),
        ('DROPS', 'Drops', 'Bottle'),
        ('CREAM', 'Topical Cream/Ointment', 'Tube'),
        ('INH', 'Inhaler Device', 'Canister')
    ]
    forms = {}
    for code, name, unit in dosage_forms_data:
        df, _ = DosageForm.objects.get_or_create(code=code, defaults={'name': name, 'default_base_unit': unit})
        forms[code] = df
    print(f"Dosage forms seeded: {len(forms)}")

    # 3. Units of Measure
    units_data = [
        ('PCS', 'Piece', 'pcs', 'COUNT'),
        ('STRIP', 'Blister Strip', 'strip', 'COUNT'),
        ('BOX', 'Outer Packaging Box', 'box', 'COUNT'),
        ('BTL', 'Bottle', 'btl', 'VOLUME'),
        ('VIAL', 'Sterile Vial', 'vial', 'COUNT'),
        ('TUBE', 'Collapsible Tube', 'tube', 'COUNT')
    ]
    for code, name, sym, utype in units_data:
        UnitOfMeasure.objects.get_or_create(code=code, defaults={'name': name, 'symbol': sym, 'type': utype})

    # 4. Dosage Presets
    presets_data = [
        ('Twice Daily (BID)', 'Take 1 unit every 12 hours after meals', 'BID', 5),
        ('Three Times Daily (TID)', 'Take 1 unit every 8 hours after meals', 'TID', 5),
        ('Once Daily (QD)', 'Take 1 unit in the morning daily', 'QD', 30),
        ('Four Times Daily (QID)', 'Take 1 unit every 6 hours', 'QID', 5),
        ('When Needed (PRN)', 'Take 1 to 2 units when severe pain or fever occurs', 'PRN', 3)
    ]
    for name, inst, freq, days in presets_data:
        DosagePreset.objects.get_or_create(name=name, defaults={'instruction': inst, 'frequency': freq, 'duration_days': days})

    # 5. Suppliers
    suppliers_data = [
        ('SUP-MEGA-001', 'MegaCare Pharma Distributors Ltd', 'RC-998214', 'Dr. Olumide Johnson', '+233 24 100 2001', 'sales@megacarepharma.com', '45 Industrial Estate, Ikeja', 30),
        ('SUP-EVANS-002', 'Evans Therapeutics Ltd', 'RC-847291', 'Mrs. Folashade Adeleke', '+233 20 200 3002', 'orders@evanstherapeutics.com', '12 Commercial Avenue, Yaba', 45),
        ('SUP-FIDSON-003', 'Fidson Healthcare Plc', 'RC-112344', 'Mr. Chidi Eze', '+233 27 300 4003', 'institutional@fidsonhealthcare.com', '215 Ikorodu Road, Obanikoro', 60),
        ('SUP-EMZOR-004', 'Emzor Pharmaceuticals Ltd', 'RC-554321', 'Alhaji Musa Danjuma', '+233 50 400 5004', 'distributors@emzorpharma.com', 'Plot 3C Aswani Market Road, Isolo', 30)
    ]
    for code, name, tax, contact, phone, email, addr, terms in suppliers_data:
        Supplier.objects.get_or_create(
            code=code,
            defaults={
                'organization': org,
                'name': name,
                'tax_number': tax,
                'contact_person': contact,
                'telephone': phone,
                'email': email,
                'address': addr,
                'payment_terms_days': terms
            }
        )
    print(f"Suppliers seeded: {len(suppliers_data)}")

    # 6. Pharmaceutical Products & Multi-Unit Hierarchy
    products_data = [
        {
            'code': 'MED-AMOX-500',
            'brand': 'Amoxil 500mg Capsules',
            'generic': 'Amoxicillin Trihydrate',
            'barcode': '890123456001',
            'category': categories['ANTIBIOTICS'],
            'dosage_form': forms['CAP'],
            'strength': '500mg',
            'base_unit': 'Capsule',
            'strip_multiplier': Decimal('10.00'),
            'pack_box_multiplier': Decimal('100.00'),
            'cost_base': Decimal('0.3500'),
            'selling_base': Decimal('0.6000'),
            'reorder': Decimal('200.00'),
            'rx_req': True,
        },
        {
            'code': 'MED-LONART-DS',
            'brand': 'Lonart DS Tablets',
            'generic': 'Artemether 80mg + Lumefantrine 480mg',
            'barcode': '890123456002',
            'category': categories['ANTIMALARIALS'],
            'dosage_form': forms['TAB'],
            'strength': '80/480mg',
            'base_unit': 'Tablet',
            'strip_multiplier': Decimal('6.00'),
            'pack_box_multiplier': Decimal('6.00'),
            'cost_base': Decimal('1.8000'),
            'selling_base': Decimal('3.0000'),
            'reorder': Decimal('50.00'),
            'rx_req': False,
        },
        {
            'code': 'MED-PARA-500',
            'brand': 'Emzor Paracetamol 500mg',
            'generic': 'Paracetamol (Acetaminophen)',
            'barcode': '890123456003',
            'category': categories['ANALGESICS'],
            'dosage_form': forms['TAB'],
            'strength': '500mg',
            'base_unit': 'Tablet',
            'strip_multiplier': Decimal('10.00'),
            'pack_box_multiplier': Decimal('1000.00'),
            'cost_base': Decimal('0.0500'),
            'selling_base': Decimal('0.1000'),
            'reorder': Decimal('500.00'),
            'rx_req': False,
        },
        {
            'code': 'MED-AUGM-625',
            'brand': 'Augmentin 625mg Tablets',
            'generic': 'Amoxicillin 500mg + Clavulanic Acid 125mg',
            'barcode': '890123456004',
            'category': categories['ANTIBIOTICS'],
            'dosage_form': forms['TAB'],
            'strength': '625mg',
            'base_unit': 'Tablet',
            'strip_multiplier': Decimal('7.00'),
            'pack_box_multiplier': Decimal('14.00'),
            'cost_base': Decimal('2.5000'),
            'selling_base': Decimal('4.2000'),
            'reorder': Decimal('100.00'),
            'rx_req': True,
        },
        {
            'code': 'MED-AMLO-10',
            'brand': 'Norvasc 10mg Tablets',
            'generic': 'Amlodipine Besylate',
            'barcode': '890123456005',
            'category': categories['ANTIHYPERTENSIVES'],
            'dosage_form': forms['TAB'],
            'strength': '10mg',
            'base_unit': 'Tablet',
            'strip_multiplier': Decimal('10.00'),
            'pack_box_multiplier': Decimal('30.00'),
            'cost_base': Decimal('0.8000'),
            'selling_base': Decimal('1.5000'),
            'reorder': Decimal('60.00'),
            'rx_req': True,
        },
        {
            'code': 'MED-METF-500',
            'brand': 'Glucophage 500mg Tablets',
            'generic': 'Metformin Hydrochloride',
            'barcode': '890123456006',
            'category': categories['ANTIDIABETICS'],
            'dosage_form': forms['TAB'],
            'strength': '500mg',
            'base_unit': 'Tablet',
            'strip_multiplier': Decimal('10.00'),
            'pack_box_multiplier': Decimal('100.00'),
            'cost_base': Decimal('0.2000'),
            'selling_base': Decimal('0.4000'),
            'reorder': Decimal('150.00'),
            'rx_req': True,
        }
    ]

    for pdata in products_data:
        prod, created = Product.objects.get_or_create(
            product_code=pdata['code'],
            defaults={
                'branch': branch,
                'brand_name': pdata['brand'],
                'generic_name': pdata['generic'],
                'barcode': pdata['barcode'],
                'category': pdata['category'],
                'dosage_form': pdata['dosage_form'],
                'strength': pdata['strength'],
                'base_dispensing_unit': pdata['base_unit'],
                'strip_multiplier': pdata['strip_multiplier'],
                'pack_box_multiplier': pdata['pack_box_multiplier'],
                'cost_price_base': pdata['cost_base'],
                'selling_price_base': pdata['selling_base'],
                'reorder_level_base': pdata['reorder'],
                'is_prescription_required': pdata['rx_req']
            }
        )
        MultiUnitPricingEngine.sync_packaging_units(prod)
    print(f"Products seeded with Multi-Unit Tiers: {len(products_data)}")

    # 7. Seed Sample Customers
    customers_data = [
        ('CUST-WALK-001', 'Walk-in Retail Customer', '+233 24 000 0000', 'walkin@retail.com', Decimal('0.00')),
        ('CUST-CORP-002', 'Lekki Health Maintenance Clinic', '+233 20 888 9999', 'accounts@lekkihealth.ng', Decimal('50000.00')),
        ('CUST-REG-003', 'Mrs. Chioma Adeleke', '+233 26 555 4433', 'chioma.adeleke@gmail.com', Decimal('5000.00'))
    ]
    for code, name, phone, email, limit in customers_data:
        Customer.objects.get_or_create(
            customer_code=code,
            defaults={
                'branch': branch,
                'name': name,
                'phone': phone,
                'email': email,
                'credit_limit': limit
            }
        )
    print(f"Customers seeded: {len(customers_data)}")
    print("--- Phase 2 Seeding Successfully Completed ---")

if __name__ == '__main__':
    seed_phase2()
