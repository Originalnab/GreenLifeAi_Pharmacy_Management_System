# Client Host System Update — Step-by-Step Operator Playbook

This operational playbook outlines the exact step-by-step procedure for a technician, system administrator, or developer to update the **GreenLife AI Pharmacy Management System** on a client's local production computer while guaranteeing **100% database data preservation**.

---

## 📋 Overview of Update Methods

Select the scenario matching the client's setup:

| Option | Client Host Internet | Recommended Update Method |
| :--- | :--- | :--- |
| **Method A** | **Connected** (Wi-Fi / LAN Internet) | **Online 1-Click Update** via `Update-GreenLife-System.bat` |
| **Method B** | **Offline** (No Internet on Host) | **Offline USB Update** via `Export-Docker-Images.bat` + `Import-Docker-Images.bat` |

---

## 🚀 METHOD A: Connected Host Update (Git or Direct Copy)

Use this method when the client machine has internet access or is synced with your Git repository.

### Step 1: Pre-Update Health Check on Client Machine
1. Go to the client computer.
2. Check if **Docker Desktop** is running:
   - Look at the Windows Taskbar (bottom-right tray).
   - If Docker Desktop is not running, open it from the Start menu and wait until the whale icon says **"Engine running"** (turns solid green).
3. If the old GreenLife AI app is open in the browser, leave it as is or close the browser tab.

### Step 2: Transfer / Pull Latest Files
- **If using Git**:
  - Open Command Prompt or PowerShell in the project directory:
    ```bash
    cd c:\Users\Grandeville\Desktop\GreenLifeAi_Pharmacy_Management_System
    git pull origin main
    ```
- **If using USB Copy / Zip**:
  - Copy the updated project files into the client folder, overwriting existing code files.
  - **Do NOT delete the `backups\` folder or Docker volumes.**

### Step 3: Execute the Automated Production Updater
1. Inside the root project folder, locate:
   ```text
   Update-GreenLife-System.bat
   ```
2. **Right-click** and select **Run as Administrator** (or double-click it).

### Step 4: Monitor the Console Execution
The script executes 6 sequential automated steps. Observe the console:
- `[Step 1/6] Checking Docker Desktop status...` ➔ Confirms Docker engine is operational.
- `[Step 2/6] Checking for codebase updates...` ➔ Confirms latest files are in place.
- `[Step 3/6] Creating automated pre-update database backup...`
  - ➔ A timestamped SQL dump is generated: `backups\greenlife_db_pre_update_YYYYMMDD_HHMMSS.sql`.
  - ➔ **Verify that `[OK] Database backup saved safely` is displayed.**
- `[Step 4/6] Gracefully stopping previous containers...`
  - ➔ Stops old containers **WITHOUT `-v`**, preserving `greenlifeai_postgres_volume` on disk.
- `[Step 5/6] Building and launching updated production containers...`
  - ➔ Compiles the fresh frontend and backend production containers.
- `[Step 6/6] Waiting for services to initialize and apply migrations...`
  - ➔ Polls `/api/v1/health/` until 200 OK.
  - ➔ Applies any new database migrations automatically.

### Step 5: System Automatically Opens
- Once finished, the green success banner will appear:
  ```text
  ==============================================================================
    [SUCCESS] GreenLife AI System Update Completed Successfully!
    (All client data, products, inventory, and sales were 100% preserved)

    Application URL:     http://localhost
    Super Admin User:    Admink19
    Super Admin Pass:    Admin1224
    Pre-Update Backup:   backups\greenlife_db_pre_update_...sql
  ==============================================================================
  ```
- Your default web browser will automatically open `http://localhost`.

---

## 🔌 METHOD B: Offline Host Update via USB (Zero Internet)

Use this method when the client machine does not have an active internet connection.

### Phase 1: On Your Developer / Connected PC (Before Visiting Client)
1. Make sure your local repository is up to date and Docker Desktop is running.
2. In the project root, double-click:
   ```text
   Export-Docker-Images.bat
   ```
3. Wait 1–2 minutes while Docker packages all 4 images:
   - `greenlifeai_pharmacy_management_system-frontend:latest`
   - `greenlifeai_pharmacy_management_system-backend:latest`
   - `postgres:16-alpine`
   - `redis:7-alpine`
