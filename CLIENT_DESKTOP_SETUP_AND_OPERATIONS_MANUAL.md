# GreenLife AI — Client Desktop Setup & Operations Manual

**Document Version:** 2.5 (September 2026)  
**System Target:** Windows 10 / 11 Workstations  
**Scope:** Complete operational instructions for deploying the silent desktop launcher, configuring PC boot auto-start, moving/hiding the application folder, using the Super Admin live console, and enforcing strict user login authentication.

---

## 1. Quick Setup on Client PC (3-Step Checklist)

Follow these 3 steps to configure the client computer into an enterprise-ready workstation:

### Step 1: Move Folder from Desktop to `C:\GreenLife` (Recommended)
1. Close any running browser windows.
2. Cut or copy the application folder from the desktop:
   ```text
   From: C:\Users\DELL\Desktop\GreenLifeAi_Pharmacy_Management_System - Copy\
   To:   C:\GreenLife\
   ```
   *(Keeping the folder in `C:\GreenLife\` ensures cashiers and staff cannot accidentally delete, rename, or tamper with files).*
3. *(Optional)* Right-click `C:\GreenLife` $\rightarrow$ Properties $\rightarrow$ Check **Hidden** $\rightarrow$ Click OK.

---

### Step 2: Configure Docker Desktop to Start Silently in the Background on Boot
1. Open **Docker Desktop** on the client PC.
2. Click the **Gear icon (Settings)** in the top title bar.
3. Under **General**, verify the following two checkboxes are checked:
   - [x] **Start Docker Desktop when you sign in**
   - [x] **Open Docker Desktop in the background** (or Start minimized to taskbar tray)
4. Click **Apply & restart**.
5. *Result:* Whenever the PC is turned on in the morning, Docker and all 4 GreenLife containers automatically start in the background before staff sit at the computer.

---

### Step 3: Install the Official Desktop Icon
1. Open the folder:
   ```text
   C:\GreenLife\
   ```
2. Double-click:
   ```text
   Install-Desktop-Icon.bat
   ```
3. A confirmation will appear:
   ```text
   [SUCCESS] "GreenLife AI Pharmacy" desktop shortcut has been created!
   ```
4. The user's Windows Desktop now has a single, clean shortcut: **`GreenLife AI Pharmacy`**.

---

## 2. Daily User Experience (Cashiers, Pharmacists & Staff)

| Action | What the Staff Member Sees |
| :--- | :--- |
| **1. Double-Click Desktop Icon** | Double-clicks **GreenLife AI Pharmacy** on the Desktop. |
| **2. Zero CMD Terminal** | **No black Command Prompt window appears.** Everything runs 100% silently in the background. |
| **3. Branded Splash Screen** | A sleek, modern GreenLife loading card appears on screen with an animated progress bar: <br>• *"Verifying Docker background services..."* <br>• *"Starting containerized database engine..."* <br>• *"Connecting to local dispensary engine..."* <br>• *"Dispensary ready! Launching portal..."* |
| **4. Clean Login Page** | The system automatically opens the web browser (in clean App Mode) strictly landing on the **Login Page**. |
| **5. Individual Staff Sign-In** | Input fields start blank. Every cashier, pharmacist, or manager enters their personal credentials. The system **never auto-logs into the Super Admin account**. |

---

## 3. Super Admin Live CMD & Telemetry Access (4 Methods)

The Super Admin has full, on-demand access to live Command Prompt windows, real-time streaming Docker logs, and database diagnostic shells:

### Method 1: The "Hold Shift" Startup Override
* **When to use:** When turning on or launching the app and you want to see verbose terminal output.
* **How to use:** **Hold down the `Shift` key** on your keyboard while double-clicking the **GreenLife AI Pharmacy** desktop shortcut.
* **Result:** The launcher detects the Shift key, suppresses the splash screen, and immediately opens the interactive **Admin Operations Console** in a live CMD window.

---

### Method 2: Secret Login Page Easter Egg
* **When to use:** When the app is already open at the Login screen and you want to check Docker container health.
* **How to use:**
  1. On the Login Screen header, click the **"Enterprise v2.4"** badge (or **"G+"** logo) **3 times consecutively**.
  2. *(Alternatively, press the keyboard shortcut: **`Ctrl + Shift + F12`**)*.
  3. A secure prompt appears: **`Enter Super Admin Password:`**
  4. Type: `Admin1224` and press Enter.
* **Result:** Opens the **Super Admin Live Telemetry Panel** showing:
  - Live container statuses & port mappings (`:80`, `:8000`, `:5434`, `:6380`).
  - One-click copy commands for live logs and terminal utilities.

---

### Method 3: In-App Super Admin Control Suite
* **When to use:** While signed in as Super Admin (`Admink19`).
* **How to use:**
  1. Navigate to: **System Settings & Super Admin Control Suite**.
  2. Open the **Desktop Launcher / Telemetry** tab.
* **Result:** View active container telemetry, copy console launch commands, or trigger database snapshots directly from the UI.

---

### Method 4: Standalone Admin Console (`Admin-Console.bat`)
* **When to use:** Maintenance, offline diagnostics, or manual SQL backups.
* **Location:** `C:\GreenLife\Admin-Console.bat`
* **Interactive Menu Options:**
  ```text
  ================================================================================
             GREENLIFE AI PHARMACY MANAGEMENT SYSTEM
                  Super Admin Operations Console
  ================================================================================
   [1] View Container Status          (docker compose ps)
   [2] Stream Unified Live Logs       (docker compose logs -f --tail=100)
   [3] Stream Backend API Logs Only   (docker compose logs -f backend)
   [4] Stream Database Logs Only      (docker compose logs -f database)
   [5] Open Interactive DB Shell      (psql -U greenlife_admin)
   [6] Take Instant Database Backup   (pg_dump to backups\)
   [7] Restart Containers             (docker compose restart)
   [8] Open GreenLife AI in Browser   (http://localhost)
   [9] Exit Console
  ================================================================================
  ```

---

## 4. File Reference Guide

| File | Location | Purpose |
| :--- | :--- | :--- |
| **`Launch-GreenLife.vbs`** | `C:\GreenLife\` | Silent VBScript wrapper that hides the CMD window completely. |
| **`Launch-GreenLife.bat`** | `C:\GreenLife\` | Checks Docker status, detects Shift key, and launches the splash screen. |
| **`assets/splash.html`** | `C:\GreenLife\assets\` | Animated loading screen with progress bar and backend healthcheck polling. |
| **`Install-Desktop-Icon.bat`** | `C:\GreenLife\` | 1-click script that creates the desktop shortcut for the user. |
| **`Admin-Console.bat`** | `C:\GreenLife\` | Standalone interactive operations console for Super Admin. |
| **`Update-GreenLife-System.bat`** | `C:\GreenLife\` | Zero-data-loss production update runner. |
| **`docker-compose.yml`** | `C:\GreenLife\` | Production Docker container configuration with fixed image tags. |
| **`backups/`** | `C:\GreenLife\backups\` | Directory where automated pre-update and manual SQL dumps are saved. |
