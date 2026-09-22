-- ==============================================================================
-- GREENLIFE AI PHARMACY MANAGEMENT SYSTEM
-- PostgreSQL 16 Seed Data (UUID v4 Standard)
-- ==============================================================================

-- 1. Initial Organization
INSERT INTO organizations (id, code, legal_name, trading_name, tax_identification_number, headquarters_address, phone, email, currency_code)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'ORG_GREENLIFE',
    'Greenlife Healthcare & Pharmaceuticals Ltd',
    'Greenlife Pharmacy',
    'TIN-GH-88392019',
    'Plot 14, Victoria Island Commercial District',
    '+233 24 456 7890',
    'info@greenlifepharmacy.ng',
    'GHS'
) ON CONFLICT (code) DO NOTHING;

-- 2. Initial Operating Branch
INSERT INTO branches (id, organization_id, code, name, premises_license_number, superintendent_name, superintendent_pcn_number, address, phone, email, is_central, is_active)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'BR_CENTRAL_01',
    'Greenlife Central Branch (Victoria Island)',
    'PCN-PREM-2024-8849',
    'Dr. Adeyemi Adeleke',
    'PCN-SA-88392',
    'Suite 4B, Apex Medical Plaza, Victoria Island',
    '+233 24 456 7890',
    'central@greenlifepharmacy.ng',
    TRUE,
    TRUE
) ON CONFLICT (code) DO NOTHING;

-- 3. Initial Storage Locations
INSERT INTO storage_locations (id, branch_id, code, name, type, temperature_range, description, is_active)
VALUES 
(
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'LOC-DISP-01',
    'Front Counter Dispensary Shelves',
    'DISPENSARY_SHELF',
    'AMBIENT_15_25C',
    'Active dispensary fast-moving prescription products',
    TRUE
),
(
    'c0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    'LOC-COLD-01',
    'Cold Chain Medical Refrigerator (2°C - 8°C)',
    'COLD_CHAIN_FRIDGE',
    'COLD_2_8C',
    'Insulins, vaccines, and biologicals with continuous data logger',
    TRUE
),
(
    'c0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000001',
    'LOC-WH-01',
    'Central Bulk Storage Bay A',
    'BULK_WAREHOUSE',
    'AMBIENT_15_25C',
    'Outer carton reserve stock awaiting dispensary staging',
    TRUE
),
(
    'c0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000001',
    'LOC-QUAR-01',
    'Quarantine & Regulatory Isolation Bay',
    'QUARANTINE_BAY',
    'AMBIENT_15_25C',
    'Recalled, damaged, or expired stock awaiting certified disposal',
    TRUE
) ON CONFLICT DO NOTHING;

-- 4. Initial Staff Users (Hashed matching demo passwords)
INSERT INTO users (id, branch_id, username, email, password_hash, name, first_name, middle_name, last_name, dob, phone, alternate_phone, role, license_number, is_active, must_change_password, is_temporary_password)
VALUES
(
    'd0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Admink19',
    'admin@greenlifepharmacy.ng',
    'pbkdf2_sha256$600000$Admin@1234_salt$placeholder',
    'Dr. Adeyemi Adeleke',
    'Adeyemi',
    'Oluwaseun',
    'Adeleke',
    '1982-05-14',
    '+233 24 456 7890',
    '+233 20 123 4567',
    'Super Admin',
    'PCN-SA-88392',
    TRUE,
    FALSE,
    FALSE
),
(
    'd0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    'pharm_amaka',
    'amaka.okafor@greenlifepharmacy.ng',
    'pbkdf2_sha256$600000$Pharm@1234_salt$placeholder',
    'Pharm. Amaka Okafor',
    'Amaka',
    'Chiamaka',
    'Okafor',
    '1989-11-23',
    '+233 24 987 6543',
    '+233 55 333 4444',
    'Pharmacist',
    'PCN-2018-44910',
    TRUE,
    FALSE,
    FALSE
),
(
    'd0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000001',
    'cashier_emmanuel',
    'emmanuel.b@greenlifepharmacy.ng',
    'pbkdf2_sha256$600000$Cashier@1234_salt$placeholder',
    'Emmanuel Balogun',
    'Emmanuel',
    '',
    'Balogun',
    '1995-03-17',
    '+233 27 654 3210',
    '',
    'Cashier',
    NULL,
    TRUE,
    FALSE,
    FALSE
),
(
    'd0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000001',
    'stock_tunde',
    'tunde.f@greenlifepharmacy.ng',
    'pbkdf2_sha256$600000$Stock@1234_salt$placeholder',
    'Babatunde Fashola',
    'Babatunde',
    'Ayodele',
    'Fashola',
    '1991-08-09',
    '+233 26 111 2233',
    '',
    'Stock Officer',
    NULL,
    TRUE,
    FALSE,
    FALSE
) ON CONFLICT (username) DO NOTHING;

