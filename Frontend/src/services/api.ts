/**
 * GreenLife AI - API Client Service (Phase 1 to Phase 5 Integration)
 * Base URL defaults to http://localhost:8000/api/v1
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('greenlife_auth_token', token);
    } else {
      localStorage.removeItem('greenlife_auth_token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('greenlife_auth_token');
    }
    return this.token;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = { detail: response.statusText };
        }
        throw new Error(errorData.detail || errorData.error || `HTTP Error ${response.status}`);
      }

      return await response.json();
    } catch (err: any) {
      console.warn(`[ApiClient] Failed request to ${endpoint}:`, err.message);
      throw err;
    }
  }

  // --- Phase 1: Authentication & Staff ---
  async login(payload: { identifier: string; password: string; remember_me?: boolean }) {
    return this.request<{ success: boolean; user: any; message?: string }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async logout() {
    return this.request<{ success: boolean }>('/auth/logout/', {
      method: 'POST',
    });
  }

  async lockScreen() {
    return this.request<{ success: boolean; message: string }>('/auth/lock/', {
      method: 'POST',
    });
  }

  async unlockScreen(password: string) {
    return this.request<{ success: boolean; user: any }>('/auth/unlock/', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  async changePassword(payload: { current_password?: string; new_password: string }) {
    return this.request<{ success: boolean; message: string }>('/auth/change-password/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async dismissPasswordResetNotice(userId: string) {
    return this.request<{ success: boolean }>(`/auth/users/${userId}/dismiss-notice/`, {
      method: 'POST',
    });
  }

  // --- Phase 1: Administration & Users ---
  async getUsers() {
    return this.request<any[]>('/admin/users/');
  }

  async createUser(userData: any) {
    return this.request<{ user: any; temp_password: string; message: string }>('/admin/users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId: string, updates: any) {
    return this.request<any>(`/admin/users/${userId}/`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async adminResetPassword(userId: string, payload?: any) {
    return this.request<{ success: boolean; temp_password: string; message: string }>(
      `/admin/users/${userId}/reset-password/`,
      { 
        method: 'POST',
        body: payload ? JSON.stringify(payload) : undefined
      }
    );
  }

  async updateUserStatus(userId: string, isActive: boolean) {
    return this.request<{ success: boolean; user: any; message: string }>(
      `/admin/users/${userId}/status/`,
      {
        method: 'POST',
        body: JSON.stringify({ is_active: isActive }),
      }
    );
  }

  async assignUserRoles(userId: string, assignedRoles: string[], primaryRole?: string, adminName?: string) {
    return this.request<{ success: boolean; user: any; message: string }>(
      `/admin/users/${userId}/assign-roles/`,
      {
        method: 'POST',
        body: JSON.stringify({
          assigned_roles: assignedRoles,
          primary_role: primaryRole,
          adminName: adminName || 'Administrator',
        }),
      }
    );
  }

  // --- Phase 1: Premises Profile ---
  async getPremisesProfile() {
    return this.request<any>('/admin/profile/');
  }

  async updatePremisesProfile(profileData: any) {
    return this.request<any>('/admin/profile/', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // --- Phase 1: Custom Roles ---
  async getCustomRoles() {
    return this.request<any[]>('/admin/roles/');
  }

  async createCustomRole(roleData: any) {
    return this.request<any>('/admin/roles/', {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
  }

  async purgeProductionData() {
    return this.request<{ success: boolean; message: string }>('/admin/purge-production-data/', {
      method: 'POST',
    });
  }

  // --- Phase 1: Audit Log ---
  async getAuditEvents() {
    return this.request<any[]>('/audit/events/');
  }

  // --- Phase 1: Storage Locations ---
  async getStorageLocations() {
    return this.request<any[]>('/admin/storage-locations/');
  }

  async createStorageLocation(locData: any) {
    return this.request<any>('/admin/storage-locations/', {
      method: 'POST',
      body: JSON.stringify(locData),
    });
  }

  // --- Phase 2: Catalogue & Multi-Unit Master ---
  async getCatalogueProducts(params?: { category?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<any>(`/catalogue/products/${qs}`);
  }

  async createCatalogueProduct(productData: any) {
    return this.request<any>('/catalogue/products/', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateCatalogueProduct(id: string, updates: any) {
    return this.request<any>(`/catalogue/products/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async getCategories() {
    return this.request<any[]>('/catalogue/categories/');
  }

  async getDosageForms() {
    return this.request<any[]>('/catalogue/dosage-forms/');
  }

  async getPackagingUnits() {
    return this.request<any[]>('/catalogue/packaging-units/');
  }

  // --- Phase 2: Bulk CSV Import Wizard ---
  getImportTemplateUrl() {
    return `${API_BASE_URL}/catalogue/import/template/`;
  }

  async previewBulkImport(payload: { file?: File; csv_content?: string }) {
    if (payload.file) {
      const formData = new FormData();
      formData.append('file', payload.file);
      const url = `${API_BASE_URL}/catalogue/import/preview/`;
      const response = await fetch(url, { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`Preview failed HTTP ${response.status}`);
      return await response.json();
    }
    return this.request<{
      total_rows: number;
      valid_rows: number;
      errors: string[];
      preview_items: any[];
    }>('/catalogue/import/preview/', {
      method: 'POST',
      body: JSON.stringify({ csv_content: payload.csv_content }),
    });
  }

  async commitBulkImport(items: any[]) {
    return this.request<{
      success: boolean;
      imported_count: number;
      message: string;
    }>('/catalogue/import/commit/', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  }

  // --- Phase 2: Parties & Suppliers ---
  async getSuppliers() {
    return this.request<any>('/parties/suppliers/');
  }

  async createSupplier(supplierData: any) {
    return this.request<any>('/parties/suppliers/', {
      method: 'POST',
      body: JSON.stringify(supplierData),
    });
  }

  async getCustomers() {
    return this.request<any>('/parties/customers/');
  }

  async createCustomer(customerData: any) {
    return this.request<any>('/parties/customers/', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  }


  // --- Phase 3: Inventory & Batches ---
  async getBatches(params?: { status?: string; product?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.product) query.append('product', params.product);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<any>(`/inventory/batches/${qs}`);
  }

  async getStockBalances() {
    return this.request<any>('/inventory/balances/');
  }

  async getStockMovements() {
    return this.request<any>('/inventory/movements/');
  }

  async getStockAdjustments() {
    return this.request<any>('/inventory/adjustments/');
  }

  async allocateFefo(productId: string, quantityBase: number) {
    return this.request<{
      success: boolean;
      product_id: string;
      requested_quantity_base: number;
      allocations: Array<{
        batch_id: string;
        batch_number: string;
        expiry_date: string;
        unit_cost_base: number;
        allocated_quantity_base: number;
        storage_location: string;
      }>;
    }>('/inventory/fefo-allocate/', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity_base: quantityBase }),
    });
  }

  // --- Phase 3: Procurement & PO/GRN ---
  async getPurchaseOrders() {
    return this.request<any>('/procurement/orders/');
  }

  async createPurchaseOrder(poData: { supplier_id: string; lines: any[]; po_number?: string }) {
    return this.request<any>('/procurement/orders/', {
      method: 'POST',
      body: JSON.stringify(poData),
    });
  }

  async getGoodsReceiptNotes() {
    return this.request<any>('/procurement/receipts/');
  }

  async createGoodsReceiptNote(grnData: {
    supplier_id: string;
    purchase_order_id?: string;
    grn_number?: string;
    supplier_invoice_number?: string;
    storage_location_id?: string;
    lines: Array<{
      product_id: string;
      batch_number: string;
      expiry_date: string;
      quantity_received_base: number;
      unit_cost_base: number;
    }>;
  }) {
    return this.request<any>('/procurement/receipts/', {
      method: 'POST',
      body: JSON.stringify(grnData),
    });
  }

  // --- Phase 4: Dispensary POS, Sales, Shifts & Returns ---
  async getSalesOrders(params?: { status?: string; customer?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.customer) query.append('customer', params.customer);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<any>(`/sales/orders/${qs}`);
  }

  async processCheckout(payload: any) {
    return this.request<any>('/sales/orders/checkout/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getCashShifts() {
    return this.request<any>('/sales/shifts/');
  }

  async openCashShift(openingFloat: number = 50) {
    return this.request<any>('/sales/shifts/', {
      method: 'POST',
      body: JSON.stringify({ opening_float: openingFloat }),
    });
  }

  async closeCashShift(shiftId: string, closingCountedCash: number, notes?: string) {
    return this.request<any>(`/sales/shifts/${shiftId}/close/`, {
      method: 'POST',
      body: JSON.stringify({ closing_counted_cash: closingCountedCash, reconciliation_notes: notes }),
    });
  }

  async getDraftSales() {
    return this.request<any>('/sales/drafts/');
  }

  async saveDraftSale(draftData: { title: string; notes?: string; cart_payload: any }) {
    return this.request<any>('/sales/drafts/', {
      method: 'POST',
      body: JSON.stringify(draftData),
    });
  }

  async getSaleReturns() {
    return this.request<any>('/sales/returns/');
  }

  async processSaleReturn(returnData: {
    sale_id: string;
    total_refund_amount: number;
    refund_method: string;
    return_reason: string;
    is_restocked_to_inventory: boolean;
    condition_assessment?: string;
    returned_items: Array<{ sale_line_id: string; quantity_returned_base: number }>;
  }) {
    return this.request<any>('/sales/returns/', {
      method: 'POST',
      body: JSON.stringify(returnData),
    });
  }

  async getCustomerCreditNotes() {
    return this.request<any>('/sales/credit-notes/');
  }

  async recordCreditPayment(paymentData: {
    customer_id: string;
    sale_id?: string;
    amount_paid: number;
    payment_method: string;
    reference?: string;
  }) {
    return this.request<any>('/sales/credit-payments/', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  // --- Phase 5: Finance, Expenses & Cash-Up ---
  async getExpenses(params?: { category?: string }) {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<any>(`/finance/expenses/${qs}`);
  }

  async createExpense(expenseData: {
    category_id: string;
    amount: number;
    payment_method: string;
    disbursed_to: string;
    purpose: string;
    receipt_url?: string;
  }) {
    return this.request<any>('/finance/expenses/', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  }

  async getExpenseCategories() {
    return this.request<any[]>('/finance/expense-categories/');
  }

  async getDailyCashUps() {
    return this.request<any>('/finance/cash-ups/');
  }

  async reconcileDailyCashUp(data: {
    cash_up_date: string;
    actual_counted_cash: number;
    opening_float?: number;
    notes?: string;
  }) {
    return this.request<any>('/finance/cash-ups/reconcile/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getBusinessLoans() {
    return this.request<any>('/finance/loans/');
  }

  // --- Phase 5: Executive Reports & System Analytics ---
  async getDashboardKpis() {
    return this.request<{
      today_revenue: number;
      today_gross_profit: number;
      today_orders_count: number;
      total_inventory_valuation: number;
      critical_expiry_batches: number;
      warning_expiry_batches: number;
      low_stock_products_count: number;
      active_suppliers_count: number;
      revenue_trend: Array<{ date: string; amount: number }>;
    }>('/reports/dashboard-kpis/');
  }

  async getFastMovers(days: number = 30) {
    return this.request<Array<{
      product_id: string;
      brand_name: string;
      generic_name: string;
      total_dispensed_base: number;
      total_revenue: number;
      total_profit: number;
    }>>(`/reports/fast-movers/?days=${days}`);
  }

  async getExpiryRiskReport() {
    return this.request<Array<{
      batch_id: string;
      product_name: string;
      batch_number: string;
      expiry_date: string;
      days_remaining: number;
      risk_level: string;
      risk_badge: string;
      risk_color: string;
      quantity_on_hand: number;
      unit_cost: number;
      potential_financial_loss: number;
      storage_location: string;
    }>>('/reports/expiry-risk/');
  }

  async getPnlSummary() {
    return this.request<{
      period: string;
      gross_revenue: number;
      cost_of_goods_sold: number;
      gross_profit: number;
      operating_expenses: number;
      net_profit: number;
      net_profit_margin_percent: number;
    }>('/reports/pnl/');
  }

  async getLauncherStatus() {
    return this.request<{
      status: string;
      database_engine: string;
      organization: string;
      active_branch: string;
      total_products: number;
      total_batches: number;
      total_sales: number;
      total_staff_users: number;
      environment: string;
    }>('/reports/launcher/status/');
  }
}

export const api = new ApiClient();




