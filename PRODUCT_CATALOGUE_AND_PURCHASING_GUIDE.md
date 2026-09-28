# GreenLife AI — Product Catalogue & Purchase Orders: Complete User Guide

> **Who should read this?** — Pharmacy Managers, Procurement Officers, Pharmacists, and any staff responsible for adding new stock items or raising purchase orders.

---

## 📖 Table of Contents

1. [How to Add a New Product (Drug Formulary)](#1-how-to-add-a-new-product)
   - [Step 1: Basic Drug Identity](#step-1-basic-drug-identity)
   - [Step 2: Commercial Pack Description](#step-2-commercial-pack-description-explained)
   - [Step 3: Packaging Setup — Box & Strips (Multi-Tier)](#step-3-packaging-setup--box--strips-multi-tier)
   - [Step 3b: Packaging Setup — Single Unit (Bottle / Tube)](#step-3b-packaging-setup--single-unit-bottle--tube)
   - [Step 4: POS Display Tiers](#step-4-active-shelf-tiers--pos-display-options)
   - [Step 5: Save the Product](#step-5-save-the-product)
2. [How to Add a Purchase Order (PO)](#2-how-to-add-a-purchase-order)
   - [Creating a New PO](#creating-a-new-purchase-order)
   - [Adding Products to a PO (including New Products)](#adding-products-to-a-po--adding-a-new-product-inline)
   - [Ordering by Pack vs. Base Unit](#ordering-by-pack-vs-base-unit)
   - [Submitting the PO](#submitting-the-po)
3. [How to Receive Stock (GRN — Goods Received Note)](#3-how-to-receive-stock-grn)
4. [Common Packaging Examples Quick-Reference](#4-quick-reference-packaging-examples)

---

## 1. How to Add a New Product

**Navigation path**: `Product Formulary` (left sidebar) → Click **`+ Add New Product`** button (top-right).

---

### Step 1: Basic Drug Identity

Fill in the core drug information in **Section 1: Drug Identity & Clinical Classification**:

| Field | What to Enter | Example |
| :--- | :--- | :--- |
| **Brand / Trade Name** *(required)* | The commercial brand name as it appears on the packaging | `Amoxil`, `Coartem`, `Brufen` |
| **Generic (INN) Name** *(required)* | The active pharmaceutical ingredient name | `Amoxicillin`, `Artemether/Lumefantrine`, `Ibuprofen` |
| **Dosage Form** *(required)* | The physical form of the medicine | `Tablet`, `Capsule`, `Syrup`, `Injection`, `Cream`, `Inhaler` |
| **Strength / Concentration** | The dose per unit | `500mg`, `250mg/5mL`, `100mcg/puff` |
| **Commercial Pack Description** | *(See full explanation below — this is the most important field for understanding)* | `Box of 10 Strips × 10 Tablets` |
| **Category / Therapeutic Class** | Drug classification | `Antibiotics`, `Antimalarials`, `NSAIDs` |
| **Manufacturer / Supplier** | The company that manufactures or distributes | `GSK`, `Pfizer`, `Novartis` |
| **Prescription Required (POM)?** | Toggle ON for Schedule 3 / Prescription-Only Medicines | ON for antibiotics, opioids, etc. |
| **Storage Requirements** | Temperature / storage guidance | `Store below 25°C`, `Refrigerate 2–8°C` |

---

### Step 2: Commercial Pack Description — Explained

> ⭐ **This field is one of the most misunderstood — and most important — fields in the system.**

#### What is the "Commercial Pack Description"?

The **Commercial Pack Description** is a **free-text label** that describes the **outermost manufacturer packaging** you physically receive from the supplier. It appears on:
- Purchase Order line item descriptions
- Goods Received Notes (GRN)
- Supplier invoices and cost-comparison reports
- The product formulary card

It is **NOT** the pricing or the dispensing unit — it is purely a **descriptive label of the box you buy from the supplier**.

#### How to write it correctly:

Follow the pattern:
```
Box of [Strips per Box] × [Tablets per Strip] [Base Unit]
```
or for liquids:
```
[Volume] [Container Type] with [Accessory]
```

#### Real-World Examples:

| Product | Commercial Pack Description |
| :--- | :--- |
| Amoxicillin 500mg Capsules | `Box of 10 Strips × 10 Capsules (100 Caps)` |
| Coartem 80/480mg Tablets | `Box of 6 Strips × 6 Tablets (36 Tabs)` |
| Paracetamol 500mg Tablets | `Box of 10 Strips × 10 Tablets (100 Tabs)` |
| Brufen Syrup 100mg/5mL | `100mL Amber Glass Bottle with 5mL Dosing Spoon` |
| Salbutamol Inhaler 100mcg | `Metered Dose Inhaler (MDI) — 200 Actuations` |
| Metronidazole 400mg | `Box of 10 Strips × 10 Tablets (100 Tabs)` |
| Vitamin C 500mg Effervescent | `Box of 4 Tubes × 10 Effervescent Tablets` |
| Insulin Actrapid 100IU/mL | `10mL Vial — Multi-Dose` |

> [!TIP]
> The Commercial Pack Description is what you **read off the outer cardboard box** that arrives at your dispensary door. Think of it as the manufacturer's official label for the whole outer packaging.

---

### Step 3: Packaging Setup — Box & Strips (Multi-Tier)

This mode is used for **tablets, capsules, or any medicine sold by the strip or individual piece** in addition to whole boxes.

**When to choose this**: Your medicine comes in a **box containing strips** (blisters), and you sell to customers:
- An entire **Box** (e.g. for bulk customer or wholesaler purchase)
- A single **Strip** (e.g. 1 strip of 10 tablets)
- Individual loose **Tablets/Capsules** (e.g. "1 tablet for today")

#### Part 1 — Box & Blister Packaging Dimensions

Configure the physical structure of the product packaging:

| Field | What to Enter | Example (Amoxicillin 500mg) |
| :--- | :--- | :--- |
| **Base Unit** | The smallest indivisible dispensing unit | `Tablet` |
| **How many Strips in 1 Box?** | Count the strips inside one outer box | `10` |
| **How many Tablets on each Strip?** | Count the tablets punched in 1 blister strip | `10` |

After you enter these, the system automatically calculates and displays:
```
📦 Calculated Capacity: 1 Box = 10 Strips = 100 Tablets
```

> [!NOTE]
> This structure is used internally for **automatic inventory conversion**. When you receive 5 boxes of Amoxicillin, the system knows that equals 50 strips or 500 tablets of actual dispensable stock.

#### Part 2 — Quick Price Entry

You can enter prices **by Strip** (recommended) or **by Box**:

**⚡ Enter by Strip (Recommended)**:

| Field | What to Enter | Example |
| :--- | :--- | :--- |
| **Cost per Strip (GH₵)** | The wholesale price you pay for 1 strip of 10 tablets | `18.00` |
| **Selling Price per Strip (GH₵)** | The retail price you charge a customer for 1 strip | `28.50` |

The system then **automatically calculates all other tier prices**:

```
Strip Cost:    GH₵ 18.00  →  Tablet Cost: GH₵ 1.80   →  Box Cost: GH₵ 180.00
Strip Price:   GH₵ 28.50  →  Tablet Price: GH₵ 3.28  →  Box Price: GH₵ 270.75
```

> [!TIP]
> **Always enter by Strip** unless you negotiate prices by the full box. Strip-entry is more accurate because pharmacies are invoiced per strip by most distributors.

**📦 Enter by Box** (alternative):
- Use this if your supplier invoices you per box.
- Enter the cost and selling price for 1 full box.
- The system divides automatically to calculate strip and loose tablet prices.

---

### Step 4: Active Shelf Tiers & POS Display Options

After entering prices, the system generates a **3-tier pricing table**:

| POS? | Tier Unit | Contains | Cost Price | Selling Price | Profit / Margin |
| :---: | :--- | :--- | :--- | :--- | :--- |
| ✅ | 📦 **Box** (10 strips) | 100 Tablets | GH₵ 180.00 | GH₵ 270.75 | +GH₵ 90.75 (33.5%) |
| ✅ | 💊 **Strip** (10 Tablets) | 10 Tablets | GH₵ 18.00 | GH₵ 28.50 | +GH₵ 10.50 (36.8%) |
| ✅ | ⚪ **Loose Tablet** (Single Piece) | 1 Tablet | GH₵ 1.80 | GH₵ 3.28 | +GH₵ 1.48 (45.1%) |

#### What does "Sell at POS?" mean?

Each tier has a **toggle checkbox** under the "Sell at POS?" column:
- ✅ **Checked** → This tier will appear as a **quick-add button** on the cashier's POS counter screen when this product is selected.
- ☐ **Unchecked** → This tier is for **internal costing only** and will NOT appear at the POS counter. Cashiers won't see it.

**Common configurations**:

| Scenario | Typical POS Checkboxes |
| :--- | :--- |
| Retail dispensary | Strip ✅, Loose Tablet ✅, Box ☐ |
| Hospital / bulk dispensary | Box ✅, Strip ✅, Loose Tablet ☐ |
| All tiers visible | Box ✅, Strip ✅, Loose Tablet ✅ |
| Strip-only dispensary | Strip ✅, Box ☐, Loose Tablet ☐ |

> [!IMPORTANT]
> If no tier is checked for "Sell at POS?", the cashier will not be able to add this product to the cart. Always ensure at least one tier is enabled.

#### Customize Tier Prices

Click the **`Customize Tier Prices`** button to manually override individual tier prices if the automatic calculation does not match your dispensary's pricing policy (e.g. you charge a different markup per tier).

---

### Step 3b: Packaging Setup — Single Unit (Bottle / Tube)

For liquids, creams, inhalers, and other **single-container medicines** that are sold as-is (1 bottle, 1 tube, 1 inhaler).

**When to choose this**: Products like:
- Syrups and oral liquids (Paracetamol Syrup 120mg/5mL — 100mL bottle)
- Creams and ointments (Betnovate Cream — 30g tube)
- Inhalers (Ventolin 100mcg — 200-dose canister)
- Vials and injections (Oxytocin 10IU/mL — 1mL ampoule)

**Fields**:

| Field | What to Enter |
| :--- | :--- |
| **Dispensary Unit Type** | Select from: `Bottle`, `Tube`, `Sachet`, `Ampoule`, `Vial`, `Canister`, `Piece`, `Device`, `Pack` — or type your own custom unit |
| **Wholesale Cost per [Unit]** | What you pay the supplier per single bottle/tube/vial |
| **Retail Selling Price per [Unit]** | The price you charge the customer |

The system shows a real-time **profit and margin card**:
```
Unit Profit: GH₵ XX.XX  |  Profit Margin: XX.X%  |  Cost Markup: XX.X%
```
A **risk indicator badge** turns:
- 🟢 **Green** — Healthy margin (>20%)
- 🟡 **Amber** — Low margin (10–20%), review pricing
- 🔴 **Red** — Loss or near-zero margin (<10%), warning

---

### Step 5: Save the Product

Click **`Save Product to Formulary`** at the bottom of the modal.

The product is immediately:
- Added to the **Product Formulary** table with all tier prices
- Available to select when **creating a Purchase Order**
- Available on the **POS counter** for all enabled tiers
- Visible in **Inventory** stock tracking

---

## 2. How to Add a Purchase Order

**Navigation path**: `Purchasing & Intake` (left sidebar) → **`Purchase Orders`** tab → Click **`Create Purchase Order`** button (top-right).

### Creating a New Purchase Order

The **Create PO** modal has the following fields:

| Field | What to Enter | Tips |
| :--- | :--- | :--- |
| **Supplier** | Select from your registered suppliers | If supplier is not listed, go to `Suppliers & Customers` → `Suppliers` to add them first |
| **Expected Delivery Date** | The agreed delivery date with your supplier | Used for tracking overdue orders |
| **Notes / Instructions** | Special instructions for this order | e.g. `Requires Certificate of Analysis (CoA) with minimum 18 months shelf-life` |

---

### Adding Products to a PO & Adding a New Product Inline

Under the **"Order Items"** section, each row is one product line:

| Column | What to Do |
| :--- | :--- |
| **Product** | Select from the dropdown of all registered products |
| **Order Unit** | Choose `Pack (Box)` or `Base Unit (Strip/Tablet)` — see explanation below |
| **Qty Ordered** | The number of packs or base units you are ordering |
| **Unit Cost** | The agreed price per pack or base unit — auto-filled from the product's registered cost but can be overridden |
| **Line Total** | Automatically calculated (Qty × Unit Cost) |

Click **`+ Add Line Item`** to add more product rows to the same PO.

#### Adding a New Product Directly from the PO

If you need to order a product that is **not yet in your formulary**:

1. In any product line, click the **product dropdown** and look for the **`+ New Product`** option.
2. A mini product card will expand inline to let you set:
   - Brand Name
   - Base Unit (Tablet, Bottle, etc.)
   - Initial cost and selling price
3. The product is registered to the formulary automatically when you submit the PO.

> [!TIP]
> It is better to add the full product details in **Product Formulary** first (with all packaging tiers and pricing) before creating a PO. However, the inline quick-add is useful for emergency rush orders.

---

### Ordering by Pack vs. Base Unit

This is one of the most important concepts in the purchasing workflow:

#### 📦 Order by Pack (Box)
- Use this when your supplier invoice is **"per box"**.
- Example: You order `10 Boxes of Amoxicillin 500mg`.
- The system automatically converts: `10 Boxes × 100 Tablets = 1,000 Tablets received`.
- **Unit Cost** = price per full box (e.g. `GH₵ 180.00 per box`).

#### 💊 Order by Base Unit (Strip or Tablet)
- Use this when your supplier invoice is **"per strip"** or **"per piece"**.
- Example: You order `100 Strips of Amoxicillin 500mg`.
- **Unit Cost** = price per strip (e.g. `GH₵ 18.00 per strip`).

> [!NOTE]
> When you switch between Pack and Base Unit for a product line, the system **automatically recalculates** the quantity and unit cost to stay mathematically consistent. You will never accidentally double-count your stock.

---

### Submitting the PO

After adding all product lines:

1. Review the **Order Summary** at the bottom:
   - Total Line Items
   - Total Estimated Value (in GH₵)
2. Click **`Submit Purchase Order`** to formally raise the PO.
   - Status changes to **`Pending`** → **`Submitted`**.
3. The PO is now:
   - Listed in the **Purchase Orders** table with its PO number (e.g. `PO-2026-0093`).
   - Filterable by Supplier, Status, and Date.
   - Downloadable as a **PDF** or **CSV** using the Export buttons.

---

#### Viewing or Editing an Existing PO

In the Purchase Orders table, each row has **action icons** in the last column:

| Icon | Action | Description |
| :---: | :--- | :--- |
| 👁 **View** | View PO details | Opens the PO card in read-only mode — see all items, supplier, dates, and totals |
| ✏️ **Edit** | Edit PO details | Opens the same PO card in edit mode — change quantities, costs, items, or notes |
| 📄 **Print/PDF** | Export PO voucher | Generates a formatted purchase order document for the supplier |

> [!IMPORTANT]
> Only **Pending** and **Submitted** purchase orders can be edited. Once a PO is marked **Completed** (stock has been received), it is locked and read-only.

---

## 3. How to Receive Stock (GRN)

After your order arrives, you must physically receive it into inventory using the **Goods Received Note (GRN)** process.

**Navigation path**: `Purchasing & Intake` → Click **`Receive Stock`** button (top-right).

### GRN Header Details

| Field | What to Enter |
| :--- | :--- |
| **Supplier** | The supplier who delivered the stock |
| **GRN / Receipt Number** | Auto-generated (e.g. `RCV-2026-4821`), or type your own reference |
| **Batch Reference Number** | Auto-generated lot number (e.g. `BAT-2026-219`). This ties all products in this delivery to one batch record |
| **Delivery / Waybill Note #** | The supplier's waybill or packing list number |
| **Receiving Bay / Location** | Where the stock is physically being stored (your branch, back room, cold room, etc.) |

### GRN Line Items (Per Product)

For each product received, enter:

| Field | What to Enter |
| :--- | :--- |
| **Product** | Select from the formulary, or flag as a new product |
| **Batch Number** | Individual product batch from the manufacturer (printed on the packaging) |
| **Manufacturing Date** | The production date on the outer box |
| **Expiry Date** | ⭐ The expiry date — **this is critical for FEFO tracking** |
| **Quantity Received** | Number of strips, bottles, or units you physically counted |
| **Unit Cost** | Actual supplier invoice cost per unit (may differ from the PO estimate) |
| **Selling Price** | The shelf price for this batch — can update the master product price if toggled ON |

Click **`+ Add Another Product`** to add more products to the same GRN.

Click **`Confirm & Post GRN to Inventory`** to complete the intake.

All received products are immediately:
- Added to the **Inventory** with their exact batch, expiry, and stock quantities.
- Tracked under **Batches & Lot Registry** in the Purchasing tab.
- Available at the **POS counter** for dispensing.

---

## 4. Quick Reference — Packaging Examples

| Drug | Packaging Mode | Strips/Box | Tabs/Strip | Cost/Strip | Sell/Strip | POS Tiers |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| Amoxicillin 500mg Caps | Box & Strips | 10 | 10 | GH₵ 18.00 | GH₵ 28.50 | Box, Strip, Loose Cap |
| Coartem 80/480mg | Box & Strips | 6 | 6 | GH₵ 25.00 | GH₵ 38.00 | Strip only |
| Paracetamol 500mg | Box & Strips | 10 | 10 | GH₵ 3.50 | GH₵ 6.00 | Strip, Loose Tab |
| Metronidazole 400mg | Box & Strips | 10 | 10 | GH₵ 5.00 | GH₵ 9.00 | Strip, Loose Tab |
| Brufen Syrup 100mg/5mL | Single Unit (Bottle) | — | — | GH₵ 12.00/bottle | GH₵ 20.00/bottle | Bottle |
| Betnovate Cream 30g | Single Unit (Tube) | — | — | GH₵ 15.00/tube | GH₵ 28.00/tube | Tube |
| Ventolin Inhaler 100mcg | Single Unit (Canister) | — | — | GH₵ 45.00/inhaler | GH₵ 75.00/inhaler | Canister |
| Ampiclox 500mg Inj. | Single Unit (Ampoule) | — | — | GH₵ 8.00/amp | GH₵ 15.00/amp | Ampoule |

---

> [!NOTE]
> **Commercial Pack Description examples to copy-paste**:
> - `Box of 10 Strips × 10 Capsules (100 Caps)`
> - `Box of 6 Strips × 6 Tablets (36 Tabs)`
> - `Box of 10 Strips × 10 Tablets (100 Tabs)`
> - `100mL Amber Glass Bottle with 5mL Dosing Spoon`
> - `200-Dose Pressurised Metered Dose Inhaler (pMDI)`
> - `10mL Multi-Dose Vial`
> - `30g Aluminium Tube`
> - `Box of 4 Tubes × 10 Effervescent Tablets`

---

*GreenLife AI Pharmacy Management System — Dispensary Operations User Guide*  
*Document Reference: PRODUCT-CATALOGUE-AND-PURCHASING-GUIDE-2026*
