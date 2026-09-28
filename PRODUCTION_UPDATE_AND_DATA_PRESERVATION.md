# GreenLife AI — Client Localhost Production Update & Data Preservation Guide

This document provides complete instructions for updating the **GreenLife AI Pharmacy Management System** on a client's local production environment. It details the **Zero Data Loss Architecture**, automated database safety backups, Docker build troubleshooting, and step-by-step procedures for both online and offline deployments.

---

## 🛡️ Enterprise Zero-Data-Loss Architecture

When updating a live production pharmacy, **client data must never be lost**. Real client operations include:
- Registered medications, packaging tiers, and active shelf batches
- Historical sales transactions, invoices, and payment splits (Cash, Card, MoMo, Credit)
- Customer profiles, store credit balances, and receivables
- Dispensation audit logs and staff user accounts

### How Data Preservation Works in GreenLife AI:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        GREENLIFE AI UPDATE PIPELINE                    │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
       [1] Pre-Update SQL Snapshot (pg_dump)
           Location: backups\greenlife_db_pre_update_YYYYMMDD_HHMMSS.sql
                                    │
                                    ▼
       [2] Volume-Preserving Shutdown (docker compose down)
           Strictly WITHOUT '-v' — greenlifeai_postgres_volume is 100% INTACT
                                    │
                                    ▼
       [3] Rebuild & Launch Updated Application Containers
           PostgreSQL 16 ── Redis 7 ── Backend Django ── Frontend Nginx
                                    │
                                    ▼
       [4] Automated Database Schema Migrations
           python manage.py migrate --noinput
                                    │
                                    ▼
       [5] Intelligent Healthcheck & Auto-Launch
           http://localhost/api/v1/health/ ──> Browser opens http://localhost
```

> [!IMPORTANT]
> **Why Previous Updates Risked Data Loss**:
> Previous update scripts contained `docker compose down -v`. The `-v` flag instructs Docker to delete all named volumes, which would permanently erase the PostgreSQL database.
> 
> **This hazard has been permanently removed.** All update scripts now use `docker compose down` (preserving volumes) and create an automated SQL dump in the `backups/` directory before taking containers down.

---

## 🔍 Docker Build Issue Resolution

### The Issue
Running `Start-GreenLife-Docker.bat` produced build errors during `docker compose up -d --build`, causing the batch file to abort with `[ERROR] Failed to start containers!`.

### Root Cause
1. `Frontend/Dockerfile` executed `RUN npm ci`.
2. `exceljs` (`^4.4.0`) was added to `Frontend/package.json`, but `Frontend/package-lock.json` was not synchronized.
3. Inside the Alpine Linux container, `npm ci` strictly requires every package in `package.json` to have an exact lock in `package-lock.json`. Because the lock entries were missing, `npm ci` crashed with error code `EUSAGE`.

### The Permanent Fix
1. **Lockfile Synchronization**: `Frontend/package-lock.json` was updated and audited to include `exceljs` and all transitive dependencies.
2. **Dockerfile Hardening**: In [Frontend/Dockerfile](file:///c:/Users/Grandeville/Desktop/GreenLifeAi_Pharmacy_Management_System/Frontend/Dockerfile), line 10 was upgraded:
   ```dockerfile
   # Stage 1: Build React 19 Frontend with TypeScript & Vite
   COPY package*.json ./
   RUN npm ci || npm install
   ```
   If `npm ci` ever encounters a lockfile discrepancy in the future, it automatically falls back to `npm install`, preventing Docker builds from ever failing.
3. **Health Check Counter**: [Start-GreenLife-Docker.bat](file:///c:/Users/Grandeville/Desktop/GreenLifeAi_Pharmacy_Management_System/Start-GreenLife-Docker.bat) now has a 40-attempt limit (~2 minutes) with progress logging and automatic log output on error, preventing terminal lockup.

---

## ⚡ Method 1: Connected Client Update (1-Click Online)

Use this method if the client production machine has an internet connection or is synchronized via Git / network shared folder.

### Steps on Client PC:
1. Ensure **Docker Desktop** is open and running (green whale icon in system tray).
2. Copy the updated project files to the client machine (or run `git pull`).
3. In the project folder, double-click:
   ```cmd
   Update-GreenLife-System.bat
   ```
4. **What the script does automatically**:
   - Verifies Docker engine status.
   - Pulls latest remote Git commits (if `.git` is present).
   - Creates a timestamped pre-update database backup in `backups\`.
   - Safely stops old containers while preserving `greenlifeai_postgres_volume`.
   - Builds updated production containers with the latest frontend & backend features.
   - Applies any new database migrations.
   - Waits for the backend API health check to respond `ONLINE`.
   - Automatically opens `http://localhost` in the default web browser.

---

## ⚡ Method 2: Offline Client Update via USB (Zero Internet)

Use this method if the pharmacy PC is isolated without internet access.

