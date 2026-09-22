# GreenLife AI — Client Deployment & Update Playbook

A comprehensive, field-tested operations manual documenting the exact deployment, offline packaging, and update procedures for on-premise pharmacy client machines.

---

## 🏆 Deployment Milestone Summary

As of September 2026, the GreenLife AI Pharmacy Management System has been successfully containerized, verified, and deployed on the client local machine.

* **Application Frontend**: React 19 + TypeScript + Vite served via high-performance Nginx on Port `80`.
* **Application Backend**: Python 3.11 + Django REST Framework served via production Gunicorn WSGI on Port `8000`.
* **Authoritative Database**: PostgreSQL 16 Alpine mapped to host port `5434` (internal Docker port `5432`).
* **Cache & Task Queue**: Redis 7 Alpine mapped to host port `6380` (internal Docker port `6379`).
* **Super Admin Credentials**: Username **`Admink19`** / Password **`Admin1224`**.

---

## 🛡️ Problem Post-Mortem & Proven Solutions

During the initial client deployment, four real-world production hurdles were encountered and resolved. This playbook documents the root causes and their permanent solutions.

### 1. The 502 Bad Gateway Error
* **Symptom**: Client browser opened `http://localhost/` but showed `Failed to load resource: the server responded with a status of 502 (Bad Gateway)` on all `/api/v1/` routes.
* **Root Cause**: The Nginx reverse proxy was online, but the Django backend container was failing to start due to database table conflicts and port collisions.
* **Solution**: Remapped database ports, removed conflicting SQL volume mounts, and introduced a healthcheck polling loop.

### 2. Port 5432 Host Collision
* **Symptom**: `Error: Bind for 0.0.0.0:5432 failed: port is already allocated`.
* **Root Cause**: The client machine already had a legacy PostgreSQL service or another container (`borlalink-postgres`) occupying port `5432`.
* **Solution**: Remapped the external host ports in `docker-compose.yml` to `5434:5432` for PostgreSQL and `6380:6379` for Redis. Inside the private Docker bridge network (`greenlife_net`), Django still communicates directly with `database:5432` and `redis:6379`.

### 3. Database Table Collision (`categories` already exists)
* **Symptom**: Django migrations crashed on startup with `psycopg2.errors.DuplicateTable: relation "categories" already exists`.
* **Root Cause**: `docker-compose.yml` mounted `./Backend/database` to `/docker-entrypoint-initdb.d:ro`. PostgreSQL ran raw SQL scripts on initialization, creating tables without recording them in `django_migrations`. When Django ran `python manage.py migrate`, it attempted to re-create the existing tables and crashed.
* **Solution**: Removed the raw SQL mount from `docker-compose.yml`. Django now manages the schema cleanly through its authoritative migration pipeline and seeds initial data using `Backend/seed_all.py`.

### 4. Docker Hub DNS Failure (`no such host`)
* **Symptom**: `Head "https://registry-1.docker.io/v2/...": dial tcp: lookup registry-1.docker.io: no such host`.
* **Root Cause**: The client machine was offline or had no access to Docker Hub. Attempting `docker compose up --build` failed because Docker could not download `python:3.11-slim` or `node:20-alpine`.
* **Solution**: Created the **Offline Tarball Pipeline** (`docker save` / `docker load`), allowing full system installation without requiring internet access on the client machine.

### 5. Windows Batch Syntax Crash (`. was unexpected at this time`)
* **Symptom**: Double-clicking `Update-GreenLife-System.bat` caused the window to close immediately at `[Step 1/5]`.
* **Root Cause**: Windows `cmd.exe` misinterprets nested parentheses `(...)` inside `if` blocks.
* **Solution**: Refactored all batch scripts to use flat execution with `goto` labels and safe `ping` delays, eliminating all `cmd.exe` parser crashes.

---

## 📦 The 100% Offline Deployment Strategy (Recommended)

This strategy allows you to deploy or update any client computer using a **USB flash drive** without relying on client Wi-Fi or internet.

```
 +--------------------------+                 +--------------------------+
 |   DEVELOPMENT MACHINE    |                 |      CLIENT MACHINE      |
 |                          |                 |                          |
 |  [Export-Docker-Images]  |  Flash Drive    |  [Import-Docker-Images]  |
 |            │             | ──────────────> |            │             |
 |            v             |  greenlife_     |            v             |
 |   greenlife_images.tar   |  images.tar     |    docker load (Offline) |
 |         (335 MB)         |  (335 MB)       |            │             |
 |                          |                 |            v             |
 +--------------------------+                 |  Running GreenLife Stack |
                                              |     http://localhost     |
                                              +--------------------------+
```

---

## 🚀 Step-by-Step Playbook for Future Client Updates

Follow this exact 3-phase workflow whenever you need to ship updates to a client machine:

