# GreenLife AI — Client PC Update & Deployment Guide (Zero Data Loss)

> **Target Version**: GreenLife AI Pharmacy Management System (Enterprise Build 2026.09)  
> **Target Environment**: Client Local Production Host PC (Windows 10 / 11 with Docker Desktop)  
> **Data Loss Guarantee**: **ZERO (100% Database & Transaction Preservation)**  

---

## 📌 Executive Summary of New Features in this Update

| Module | What Was Added / Hardened |
| :--- | :--- |
| **Purchasing & GRN** | • **View & Edit PO Actions**: View and modify purchase order items using the intuitive modal.<br>• **CSV & PDF Export**: Instant download of official PO vouchers, supplier delivery sheets, and bulk PO ledgers.<br>• **Defensive Intake Engine**: Sanitized date intake preventing 500 errors on stock intake. |
| **Inventory & Quarantine** | • **Quarantine Restore**: 1-click **"Restore to Shelf"** button to release quarantined batches back into active inventory with full audit trail.<br>• **CSV & PDF Ledger Downloads**: Full export capabilities for Batches & Lot Registry and Stock Movement Ledgers. |
| **Super Admin Concealment** | • **Role Protection**: The `Super Admin` role is strictly hidden from "Target Role" and "Role & Practice Licensing" dropdowns for all non-Super Admin users.<br>• **Staff Privacy**: Super Admin user accounts are hidden from the staff directory and direct authorization inspectors.<br>• **Navigation Menu**: "System Settings & Super Admin Control Suite" is completely hidden from role menu access configuration for non-superadmins. |
| **Clinical Governance (POM)** | • **Medical License Number**: Disabled/hidden by default from the POS POM dispensation modal. Cashiers and pharmacists only need Patient Name and Prescribing Doctor.<br>• **Super Admin Toggle**: Switchable ON/OFF under **Administration & System** &gt; **Clinical Governance**. |
| **Offline Hardening** | • **Non-Blocking Fonts**: Google Fonts loaded asynchronously so the UI renders instantly with zero internet.<br>• **Docker Desktop Auto-Start**: Launcher automatically detects if Docker Desktop is stopped and initiates it with health polling. |

---

## 🛡️ Data Preservation Guarantee (Why Your Client's Data Is 100% Safe)

All operational data (sales history, patients, products, suppliers, expense ledgers, batches, and user accounts) is permanently stored in the Docker named volume:
```text
postgres_data (persisted on disk at /var/lib/postgresql/data)
```
- **Updating the system only replaces the application containers (frontend Nginx and backend Django)**.
- **The database volume is never deleted, formatted, or overwritten**.
- In addition, **`Update-GreenLife-System.bat` automatically takes an uncompressed SQL snapshot of the entire database into the `backups\` folder BEFORE touching any containers**.

---

## 🗂️ Step 1: Files to Put on Your USB Flash Drive

On your development computer, copy the following items from the project root onto your USB drive:

```text
📁 GreenLifeAI_Update_Bundle/
│
├── 📄 greenlife_images.tar         <-- (334.95 MB: Updated frontend, backend, postgres, redis)
├── 📄 docker-compose.yml           <-- (Container orchestration configuration)
├── 📄 Update-GreenLife-System.bat   <-- (1-Click automated updater with pre-backup)
├── 📄 Import-Docker-Images.bat     <-- (Alternative offline image loader)
├── 📄 Start-GreenLife-Docker.bat   <-- (Daily desktop launcher)
├── 📄 Stop-GreenLife-Docker.bat    <-- (Clean shutdown utility)
│
├── 📁 Backend/                     <-- (Mounted backend codebase and migrations)
│   ├── apps/
│   ├── core/
│   ├── manage.py
│   ├── requirements.txt
│   └── entrypoint.sh
│
└── 📁 Frontend/
    ├── dist/                       <-- (Compiled production React 19 bundle)
    ├── nginx.conf                  <-- (Production web server configuration)
    └── package.json
