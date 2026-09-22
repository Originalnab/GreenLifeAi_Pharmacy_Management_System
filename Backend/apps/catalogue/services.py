import io
import csv
import uuid
from datetime import date, timedelta
from decimal import Decimal
from django.db import transaction
from .models import (
    Product, ProductPackagingUnit, Category, DosageForm, ImportJob
)
from apps.inventory.models import Batch, StockBalance
from apps.audit.services import log_audit_event

class MultiUnitPricingEngine:
    """Calculates and maintains consistent multi-tier packaging pricing."""

    @staticmethod
    def sync_packaging_units(product: Product):
        """Creates or updates BASE_UNIT, STRIP, and OUTER_BOX tiers for a product."""
        # 1. Base Unit Tier
        ProductPackagingUnit.objects.update_or_create(
            product=product,
            tier_name='BASE_UNIT',
            defaults={
                'unit_label': product.base_dispensing_unit,
                'multiplier_to_base': Decimal('1.00'),
                'wholesale_cost': product.cost_price_base,
                'retail_selling_price': product.selling_price_base,
                'is_dispensable': True
            }
        )

        # 2. Strip Tier (if multiplier > 1)
        if product.strip_multiplier and product.strip_multiplier > Decimal('1.00'):
            strip_cost = product.cost_price_base * product.strip_multiplier
            strip_selling = product.selling_price_base * product.strip_multiplier
            ProductPackagingUnit.objects.update_or_create(
                product=product,
                tier_name='STRIP',
                defaults={
                    'unit_label': 'Strip',
                    'multiplier_to_base': product.strip_multiplier,
                    'wholesale_cost': strip_cost,
                    'retail_selling_price': strip_selling,
                    'is_dispensable': True
                }
            )
        else:
            ProductPackagingUnit.objects.filter(product=product, tier_name='STRIP').delete()

        # 3. Outer Box / Pack Tier (if multiplier > 1)
        if product.pack_box_multiplier and product.pack_box_multiplier > Decimal('1.00'):
            box_cost = product.cost_price_base * product.pack_box_multiplier
            box_selling = product.selling_price_base * product.pack_box_multiplier
            ProductPackagingUnit.objects.update_or_create(
                product=product,
                tier_name='OUTER_BOX',
                defaults={
                    'unit_label': 'Box/Pack',
                    'multiplier_to_base': product.pack_box_multiplier,
                    'wholesale_cost': box_cost,
                    'retail_selling_price': box_selling,
                    'is_dispensable': True
                }
            )
        else:
            ProductPackagingUnit.objects.filter(product=product, tier_name='OUTER_BOX').delete()


