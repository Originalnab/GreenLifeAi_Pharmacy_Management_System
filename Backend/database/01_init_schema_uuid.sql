-- ==============================================================================
-- GREENLIFE AI PHARMACY MANAGEMENT SYSTEM
-- PostgreSQL 16 Universal UUID Database Schema
-- All Primary Keys use UUID v4 (gen_random_uuid())
-- ==============================================================================

-- Enable UUID extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. ORGANIZATIONS, BRANCHES & PREMISES FACILITIES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    legal_name VARCHAR(255) NOT NULL,
    trading_name VARCHAR(255) NOT NULL,
    tax_identification_number VARCHAR(100),
    headquarters_address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    currency_code VARCHAR(10) NOT NULL DEFAULT 'GHS',
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    premises_license_number VARCHAR(100) NOT NULL,
    superintendent_name VARCHAR(255) NOT NULL,
    superintendent_pcn_number VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    is_central BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS storage_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'DISPENSARY_SHELF', -- 'DISPENSARY_SHELF', 'COLD_CHAIN_FRIDGE', 'BULK_WAREHOUSE', 'QUARANTINE_BAY'
    temperature_range VARCHAR(50) DEFAULT 'AMBIENT_15_25C', -- 'AMBIENT_15_25C', 'COLD_2_8C', 'DEEP_FREEZE'
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_branch_location_code UNIQUE (branch_id, code)
);

-- ==============================================================================
-- 2. IDENTITY, STAFF USERS, RBAC & PERMISSION CEILINGS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    middle_name VARCHAR(100),
    last_name VARCHAR(100),
    dob DATE,
    phone VARCHAR(50),
    alternate_phone VARCHAR(50),
    role VARCHAR(50) NOT NULL, -- 'Super Admin', 'Pharmacy Admin', 'Pharmacist', 'Cashier', 'Stock Officer', 'Accountant', 'Auditor'
    license_number VARCHAR(100), -- PCN or Pharmacy Council license number
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
    is_temporary_password BOOLEAN NOT NULL DEFAULT TRUE,
    password_reset_notice JSONB, -- { "reset_at": "...", "reset_by": "...", "acknowledged": false }
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_authorizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    max_discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
    max_refund_limit NUMERIC(15, 4) NOT NULL DEFAULT 100.0000,
    stock_adjustment_limit NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    expense_approval_limit NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    po_approval_limit NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    require_two_factor BOOLEAN NOT NULL DEFAULT FALSE,
    can_override_price BOOLEAN NOT NULL DEFAULT FALSE,
    can_view_cost_prices BOOLEAN NOT NULL DEFAULT FALSE,
    can_view_profits BOOLEAN NOT NULL DEFAULT FALSE,
    sessions_active INTEGER NOT NULL DEFAULT 0,
    last_password_change TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    custom_permissions JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    permission_matrix JSONB NOT NULL,
    role_sensitive_controls JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_name VARCHAR(255) NOT NULL,
    actor_role VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    target_identifier VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    ip_address VARCHAR(50),
    payload_before JSONB,
    payload_after JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_branch_setting_key UNIQUE (branch_id, key)
);

