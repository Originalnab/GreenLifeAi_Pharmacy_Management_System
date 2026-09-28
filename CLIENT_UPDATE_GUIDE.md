# GreenLife AI — Client Machine Automated Production Update Guide

This guide describes how to safely apply system updates to the GreenLife AI Pharmacy Management System on the client's local production computer with **100% database data preservation**.

---

## 🛡️ Enterprise Data Preservation Guarantee

> [!IMPORTANT]
> **Zero Data Loss Guarantee**:
> - All sales records, patient data, stock batches, dispensations, and custom settings stored in `greenlifeai_postgres_volume` are **strictly preserved**.
> - An automated SQL database snapshot (`backups\greenlife_db_pre_update_YYYYMMDD_HHMMSS.sql`) is automatically created before any containers are stopped.
> - The destructive `-v` flag is never used during updates.

---

## ⚡ Method 1: 1-Click Update (Online / Connected Client PC)

Use this method if the client PC has internet access or is synced via Git/Zip copy.

### Steps on the Client Machine:
1. Ensure **Docker Desktop** is open and running (the whale icon in the taskbar is steady green).
2. Copy the latest project files to the client machine (or run `git pull`).
3. Double-click **`Update-GreenLife-System.bat`**.
4. The script will automatically:
   - Check Docker engine health.
   - Pull latest code updates (if git-connected).
   - **Take an automatic safety backup** of the current database into `backups\`.
   - Safely stop old containers without touching the database volume.
   - Build and start updated containers with the new frontend and backend.
   - Apply any new database migrations.
   - Poll backend health check until online.
   - Automatically launch the browser at `http://localhost`.

---

## ⚡ Method 2: Offline Update via USB (No Internet on Client PC)

Use this method if the pharmacy computer is completely offline.

### Step A: On the Developer PC (Connected):
1. Double-click **`Export-Docker-Images.bat`**.
2. This creates **`greenlife_images.tar`** (~350MB) containing all 4 pre-built Docker images.
3. Copy `greenlife_images.tar` and the project folder onto a USB flash drive.

### Step B: On the Client PC (Offline):
1. Insert the USB drive and copy the project folder (including `greenlife_images.tar`) to the client's Desktop.
2. Ensure Docker Desktop is running.
3. Double-click **`Import-Docker-Images.bat`**.
4. The script loads the updated images, takes a pre-update backup of any existing database, applies updates safely, and launches `http://localhost`.

---

## ⚙️ What the Automated Script Does (Step-by-Step)

```
[Step 1/6] Verifies Docker Engine is running.
      │
[Step 2/6] Checks for codebase updates (git pull or local files).
      │
[Step 3/6] 🔒 TAKES AUTOMATIC PRE-UPDATE DATABASE BACKUP to backups/*.sql.
      │
[Step 4/6] Gracefully stops old containers (database volume PRESERVED 100%).
      │
[Step 5/6] Builds and starts updated containers with latest features.
      │
[Step 6/6] Runs database migrations, verifies healthcheck, and opens browser.
```

---

## 🔍 Verification Checklist

After the update script completes:

1. **Verify All Containers are Active**:
   Open PowerShell and run:
   ```bash
   docker compose ps
   ```
   All four services should show status `Up` or `Up (healthy)`:
   - `greenlifeai_frontend` (Port `80`)
   - `greenlifeai_backend` (Port `8000`)
   - `greenlifeai_postgres` (Port `5434->5432`)
   - `greenlifeai_redis` (Port `6380->6379`)

2. **Verify API Healthcheck**:
   In browser:
   ```text
   http://localhost/api/v1/health/
   ```
   Response:
   ```json
   {
     "status": "ONLINE",
     "service": "GreenLife AI Pharmacy Management System Backend API",
     "version": "1.0.0-rc",
     "database": "PostgreSQL 16 (Authoritative)"
   }
   ```

3. **Verify Existing Client Data**:
   - Log in at `http://localhost`.
   - Go to **Sales History**, **Inventory**, and **Settings** to confirm all previous client transactions, inventory balances, and users remain intact.

4. **Sign In Credentials**:
   - **Username**: `Admink19`
   - **Password**: `Admin1224`

---

## 🛟 Troubleshooting & FAQs

### Q1: The script says `[ERROR] Docker Desktop is not running!`
- **Solution**: Open Docker Desktop from the Windows Start menu. Wait 30 seconds for the engine to initialize, then run `Update-GreenLife-System.bat` again.

### Q2: Where is the backup file located?
- **Solution**: Check the `backups\` folder in the root directory. Files are named:
  `backups\greenlife_db_pre_update_YYYYMMDD_HHMMSS.sql`.

### Q3: How do other computers on the pharmacy Wi-Fi access the system?
- **Solution**:
  1. On the host PC, run `ipconfig` in Command Prompt to get its IPv4 address (e.g. `192.168.1.50`).
  2. On cashier or pharmacist laptops/terminals on the same Wi-Fi, open Chrome or Edge and go to:
     ```text
     http://192.168.1.50
     ```

---
*© 2026 GreenLife AI — Enterprise Pharmacy Management System.*