class BulkImportService:
    """Handles CSV template export, preview validation, and transactional commit."""

    CSV_HEADERS = [
        'Medicine Name', 'Generic Name', 'Category', 'Dosage Form',
        'Strength', 'Unit', 'Cost Price', 'Selling Price',
        'Barcode', 'Reorder Level', 'Prescription Required'
    ]

    @classmethod
    def get_template_csv(cls) -> str:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(cls.CSV_HEADERS)
        writer.writerow([
            'Amoxil 500mg', 'Amoxicillin Trihydrate', 'Antibiotics & Anti-Infectives', 'Capsule',
            '500mg', 'Capsule', '1.20', '2.50',
            '8901032104501', '50', 'Yes'
        ])
        writer.writerow([
            'Panadol Extra', 'Paracetamol + Caffeine', 'Analgesics & Antipyretics', 'Tablet',
            '500mg/65mg', 'Tablet', '0.50', '1.00',
            '8901032104502', '100', 'No'
        ])
        return output.getvalue()

    @classmethod
    def parse_preview(cls, file_content: str, branch):
        reader = csv.DictReader(io.StringIO(file_content))
        preview_rows = []
        errors = []
        valid_count = 0

        # Cache existing categories and forms
        categories = {c.name.upper(): c for c in Category.objects.all()}
        categories.update({c.code.upper(): c for c in Category.objects.all()})
        dosage_forms = {d.name.upper(): d for d in DosageForm.objects.all()}
        dosage_forms.update({d.code.upper(): d for d in DosageForm.objects.all()})

        for idx, row in enumerate(reader, start=2):
            # Flexible key lookups
            brand_name = (
                row.get('Medicine Name') or row.get('Brand Name') or row.get('Name') or ''
            ).strip()
            generic_name = (
                row.get('Generic Name') or row.get('Generic Molecule') or brand_name
            ).strip()
            cat_name = (
                row.get('Category') or row.get('Therapeutic Category') or row.get('Category Code') or 'General'
            ).strip()
            form_name = (
                row.get('Dosage Form') or row.get('Dosage Form Code') or 'Tablet'
            ).strip()

            if not brand_name:
                errors.append(f"Row {idx}: Medicine Name is mandatory.")
                continue

            # Auto-create or match category
            cat_key = cat_name.upper()
            category = categories.get(cat_key)
            if not category and cat_name:
                clean_code = ''.join(c for c in cat_name if c.isalnum())[:8].upper() or 'GEN'
                category, _ = Category.objects.get_or_create(code=clean_code, defaults={'name': cat_name})
                categories[cat_key] = category
            elif not category:
                category = Category.objects.first()

            # Auto-create or match dosage form
            form_key = form_name.upper()
            dosage_form = dosage_forms.get(form_key)
            if not dosage_form and form_name:
                clean_fcode = ''.join(c for c in form_name if c.isalnum())[:4].upper() or 'TAB'
                dosage_form, _ = DosageForm.objects.get_or_create(code=clean_fcode, defaults={'name': form_name, 'default_base_unit': 'Tablet'})
                dosage_forms[form_key] = dosage_form
            elif not dosage_form:
                dosage_form = DosageForm.objects.first()

            # Unit
            unit_val = (row.get('Unit') or row.get('Base Unit') or 'Tablet').strip()

            try:
                cost_base = Decimal(str(row.get('Cost Price') or row.get('Cost Price Base') or '0.0').replace('$', '').replace('GH₵', '').strip() or '0.0')
                selling_base = Decimal(str(row.get('Selling Price') or row.get('Selling Price Base') or '0.0').replace('$', '').replace('GH₵', '').strip() or '0.0')
                reorder = Decimal(str(row.get('Reorder Level') or '50.0').strip() or '50.0')
                strip_mult = Decimal(str(row.get('Strip Multiplier') or '1.0').strip() or '1.0')
                box_mult = Decimal(str(row.get('Box Multiplier') or '1.0').strip() or '1.0')
            except Exception as e:
                errors.append(f"Row {idx}: Invalid numeric pricing or reorder level format.")
                continue

            if selling_base <= 0:
                errors.append(f"Row {idx}: Selling Price must be greater than 0.00.")
                continue

            # Auto-generate unique product code
            clean_brand = ''.join(c for c in brand_name if c.isalnum())[:4].upper() or 'MED'
            temp_code = f"MED-{clean_brand}-{uuid.uuid4().hex[:4].upper()}"

            barcode_val = (row.get('Barcode') or '').strip()
            if not barcode_val:
                barcode_val = f"890{uuid.uuid4().int % 10000000000:010d}"

            pom_val = (row.get('Prescription Required') or '').upper().strip()
            is_pom = pom_val in ['TRUE', '1', 'YES', 'Y', 'POM']

            clean_b = ''.join(c for c in brand_name if c.isalnum())[:4].upper() or 'MED'
            batch_num = (row.get('Batch Number') or row.get('Batch ID') or row.get('Lot Number') or '').strip()
            if not batch_num:
                batch_num = f"BAT-{clean_b}-{date.today().year}-{uuid.uuid4().hex[:4].upper()}"

            exp_val = (row.get('Expiry Date') or row.get('Expiry') or '').strip()
            if not exp_val:
                exp_val = str(date.today() + timedelta(days=730))

            qty_val = float(Decimal(str(row.get('Initial Stock') or row.get('Quantity') or '0').strip() or '0'))

            preview_item = {
                'id': str(uuid.uuid4()),
                'product_code': temp_code,
                'brand_name': brand_name,
                'generic_name': generic_name,
                'category_id': str(category.id) if category else None,
                'category_name': category.name if category else 'General',
                'dosage_form_id': str(dosage_form.id) if dosage_form else None,
                'dosage_form_name': dosage_form.name if dosage_form else 'General',
                'strength': (row.get('Strength') or '').strip(),
                'base_dispensing_unit': unit_val,
                'strip_multiplier': float(strip_mult),
                'pack_box_multiplier': float(box_mult),
                'cost_price_base': float(cost_base),
                'selling_price_base': float(selling_base),
                'reorder_level_base': float(reorder),
                'barcode': barcode_val,
                'batch_number': batch_num,
                'expiry_date': exp_val,
                'initial_quantity': qty_val,
                'is_prescription_required': is_pom,
                'is_controlled_substance': False,
                'predicted_units': [
                    {'tier': 'BASE_UNIT', 'unit': unit_val, 'selling': float(selling_base)},
                ]
            }
            preview_rows.append(preview_item)
            valid_count += 1

        return {
            'total_rows': len(preview_rows) + len(errors),
            'valid_rows': valid_count,
            'errors': errors,
            'preview_items': preview_rows
        }

    @classmethod
    @transaction.atomic
    def commit_import(cls, items: list, branch, actor):
        created_products = []
        for item in items:
            product = Product.objects.create(
                id=uuid.UUID(item['id']) if item.get('id') else uuid.uuid4(),
                branch=branch,
                product_code=item['product_code'],
                brand_name=item['brand_name'],
                generic_name=item['generic_name'],
                category_id=item['category_id'],
                dosage_form_id=item['dosage_form_id'],
                strength=item.get('strength'),
                base_dispensing_unit=item.get('base_dispensing_unit', 'Piece'),
                strip_multiplier=Decimal(str(item.get('strip_multiplier', '1.0'))),
                pack_box_multiplier=Decimal(str(item.get('pack_box_multiplier', '1.0'))),
                cost_price_base=Decimal(str(item.get('cost_price_base', '0.0'))),
                selling_price_base=Decimal(str(item.get('selling_price_base', '0.0'))),
                reorder_level_base=Decimal(str(item.get('reorder_level_base', '50.0'))),
                barcode=item.get('barcode'),
                is_prescription_required=item.get('is_prescription_required', False),
                is_controlled_substance=item.get('is_controlled_substance', False),
            )
            MultiUnitPricingEngine.sync_packaging_units(product)
            created_products.append(product)

            # Auto-attach active Batch & StockBalance
            clean_b = ''.join(c for c in product.brand_name if c.isalnum())[:4].upper() or 'MED'
            batch_num = item.get('batch_number') or f"BAT-{clean_b}-{date.today().year}-{uuid.uuid4().hex[:4].upper()}"
            expiry = item.get('expiry_date') or (date.today() + timedelta(days=730))
            init_qty = Decimal(str(item.get('initial_quantity', '0.0') or '0.0'))

            batch = Batch.objects.create(
                branch=branch,
                product=product,
                batch_number=batch_num,
                expiry_date=expiry,
                manufacturing_date=date.today(),
                unit_cost_base=product.cost_price_base,
                initial_quantity_base=init_qty,
                status='ACTIVE'
            )

            StockBalance.objects.create(
                branch=branch,
                product=product,
                batch=batch,
                quantity_on_hand_base=init_qty,
                quantity_reserved_base=Decimal('0.00')
            )

        # Audit event
        log_audit_event(
            module='catalogue',
            action_type='BULK_PRODUCT_IMPORT',
            target_identifier=f"{len(created_products)} Products",
            description=f"Imported {len(created_products)} products via CSV wizard",
            actor=actor,
            branch=branch
        )
        return created_products
