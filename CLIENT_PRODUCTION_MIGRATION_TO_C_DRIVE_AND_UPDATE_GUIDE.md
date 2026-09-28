# Client Production Migration to C:\GreenLife & Complete Update Guide

**Document Version:** 2.5 (September 2026)  
**System Target:** Client Production Workstation (Windows 10 / 11)  
**Objective:** Relocate the production application from the Desktop to `C:\GreenLife`, apply all Docker updates offline, install the silent desktop launcher with the animated splash screen, configure Windows boot auto-start, and enforce strict login authentication **with 100% zero data loss**.

---

## 1. Zero Data Loss Guarantee (Why Moving to C:\ is 100% Safe)

```
+-----------------------------------------------------------------------------------+
|                              CLIENT PC STORAGE ARCHITECTURE                       |
|                                                                                   |
|  C:\GreenLife\                                                                    |
|  +-----------------------------------------------------------------------------+  |
|  |  • docker-compose.yml   • Launch-GreenLife.vbs  • Admin-Console.bat         |  |
|  |  • greenlife_images.tar • Launch-GreenLife.bat  • Install-Desktop-Icon.bat   |  |
|  |  • assets\splash.html   • backups\ (SQL dumps)  • Update-GreenLife-System.bat|  |
|  +-----------------------------------------------------------------------------+  |
|         |                                                                         |
|         | References Global Docker Volume:                                        |
|         v                                                                         |
|  ===============================================================================  |
|  GLOBAL DOCKER STORAGE (Physical Disk):                                           |
|  Volume Name: greenlifeai_postgres_volume                                         |
|  Location:    \\wsl$\docker-desktop-data\data\docker\volumes\                      |
|                                                                                   |
|  * The database volume is INDEPENDENT of where the project folder is stored.      |
|  * Moving the folder from Desktop to C:\GreenLife does NOT touch this volume.     |
|  * All existing sales, drug stock, batches, and logins remain 100% intact.        |
+-----------------------------------------------------------------------------------+
```

---

## 2. Phase 1: On Your Developer PC (Prepare the USB Drive)

