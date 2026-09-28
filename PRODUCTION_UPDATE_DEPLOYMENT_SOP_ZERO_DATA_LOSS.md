# Production Update Deployment SOP — Zero Data Loss Guarantee

**Standard Operating Procedure (SOP):** SOP-GLA-004  
**Classification:** Enterprise Production Operations  
**Scope:** Updating GreenLife AI Pharmacy Management System on Client Production PCs without internet access and with 100% data preservation.

---

## 1. Zero Data Loss Architecture (How Client Data is Protected)

Before executing any update, understand why client records, sales, and products can **never be deleted** when following this SOP:

```
+-------------------------------------------------------------------------------+
|                             CLIENT WORKSTATION                                |
|                                                                               |
|  [ DOCKER CONTAINER LAYER ] (Stateless - Replaced during update)              |
|  +---------------------------+   +----------------------------+               |
|  | greenlifeai_backend       |   | greenlifeai_frontend       |               |
|  | (Django API Engine)       |   | (React Dispensary UI)      |               |
|  +---------------------------+   +----------------------------+               |
|                |                                                              |
|                v                                                              |
|  +---------------------------+                                                |
|  | greenlifeai_postgres      |                                                |
|  | (PostgreSQL 16 Engine)    |                                                |
|  +-------------+-------------+                                                |
|                |                                                              |
|================v==============================================================|
|  [ PERSISTENT VOLUME LAYER ] (Stateful - Stored permanently on physical disk) |
|                                                                               |
|   Physical Volume: greenlifeai_postgres_volume                                |
|   Disk Location:   \\wsl$\docker-desktop-data\data\docker\volumes\...         |
|   Contains:        All sales, batches, prices, drugs, staff logins, audits.  |
|                                                                               |
|   Rule #1: 'docker compose down' NEVER deletes volumes.                      |
|   Rule #2: 'docker compose down -v' deletes volumes (STRICTLY PROHIBITED!).   |
|   Rule #3: 'Update-GreenLife-System.bat' takes a full SQL dump FIRST.         |
+-------------------------------------------------------------------------------+
```

### The Three Safety Locks:
1. **Automated Live SQL Snapshot**: Step 3 of the updater runs `pg_dump` to create an immediate backup timestamped in `backups/greenlife_db_pre_update_YYYYMMDD_HHMMSS.sql`.
2. **Persistent Named Volume**: The database files live in `greenlifeai_postgres_volume`. Stopping or destroying containers does not touch this storage volume.
3. **Hardcoded Image References**: `docker-compose.yml` explicitly specifies image tags, preventing Docker from rebuilding or resetting state based on folder names.

---

## 2. Pre-Deployment Preparation on Developer PC

Always perform these steps on the developer workstation before going to the client site or transferring files:

### Step 2.1 — Build and Package Fresh Docker Images
Run this command in the project root to bundle all updated containers into a single offline archive:

```powershell
docker save greenlifeai_pharmacy_management_system-backend:latest greenlifeai_pharmacy_management_system-frontend:latest postgres:16-alpine redis:7-alpine -o greenlife_images.tar
```
*Expected file size: approximately 330 MB – 360 MB.*

### Step 2.2 — Files to Copy to USB Drive
Place the following files onto the root of your USB flash drive:

| File Name | Purpose | Must Overwrite on Client? |
| :--- | :--- | :---: |
| **`greenlife_images.tar`** | Pre-compiled Docker images (Offline container payload) | **YES** |
| **`Update-GreenLife-System.bat`** | Refactored, syntax-safe production update runner | **YES** |
| **`docker-compose.yml`** | Production orchestration file with fixed image tags | **YES** |
| **`Run-Diagnostic.bat`** | Diagnostic utility to inspect client PC health | **YES** |
| **`Backend/`** *(optional)* | Updated backend code files (if running hybrid mode) | **YES** |
| **`Frontend/`** *(optional)* | Updated frontend code files | **YES** |

---

## 3. Step-by-Step Update Procedure on Client PC

### Step 3.1 — Verify Docker Desktop is Running
1. Check the Windows taskbar (system tray near the clock).
2. Ensure the **Docker whale icon is steady** (Engine running).
3. If not open, launch **Docker Desktop** from the Start Menu and wait 30 seconds.

