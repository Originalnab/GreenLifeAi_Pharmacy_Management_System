# GreenLife AI Pharmacy Management System
## Zero-Math Packaging Setup, Shelf Pricing & 1-Tap POS Guide

**Document Version:** 2.0.0  
**Target Modules:** 
- Catalogue & Formulations (`CataloguePage.tsx`)
- Point of Sale Terminal (`PointOfSalePage.tsx`)
- Goods Received Note & Purchasing (`PurchasingPage.tsx`)  
**Currency Standard:** Ghana Cedi (GH₵ / GHS) & Multi-Currency  

---

## 1. Executive Summary & Philosophy

In busy community pharmacies, staff face high mental friction when forced to do mental arithmetic for unit divisions, multipliers, and odd change calculations while processing deliveries or dispensing at the counter.

The **Zero-Math Packaging & Shelf Pricing Engine** adheres to one principle:
> **The user enters what is physically on their supplier invoice; the system performs all mathematical breakdowns, commercial roundings, and multi-tier POS buttons automatically.**

---

## 2. Universal 3-Preset Architecture

```
+---------------------------------------------------------------------------------------------------------+
|                                1. DISPENSARY PACKAGING PRESET (1-Click)                                 |
|                                                                                                         |
|   [💊 Blister Box]               [🍼 Single Bottle / Tube]         [📦 Multi-Pack]                      |
|   Box ➔ Strips ➔ Tablets        1 Bottle = 1 Dispensed Unit       Pack of 20 Sachets / Ampoules         |
+---------------------------------------------------+-----------------------------------------------------+
                                                    |
                                                    v
+---------------------------------------------------------------------------------------------------------+
|                                2. INVOICE INPUT (Only 2 numbers needed!)                                |
|                                                                                                         |
|   "Supplier Buy Cost"                 ➔  [ GH₵ 180.00 ]                                                 |
|   "Strips in this box"                ➔  [ 10 Strips ]                                                  |
|   "Target Profit Margin"              ➔  [ 25% ] [ 30% ★ ] [ 35% ] [ 40% ]                              |
+---------------------------------------------------+-----------------------------------------------------+
                                                    | (Automated Breakdown & Clean Rounding)
                                                    v
+---------------------------------------------------------------------------------------------------------+
|                               3. AUTO-GENERATED DISPENSARY SHELF TIERS                                  |
|                                                                                                         |
|   📦 Full Box     (10 strips)   ➔  Buy: GH₵ 180.00   |  Sell: GH₵ 260.00   (30.8% margin)   [✓ Active]  |
|   💊 Single Strip (10 tabs)     ➔  Buy: GH₵ 18.00    |  Sell: GH₵ 28.00*   (35.7% margin)   [✓ Active]  |
|   ⚪ Loose Tablet (1 tab)       ➔  Buy: GH₵ 1.80     |  Sell: GH₵ 3.00*    (40.0% margin)   [✓ Active]  |
|                                                                                                         |
|   *Clean commercial rounding applied (eliminates awkward change like 28 or 75 pesewas)                  |
+---------------------------------------------------+-----------------------------------------------------+
                                                    |
                                                    v
+---------------------------------------------------------------------------------------------------------+
|                               4. 1-TAP FAST DISPENSING AT CASHIER POS                                   |
|                                                                                                         |
|   [+ 📦 Box (GH₵ 260)]       [+ 💊 Strip (GH₵ 28)]       [+ ⚪ Tablet (GH₵ 3)]                          |
+---------------------------------------------------------------------------------------------------------+
```

### Step 2: Box & Blister Packaging Dimensions
Pharmacy operators enter two basic values found directly on the medicine packaging:
- **How many Strips in 1 Box?** (e.g. `10`)
- **How many Tablets on each Strip?** (e.g. `5`)

The system computes:
$$\text{Calculated Capacity} = \text{Strips per Box} \times \text{Tablets per Strip} = 10 \times 5 = 50\text{ Tablets}$$
- **Inventory Synchronization:** Stock is authoritatively tracked at the base loose piece level, allowing the pharmacy to receive in boxes while seamlessly dispensing in strips or single tablets without inventory discrepancy.

---

### Step 3: Quick Price Entry Modes

Users can toggle between two primary invoicing habits:

#### Mode A: ⚡ Enter by Strip (Recommended)
Used when supplier invoice quotes cost per blister or strip:
- **Cost per Strip (GH₵):** Supplier purchase cost for 1 strip (e.g. `18.00`).
- **Selling Price per Strip (GH₵):** Counter retail price for 1 strip (e.g. `28.50`).

**Behind-the-Scenes Automatic Calculations:**
1. **Box Wholesale Cost:**
   $$\text{Box Cost} = \text{Strip Cost} \times \text{Strips per Box} = 18.00 \times 10 = \text{GH₵ } 180.00$$
