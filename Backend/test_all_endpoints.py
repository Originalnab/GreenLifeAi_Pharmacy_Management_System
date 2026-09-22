import json
import urllib.request
import urllib.error
import sys
import uuid
from datetime import datetime, date

BASE_URL = "http://127.0.0.1:8000/api/v1"

results = []

def record_result(phase, method, path, status_code, success, details=None, payload=None):
    res = {
        "phase": phase,
        "method": method,
        "path": path,
        "status_code": status_code,
        "success": success,
        "payload": payload,
        "details": details
    }
    results.append(res)
    mark = "PASS" if success else "FAIL"
    detail_str = str(details)[:120] if details else ""
    print(f"[{mark}] [{phase:^7}] {method:4} {path:36} -> {status_code:3} {detail_str}")
    return res

def make_request(method, endpoint, data=None, headers=None):
    url = f"{BASE_URL}{endpoint}"
    req_headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if headers:
        req_headers.update(headers)
    
    body = None
    if data is not None:
        body = json.dumps(data).encode("utf-8")
    
    req = urllib.request.Request(url, data=body, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            res_code = response.getcode()
            content_type = response.headers.get("Content-Type", "")
            raw_body = response.read().decode("utf-8")
            if "application/json" in content_type:
                return res_code, json.loads(raw_body)
            return res_code, raw_body
    except urllib.error.HTTPError as e:
        raw_err = e.read().decode("utf-8")
        try:
            err_data = json.loads(raw_err)
        except Exception:
            err_data = raw_err
        return e.code, err_data
    except Exception as e:
        return 0, str(e)

def run_tests():
    print("=" * 80)
    print("GREENLIFE AI PHARMACY MANAGEMENT SYSTEM - COMPREHENSIVE 5-PHASE API TEST")
    print("=" * 80)

    # 0. Health Check
    code, data = make_request("GET", "/health/")
    record_result("Health", "GET", "/health/", code, code == 200, str(data))

    # Phase 1: Authentication & Identity
    print("\n" + "=" * 40 + " PHASE 1: IDENTITY, ACCESS & SECURITY " + "=" * 40)
    
    # 1.1 Login with superadmin credentials
    login_payload = {"identifier": "superadmin", "password": "Admin@1234"}
    code, data = make_request("POST", "/auth/login/", login_payload)
    current_user_id = None
    if code == 200 and isinstance(data, dict):
        user_info = data.get('user', {})
        current_user_id = user_info.get('id')
        user_display = f"{user_info.get('name')} ({user_info.get('role')})"
    else:
        user_display = str(data)
    record_result("Phase 1", "POST", "/auth/login/", code, code == 200, user_display, login_payload)
    
    # 1.2 Auth Me
    code, data = make_request("GET", "/auth/me/")
    record_result("Phase 1", "GET", "/auth/me/", code, code == 200)

    # 1.3 Lock Screen
    code, data = make_request("POST", "/auth/lock/", {"reason": "Screen timeout"})
    record_result("Phase 1", "POST", "/auth/lock/", code, code in [200, 201])

    # 1.4 Unlock Screen
    unlock_payload = {"userId": current_user_id, "password": "Admin@1234"}
    code, data = make_request("POST", "/auth/unlock/", unlock_payload)
    record_result("Phase 1", "POST", "/auth/unlock/", code, code in [200, 201], str(data), unlock_payload)

    # 1.5 Dismiss Notice
    code, data = make_request("POST", "/auth/dismiss-notice/", {"username": "superadmin"})
    record_result("Phase 1", "POST", "/auth/dismiss-notice/", code, code in [200, 201])

    # 1.6 Premises Profile
    code, data = make_request("GET", "/admin/profile/")
    record_result("Phase 1", "GET", "/admin/profile/", code, code == 200, f"Branch: {data.get('name') if isinstance(data, dict) else 'N/A'}")

    # 1.7 Storage Locations GET
    code, locs = make_request("GET", "/admin/storage-locations/")
    record_result("Phase 1", "GET", "/admin/storage-locations/", code, code == 200, f"Found {len(locs) if isinstance(locs, list) else 'N/A'}")

    # 1.8 Create Storage Location POST
    loc_payload = {
        "code": f"LOC-TEST-{uuid.uuid4().hex[:4].upper()}",
        "name": f"Dispensary Bay {uuid.uuid4().hex[:4].upper()}",
        "type": "DISPENSARY_SHELF",
        "temperature_range": "AMBIENT_15_25C",
        "description": "Secondary dispensary rack"
    }
    code, new_loc = make_request("POST", "/admin/storage-locations/", loc_payload)
    storage_loc_id = new_loc.get('id') if isinstance(new_loc, dict) else (locs[0]['id'] if isinstance(locs, list) and len(locs) > 0 else None)
    record_result("Phase 1", "POST", "/admin/storage-locations/", code, code in [200, 201], f"Created Location ID: {storage_loc_id}", loc_payload)

    # 1.9 Admin Users GET
    code, users = make_request("GET", "/admin/users/")
    record_result("Phase 1", "GET", "/admin/users/", code, code == 200, f"Found {len(users) if isinstance(users, list) else 'N/A'}")

    # 1.10 Create Staff User POST
    new_user_payload = {
        "username": f"pharm_{uuid.uuid4().hex[:5]}",
        "first_name": "Amina",
        "last_name": "Ibrahim",
        "email": f"amina_{uuid.uuid4().hex[:4]}@greenlife.com",
        "dob": "1994-08-15",
        "phone": "+233245550011",
        "role": "Pharmacist",
        "license_number": f"PCN-PH-{uuid.uuid4().hex[:5].upper()}"
    }
    code, created_user = make_request("POST", "/admin/users/", new_user_payload)
    test_user_id = created_user.get('user', {}).get('id') if isinstance(created_user, dict) else None
    record_result("Phase 1", "POST", "/admin/users/", code, code in [200, 201], f"New Staff ID: {test_user_id}", new_user_payload)

    # 1.11 Toggle User Status POST
    if test_user_id:
        code, status_res = make_request("POST", f"/admin/users/{test_user_id}/status/", {"is_active": True})
        record_result("Phase 1", "POST", f"/admin/users/{test_user_id}/status/", code, code in [200, 204], f"Status: {status_res}")

    # 1.12 Roles GET
    code, roles = make_request("GET", "/admin/roles/")
    record_result("Phase 1", "GET", "/admin/roles/", code, code == 200)

    # 1.13 Audit Events GET
    code, audits = make_request("GET", "/audit/events/")
    audit_count = len(audits) if isinstance(audits, list) else (len(audits.get('results', [])) if isinstance(audits, dict) else 0)
    record_result("Phase 1", "GET", "/audit/events/", code, code == 200, f"Logged audit events: {audit_count}")

    # Phase 2: Master Data & Catalogue
    print("\n" + "=" * 40 + " PHASE 2: CATALOGUE, PARTIES & PRICING " + "=" * 40)
    
    # 2.1 Categories GET & POST
    code, cats = make_request("GET", "/catalogue/categories/")
    record_result("Phase 2", "GET", "/catalogue/categories/", code, code == 200)

    cat_payload = {
        "code": f"CAT-{uuid.uuid4().hex[:4].upper()}",
        "name": f"Analgesics-{uuid.uuid4().hex[:4]}",
        "description": "Pain relief & antipyretic therapeutics",
        "is_active": True
    }
    code, cat_data = make_request("POST", "/catalogue/categories/", cat_payload)
    cat_id = cat_data.get('id') if isinstance(cat_data, dict) else None
    if not cat_id and isinstance(cats, dict) and cats.get('results'):
        cat_id = cats['results'][0]['id']
    elif not cat_id and isinstance(cats, list) and len(cats) > 0:
        cat_id = cats[0]['id']
    record_result("Phase 2", "POST", "/catalogue/categories/", code, code in [200, 201], f"Category ID: {cat_id}", cat_payload)

    # 2.2 Dosage Forms GET & POST
    code, dosage_forms = make_request("GET", "/catalogue/dosage-forms/")
    record_result("Phase 2", "GET", "/catalogue/dosage-forms/", code, code == 200)

    df_payload = {
        "code": f"DF-{uuid.uuid4().hex[:3].upper()}",
        "name": f"Film-Coated Tablet {uuid.uuid4().hex[:3]}",
        "default_base_unit": "tablet",
        "is_active": True
    }
    code, df_data = make_request("POST", "/catalogue/dosage-forms/", df_payload)
    df_id = df_data.get('id') if isinstance(df_data, dict) else None
    if not df_id and isinstance(dosage_forms, dict) and dosage_forms.get('results'):
        df_id = dosage_forms['results'][0]['id']
    elif not df_id and isinstance(dosage_forms, list) and len(dosage_forms) > 0:
        df_id = dosage_forms[0]['id']
    record_result("Phase 2", "POST", "/catalogue/dosage-forms/", code, code in [200, 201], f"DosageForm ID: {df_id}", df_payload)

    # 2.3 Units of Measure GET & POST
    code, units = make_request("GET", "/catalogue/units/")
    record_result("Phase 2", "GET", "/catalogue/units/", code, code == 200)

    unit_payload = {
        "code": f"UOM-{uuid.uuid4().hex[:3].upper()}",
        "name": f"Standard Tablet {uuid.uuid4().hex[:3]}",
        "symbol": "tab",
        "type": "COUNT"
    }
    code, unit_data = make_request("POST", "/catalogue/units/", unit_payload)
    unit_id = unit_data.get('id') if isinstance(unit_data, dict) else None
    record_result("Phase 2", "POST", "/catalogue/units/", code, code in [200, 201], f"Unit ID: {unit_id}", unit_payload)

    # 2.4 Dosage Presets GET
    code, presets = make_request("GET", "/catalogue/dosage-presets/")
    record_result("Phase 2", "GET", "/catalogue/dosage-presets/", code, code == 200)

    # 2.5 Products GET & POST
    code, products = make_request("GET", "/catalogue/products/")
    record_result("Phase 2", "GET", "/catalogue/products/", code, code == 200)

    prod_code = f"PRD-{uuid.uuid4().hex[:6].upper()}"
    prod_payload = {
        "product_code": prod_code,
        "brand_name": f"Ibuprofen Forte {uuid.uuid4().hex[:4]}",
        "generic_name": "Ibuprofen 400mg",
        "category": cat_id,
        "dosage_form": df_id,
        "strength": "400mg",
        "base_dispensing_unit": "tablet",
        "strip_multiplier": 10,
        "pack_box_multiplier": 100,
        "cost_price_base": "1.2000",
        "selling_price_base": "2.5000",
        "reorder_level_base": 50,
        "maximum_stock_base": 500,
        "is_prescription_required": False,
        "is_active": True
    }
    code, prod_data = make_request("POST", "/catalogue/products/", prod_payload)
    product_id = prod_data.get('id') if isinstance(prod_data, dict) else None
    if not product_id and isinstance(products, dict) and products.get('results'):
        product_id = products['results'][0]['id']
    elif not product_id and isinstance(products, list) and len(products) > 0:
        product_id = products[0]['id']
    record_result("Phase 2", "POST", "/catalogue/products/", code, code in [200, 201], f"Product ID: {product_id}", prod_payload)

    # 2.6 Packaging Units GET & POST
    code, pkg_units = make_request("GET", "/catalogue/packaging-units/")
    record_result("Phase 2", "GET", "/catalogue/packaging-units/", code, code == 200)

    if product_id:
        pkg_payload = {
            "product": product_id,
            "tier_name": "Pack of 100",
            "unit_label": "Box",
            "multiplier_to_base": 100,
            "wholesale_cost": "100.0000",
            "retail_selling_price": "220.0000",
            "is_dispensable": True
        }
        code, pkg_data = make_request("POST", "/catalogue/packaging-units/", pkg_payload)
        record_result("Phase 2", "POST", "/catalogue/packaging-units/", code, code in [200, 201], f"Packaging ID: {pkg_data.get('id') if isinstance(pkg_data, dict) else None}", pkg_payload)

    # 2.7 Stock Alert Rules GET & POST
    code, rules = make_request("GET", "/catalogue/alert-rules/")
    record_result("Phase 2", "GET", "/catalogue/alert-rules/", code, code == 200)

    if product_id:
        rule_payload = {
            "product": product_id,
            "min_days_to_expiry": 90,
            "critical_stock_threshold": 30,
            "action_required": "NOTIFY_STOCK_OFFICER",
            "is_active": True
        }
        code, rule_data = make_request("POST", "/catalogue/alert-rules/", rule_payload)
        record_result("Phase 2", "POST", "/catalogue/alert-rules/", code, code in [200, 201], f"Alert Rule ID: {rule_data.get('id') if isinstance(rule_data, dict) else None}", rule_payload)

    # 2.8 Bulk Import Template, Preview & Commit
    code, tpl = make_request("GET", "/catalogue/import/template/")
    record_result("Phase 2", "GET", "/catalogue/import/template/", code, code == 200, f"Template size: {len(str(tpl))} bytes")

    sample_csv = "product_code,brand_name,generic_name,classification,category_name,dosage_form,base_unit,unit_cost,selling_price\n" \
                 f"CSV-{uuid.uuid4().hex[:4]},Cataflam 50mg,Diclofenac Potassium,POM,Analgesics,Tablet,tablet,2.00,4.50"
    code, preview_data = make_request("POST", "/catalogue/import/preview/", {"csv_content": sample_csv})
    record_result("Phase 2", "POST", "/catalogue/import/preview/", code, code == 200, f"Valid rows: {preview_data.get('valid_rows_count') if isinstance(preview_data, dict) else preview_data}")

    if isinstance(preview_data, dict) and preview_data.get('rows'):
        code, commit_res = make_request("POST", "/catalogue/import/commit/", {"items": preview_data['rows']})
        record_result("Phase 2", "POST", "/catalogue/import/commit/", code, code == 200, str(commit_res))

    # 2.9 Suppliers GET & POST
    code, sups = make_request("GET", "/parties/suppliers/")
    record_result("Phase 2", "GET", "/parties/suppliers/", code, code == 200)

    sup_payload = {
        "name": f"Greenland Pharmaceuticals {uuid.uuid4().hex[:3]}",
        "contact_person": "Sarah Boateng",
        "phone": "+233241009988",
        "email": f"orders_{uuid.uuid4().hex[:3]}@greenland.gh",
        "payment_terms_days": 30,
        "is_active": True
    }
    code, sup_data = make_request("POST", "/parties/suppliers/", sup_payload)
    supplier_id = sup_data.get('id') if isinstance(sup_data, dict) else None
    if not supplier_id and isinstance(sups, dict) and sups.get('results'):
        supplier_id = sups['results'][0]['id']
    elif not supplier_id and isinstance(sups, list) and len(sups) > 0:
        supplier_id = sups[0]['id']
    record_result("Phase 2", "POST", "/parties/suppliers/", code, code in [200, 201], f"Supplier ID: {supplier_id}", sup_payload)

    # 2.10 Customers GET & POST
    code, custs = make_request("GET", "/parties/customers/")
    record_result("Phase 2", "GET", "/parties/customers/", code, code == 200)

    cust_payload = {
        "name": f"Kofi Annan {uuid.uuid4().hex[:3]}",
        "phone": f"+23354{uuid.uuid4().hex[:7]}",
        "email": f"kofi_{uuid.uuid4().hex[:3]}@example.com",
        "credit_limit": "5000.00",
        "current_credit_balance": "0.00",
        "is_active": True
    }
    code, cust_data = make_request("POST", "/parties/customers/", cust_payload)
    customer_id = cust_data.get('id') if isinstance(cust_data, dict) else None
    if not customer_id and isinstance(custs, dict) and custs.get('results'):
        customer_id = custs['results'][0]['id']
    elif not customer_id and isinstance(custs, list) and len(custs) > 0:
        customer_id = custs[0]['id']
    record_result("Phase 2", "POST", "/parties/customers/", code, code in [200, 201], f"Customer ID: {customer_id}", cust_payload)

    # Phase 3: Inventory Engine & Procurement
    print("\n" + "=" * 40 + " PHASE 3: INVENTORY ENGINE & PROCUREMENT " + "=" * 40)

    # 3.1 Batches GET & POST
    code, batches = make_request("GET", "/inventory/batches/")
    record_result("Phase 3", "GET", "/inventory/batches/", code, code == 200)

    batch_num = f"BN-{uuid.uuid4().hex[:6].upper()}"
    batch_payload = {
        "product": product_id,
        "batch_number": batch_num,
        "manufacturing_date": "2025-01-01",
        "expiry_date": "2027-12-31",
        "initial_quantity_base": 250,
        "unit_cost_base": "1.2000",
        "storage_location": storage_loc_id,
        "status": "ACTIVE"
    }
    code, batch_data = make_request("POST", "/inventory/batches/", batch_payload)
    batch_id = batch_data.get('id') if isinstance(batch_data, dict) else None
    if not batch_id and isinstance(batches, dict) and batches.get('results'):
        batch_id = batches['results'][0]['id']
    elif not batch_id and isinstance(batches, list) and len(batches) > 0:
        batch_id = batches[0]['id']
    record_result("Phase 3", "POST", "/inventory/batches/", code, code in [200, 201], f"Batch ID: {batch_id} (Num: {batch_num})", batch_payload)

    # 3.2 Stock Balances GET
    code, balances = make_request("GET", "/inventory/balances/")
    record_result("Phase 3", "GET", "/inventory/balances/", code, code == 200)

    # 3.3 Stock Movements GET
    code, movements = make_request("GET", "/inventory/movements/")
    record_result("Phase 3", "GET", "/inventory/movements/", code, code == 200)

    # 3.4 Stock Adjustments GET & POST
    code, adjustments = make_request("GET", "/inventory/adjustments/")
    record_result("Phase 3", "GET", "/inventory/adjustments/", code, code == 200)

    if batch_id:
        adj_payload = {
            "batch": batch_id,
            "previous_quantity_base": "250.00",
            "counted_quantity_base": "255.00",
            "variance_base": "5.00",
            "reason": "Routine physical count reconciliation surplus"
        }
        code, adj_data = make_request("POST", "/inventory/adjustments/", adj_payload)
        record_result("Phase 3", "POST", "/inventory/adjustments/", code, code in [200, 201], f"Adjustment ID: {adj_data.get('id') if isinstance(adj_data, dict) else adj_data}", adj_payload)

    # 3.5 FEFO Allocation POST
    if product_id:
        fefo_payload = {"product_id": product_id, "quantity_base": 15}
        code, fefo_data = make_request("POST", "/inventory/fefo-allocate/", fefo_payload)
        alloc_details = f"Allocations: {len(fefo_data.get('allocations', []))}" if isinstance(fefo_data, dict) else str(fefo_data)
        record_result("Phase 3", "POST", "/inventory/fefo-allocate/", code, code == 200, alloc_details, fefo_payload)

    # 3.6 Procurement Orders GET & POST
    code, pos = make_request("GET", "/procurement/orders/")
    record_result("Phase 3", "GET", "/procurement/orders/", code, code == 200)

    if supplier_id and product_id:
        po_payload = {
            "supplier_id": supplier_id,
            "lines": [
                {
                    "product_id": product_id,
                    "quantity_ordered_base": 100,
                    "unit_cost_base": "1.1000"
                }
            ]
        }
        code, po_data = make_request("POST", "/procurement/orders/", po_payload)
        po_id = po_data.get('id') if isinstance(po_data, dict) else None
        record_result("Phase 3", "POST", "/procurement/orders/", code, code in [200, 201], f"PO ID: {po_id} ({po_data.get('po_number') if isinstance(po_data, dict) else ''})", po_payload)

    # 3.7 Procurement Receipts (GRN) GET & POST
    code, grns = make_request("GET", "/procurement/receipts/")
    record_result("Phase 3", "GET", "/procurement/receipts/", code, code == 200)

    if supplier_id and product_id:
        grn_payload = {
            "supplier_id": supplier_id,
            "storage_location_id": storage_loc_id,
            "supplier_invoice_number": f"INV-{uuid.uuid4().hex[:5].upper()}",
            "lines": [
                {
                    "product_id": product_id,
                    "batch_number": f"GRN-B-{uuid.uuid4().hex[:5].upper()}",
                    "expiry_date": "2027-10-31",
                    "quantity_received_base": 100,
                    "unit_cost_base": "1.1000",
                    "selling_price_base": "2.5000"
                }
            ]
        }
        code, grn_data = make_request("POST", "/procurement/receipts/", grn_payload)
        record_result("Phase 3", "POST", "/procurement/receipts/", code, code in [200, 201], f"GRN ID: {grn_data.get('id') if isinstance(grn_data, dict) else grn_data}", grn_payload)

    # Phase 4: POS & Sales Engine
    print("\n" + "=" * 40 + " PHASE 4: DISPENSARY POS & SALES ENGINE " + "=" * 40)

    # 4.1 Cashier Shifts GET & POST (Open Shift)
    code, shifts = make_request("GET", "/sales/shifts/")
    record_result("Phase 4", "GET", "/sales/shifts/", code, code == 200)

    shift_payload = {"opening_float": "100.0000"}
    code, shift_data = make_request("POST", "/sales/shifts/", shift_payload)
    active_shift_id = shift_data.get('id') if isinstance(shift_data, dict) else None
    record_result("Phase 4", "POST", "/sales/shifts/", code, code in [200, 201], f"Shift: {shift_data.get('shift_number') if isinstance(shift_data, dict) else ''} (ID: {active_shift_id})", shift_payload)

    # 4.2 Draft Sales GET & POST (Park Sale)
    code, drafts = make_request("GET", "/sales/drafts/")
    record_result("Phase 4", "GET", "/sales/drafts/", code, code == 200)

    if product_id:
        draft_payload = {
            "customer_name": "Walk-in Patient",
            "cart_data": [{"product_id": product_id, "quantity": 2, "unit_price": 2.50}]
        }
        code, draft_data = make_request("POST", "/sales/drafts/", draft_payload)
        record_result("Phase 4", "POST", "/sales/drafts/", code, code in [200, 201], f"Parked Draft: {draft_data.get('draft_number') if isinstance(draft_data, dict) else draft_data}", draft_payload)

    # 4.3 Atomic Checkout Engine POST (POS Sale Checkout)
    checkout_payload = {
        "cash_shift_id": active_shift_id,
        "customer_id": customer_id,
        "items": [
            {
                "product_id": product_id,
                "batch_id": batch_id,
                "quantity": 2,
                "unit_price": "2.5000",
                "discount_amount": "0.0000",
                "tax_amount": "0.0000"
            }
        ],
        "lines": [
            {
                "product_id": product_id,
                "batch_id": batch_id,
                "quantity": 2,
                "unit_price": "2.5000",
                "discount_amount": "0.0000",
                "tax_amount": "0.0000"
            }
        ],
        "tenders": [
            {
                "tender_method": "CASH",
                "amount_paid": "5.0000"
            }
        ],
        "discount_total": "0.0000",
        "tax_total": "0.0000",
        "bypass_rx_check": True
    }
    code, sale_data = make_request("POST", "/sales/orders/checkout/", checkout_payload)
    completed_sale_id = sale_data.get('id') if isinstance(sale_data, dict) else None
    receipt_no = sale_data.get('receipt_number') if isinstance(sale_data, dict) else None
    sale_line_id = sale_data.get('lines', [{}])[0].get('id') if isinstance(sale_data, dict) and sale_data.get('lines') else None
    record_result("Phase 4", "POST", "/sales/orders/checkout/", code, code in [200, 201], f"Sale Receipt: {receipt_no} (ID: {completed_sale_id})", checkout_payload)

    # 4.4 Sales Orders GET
    code, sales = make_request("GET", "/sales/orders/")
    sale_count = len(sales) if isinstance(sales, list) else (len(sales.get('results', [])) if isinstance(sales, dict) else 0)
    record_result("Phase 4", "GET", "/sales/orders/", code, code == 200, f"Total Sales Records: {sale_count}")

    # 4.5 Sale Returns GET & POST
    code, returns = make_request("GET", "/sales/returns/")
    record_result("Phase 4", "GET", "/sales/returns/", code, code == 200)

    if completed_sale_id and sale_line_id:
        return_payload = {
            "sale_id": completed_sale_id,
            "refund_method": "CASH",
            "total_refund_amount": "2.5000",
            "return_reason": "Patient unsealed pack return",
            "is_restocked_to_inventory": True,
            "returned_items": [{"sale_line_id": sale_line_id}]
        }
        code, return_data = make_request("POST", "/sales/returns/", return_payload)
        record_result("Phase 4", "POST", "/sales/returns/", code, code in [200, 201], f"Return: {return_data.get('return_number') if isinstance(return_data, dict) else return_data}", return_payload)

    # 4.6 Credit Notes GET
    code, credit_notes = make_request("GET", "/sales/credit-notes/")
    record_result("Phase 4", "GET", "/sales/credit-notes/", code, code == 200)

    # 4.7 Credit Payments GET & POST
    code, credit_payments = make_request("GET", "/sales/credit-payments/")
    record_result("Phase 4", "GET", "/sales/credit-payments/", code, code == 200)

    if customer_id:
        credit_pay_payload = {
            "customer_id": customer_id,
            "amount_paid": "50.0000",
            "payment_method": "CASH",
            "reference": "Cash payment settlement"
        }
        code, cp_data = make_request("POST", "/sales/credit-payments/", credit_pay_payload)
        record_result("Phase 4", "POST", "/sales/credit-payments/", code, code in [200, 201], f"Credit Pay Receipt: {cp_data.get('receipt_number') if isinstance(cp_data, dict) else cp_data}", credit_pay_payload)

    # 4.8 Close Shift POST
    if active_shift_id:
        close_shift_payload = {"closing_counted_cash": "105.0000", "reconciliation_notes": "Shift reconciled with zero variance"}
        code, closed_shift = make_request("POST", f"/sales/shifts/{active_shift_id}/close/", close_shift_payload)
        record_result("Phase 4", "POST", f"/sales/shifts/{{id}}/close/", code, code in [200, 201], f"Shift Status: {closed_shift.get('status') if isinstance(closed_shift, dict) else closed_shift}", close_shift_payload)

    # Phase 5: Finance & Reports
    print("\n" + "=" * 40 + " PHASE 5: FINANCE & EXECUTIVE REPORTING " + "=" * 40)

    # 5.1 Expense Categories GET & POST
    code, exp_cats = make_request("GET", "/finance/expense-categories/")
    record_result("Phase 5", "GET", "/finance/expense-categories/", code, code == 200)

    exp_cat_payload = {
        "name": f"Generator Fuel {uuid.uuid4().hex[:3].upper()}",
        "description": "Backup power fuel expenses"
    }
    code, exp_cat_data = make_request("POST", "/finance/expense-categories/", exp_cat_payload)
    exp_cat_id = exp_cat_data.get('id') if isinstance(exp_cat_data, dict) else None
    if not exp_cat_id and isinstance(exp_cats, dict) and exp_cats.get('results'):
        exp_cat_id = exp_cats['results'][0]['id']
    elif not exp_cat_id and isinstance(exp_cats, list) and len(exp_cats) > 0:
        exp_cat_id = exp_cats[0]['id']
    record_result("Phase 5", "POST", "/finance/expense-categories/", code, code in [200, 201], f"Exp Cat ID: {exp_cat_id}", exp_cat_payload)

    # 5.2 Expenses GET & POST
    code, exps = make_request("GET", "/finance/expenses/")
    record_result("Phase 5", "GET", "/finance/expenses/", code, code == 200)

    if exp_cat_id:
        exp_payload = {
            "category_id": exp_cat_id,
            "amount": "250.00",
            "payment_method": "CASH",
            "disbursed_to": "Apex Petroleum Service",
            "purpose": "Diesel 50 Liters for generator"
        }
        code, exp_data = make_request("POST", "/finance/expenses/", exp_payload)
        record_result("Phase 5", "POST", "/finance/expenses/", code, code in [200, 201], f"Voucher: {exp_data.get('voucher_number') if isinstance(exp_data, dict) else exp_data}", exp_payload)

    # 5.3 Daily Cash-Ups GET & Reconcile POST
    code, cash_ups = make_request("GET", "/finance/cash-ups/")
    record_result("Phase 5", "GET", "/finance/cash-ups/", code, code == 200)

    reconcile_payload = {
        "cash_up_date": date.today().isoformat(),
        "opening_float": "100.0000",
        "actual_counted_cash": "105.0000",
        "notes": "Daily cash-drawer audit completed"
    }
    code, rec_data = make_request("POST", "/finance/cash-ups/reconcile/", reconcile_payload)
    record_result("Phase 5", "POST", "/finance/cash-ups/reconcile/", code, code in [200, 201], f"Reconciliation Status: {rec_data.get('status') if isinstance(rec_data, dict) else rec_data}", reconcile_payload)

    # 5.4 Business Loans GET & POST
    code, loans = make_request("GET", "/finance/loans/")
    record_result("Phase 5", "GET", "/finance/loans/", code, code == 200)

    loan_payload = {
        "lender_name": "CalBank Commercial SME Facility",
        "principal_amount": "150000.00",
        "interest_rate_percent": "11.50",
        "start_date": "2026-02-01",
        "tenure_months": 24,
        "monthly_installment": "7200.00",
        "outstanding_balance": "135000.00",
        "status": "ACTIVE"
    }
    code, loan_data = make_request("POST", "/finance/loans/", loan_payload)
    record_result("Phase 5", "POST", "/finance/loans/", code, code in [200, 201], f"Loan ID: {loan_data.get('id') if isinstance(loan_data, dict) else loan_data}", loan_payload)

    # 5.5 Reports Endpoints
    report_endpoints = [
        ("/reports/dashboard-kpis/", "GET", "Dashboard KPIs"),
        ("/reports/fast-movers/", "GET", "Fast & Slow Movers"),
        ("/reports/expiry-risk/", "GET", "Expiry Risk Analytics"),
        ("/reports/pnl/", "GET", "P&L Summary"),
        ("/reports/launcher/status/", "GET", "Launcher Status")
    ]
    for r_path, r_method, r_name in report_endpoints:
        code, rep_data = make_request(r_method, r_path)
        keys_summary = f"Keys: {list(rep_data.keys())}" if isinstance(rep_data, dict) else "Data Array"
        record_result("Phase 5", r_method, r_path, code, code == 200, f"{r_name} ({keys_summary})")

    # Summary
    print("\n" + "=" * 80)
    total = len(results)
    passed = sum(1 for r in results if r["success"])
    failed = total - passed
    print(f"API TEST RESULTS SUMMARY: {passed}/{total} ENDPOINTS PASSED ({failed} FAILED)")
    print("=" * 80)

    with open("test_results.json", "w") as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    run_tests()