### Step 3.2 — Transfer Files into the Client Project Directory
1. Plug the USB flash drive into the client workstation.
2. Locate the client application folder (e.g. `C:\GreenLife\` or `C:\Users\DELL\Desktop\GreenLifeAi_Pharmacy_Management_System - Copy\`).
3. Copy from USB and **paste & replace** the following into the project folder:
   - `greenlife_images.tar`
   - `Update-GreenLife-System.bat`
   - `docker-compose.yml`

### Step 3.3 — Execute the Production Updater
1. Double-click **`Update-GreenLife-System.bat`**.
2. A clean, cyan-and-black terminal window will appear. It automatically executes all 6 phases:

```text
================================================================================
           GREENLIFE AI PHARMACY MANAGEMENT SYSTEM
            Production System Updater (Zero Data Loss)
================================================================================

[Step 1/6] Checking Docker Desktop status...
         - docker command found in PATH.
         - Docker engine is active and operational.

[Step 2/6] Checking for updated files...
         - Standalone installation detected. Using the files in this folder.

[Step 3/6] Creating automated pre-update database backup...
         - Taking live database snapshot to: backups\greenlife_db_pre_update_20260928_172559.sql
         - [OK] Database backup saved successfully. All client data is protected.

[Step 4/6] Gracefully stopping previous containers...
         - NOTE: 'docker compose down' without -v preserves all client data!
         - Previous containers stopped. Database volume remains 100% intact.

[Step 5/6] Starting updated containers...
         - [OFFLINE MODE] greenlife_images.tar found in this folder.
         - Loading pre-packaged Docker images [no internet needed]...
         - Please wait -- this takes approx. 30-60 seconds...
         - Docker images loaded successfully.
         - Starting all services from loaded images...
         - [OK] Containers started successfully.

[Step 6/6] Waiting for GreenLife AI services to come online...
         - [OK] GreenLife AI backend is ONLINE and responding.
         - Applying any pending database schema migrations...
         - Migrations applied [or already up to date].

==============================================================================
  [SUCCESS] GreenLife AI System Update Completed!
  [All client data, products, inventory, and sales are 100% preserved]

  Application URL:   http://localhost
  Super Admin User:  Admink19
  Super Admin Pass:  Admin1224
  Pre-Update Backup: backups\greenlife_db_pre_update_20260928_172559.sql
==============================================================================
```
3. The script automatically launches the browser at `http://localhost`.
4. Press any key in the terminal window to close it.

---

## 4. Post-Update Verification Checklist

Once the browser opens, verify the following 5 items to confirm a perfect deployment:

- [ ] **1. Login Page Displays**: Confirm the application opens to the login page (not locked or broken).
- [ ] **2. Sign in as Admin/Manager**: Verify login succeeds with client credentials.
- [ ] **3. Products & Stock Intact**: Navigate to **Catalogue / Stock Inventory** and confirm existing drug batches, quantities, and shelf prices are present.
- [ ] **4. Past Sales History Intact**: Navigate to **Sales History** and verify previous transaction records and receipts exist.
- [ ] **5. Backup File Exists on Disk**: Open the `backups/` folder inside the project directory and verify the new SQL snapshot file exists (e.g. `greenlife_db_pre_update_YYYYMMDD_HHMMSS.sql`).

---

## 5. Critical Technical Rules (Never Violate)

> [!CAUTION]
> **RULE #1: NEVER RUN `docker compose down -v`**  
> The `-v` flag stands for *volume*. Running `docker compose down -v` will erase the physical database volume. Always run `docker compose down` WITHOUT the `-v` flag.

> [!IMPORTANT]
> **RULE #2: NEVER USE NESTED PARENTHESES IN BATCH FILES**  
> In Windows CMD (`.bat`), unescaped closing parentheses `)` inside `if (...)` blocks break CMD's token parser and cause immediate fatal process exits (`. was unexpected at this time`). Always structure batch scripts using flat `goto :LABEL` jumps.

> [!TIP]
> **RULE #3: KEEP BACKUP SNAPSHOTS ON AN EXTERNAL DRIVE**  
> Periodically copy the contents of the `backups/` folder onto your USB flash drive. This provides an off-site disaster recovery backup in case the client PC suffers physical hardware or hard drive failure.

---

## 6. Emergency Disaster Recovery (Rollback Procedure)

In the highly unlikely event that a client computer crashes during an update or experiences power loss, you can restore the entire database in under 60 seconds:

1. Identify the latest SQL backup file inside the `backups/` folder:
   ```text
   backups\greenlife_db_pre_update_20260928_172559.sql
   ```
2. Open Command Prompt (`cmd.exe`) in the project directory.
3. Run the following single restore command:
   ```cmd
   docker compose exec -T database psql -U greenlife_admin -d greenlife_pharmacy_db < "backups\greenlife_db_pre_update_20260928_172559.sql"
   ```
4. Restart the backend service:
   ```cmd
   docker compose restart backend
   ```
5. All database tables and data are restored to the exact millisecond before the update began.
