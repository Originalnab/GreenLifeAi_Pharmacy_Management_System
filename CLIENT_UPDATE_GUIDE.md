# GreenLife AI — Client Machine Automated Update Guide

This guide describes how to apply system updates, resolve previous 502/port-binding issues, and restart the GreenLife AI Pharmacy Management System on the client's local computer using the automated update utility.

---

## ⚡ Quick 1-Click Update (Automated)

An automated updater has been provided in the project root: **`Update-GreenLife-System.bat`**.

### Instructions for the Client Machine:
1. **Transfer the updated files** to the client machine (via Git pull or by copying/unzipping the updated project folder).
2. Ensure **Docker Desktop** is open and running (the whale icon in the taskbar is steady green).
3. In the project folder, double-click **`Update-GreenLife-System.bat`**.
4. The script will perform the entire upgrade procedure automatically, report success, and open the updated login screen in the browser.

---

## ⚙️ What the Automated Script Does (Step-by-Step)

The update utility automatically runs through five sequential phases:

```
[Step 1/5] Verifies Docker Engine is running.
      │
[Step 2/5] Detects Git repository and pulls latest remote commits (or preserves copied files).
      │
[Step 3/5] Gracefully shuts down old containers and clears conflicting volumes (docker compose down -v).
      │
[Step 4/5] Rebuilds and launches updated containers (PostgreSQL 16, Redis 7, Backend, Frontend Nginx).
      │
[Step 5/5] Polls the Backend API healthcheck until online, then launches http://localhost.
```

---

## 🛠️ Summary of Fixes Included in this Update

| Component | Previous State (Caused 502) | Updated State (Fixed) |
| :--- | :--- | :--- |
| **PostgreSQL Host Port** | Bound to `5432:5432` (collided with existing postgres instances on host) | Remapped to `5434:5432` *(internal Docker communication remains standard)* |
| **Redis Host Port** | Bound to `6379:6379` | Remapped to `6380:6379` |
| **Database Initializer** | Raw SQL volume mount created duplicate tables (`categories`) crashing Django | Removed conflicting mount; Django migrations apply cleanly with `seed_all.py` |
| **Startup Timing** | Fixed 5-second sleep before opening browser | Intelligent polling loop that waits until backend responds `200 OK` |
| **Build Optimization** | Copied `node_modules` into Docker context | Added `.dockerignore` for fast, lightweight rebuilds |
| **Default Credentials** | `superadmin` / `Admin@1234` | Updated to **`Admink19`** / **`Admin1224`** |

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
   In PowerShell or browser:
   ```text
   http://localhost/api/v1/health/
   ```
   Response should be:
   ```json
   {
     "status": "ONLINE",
     "service": "GreenLife AI Pharmacy Management System Backend API",
     "version": "1.0.0-rc",
     "database": "PostgreSQL 16 (Authoritative)"
   }
   ```

3. **Sign In to the System**:
   Navigate to `http://localhost` and enter:
   - **Username**: `Admink19`
   - **Password**: `Admin1224`

---

## 🛟 Troubleshooting & FAQs

### Q1: The script says `[ERROR] Docker is not running!`
- **Solution**: Open Docker Desktop from the Windows Start menu. Wait 30 seconds for the Docker daemon to initialize, then run `Update-GreenLife-System.bat` again.

### Q2: Port 80 is occupied by another local service (e.g., IIS / Skype / Apache).
- **Solution**: Open `docker-compose.yml`, find the `frontend` service, and change:
  ```yaml
  ports:
    - "8080:80"
  ```
  Then re-run `Update-GreenLife-System.bat`. Access the application at `http://localhost:8080`.

### Q3: How do other computers on the pharmacy Wi-Fi access the system?
- **Solution**:
  1. On the host PC, run `ipconfig` to get its local IPv4 address (e.g. `192.168.1.50`).
  2. On cashier or pharmacist terminals on the same network, open Chrome/Edge and go to:
     ```text
     http://192.168.1.50
     ```

---
*© 2026 GreenLife AI — Enterprise Pharmacy Management System.*