2. **Box Selling Price (Bulk-Purchase Incentive):**
   $$\text{Box Price} = (\text{Strip Price} \times \text{Strips per Box}) \times \left(1 - \frac{\text{Bulk Discount}}{100}\right) = (28.50 \times 10) \times 0.95 = \text{GH₵ } 270.75$$
3. **Loose Piece Wholesale Cost:**
   $$\text{Piece Cost} = \frac{\text{Strip Cost}}{\text{Tablets per Strip}} = \frac{18.00}{5} = \text{GH₵ } 3.60$$
4. **Loose Piece Retail Price (Convenience Markup):**
   $$\text{Piece Price} = \left(\frac{\text{Strip Price}}{\text{Tablets per Strip}}\right) \times 1.15 = \frac{28.50}{5} \times 1.15 = \text{GH₵ } 6.56$$

#### Mode B: 📦 Enter by Box
Used when invoices are billed strictly per outer box (e.g. GH₵ 180.00 Cost, GH₵ 270.00 Selling Price):
- The engine divides down to calculate the strip and loose tablet values automatically.

---

### Step 4: Active Shelf Tiers & Point-of-Sale (POS) Options Table

| Sell at POS? | Tier Unit | Contains | Cost Price | Selling Price | Profit / Margin |
| :---: | :--- | :--- | :--- | :--- | :--- |
| ☑️ | **📦 Box** | 50 Tablets | GH₵ 180.00 | GH₵ 270.75 | **+GH₵ 90.75 (33.5%)** |
| ☑️ | **💊 Strip** | 5 Tablets | GH₵ 18.00 | GH₵ 28.50 | **+GH₵ 10.50 (36.8%)** |
| ☑️ | **⚪ Loose Tablet** | 1 Tablet | GH₵ 3.60 | GH₵ 6.56 | **+GH₵ 2.96 (45.1%)** |

#### Key Controls:
1. **"Sell at POS?" Checkboxes:**
   - Only checked tiers will appear as fast-action dispensing buttons on the Cashier POS terminal.
   - *Example:* If a pharmacy policy prohibits cutting open blister packs, uncheck **Loose Tablet**. The cashier will only be allowed to sell whole Boxes or Strips.
2. **"Customize Tier Prices" / "Lock Auto-Calculated":**
   - Click the customize button to enable manual numerical override inputs for any specific tier if the pharmacy adheres to custom price lists or regulated price caps.

---

### Step 5: Commercial Margin Health & Risk Indicator

The system dynamically tracks margin health on the active tier and provides live regulatory/commercial feedback:

$$\text{Margin \%} = \frac{\text{Selling Price} - \text{Cost Price}}{\text{Selling Price}} \times 100$$

| Margin Range | Risk Level | Badge Color | Guidance Label |
| :--- | :--- | :--- | :--- |
| $< 0\%$ | **CRITICAL** | Red | `CRITICAL: Selling Below Cost (Loss)` |
| $< 15\%$ | **LOW** | Amber | `CAUTION: Thin Profit Margin (<15%)` |
| $15\% - 40\%$ | **HEALTHY** | Emerald | `OPTIMAL: Healthy Commercial Margin (15% - 40%)` |
| $> 40\%$ | **PREMIUM** | Indigo | `PREMIUM: High Markup (>40%)` |

---

## 4. Single-Unit Products (Bottles, Syrups, Inhalers)

When adding items that cannot be split into strips or blisters (e.g. Syrups, Suspensions, Eye Drops, Inhalers):
1. Switch mode to **Single Unit (Bottle / Tube)**.
2. Select the **Dispensary Unit Type** (`Bottle`, `Tube`, `Ampoule`, `Sachet`, `Vial`, `Canister`, or type a custom unit).
3. Enter only 2 values:
   - **Wholesale Cost per Unit (GH₵)**
   - **Retail Selling Price per Unit (GH₵)**
4. The system calculates Unit Profit, Margin %, and Cost Markup % instantly.

---

## 5. Technical Implementation References

- **Frontend Component:** [`Frontend/src/pages/catalogue/CataloguePage.tsx`](file:///c:/Users/Grandeville/Desktop/GreenLifeAi_Pharmacy_Management_System/Frontend/src/pages/catalogue/CataloguePage.tsx)
- **Calculation Functions:**
  - `calculateFromStrip()` (Line 232)
  - `calculateFromBox()` (Line 266)
  - `handleDimensionChange()` (Line 297)
  - `getMarginRisk()` (Line 318)
- **Database Schema Models:**
  - `Product`: Stores base unit, dosage form, packaging descriptions.
  - `ProductPackagingTier`: Stores multiplier, tier type (`BOX`, `STRIP`, `PIECE`), wholesale cost, retail price, and `is_pos_available` flag.