-- ==============================================================================
-- 3. CATALOGUE, MULTI-UNIT HIERARCHY & SUPPLIER VENDORS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dosage_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    default_base_unit VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS units_of_measure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    type VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS dosage_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    instruction VARCHAR(255) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    duration_days INTEGER NOT NULL DEFAULT 5,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    tax_number VARCHAR(100),
    contact_person VARCHAR(255),
    telephone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    payment_terms_days INTEGER NOT NULL DEFAULT 30,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    product_code VARCHAR(50) NOT NULL UNIQUE,
    brand_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255) NOT NULL,
    barcode VARCHAR(100),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    dosage_form_id UUID NOT NULL REFERENCES dosage_forms(id) ON DELETE RESTRICT,
    strength VARCHAR(100),
    
    -- Packaging Multiplier Hierarchy
    base_dispensing_unit VARCHAR(50) NOT NULL DEFAULT 'Piece',
    strip_multiplier NUMERIC(10, 2) NOT NULL DEFAULT 1.0,
    pack_box_multiplier NUMERIC(10, 2) NOT NULL DEFAULT 1.0,
    
    -- Atomic Base Prices
    cost_price_base NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    selling_price_base NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    
    -- Safety Reorder Safeguards
    reorder_level_base NUMERIC(12, 2) NOT NULL DEFAULT 50.0,
    maximum_stock_base NUMERIC(12, 2) NOT NULL DEFAULT 1000.0,
    
    -- Clinical & Legal Gating
    is_prescription_required BOOLEAN NOT NULL DEFAULT FALSE,
    is_controlled_substance BOOLEAN NOT NULL DEFAULT FALSE,
    storage_condition VARCHAR(100) DEFAULT 'Ambient 15-25°C',
    pregnancy_category VARCHAR(10) DEFAULT 'B',
    max_daily_dose VARCHAR(100),
    clinical_notes TEXT,
    
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_packaging_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tier_name VARCHAR(50) NOT NULL, -- 'BASE_UNIT', 'STRIP', 'OUTER_BOX'
    unit_label VARCHAR(50) NOT NULL,
    multiplier_to_base NUMERIC(10, 2) NOT NULL,
    wholesale_cost NUMERIC(15, 4) NOT NULL,
    retail_selling_price NUMERIC(15, 4) NOT NULL,
    barcode VARCHAR(100),
    is_dispensable BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_product_tier UNIQUE (product_id, tier_name)
);

CREATE TABLE IF NOT EXISTS import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    total_rows INTEGER NOT NULL DEFAULT 0,
    valid_rows INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    errors JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. INVENTORY, BATCHES, MOVEMENTS & FEFO ALLOCATION
-- ==============================================================================

CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    batch_number VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    manufacturing_date DATE,
    unit_cost_base NUMERIC(15, 4) NOT NULL,
    initial_quantity_base NUMERIC(15, 2) NOT NULL,
    storage_location_id UUID REFERENCES storage_locations(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_product_batch UNIQUE (branch_id, product_id, batch_number)
);

CREATE TABLE IF NOT EXISTS stock_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    quantity_on_hand_base NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    quantity_reserved_base NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_stock_balance UNIQUE (branch_id, product_id, batch_id),
    CONSTRAINT chk_positive_on_hand CHECK (quantity_on_hand_base >= 0)
);

CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
    movement_type VARCHAR(50) NOT NULL,
    quantity_change_base NUMERIC(15, 2) NOT NULL,
    balance_after_base NUMERIC(15, 2) NOT NULL,
    reference_type VARCHAR(50) NOT NULL,
    reference_id UUID NOT NULL,
    unit_cost_snapshot NUMERIC(15, 4) NOT NULL,
    total_cost_snapshot NUMERIC(15, 4) NOT NULL,
    performed_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
    previous_quantity_base NUMERIC(15, 2) NOT NULL,
    counted_quantity_base NUMERIC(15, 2) NOT NULL,
    variance_base NUMERIC(15, 2) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    authorized_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 5. PURCHASING, PROCUREMENT & GOODS RECEIPTS (GRN)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    po_number VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    total_estimated_cost NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    approved_by_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity_ordered_base NUMERIC(15, 2) NOT NULL,
    unit_cost_base NUMERIC(15, 4) NOT NULL
);

CREATE TABLE IF NOT EXISTS goods_receipt_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    grn_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_invoice_number VARCHAR(100),
    total_invoice_amount NUMERIC(15, 4) NOT NULL,
    received_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    storage_location_id UUID REFERENCES storage_locations(id),
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goods_receipt_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goods_receipt_note_id UUID NOT NULL REFERENCES goods_receipt_notes(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    batch_number VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    quantity_received_base NUMERIC(15, 2) NOT NULL,
    unit_cost_base NUMERIC(15, 4) NOT NULL
);

-- ==============================================================================
-- 6. CUSTOMERS, PATIENTS & CREDIT ACCOUNTS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    alternate_phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    allergies TEXT,
    chronic_conditions TEXT,
    credit_limit NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    current_credit_balance NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 7. POINT OF SALE, CASH SHIFTS, SALES, TENDERS & RETURNS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS cash_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    shift_number VARCHAR(50) NOT NULL UNIQUE,
    opening_float NUMERIC(15, 4) NOT NULL,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    closing_counted_cash NUMERIC(15, 4),
    closing_system_expected_cash NUMERIC(15, 4),
    discrepancy_amount NUMERIC(15, 4),
    reconciled_by_id UUID REFERENCES users(id),
    reconciliation_notes TEXT
);

CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    cash_shift_id UUID NOT NULL REFERENCES cash_shifts(id) ON DELETE RESTRICT,
    cashier_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    sale_type VARCHAR(50) NOT NULL DEFAULT 'RETAIL',
    
    subtotal NUMERIC(15, 4) NOT NULL,
    discount_amount NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    tax_amount NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    total_amount NUMERIC(15, 4) NOT NULL,
    total_cost_amount NUMERIC(15, 4) NOT NULL,
    gross_profit_amount NUMERIC(15, 4) NOT NULL,
    
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    is_credit_sale BOOLEAN NOT NULL DEFAULT FALSE,
    credit_due_date DATE,
    credit_amount_paid NUMERIC(15, 4) DEFAULT 0.0000,
    
    pharmacist_verified_by_id UUID REFERENCES users(id),
    prescribing_doctor_name VARCHAR(255),
    doctor_license_number VARCHAR(100),
    patient_prescription_number VARCHAR(100),
    
    idempotency_key UUID UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
    packaging_unit_name VARCHAR(50) NOT NULL,
    multiplier_to_base NUMERIC(10, 2) NOT NULL,
    quantity_dispensed_units NUMERIC(10, 2) NOT NULL,
    total_quantity_base NUMERIC(15, 2) NOT NULL,
    
    unit_selling_price NUMERIC(15, 4) NOT NULL,
    unit_cost_price NUMERIC(15, 4) NOT NULL,
    discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    total_line_amount NUMERIC(15, 4) NOT NULL,
    total_line_cost NUMERIC(15, 4) NOT NULL,
    total_line_profit NUMERIC(15, 4) NOT NULL,
    
    dosage_instructions TEXT
);

CREATE TABLE IF NOT EXISTS sale_tenders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    tender_method VARCHAR(50) NOT NULL,
    amount_tendered NUMERIC(15, 4) NOT NULL,
    amount_paid NUMERIC(15, 4) NOT NULL,
    change_given NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    transaction_reference VARCHAR(100),
    tender_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS draft_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    cashier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    cart_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE RESTRICT,
    return_number VARCHAR(50) NOT NULL UNIQUE,
    returned_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    refund_tender VARCHAR(50) NOT NULL,
    total_refund_amount NUMERIC(15, 4) NOT NULL,
    return_reason VARCHAR(100) NOT NULL,
    is_restocked_to_inventory BOOLEAN NOT NULL DEFAULT TRUE,
    condition_assessment VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_credit_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    sale_return_id UUID REFERENCES sale_returns(id) ON DELETE SET NULL,
    credit_note_number VARCHAR(50) NOT NULL UNIQUE,
    original_amount NUMERIC(15, 4) NOT NULL,
    remaining_balance NUMERIC(15, 4) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    issued_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    expiry_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    amount_paid NUMERIC(15, 4) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    reference VARCHAR(100),
    received_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 8. FINANCE, EXPENSES, LOANS & SHIFT RECONCILIATIONS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    category_id UUID NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
    voucher_number VARCHAR(50) NOT NULL UNIQUE,
    amount NUMERIC(15, 4) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    disbursed_to VARCHAR(255) NOT NULL,
    purpose TEXT NOT NULL,
    approved_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    borrower_name VARCHAR(255) NOT NULL,
    principal_amount NUMERIC(15, 4) NOT NULL,
    interest_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    total_repayable_amount NUMERIC(15, 4) NOT NULL,
    total_repaid_amount NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 9. PERFORMANCE INDEXES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_branch_role ON users(branch_id, role);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_branch ON products(branch_id);
CREATE INDEX IF NOT EXISTS idx_batches_product_expiry ON batches(product_id, expiry_date);
CREATE INDEX IF NOT EXISTS idx_batches_status ON batches(status);
CREATE INDEX IF NOT EXISTS idx_stock_balances_product_batch ON stock_balances(product_id, batch_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_batch ON stock_movements(batch_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_receipt ON sales(receipt_number);
CREATE INDEX IF NOT EXISTS idx_sales_branch_created ON sales(branch_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sale_lines_sale ON sale_lines(sale_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_module_action ON audit_events(module, action_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_timestamp ON audit_events(timestamp);
