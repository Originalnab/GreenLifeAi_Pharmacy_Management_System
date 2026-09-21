# GreenLife AI — Modern Pharmacy Management System

A next-generation, enterprise-grade Pharmacy Management System featuring role-based intelligence, AI-driven demand forecasting, real-time clinical verification, inventory lifecycle tracking, and comprehensive financial analytics.

---

## 🌟 Key Features

### 1. 🛡️ Role-Based Dynamic Dashboards
Tailored operational cockpits designed for 9 distinct pharmacy roles:
- **Super Admin**: Multi-branch overview, cross-functional health metrics, system vitals, audit logs, backup status, and enterprise revenue/profit analytics.
- **Branch Manager**: Real-time sales KPIs, cash vs credit split, expiry risk alerts, discount/void approvals queue, and AI-powered stocking recommendations.
- **Pharmacy Admin**: Staff scheduling, audit log tracker, compliance logs, shift oversight, and license management.
- **Pharmacist**: Active prescription queue, drug-drug interaction alerts, clinical counseling checklists, and refill requests.
- **Cashier**: Active register balance, POS transaction stats, shift cash reconciliation, and payment method breakdowns.
- **Stock Officer**: Critical low-stock monitor, batch & bin locations, supplier deliveries, and physical count discrepancy tracking.
- **Procurement Officer**: Purchase order pipeline, supplier health ratings, open balances, payment terms, and automated reorder alerts.
- **Accountant**: Balance sheet KPIs, Accounts Receivable aging bands, Accounts Payable breakdown, loan schedules, and profit & loss summaries.
- **Auditor**: Tamper-proof audit trails, narcotics register reconciliation, discount/override variance logs, and compliance scorecards.

### 2. 📅 Interactive Period Filtering
- Instant aggregation across **Today**, **This Week**, **This Month**, **This Quarter**, **This Year**, and **Custom Date ranges**.
- Dynamic KPI multipliers, target tracking, and contextual trend comparisons.

### 3. 📊 Modern Interactive Data Visualizations
- Real-time **Sales & Profit Trend Bar Charts** with hover breakdowns.
- **Category Sales & Payment Breakdown Donut Charts** with percentage tooltips.
- **Sparkline KPI Cards** with gradient trends and metric deltas.
- **Purchase Pipeline Tracker**, **Expiry Risk Matrix**, and **Approval Queues**.

### 4. 💊 Core Pharmacy Management Modules
- **Point of Sale (POS)**: Barcode scanning, receipt printing, multi-tender transactions (Cash, Card, Mobile Money), discount handling.
- **Inventory & Batch Tracking**: FEFO (First-Expiry-First-Out), batch numbers, supplier link, bin tracking, low-stock reorder triggers.
- **Clinical & Prescriptions**: Dosage checks, contraindications, patient medication profiles.
- **Finance & Accounting**: Revenue, COGS, operational expenses, debt tracking, loan amortizations.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS, Lucide Icons
- **State Management**: React Context API (`PharmacyContext`) with mock datasets
- **Architecture**: Modular widget-based architecture with clean separation of layouts and reusable analytics components
- **Styling**: Modern dark mode support, glassmorphism, responsive grid layouts, subtle micro-animations

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation & Running Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Originalnab/GreenLifeAi_Pharmacy_Management_System.git
   cd GreenLifeAi_Pharmacy_Management_System
   ```

2. **Install frontend dependencies:**
   ```bash
   cd Frontend
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173/` (or the port indicated in your console).

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 📂 Project Structure

```text
GreenLifeAi_Pharmacy_Management_System/
├── Backend/                 # Backend API services & controllers
├── Frontend/                # Vite + React + TypeScript web application
│   ├── src/
│   │   ├── components/      # UI components & shared modals
│   │   ├── context/         # Global state & PharmacyContext
│   │   ├── data/            # Mock database seeds & records
│   │   ├── pages/
│   │   │   └── dashboard/   # Role-based dashboard layouts & widgets
│   │   │       ├── layouts/ # 9 Role-specific dashboard views
│   │   │       └── widgets/ # Reusable KPI, chart, & list widgets
│   │   └── types/           # TypeScript definitions & interfaces
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── notes/                   # Product requirements & architecture documentation
├── .gitignore
└── README.md
```

---

## 📄 License
All rights reserved © 2026 GreenLife AI.