```

> [!TIP]
> **Exclude heavy/unnecessary folders**: You **DO NOT** need to copy `Frontend/node_modules/` or `.git/`. This saves gigabytes of space and transfer time.

---

## 💻 Step 2: Transfer Files to the Client PC

1. Take the USB flash drive to the client's pharmacy host computer.
2. Open the existing installation directory on the client PC (typically on Desktop or `C:\GreenLifeAi_Pharmacy_Management_System`).
3. Copy the updated files from the USB drive into the client's folder, choosing **"Replace the files in the destination"** when prompted by Windows.
4. Verify that **`greenlife_images.tar`** is present in the root folder alongside `Update-GreenLife-System.bat`.

---

## ⚡ Step 3: Run the 1-Click Update on the Client PC

1. Ensure **Docker Desktop** is running on the client PC (whale icon in the Windows taskbar).
   *(If it is not running, start it and wait until the whale icon turns green — "Engine running")*.
2. Open the project folder on the client PC.
3. **Right-click** on:
   ```text
   Update-GreenLife-System.bat
   ```
   and select **Run as Administrator** (or double-click it).

### What the Script Executes Automatically:
```text
[Step 1/6] Checking Docker Desktop status...
           - Docker engine is active and operational.

[Step 2/6] Checking for codebase updates...
           - Standalone installation detected using updated local files.

[Step 3/6] Creating automated pre-update database backup...
           - Taking snapshot of active database to: backups\greenlife_db_pre_update_YYYYMMDD_HHMMSS.sql
           - [OK] Database backup saved safely.

[Step 4/6] Gracefully stopping previous containers (Preserving Database Volume)...
           - Previous containers stopped cleanly.
           - Database volume 'greenlifeai_postgres_volume' is 100% PRESERVED.

[Step 5/6] Starting updated production containers...
           - Offline image archive 'greenlife_images.tar' detected.
           - Loading offline Docker images (zero internet required)...
           - Starting containers from updated images...
           - Containers successfully started.

[Step 6/6] Waiting for services to initialize and apply migrations...
           - Ensuring latest database migrations are applied...
```

4. Once finished, a **green success banner** will appear and your default web browser will automatically open:
   ```text
   http://localhost
   ```

---

## ✅ Step 4: Quality Assurance & Verification Checklist

Perform these quick checks on the client PC to verify the update:

### 1. Hard Refresh Browser Cache
- On the client browser, press **`Ctrl + F5`** (or **`Ctrl + Shift + R`**).
- *This forces the browser to discard cached files and load the updated application.*

### 2. Check Database Data Integrity
- Log in with the pharmacy credentials.
- Navigate to **Sales & Invoices** ➔ Confirm all historical transactions, invoices, and customer accounts are intact.
- Navigate to **Stocks & Batches** ➔ Confirm all batch quantities, expiration dates, and shelf stock are present.

### 3. Verify New Features
- **Purchasing & Intake**:
  - Open a purchase order ➔ Click **View** or **Edit** to confirm the detailed PO item card renders.
  - Click **Download CSV** or **Print PDF** to confirm instant export.
- **Quarantine & Disposal**:
  - Open **Quarantine & Disposal** tab ➔ Locate a quarantined batch and verify the **"Restore to Shelf"** button is present and functional.
- **Point of Sale (POM Sign-Off)**:
  - Add a Prescription-Only Medication (e.g. Amoxicillin or Coartem) to the cart and proceed to checkout.
  - Verify that the modal requires **Patient Name** and **Prescribing Doctor**, while the **Medical License Number** is hidden.
- **Super Admin Concealment**:
  - Log in as a Pharmacist or Manager:
    - Open **Staff Directory** ➔ Confirm Super Admin account is hidden.
    - Open **Create New Staff** ➔ Confirm `Super Admin` is not in the role list.
    - Open **Navigation Permissions** ➔ Confirm `System Settings & Super Admin Control Suite` is invisible.

---

## 🚨 Emergency Rollback (Just In Case)

If power is suddenly disconnected or a hardware fault occurs during updating:

1. Locate the pre-update backup SQL file generated in `backups\`:
   - Example: `backups\greenlife_db_pre_update_20260928_155012.sql`
2. Open PowerShell or Command Prompt in the project directory and run:
   ```powershell
   # 1. Temporarily stop the backend container
   docker compose stop backend

   # 2. Restore database from the safety backup
   docker compose exec -T database psql -U greenlife_admin -d greenlife_pharmacy_db < backups\greenlife_db_pre_update_YYYYMMDD_HHMMSS.sql

   # 3. Restart the backend container
   docker compose start backend
   ```
3. Refresh `http://localhost` in the browser. The database will be restored to its exact pre-update state.

---

*GreenLife AI Pharmacy Management System — Enterprise Deployment Protocol*