4. Confirm **`greenlife_images.tar`** (~350 MB) is created in the project root.
5. Copy the entire project folder (including `greenlife_images.tar`) onto a USB flash drive.

---

### Phase 2: On the Client's Offline Host PC
1. Insert your USB flash drive into the client computer.
2. Copy the updated project files from the USB drive to the client's destination folder (e.g. `C:\GreenLifeAI` or Desktop).
3. Ensure **Docker Desktop** is open and running on the client PC.
4. In the project folder on the client PC, locate:
   ```text
   Import-Docker-Images.bat
   ```
5. **Right-click** and select **Run as Administrator** (or double-click).
6. **What the script does automatically**:
   - `[Step 1/5]` Verifies Docker engine.
   - `[Step 2/5]` Loads the offline Docker images from `greenlife_images.tar` (takes ~30s).
   - `[Step 3/5]` Takes an automated safety snapshot of the existing client database to `backups\`.
   - `[Step 4/5]` Gracefully restarts containers with the new images (volumes 100% preserved).
   - `[Step 5/5]` Verifies healthcheck, applies migrations, and launches `http://localhost`.

---

## 🔍 Post-Update Quality Assurance & Verification

Perform this 5-minute sign-off checklist immediately after the update completes:

### 1. Hard Refresh the Client Browser
On the client host computer and any cashier terminals:
- Press **Ctrl + F5** (or **Ctrl + Shift + R**) in Google Chrome / Microsoft Edge.
- *Why*: This forces the browser to discard cached CSS/JS files and load the newly updated frontend bundle.

### 2. Verify Container Health
Open PowerShell or Command Prompt on the host PC and run:
```bash
docker compose ps
```
Ensure all 4 services show status **`Up`** or **`Up (healthy)`**:
- `greenlifeai_frontend` (Port `80`)
- `greenlifeai_backend` (Port `8000`)
- `greenlifeai_postgres` (Port `5434->5432`)
- `greenlifeai_redis` (Port `6380->6379`)

### 3. Verify Health Endpoint
Open a new browser tab or run:
```text
http://localhost/api/v1/health/
```
Verify the JSON response displays `"status": "ONLINE"`.

### 4. Verify Data Integrity (Zero Data Loss Check)
Log in with Super Admin credentials (`Admink19` / `Admin1224`):
1. **Sales History**:
   - Open **Sales History** page.
   - Click each tab: **Standard Sales**, **Credit & Receivables**, **Drafts & Quotes**, and **Medication Returns**.
   - Verify previous sales transactions and customers are visible.
2. **Inventory & Shelf Stock**:
   - Open **Inventory** page.
   - Verify active batches, expiry dates, and current stock balances are intact.
3. **Point of Sale (POS)**:
   - Add a test item to cart and click **Pay / Checkout**.
   - Test the Multi-Tender modal (enter Card, Transfer, or MoMo amounts).
   - Verify **Change Due to Customer** updates accurately.
4. **Goods Intake (GRN)**:
   - Open **Purchasing & Intake** page.
   - Verify the simplified Single Unit Price workflow is active.

### 5. Multi-Device LAN Check (If Pharmacy Uses Cashier Laptops / Tablets)
1. On the host PC, open Command Prompt and run `ipconfig`.
2. Find the host's IPv4 address (e.g. `192.168.1.100`).
3. On a cashier laptop connected to the pharmacy Wi-Fi, open the browser to:
   ```text
   http://192.168.1.100
   ```
4. Verify the POS screen loads smoothly.

---

## 🚨 Emergency Rollback Procedure (Disaster Recovery)

If an unexpected hardware crash or power interruption occurs during an update:

### How to Restore the Client Database in 60 Seconds:
1. Locate the safety backup file created right before the update in the `backups\` folder:
   - Example: `backups\greenlife_db_pre_update_20260922_191028.sql`
2. Open PowerShell or Command Prompt in the project folder and run:
   ```bash
   # Step 1: Temporarily stop backend to free database lock
   docker compose stop backend

   # Step 2: Restore data directly from the backup SQL file
   docker compose exec -T database psql -U greenlife_admin -d greenlife_pharmacy_db < backups\greenlife_db_pre_update_YYYYMMDD_HHMMSS.sql

   # Step 3: Restart backend
   docker compose start backend
   ```
3. Refresh the browser at `http://localhost`. All previous data is restored.

---
*GreenLife AI — Enterprise Production Deployment Playbook*