Plug your USB flash drive into your computer and copy the following files from:  
`c:\Users\Grandeville\Desktop\GreenLifeAi_Pharmacy_Management_System\`

Copy these files onto the root of the USB drive:

| File / Folder | Description |
| :--- | :--- |
| **`greenlife_images.tar`** | 351 MB archive containing the updated frontend & backend containers |
| **`Update-GreenLife-System.bat`** | Syntax-safe zero-data-loss production system updater |
| **`docker-compose.yml`** | Production Docker configuration with hardcoded image tags |
| **`Launch-GreenLife.vbs`** | Invisible launcher wrapper (zero CMD prompt) |
| **`Launch-GreenLife.bat`** | Launcher with Shift-key detection and splash screen trigger |
| **`Install-Desktop-Icon.bat`** | 1-click desktop shortcut installer |
| **`Admin-Console.bat`** | Interactive Super Admin operations console |
| **`assets\`** | Folder containing `splash.html` (animated loading screen) |

---

## 3. Phase 2: On the Client PC (Step-by-Step Execution)

### Step 1: Move the Folder from Desktop to `C:\`
1. Close any open GreenLife browser windows on the client PC.
2. Locate the project folder on the Desktop:
   ```text
   C:\Users\DELL\Desktop\GreenLifeAi_Pharmacy_Management_System\GreenLifeAi_Pharmacy_Management_System - Copy
   ```
3. **Right-click the folder $\rightarrow$ Cut** (or press `Ctrl + X`).
4. Open **File Explorer** and go to **This PC $\rightarrow$ Local Disk (C:)**.
5. **Paste** the folder directly into `C:\`.
6. **Rename the folder** to simply:
   ```text
   GreenLife
   ```
   *(Your clean production path is now permanently: **`C:\GreenLife\`**)*.

---

### Step 2: Copy Updated Files from USB into `C:\GreenLife`
1. Plug your USB drive into the client PC.
2. Select all the files you copied onto the USB in Phase 1.
3. Paste them into:
   ```text
   C:\GreenLife\
   ```
4. When prompted by Windows, choose **"Replace the files in the destination"**.

---

### Step 3: Run the Production System Updater
1. Inside `C:\GreenLife\`, double-click:
   ```text
   Update-GreenLife-System.bat
   ```
2. The updater will automatically perform all 6 safety checks:
   - **Step 1:** Verifies Docker Desktop is running.
   - **Step 2:** Detects standalone installation in `C:\GreenLife\`.
   - **Step 3:** Takes an automated pre-update snapshot of the client database into `C:\GreenLife\backups\`.
   - **Step 4:** Gracefully stops old containers without deleting the database volume.
   - **Step 5:** Loads new Docker images from `greenlife_images.tar` and starts all 4 containers.
   - **Step 6:** Verifies backend health and applies migrations.
3. When the green success banner appears (`[SUCCESS] GreenLife AI System Update Completed!`), press any key to close the window.

---

### Step 4: Create the Clean Desktop Shortcut
1. Still inside `C:\GreenLife\`, double-click:
   ```text
   Install-Desktop-Icon.bat
   ```
2. A window will confirm:
   ```text
   [SUCCESS] "GreenLife AI Pharmacy" desktop shortcut has been created!
   ```
3. Press any key to close the window.
4. *Look at the Windows Desktop:* There is now a single, official shortcut: **`GreenLife AI Pharmacy`** pointing directly to `C:\GreenLife\Launch-GreenLife.vbs`.

---

### Step 5: (Optional & Recommended) Hide the `C:\GreenLife` Folder
To prevent staff from browsing, modifying, or accidentally deleting system files:
1. Open **File Explorer** and navigate to **Local Disk (C:)**.
2. Right-click the **`GreenLife`** folder and select **Properties**.
3. Under the **General** tab (Attributes at the bottom), check the box for **Hidden**.
4. Click **Apply**.
5. When prompted, select **"Apply changes to this folder only"** and click **OK**.
6. Click **OK** to close the Properties dialog.

---

### Step 6: Configure Docker Desktop to Auto-Start Silently on PC Boot
1. Open **Docker Desktop** from the Windows Start Menu.
2. Click the **Gear icon (Settings)** at the top right of the Docker window.
3. Under the **General** settings tab, ensure the following are checked:
   - [x] **Start Docker Desktop when you sign in**
   - [x] **Open Docker Desktop in the background** *(or Start minimized to system tray)*
4. Click **Apply & restart**.
5. *Result:* Every morning when staff turn on the computer and log in, Docker Desktop and all GreenLife containers automatically start in the background before anyone opens the app.

---

## 4. Phase 3: Post-Deployment Verification

Verify the system by testing these 3 flows on the client PC:

### Test 1: Standard Staff Daily Launch
1. Double-click the **`GreenLife AI Pharmacy`** desktop icon.
2. **Verify:** **Zero black CMD prompt appears.**
3. **Verify:** The branded **GreenLife Splash Screen** appears with the animated loading bar.
4. **Verify:** The browser opens automatically and lands directly on the **Login Page**.
5. **Verify:** Form inputs are blank and **it does NOT auto-login to Super Admin**. Each staff member enters their own credentials.

---

### Test 2: Super Admin Live Terminal Access (Shift Key Override)
1. Close the browser.
2. **Hold down the `Shift` key** on your keyboard while double-clicking the **`GreenLife AI Pharmacy`** desktop icon.
3. **Verify:** The splash screen is bypassed and the live **Super Admin Operations Console** (`Admin-Console.bat`) opens immediately in a Command Prompt window.

---

### Test 3: Super Admin Live Telemetry (Login Screen Easter Egg)
1. Open the app to the Login Page.
2. Click the **"Enterprise v2.4"** badge or **"G+"** logo **3 times consecutively** *(or press **`Ctrl + Shift + F12`**)*.
3. In the password prompt, enter: `Admin1224`.
4. **Verify:** The Super Admin live telemetry modal appears showing all active container ports (`:80`, `:8000`, `:5434`, `:6380`) and quick terminal launch commands.

---

## 5. Summary of Client Workstation State

| Item | Previous State | New Production State |
| :--- | :--- | :--- |
| **Folder Location** | Cluttered on Desktop (`... - Copy`) | Cleanly relocated to `C:\GreenLife\` (Hidden) |
| **Desktop Appearance** | Folders, batch files, scripts exposed | **Single official icon:** `GreenLife AI Pharmacy` |
| **Startup Behavior** | Manual script execution required | **Auto-starts silently on PC boot** in background |
| **App Launching** | Black CMD prompt with scrolling code | **Zero terminal**, branded loading splash screen |
| **Authentication** | Auto-logged into Super Admin | **Strict Login Page**, individual staff credentials |
| **Super Admin Telemetry**| Difficult to access or required scripts | **4 instant access methods** (Shift launch, hotkeys, in-app) |
| **Client Data Integrity** | N/A | **100% Zero Data Loss Guaranteed** |
