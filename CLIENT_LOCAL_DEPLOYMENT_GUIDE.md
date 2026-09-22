# GreenLife AI — Client Local Machine Deployment Guide

A step-by-step production deployment manual for installing and running the **GreenLife AI Pharmacy Management System** on a client's local workstation or on-premise pharmacy server.

---

## 📋 Table of Contents
1. [System Overview & Architecture](#-system-overview--architecture)
2. [Deployment Strategy Matrix](#-deployment-strategy-matrix)
3. [Strategy A: Docker Desktop (Recommended for Production)](#-strategy-a-docker-desktop-recommended)
   - [Prerequisites](#a1-prerequisites)
   - [Configuration & Container Setup](#a2-configuration--container-setup)
   - [Step-by-Step Launch Instructions](#a3-step-by-step-launch-instructions)
   - [Local Area Network (LAN) Multi-Terminal Access](#a4-local-area-network-lan-multi-terminal-access)
4. [Strategy B: Native Windows Standalone (Zero-Docker / Low-RAM)](#-strategy-b-native-windows-standalone-zero-docker)
   - [Prerequisites](#b1-prerequisites)
   - [Backend & Frontend Setup](#b2-backend--frontend-setup)
   - [One-Click Batch Automation Scripts](#b3-one-click-batch-automation-scripts)
5. [Default User Accounts & Credentials](#-default-user-accounts--credentials)
6. [Data Backup, Restoration & Maintenance](#-data-backup-restoration--maintenance)
7. [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 🏗️ System Overview & Architecture

GreenLife AI is composed of three interconnected layers:
1. **Frontend UI**: React 19 + TypeScript + Vite + TailwindCSS (responsive on desktop, POS terminals, and tablets).
2. **Backend API**: Python 3.11 + Django REST Framework + Gunicorn WSGI.
3. **Data Layer**: PostgreSQL 16 (Authoritative enterprise persistence) with Redis 7 (caching/queues), or zero-config pre-seeded SQLite (`db.sqlite3`) for lightweight standalone deployments.

```
       +-------------------------------------------------------------+
       |                  Pharmacy Local Network                     |
       |                                                             |
       |  [Cashier Terminal 1]    [Pharmacist Counter]    [Manager PC] |
       +--------------+-------------------+-------------------+------+
                      |                   |                   |
                      +-------------------+-------------------+
                                          | HTTP Port 80 (or 5173)
                                          v
       +-------------------------------------------------------------+
       |               HOST / SERVER PHARMACY MACHINE                |
       |                                                             |
       |   +-----------------------------------------------------+   |
       |   | Frontend (Nginx / Web Server)                       |   |
       |   | - Serves React 19 SPA                               |   |
       |   | - Reverse-proxies /api/ and /admin/ to Backend      |   |
       |   +--------------------------+--------------------------+   |
       |                              | Proxy to :8000               |
       |   +--------------------------v--------------------------+   |
       |   | Backend (Django REST Framework / Gunicorn)          |   |
       |   | - Clinical validation, POS logic, Inventory         |   |
       |   +--------------------------+--------------------------+   |
       |                              |                              |
       |         +--------------------+--------------------+         |
       |         |                                         |         |
       |         v                                         v         |
       |   +---------------+                       +---------------+ |
       |   | PostgreSQL 16 |                       |    Redis 7    | |
       |   | (or SQLite)   |                       | (Task Queue)  | |
       |   +---------------+                       +---------------+ |
       +-------------------------------------------------------------+
```

---

## 📊 Deployment Strategy Matrix

Choose the strategy that matches the client’s pharmacy computer specifications:

| Criteria | Strategy A: Docker Desktop | Strategy B: Native Windows Standalone |
| :--- | :--- | :--- |
| **Best For** | Modern dedicated server PC or branch manager workstation | Standard Windows 10/11 office or POS laptop/desktop |
| **Host Requirements** | Windows 10/11 64-bit with WSL2 support | Any standard Windows 10/11 machine |
| **Minimum RAM** | 8 GB – 16 GB | 4 GB – 8 GB |
| **Prerequisites** | Docker Desktop | Python 3.11 + Node.js (or pre-bundled files) |
| **Isolation** | 100% containerized; no host library conflicts | Runs natively on Windows OS |
| **Database** | PostgreSQL 16 + Redis 7 | Pre-populated SQLite (`db.sqlite3`) or local Postgres |
| **Setup Time** | 5 – 10 minutes | 3 – 5 minutes |

---

## 🐳 Strategy A: Docker Desktop (Recommended)

### A.1 Prerequisites
1. **Windows 10 / 11 64-bit** (Home, Pro, or Enterprise).
2. **WSL2** installed (`wsl --install` in PowerShell).
3. **Docker Desktop for Windows** downloaded and running:
   - [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - Ensure "Use the WSL 2 based engine" is enabled in Docker Settings.

---

### A.2 Configuration & Container Setup

#### 1. Frontend Dockerfile (`Frontend/Dockerfile`)
Create `Frontend/Dockerfile` to compile the React app and serve it with Nginx:

```dockerfile
# Stage 1: Build React 19 Frontend
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve via Nginx Alpine
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 2. Frontend Nginx Reverse Proxy Config (`Frontend/nginx.conf`)
Create `Frontend/nginx.conf` so browser requests seamlessly reach the frontend and proxy `/api/` to the backend container:

```nginx
server {
    listen 80;
    server_name localhost;

    # Serve React SPA files
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Django Backend
    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Proxy Django Admin
    location /admin/ {
        proxy_pass http://backend:8000/admin/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 3. Complete `docker-compose.yml`
Ensure your root `docker-compose.yml` includes the frontend service:

```yaml
version: '3.8'

services:
  database:
    image: postgres:16-alpine
    container_name: greenlifeai_postgres
    environment:
      POSTGRES_DB: greenlife_pharmacy_db
      POSTGRES_USER: greenlife_admin
      POSTGRES_PASSWORD: GreenlifeSecret2026!
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./Backend/database:/docker-entrypoint-initdb.d:ro
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U greenlife_admin -d greenlife_pharmacy_db"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - greenlife_net
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: greenlifeai_redis
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - greenlife_net
    restart: unless-stopped

  backend:
    build:
      context: ./Backend
      dockerfile: Dockerfile
    container_name: greenlifeai_backend
    command: >
      sh -c "python manage.py migrate &&
             gunicorn greenlife.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120"
    volumes:
      - ./Backend:/app
    environment:
      - DEBUG=0
      - SECRET_KEY=greenlife-client-prod-secret-key-2026
      - DB_NAME=greenlife_pharmacy_db
      - DB_USER=greenlife_admin
      - DB_PASSWORD=GreenlifeSecret2026!
      - DB_HOST=database
      - DB_PORT=5432
      - REDIS_URL=redis://redis:6379/0
      - ALLOWED_HOSTS=*
      - CORS_ALLOW_ALL_ORIGINS=True
    depends_on:
      database:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - greenlife_net
    restart: unless-stopped

  frontend:
    build:
      context: ./Frontend
      dockerfile: Dockerfile
    container_name: greenlifeai_frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - greenlife_net
    restart: unless-stopped

volumes:
  postgres_data:
    name: greenlifeai_postgres_volume

networks:
  greenlife_net:
    name: greenlifeai_internal_network
```

---

### A.3 Step-by-Step Launch Instructions

1. Open PowerShell or Command Prompt in the project root directory.
2. Build and start all services in detached mode:
   ```bash
   docker compose up -d --build
   ```
3. Check container health status:
   ```bash
   docker compose ps
   ```
4. Open the application:
   - On the host machine: Open browser and navigate to `http://localhost`
   - Log in using the default Super Admin credentials (see Section 5).

---

### A.4 Local Area Network (LAN) Multi-Terminal Access

In a pharmacy with multiple terminals (e.g. 2 Cashier counters, 1 Dispensing table, 1 Manager office):

1. **Find Host IP Address**:
   - In PowerShell on the server PC: `ipconfig`
   - Note the **IPv4 Address** (e.g., `192.168.1.50`).
2. **Allow Windows Firewall Port 80**:
   - In PowerShell (Run as Administrator):
     ```powershell
     New-NetFirewallRule -DisplayName "GreenLife AI Pharmacy System" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
     ```
3. **Connect from Client Counter Terminals**:
   - On any cashier computer or tablet on the same Wi-Fi/LAN, open Chrome or Edge and go to:
     `http://192.168.1.50`

---

## 💻 Strategy B: Native Windows Standalone (Zero-Docker)

Use this method when the client machine is an older PC or has limited RAM (4 GB – 8 GB) where running Docker Desktop is not feasible.

### B.1 Prerequisites
1. **Python 3.11** installed:
   - Ensure **"Add Python to PATH"** checkbox was checked during installation.
2. **Node.js 18+ or 20+** installed.

---

### B.2 Backend & Frontend Setup

#### Step 1: Install Backend Dependencies
Open PowerShell in `Backend/`:
```powershell
cd Backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
pip install waitress
```

#### Step 2: Initialize Database
The repository includes a ready-to-use pre-seeded database (`db.sqlite3`). To verify or run migrations:
```powershell
python manage.py migrate
```

#### Step 3: Build Frontend for Production
Open PowerShell in `Frontend/`:
```powershell
cd Frontend
npm install
npm run build
```
*(The production build will be generated in `Frontend/dist`)*.

---

### B.3 One-Click Batch Automation Scripts

Create these `.bat` scripts in the root project folder so pharmacy staff can double-click to start or stop the system.

#### 1. `Start-GreenLife.bat`
```bat
@echo off
title GreenLife AI Pharmacy Management System
echo ===================================================
echo Starting GreenLife AI Pharmacy System (Native Mode)
echo ===================================================

:: 1. Start Backend in Background
echo Starting Backend API Server on port 8000...
cd /d "%~dp0Backend"
call venv\Scripts\activate
start /b python -m waitress --port=8000 greenlife.wsgi:application

:: 2. Start Frontend Server on Port 80 (or 5173)
echo Starting Frontend Application...
cd /d "%~dp0Frontend"
start /b npx serve -s dist -l 80

:: 3. Open Browser
timeout /t 3 /nobreak >nul
echo Launching Pharmacy Dashboard...
start http://localhost

echo ===================================================
echo GreenLife AI is running! Keep this window open.
echo To stop the system, run Stop-GreenLife.bat.
echo ===================================================
pause
```

#### 2. `Stop-GreenLife.bat`
```bat
@echo off
title Stop GreenLife AI
echo Stopping GreenLife AI processes...
taskkill /F /IM python.exe /T 2>nul
taskkill /F /IM node.exe /T 2>nul
echo GreenLife AI has been stopped successfully.
pause
```

---

## 🔑 Default User Accounts & Credentials

The pre-seeded database contains ready accounts across all major pharmacy operational roles:

| Role | Username | Default Password | Primary Permissions / Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `Admink19` | `Admin1224` | Full system governance, audit logs, database backups, settings |
| **Branch Manager** | `manager_victoria` | `Manager@1234` | Sales KPIs, staff shift oversight, discount/void approvals, restocking |
| **Pharmacist** | `pharm_amaka` | `Pharm@1234` | Clinical queue, drug interactions, prescription dispensing |
| **Cashier** | `cashier_emmanuel` | `Cashier@1234` | POS terminal, barcode scanning, shift cash drawer balancing |
| **Stock Officer** | `stock_tunde` | `Stock@1234` | Batches, shelf locations, goods receipt notes, inventory counts |
| **Accountant** | `accountant_kofi` | `Acct@1234` | Invoices, P&L, balance sheets, accounts receivable/payable |

> [!IMPORTANT]
> Advise the pharmacy administrator to change these default passwords immediately under **Settings > Staff Management** after initial deployment.

---

## 💾 Data Backup, Restoration & Maintenance

### In-App One-Click Backup
1. Log in as `Admink19`.
2. Navigate to **System Settings > Backup & Data Management**.
3. Click **"Download Full System Backup"**.
   - This downloads a timestamped `.json` snapshot containing all product catalogs, stock levels, sales transactions, shift history, and user permissions.
4. Keep copies on a secondary USB drive or secure cloud storage weekly.

### Automated Database Backup (Docker Mode)
To back up the PostgreSQL database directly:
```bash
docker exec -t greenlifeai_postgres pg_dump -U greenlife_admin greenlife_pharmacy_db > greenlife_backup_%date:~-4,4%%date:~-7,2%%date:~-10,2%.sql
```

---

## 🛠️ Troubleshooting & FAQs

### Q1: Port 80 or 5432 is already in use by another application.
- **Cause**: IIS, Skype, or an existing PostgreSQL/XAMPP server may be running on the host.
- **Fix**: In `docker-compose.yml`, change the external port mapping:
  - Frontend: `"8080:80"` (access via `http://localhost:8080`)
  - Database: `"5433:5432"`

### Q2: Other cashier computers cannot open `http://192.168.1.X`.
- **Cause**: Windows Defender Firewall is blocking inbound connections on port 80.
- **Fix**: Run PowerShell as Administrator on the host machine:
  ```powershell
  New-NetFirewallRule -DisplayName "GreenLife Port 80" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
  ```

### Q3: How to reset a forgotten admin password?
- **In Docker**:
  ```bash
  docker exec -it greenlifeai_backend python manage.py changepassword Admink19
  ```
- **In Native Mode**:
  ```powershell
  cd Backend
  .\venv\Scripts\activate
  python manage.py changepassword Admink19
  ```

---
*© 2026 GreenLife AI — Enterprise Pharmacy Management System. All rights reserved.*
