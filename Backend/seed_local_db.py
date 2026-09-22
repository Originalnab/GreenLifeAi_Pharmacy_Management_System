import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'greenlife.settings')
os.environ.setdefault('USE_SQLITE', '1')
django.setup()

from apps.administration.models import Organization, Branch, StorageLocation
from apps.authentication.models import User, UserAuthorization, CustomRole

def seed():
    print("Seeding initial Organization & Branch...")
    org, _ = Organization.objects.get_or_create(
        code='ORG_GREENLIFE',
        defaults={
            'legal_name': 'Greenlife Healthcare & Pharmaceuticals Ltd',
            'trading_name': 'Greenlife Pharmacy',
            'tax_identification_number': 'TIN-GH-88392019',
            'headquarters_address': 'Plot 14, Victoria Island Commercial District',
            'phone': '+233 24 456 7890',
            'email': 'info@greenlifepharmacy.ng',
            'currency_code': 'GHS'
        }
    )

    branch, _ = Branch.objects.get_or_create(
        code='BR_CENTRAL_01',
        defaults={
            'organization': org,
            'name': 'Greenlife Central Branch (Victoria Island)',
            'premises_license_number': 'PCN-PREM-2024-8849',
            'superintendent_name': 'Dr. Adeyemi Adeleke',
            'superintendent_pcn_number': 'PCN-SA-88392',
            'address': 'Suite 4B, Apex Medical Plaza, Victoria Island',
            'phone': '+233 24 456 7890',
            'email': 'central@greenlifepharmacy.ng',
            'is_central': True,
            'is_active': True
        }
    )

    print("Seeding Storage Locations...")
    locs = [
        ('LOC-DISP-01', 'Front Counter Dispensary Shelves', 'DISPENSARY_SHELF', 'AMBIENT_15_25C'),
        ('LOC-COLD-01', 'Cold Chain Medical Refrigerator (2-8°C)', 'COLD_CHAIN_FRIDGE', 'COLD_2_8C'),
        ('LOC-WH-01', 'Central Bulk Warehouse Bay A', 'BULK_WAREHOUSE', 'AMBIENT_15_25C'),
        ('LOC-QUAR-01', 'Quarantine & Regulatory Isolation Bay', 'QUARANTINE_BAY', 'AMBIENT_15_25C'),
    ]
    for code, name, l_type, temp in locs:
        StorageLocation.objects.get_or_create(
            branch=branch,
            code=code,
            defaults={'name': name, 'type': l_type, 'temperature_range': temp, 'is_active': True}
        )

    print("Seeding Staff Users...")
    staff = [
        ('Admink19', 'admin@greenlifepharmacy.ng', 'Admin1224', 'Dr. Adeyemi Adeleke', 'Adeyemi', 'Oluwaseun', 'Adeleke', '1982-05-14', '+233 24 456 7890', 'Super Admin', 'PCN-SA-88392'),
        ('pharm_amaka', 'amaka.okafor@greenlifepharmacy.ng', 'Pharm@1234', 'Pharm. Amaka Okafor', 'Amaka', 'Chiamaka', 'Okafor', '1989-11-23', '+233 24 987 6543', 'Pharmacist', 'PCN-2018-44910'),
        ('cashier_emmanuel', 'emmanuel.b@greenlifepharmacy.ng', 'Cashier@1234', 'Emmanuel Balogun', 'Emmanuel', '', 'Balogun', '1995-03-17', '+233 27 654 3210', 'Cashier', None),
        ('stock_tunde', 'tunde.f@greenlifepharmacy.ng', 'Stock@1234', 'Babatunde Fashola', 'Babatunde', 'Ayodele', 'Fashola', '1991-08-09', '+233 26 111 2233', 'Stock Officer', None),
    ]

    for uname, email, raw_pass, name, fn, mn, ln, dob, phone, role, lic in staff:
        if not User.objects.filter(username=uname).exists():
            user = User.objects.create(
                username=uname,
                email=email,
                name=name,
                first_name=fn,
                middle_name=mn,
                last_name=ln,
                dob=dob,
                phone=phone,
                role=role,
                license_number=lic,
                branch=branch,
                is_active=True,
                must_change_password=False,
                is_temporary_password=False
            )
            user.set_password(raw_pass)
            user.save()

            UserAuthorization.objects.get_or_create(
                user=user,
                defaults={
                    'max_discount_percent': 100.0 if role == 'Super Admin' else 15.0 if role == 'Pharmacist' else 5.0,
                    'max_refund_limit': 10000.0 if role == 'Super Admin' else 500.0 if role == 'Pharmacist' else 100.0,
                    'stock_adjustment_limit': 10000.0 if role == 'Super Admin' else 1000.0,
                    'can_override_price': role in ['Super Admin', 'Pharmacist'],
                    'can_view_cost_prices': role in ['Super Admin', 'Stock Officer'],
                    'can_view_profits': role == 'Super Admin'
                }
            )

    print("Seeding Complete! Total Users:", User.objects.count(), "Storage Locations:", StorageLocation.objects.count())

if __name__ == '__main__':
    seed()