-- 5. User Authorizations
INSERT INTO user_authorizations (user_id, max_discount_percent, max_refund_limit, stock_adjustment_limit, expense_approval_limit, po_approval_limit, can_override_price, can_view_cost_prices, can_view_profits)
VALUES
('d0000000-0000-0000-0000-000000000001', 100.0, 10000.0, 10000.0, 50000.0, 100000.0, TRUE, TRUE, TRUE),
('d0000000-0000-0000-0000-000000000002', 15.0, 500.0, 1000.0, 0.0, 0.0, TRUE, TRUE, FALSE),
('d0000000-0000-0000-0000-000000000003', 5.0, 100.0, 0.0, 0.0, 0.0, FALSE, FALSE, FALSE),
('d0000000-0000-0000-0000-000000000004', 0.0, 0.0, 5000.0, 0.0, 10000.0, FALSE, TRUE, FALSE)
ON CONFLICT (user_id) DO NOTHING;

-- 6. Initial Categories
INSERT INTO categories (id, code, name, description)
VALUES
('e0000000-0000-0000-0000-000000000001', 'CAT-ANTI', 'Antibiotics & Anti-infectives', 'Broad-spectrum penicillins, cephalosporins, macrolides'),
('e0000000-0000-0000-0000-000000000002', 'CAT-ANAL', 'Analgesics & Pain Relief', 'NSAIDs, antipyretics, non-opioid pain management'),
('e0000000-0000-0000-0000-000000000003', 'CAT-MAL', 'Antimalarials', 'Artemisinin-based combination therapies (ACT) and prophylaxis'),
('e0000000-0000-0000-0000-000000000004', 'CAT-CARD', 'Cardiovascular & Antihypertensives', 'ACE inhibitors, beta blockers, calcium channel blockers')
ON CONFLICT (code) DO NOTHING;

-- 7. Initial Dosage Forms
INSERT INTO dosage_forms (id, code, name, default_base_unit)
VALUES
('f0000000-0000-0000-0000-000000000001', 'FORM-TAB', 'Tablet', 'Piece'),
('f0000000-0000-0000-0000-000000000002', 'FORM-CAP', 'Capsule', 'Piece'),
('f0000000-0000-0000-0000-000000000003', 'FORM-SYR', 'Syrup / Oral Suspension', 'mL'),
('f0000000-0000-0000-0000-000000000004', 'FORM-INJ', 'Injection', 'Vial')
ON CONFLICT (code) DO NOTHING;

-- 8. Initial Units of Measure
INSERT INTO units_of_measure (id, code, name, symbol, type)
VALUES
('a1000000-0000-0000-0000-000000000001', 'UOM-PC', 'Piece / Single Tablet', 'pc', 'COUNT'),
('a1000000-0000-0000-0000-000000000002', 'UOM-STRIP', 'Blister Strip', 'strip', 'COUNT'),
('a1000000-0000-0000-0000-000000000003', 'UOM-BOX', 'Outer Pack / Box', 'box', 'COUNT'),
('a1000000-0000-0000-0000-000000000004', 'UOM-ML', 'Millilitre', 'mL', 'VOLUME')
ON CONFLICT (code) DO NOTHING;