### Phase 1: On Your Development Machine

1. **Make your code modifications** in `Frontend/` or `Backend/`.
2. **Verify and test locally**:
   ```bash
   cd Frontend
   npm run build
   cd ..
   docker compose up -d --build
   ```
3. **Export the updated offline image bundle**:
   Double-click:
   👉 **`Export-Docker-Images.bat`**
   *(Or run in terminal)*:
   ```bash
   docker save -o greenlife_images.tar greenlifeai_pharmacy_management_system-backend:latest greenlifeai_pharmacy_management_system-frontend:latest postgres:16-alpine redis:7-alpine
   ```
   *Result*: Generates a single **`greenlife_images.tar`** file (~335 MB) in the project root.

---

### Phase 2: Prepare the USB Flash Drive

Copy the following files onto your USB flash drive:
1. **`greenlife_images.tar`** *(The 335MB offline image bundle)*
2. **`Import-Docker-Images.bat`** *(1-click installer for client)*
3. **`docker-compose.yml`**
4. **`Start-GreenLife-Docker.bat`**
5. **`Stop-GreenLife-Docker.bat`**
6. **`Update-GreenLife-System.bat`**
7. The **`Backend/`** and **`Frontend/`** folders *(ensure `Frontend/node_modules/` is excluded to save space)*.

---

### Phase 3: On the Client Machine

1. Plug in the USB flash drive.
2. Copy the files into the client's project folder (e.g. `C:\Users\DELL\Desktop\GreenLifeAi_Pharmacy_Management_System`). Replace existing files if prompted.
3. Ensure **Docker Desktop** is running (green whale icon in the Windows taskbar).
4. Double-click:
   👉 **`Import-Docker-Images.bat`**

#### What `Import-Docker-Images.bat` executes automatically:
- **Step 1/4**: Confirms Docker engine is operational.
- **Step 2/4**: Loads the pre-compiled images into the client's local Docker registry via `docker load -i greenlife_images.tar` (Zero internet required!).
- **Step 3/4**: Resets previous volume conflicts (`docker compose down -v`) and starts the stack (`docker compose up -d`).
- **Step 4/4**: Polls `http://localhost/api/v1/health/` until Django has applied all migrations and seeded initial data.
- **Completion**: Automatically launches Google Chrome or Edge to `http://localhost`.

---

## 🔑 Default Credentials & Access

| Role | Username | Password | Default Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | **`Admink19`** | **`Admin1224`** | Complete governance, audit logs, backup downloads, settings |
| **Branch Manager** | `manager_victoria` | `Manager@1234` | Sales KPIs, staff shifts, discount approvals, stock management |
| **Pharmacist** | `pharm_amaka` | `Pharm@1234` | Clinical prescription queue, dispensing, drug interactions |
| **Cashier** | `cashier_emmanuel` | `Cashier@1234` | POS terminal, receipt printing, shift drawer balancing |
| **Stock Officer** | `stock_tunde` | `Stock@1234` | Batch management, goods receipt notes (GRN), inventory tracking |
| **Accountant** | `accountant_kofi` | `Acct@1234` | Invoices, loans, profit & loss reports, balance sheets |

---

## 🌐 Connecting Other Pharmacy Terminals (LAN Access)

To allow cashier counters or dispensing tablets on the same Wi-Fi router to access the system:

1. **Find Server IP**:
   In PowerShell on the main PC:
   ```powershell
   ipconfig
   ```
   Locate the **IPv4 Address** (e.g., `192.168.1.50`).

2. **Open Port 80 in Windows Firewall** (Run once as Administrator on Server PC):
   ```powershell
   New-NetFirewallRule -DisplayName "GreenLife AI Port 80" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
   ```

3. **Access from Counter Terminals**:
   On any other computer or tablet connected to the pharmacy Wi-Fi, open the browser and navigate to:
   ```text
   http://192.168.1.50
   ```

---

## ☀️ Daily Operations Routine for Pharmacy Staff

### Morning Opening Routine:
1. Turn on the PC and start **Docker Desktop** (can be configured to start automatically with Windows).
2. Double-click **`Start-GreenLife-Docker.bat`** (or desktop shortcut).
3. The browser will open to `http://localhost`. Staff can log in with their assigned role accounts.

### Evening Closing Routine:
1. Double-click **`Stop-GreenLife-Docker.bat`**.
2. Containers stop gracefully. All transaction records and stock balances remain safe in the persistent PostgreSQL volume.

### Weekly Backup Routine:
1. Log in as `Admink19`.
2. Navigate to **System Settings > Backup & Data Management**.
3. Click **"Download Full System Backup"** and copy the downloaded JSON file to a secondary USB flash drive.

---
*© 2026 GreenLife AI — Enterprise Pharmacy Management System. All rights reserved.*