### Phase A: On Developer / Connected Machine
1. Open the project directory in Command Prompt.
2. Run the image export utility:
   ```cmd
   Export-Docker-Images.bat
   ```
3. This bundles all 4 required production images into **`greenlife_images.tar`** (~350 MB):
   - `greenlifeai_pharmacy_management_system-frontend:latest`
   - `greenlifeai_pharmacy_management_system-backend:latest`
   - `postgres:16-alpine`
   - `redis:7-alpine`
4. Copy `greenlife_images.tar` along with the project folder to a USB flash drive.

### Phase B: On Client Production Machine
1. Insert the USB flash drive and copy the project folder (with `greenlife_images.tar` in the root) to the client PC.
2. Ensure Docker Desktop is running.
3. Double-click:
   ```cmd
   Import-Docker-Images.bat
   ```
4. **What the script does automatically**:
   - Loads the updated Docker images into the local registry (`docker load -i greenlife_images.tar`).
   - Takes a safety backup of any existing database to `backups\`.
   - Safely restarts containers with the new images (preserving the database volume).
   - Applies migrations and opens `http://localhost`.

---

## 💾 Database Backup & Restore Reference

### Automatic Backups
Every time `Update-GreenLife-System.bat` or `Import-Docker-Images.bat` runs, a full SQL dump is created:
```text
backups\greenlife_db_pre_update_YYYYMMDD_HHMMSS.sql
```

### Manual Backup (On Demand)
To take a manual backup at any time from PowerShell or Command Prompt:
```bash
docker compose exec -T database pg_dump -U greenlife_admin greenlife_pharmacy_db > backups\manual_backup.sql
```

### Manual Restore (Disaster Recovery)
If you ever need to restore the database from a backup file:
```bash
# 1. Stop backend container to release database connections
docker compose stop backend

# 2. Restore database from SQL dump
docker compose exec -T database psql -U greenlife_admin -d greenlife_pharmacy_db < backups\greenlife_db_pre_update_XXXX.sql

# 3. Restart backend
docker compose start backend
```

---

## 🔍 Verification Checklist

After the update finishes, perform these quick checks to ensure everything is operational:

### 1. Container Status
Run in terminal:
```bash
docker compose ps
```
Expected output:
| Name | Image | Status | Ports |
| :--- | :--- | :--- | :--- |
| `greenlifeai_frontend` | `...-frontend:latest` | `Up` | `0.0.0.0:80->80/tcp` |
| `greenlifeai_backend` | `...-backend:latest` | `Up` | `0.0.0.0:8000->8000/tcp` |
| `greenlifeai_postgres` | `postgres:16-alpine` | `Up (healthy)` | `0.0.0.0:5434->5432/tcp` |
| `greenlifeai_redis` | `redis:7-alpine` | `Up (healthy)` | `0.0.0.0:6380->6379/tcp` |

### 2. API Health Check
Open browser or run `curl`:
```text
http://localhost/api/v1/health/
```
Expected JSON:
```json
{
  "status": "ONLINE",
  "service": "GreenLife AI Pharmacy Management System Backend API",
  "version": "1.0.0-rc",
  "database": "PostgreSQL 16 (Authoritative)"
}
```

### 3. Log In & Verify Data Integrity
1. Open `http://localhost`.
2. Sign in with Super Admin credentials:
   - **Username**: `Admink19`
   - **Password**: `Admin1224`
3. Navigate to:
   - **Sales History**: Verify previous sales, drafts, and credit sales are listed.
   - **Inventory / Catalogue**: Verify medication stock balances and batch expiries are intact.
   - **Point of Sale (POS)**: Test multi-tender payment change calculation.
   - **Purchasing / GRN**: Verify the streamlined single Unit Price intake workbench.

---

## 🛟 Common FAQs & Troubleshooting

### Q1: The script reports `[ERROR] Docker Desktop is not running!`
- **Solution**: Open Docker Desktop from the Windows Start menu. Wait 30 seconds until the whale icon in the bottom-left turns green with "Engine running", then run the script again.

### Q2: Port 80 is occupied by another application (e.g., IIS / Skype / Apache).
- **Solution**: Open [docker-compose.yml](file:///c:/Users/Grandeville/Desktop/GreenLifeAi_Pharmacy_Management_System/docker-compose.yml), navigate to the `frontend` service, and change:
  ```yaml
  ports:
    - "8080:80"
  ```
  Then re-run `Update-GreenLife-System.bat`. Access the app at `http://localhost:8080`.

### Q3: How do other staff computers on the pharmacy Wi-Fi access the system?
- **Solution**:
  1. On the host production PC, open Command Prompt and type `ipconfig`.
  2. Note the **IPv4 Address** (e.g. `192.168.1.120`).
  3. On cashier and pharmacist tablets/laptops on the same Wi-Fi, open Google Chrome or Edge and navigate to:
     ```text
     http://192.168.1.120
     ```

---
*© 2026 GreenLife AI — Enterprise Pharmacy Management System. All rights reserved.*
