# GreenLife AI Pharmacy Management System
## Purchasing & Stock Receiving Workflow Guide

**Document Version:** 1.0.0  
**Target Module:** Purchasing & Stock Receiving (`PurchasingPage.tsx`, `Sidebar.tsx`)  
**Terminology Upgrade:** Complete Elimination of Jargon Acronym "GRN" (Replaced with "Stock Receiving")  
**Currency Standard:** Ghana Cedi (GH₵ / GHS) & Multi-Currency Engine  

---

## 1. Executive Summary & Purpose

In community retail pharmacies and hospital dispensaries, stock replenishment from wholesale distributors requires rapid verification of incoming shipments. Previously:
1. The use of the accounting term **"GRN"** (*Goods Received Note*) created unnecessary confusion among retail staff.
2. If an invoice contained a new pharmaceutical line not yet in the master catalogue, staff had to abort receiving, navigate to Catalogue, add the medicine, and restart the intake from scratch.
3. Financial line-item sub-calculations (Cost Subtotal, Expected Retail Subtotal, Per-Unit Margin vs. Line Gross Profit) were not immediately transparent.

The **Simplified Stock Receiving Workbench** completely eliminates the GRN acronym and transforms supplier delivery intake into a streamlined, high-visibility financial and inventory operation.

---

## 2. Terminology Modernization Matrix

| Previous Jargon | New Clear Terminology | Where Displayed |
| :--- | :--- | :--- |
| **"Purchasing & Goods Receiving (GRN)"** | **"Purchasing & Stock Receiving"** | Main Navigation, Page Header |
| **"Receive Goods (GRN)" / "New GRN Intake"** | **"Receive Stock" / "Receive Stock Delivery"** | Primary Action Buttons |
| **"GRN Reference" (`GRN-2026-XXXX`)** | **"Delivery Voucher #" (`RCV-2026-XXXX`)** | Tracking Reference, Search Bar |
| **"Procurement & GRN Receiving Ledger"** | **"Stock Receiving & Delivery Ledger"** | Reports, Analytics Ledgers |
| **"Commit Goods Receipt"** | **"Save & Post Stock to Shelves"** | Delivery Confirmation Button |

---

## 3. Stock Receiving Line Architecture

When receiving a supplier delivery invoice, each row provides complete data entry and instant mathematical auditing:

```
+---------------------------------------------------------------------------------------------------------------+
| # | Product Name         | Unit Type | Batch Lot #   | Exp Date   | Qty | Unit Cost | Subtotal Cost           |
| 1 | Augmentin 625mg      | Box       | BAT-2026-981  | 2028-06-30 | 10  | GH₵ 18.00 | GH₵ 180.00 (10 × 18.00) |
+---+----------------------+-----------+---------------+------------+-----+-----------+-------------------------+
|   | Unit Selling Price   | Subtotal Retail Value     | Per-Unit Profit | Total Line Profit | Line Margin %    |
|   | GH₵ 28.50            | GH₵ 285.00 (10 × 28.50)   | +GH₵ 10.50/unit | +GH₵ 105.00 total | ✓ 36.8% margin   |
+---------------------------------------------------------------------------------------------------------------+
```

### Detailed Field Explanations:
1. **Medicine / Formulation Selector:**
   - Dropdown with all existing catalogue medicines.
   - Option **"✨ + Add New Medicine / Product..."** or **"+ New"** button.
   - When clicked, turns into an inline text input for Brand / Trade Name without switching screens.
2. **Unit Type Selector:**
   - Dropdown allowing direct selection of physical packaging: `Box`, `Strip`, `Tablet`, `Capsule`, `Bottle`, `Tube`, `Sachet`, `Vial`, `Ampoule`, `Piece`, `Canister`, `Pack`.
3. **Batch / Lot # & Expiry Date:**
   - Auto-generated unique batch code with one-click re-roll (`Auto-Gen`), or manual entry matching the supplier carton.
   - Expiry date drives automated First-Expired, First-Out (FEFO) dispensing order at the POS.
4. **Received Quantity:**
   - Number of units delivered.
5. **Unit Cost (Supplier Buy Price):**
   - Invoiced price paid per unit to the wholesale distributor.
6. **Subtotal Cost (Wholesale Outlay):**
   $$\text{Subtotal Cost} = \text{Received Quantity} \times \text{Unit Cost Price}$$
7. **Unit Selling Price (Dispensary Shelf Price):**
   - Retail price charged to customers at the counter.
8. **Subtotal Retail (Expected Revenue):**
   $$\text{Subtotal Retail Value} = \text{Received Quantity} \times \text{Unit Selling Price}$$
9. **Profit & Margin Audit:**
   $$\begin{aligned}
   \text{Unit Profit} &= \text{Unit Selling Price} - \text{Unit Cost Price} \\
   \text{Line Profit} &= \text{Subtotal Retail Value} - \text{Subtotal Cost} \\
   \text{Margin \%} &= \left( \frac{\text{Unit Profit}}{\text{Unit Selling Price}} \right) \times 100
   \end{aligned}$$
   - **Risk Badges:**
     - 🔴 `⚠️ Loss (<0%)`
     - 🟡 `⚠️ Low Margin (<20%)`
     - 🟢 `✓ Healthy Margin (≥20%)`

---

## 4. End-of-Day / Delivery Order Financial Summary

At the bottom of the intake workbench, pharmacy owners and dispensary managers receive a 4-card commercial overview:

```
+---------------------------------------------------------------------------------------------------------+
| [ Total Invoice Cost ]         [ Total Retail Value ]        [ Projected Profit ]      [ Stock Volume ] |
| GH₵ 420.00                    GH₵ 645.00                    +GH₵ 225.00               30 Units         |
| Avg: GH₵ 14.00 / unit          Avg: GH₵ 21.50 / unit         34.9% Batch Margin        Across 2 Lines   |
+---------------------------------------------------------------------------------------------------------+
```

### Key Metrics Defined:
- **Total Invoice Cost:** Exact wholesale cash outlay payable to the distributor vendor.
- **Total Retail Value:** Total anticipated cash generated when all received stock is dispensed.
- **Projected Gross Profit:** Net cash margin earned on this intake.
- **Overall Batch Margin %:** Weighted commercial profitability across the entire shipment.
- **Average Unit Cost & Selling:** Normalized price per physical unit for instant auditing.

---

## 5. Master Catalogue Price Sync Option

Located directly next to the confirmation button:
- ☑️ **Update Master Catalogue Shelf Prices & Tiers:**
  - **When checked:** The system immediately updates the master product card in the Catalogue. When cashiers scan this product at the POS, it immediately sells at the updated selling price.
  - **When unchecked:** The system updates the inventory lot and cost valuation, but leaves existing shelf retail prices unchanged if the pharmacy prefers to maintain current prices.

---

## 6. Seamless Workflow Integration (No Complications)

1. **Direct Supplier Van Deliveries (No PO):**
   - Click **"Receive Stock"**.
   - Select the Wholesale Supplier.
   - Enter/scan items (or add new products on-the-fly).
   - Click **"Save & Post Stock to Shelves"**.
   - Products and batches are immediately live on dispensary shelves.
2. **Receiving Against an Existing Purchase Order (PO):**
   - Approved POs can be received into the workbench with one click.
   - Staff can add extra/bonus items or adjust delivered counts without canceling the original order.
