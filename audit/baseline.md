# PHASE 1 — AUDIT BASELINE REPORT
**Project:** Binance SOL/USDT Day Trader & Paper Trading App  
**Package ID:** `com.binancetrader.papertrading`  
**Audit Phase:** Phase 1 — Discover and Preserve  
**Date:** October 14, 2026  
**Auditor Mode:** Read-Only Audit Mode (Zero Source Modification)

---

## 1. Environment & Tooling Baseline

The audit was conducted on the host execution environment with the following recorded tool versions:

| Tool / Runtime | Version | Notes / Location |
| :--- | :--- | :--- |
| **Operating System** | Windows 10/11 (Windows_NT x64) | Host workstation |
| **Node.js** | `v25.9.0` | Node LTS / Current |
| **NPM** | `11.12.1` | Package manager |
| **Git** | `2.54.0.windows.1` | Source code management |
| **Python** | `3.14.4` | Used for binary inspection & cryptographic verification |
| **Capacitor CLI** | `8.5.3` | `@capacitor/cli` |
| **OpenJDK** | `17.0.20.1` (Temurin 64-Bit) | Eclipse Adoptium JDK 17 |
| **Android SDK Tools** | Build-Tools `35.0.0` | `aapt2.exe`, `apksigner.bat`, `zipalign.exe` |
| **Android Target SDK** | API Level 36 (`compileSdk 36`, `targetSdk 36`, `minSdk 24`) | Android 15/16 preview target |

---

## 2. Git State & Working-Tree Preservation

- **Initial Git Commit:** `159af74bc9534f6c8b3e90ca66d83a4be696d642`
  - *Author:* Sarannisar (`sarannisar17@gmail.com`)
  - *Message:* `feat: extract logo, convert to dark theme, and set as app icon across Android and Web`
- **Initial Working-Tree Status:** Clean (`nothing to commit, working tree clean`).
- **Audit Isolation Strategy:** In accordance with non-negotiable rules, a dedicated audit branch was created:
  - **Branch Name:** `audit/phase-1-discovery`
  - **Branch Origin:** `main` at commit `159af74`
  - **Status:** Isolated workspace. Original `main` branch remains untouched.

---

## 3. APK Preservation & Cryptographic Inventory

The project contains a pre-built APK artifact in the repository root and build output directories:

| Location | Size (Bytes) | SHA-256 Hash | Integrity Match |
| :--- | :--- | :--- | :--- |
| `.\BinanceDayTrader.apk` (Root) | 16,414,078 | `BE7607C02567756BFCEFA233BFA36601607E4DC63FC44E7828C6B29A16F52311` | **Baseline Master** |
| `.\android\app\build\outputs\apk\debug\app-debug.apk` | 16,414,078 | `BE7607C02567756BFCEFA233BFA36601607E4DC63FC44E7828C6B29A16F52311` | Identical |
| `.\dist\BinanceDayTrader.apk` | 16,414,078 | `BE7607C02567756BFCEFA233BFA36601607E4DC63FC44E7828C6B29A16F52311` | Identical (copied) |
| `.\public\BinanceDayTrader.apk` | 16,414,078 | `BE7607C02567756BFCEFA233BFA36601607E4DC63FC44E7828C6B29A16F52311` | Identical (copied) |
| `[Inside APK] assets/public/BinanceDayTrader.apk` | 12,350,687 | `A317801BCA0DD580150E1A171B4E9CEF2AC503F3D74FEC1217430B20F47DF745` | **Anomaly: Earlier APK build bundled inside current APK** |

> [!WARNING]
> **Packaging Anomaly ("Russian Doll" Effect):**
> Because `BinanceDayTrader.apk` was placed inside `public/`, the Vite build pipeline copied the entire previous 12.35 MB APK into `dist/`, which was then packaged into `android/app/src/main/assets/public/` during `cap sync`. As a result, the compiled APK contains an entire nested APK inside its web assets, bloating the package size from ~4.1 MB to 16.4 MB.

---

## 4. Technology Stack Identification

### A. Web Application Layer
- **Framework:** React 19.3.0 (`react`, `react-dom`)
- **Language:** TypeScript 6.0.3 (`tsconfig.app.json`, `tsconfig.json`)
- **Build Tool:** Vite 8.3.4 with `@vitejs/plugin-react`
- **Styling:** Tailwind CSS v4.3.3 (`@tailwindcss/vite`)
- **Charting Engine:** TradingView `lightweight-charts` v5.2.1
- **Icons:** `lucide-react` v1.56.0
- **Linter:** `oxlint` v1.88.0

### B. Android Native Wrapper Layer
- **Wrapper Framework:** Capacitor 8.5.3 (`@capacitor/core`, `@capacitor/android`, `@capacitor/cli`)
- **Entry Activity:** `com.binancetrader.papertrading.MainActivity` (extends `com.getcapacitor.BridgeActivity`)
- **Webview Engine:** Android System WebView via Chromium
- **Native Plugins:** None (`capacitor.plugins.json` is empty `[]`)
- **Cordova Plugins:** None

### C. Storage & Persistence
- **Implementation:** Browser / WebView `localStorage`
- **Data Encrypted:** **No** (Plaintext JSON serialization)
- **Local Storage Keys:**
  - `paper_trade_usdt_balance`
  - `paper_trade_holdings`
  - `paper_trade_initial_balance`
  - `paper_trade_open_orders`
  - `paper_trade_completed_trades`
  - `paper_trade_positions`
  - `paper_trade_risk_settings`
- **Physical Device Path:** `/data/data/com.binancetrader.papertrading/app_webview/Default/Local Storage/leveldb/`

### D. Network Architecture
- **Public REST Feeds:**
  - `https://api.binance.com/api/v3/klines`
  - `https://data-api.binance.vision/api/v3/klines`
  - `https://api1.binance.com/api/v3/klines`
- **Public WebSocket Feed:**
  - `wss://stream.binance.com:9443/ws/<symbol>@kline_<interval>`
  - `wss://stream.binance.com:9443/ws/<symbol>@ticker`
- **User Authentication / Backend API:** None (Zero API keys required; pure paper trading)
- **Telemetry / Ads / Crash SDKs:** None detected

---

## 5. Preliminary Security & Release Observations

1. **Build Variant:** The APK is a **DEBUG** build (`android:debuggable="true"` confirmed via AAPT2 badging).
2. **Signing Key:** The APK is signed with the default **Android Debug Certificate** (`CN=Android Debug`, SHA-256: `99D6700CC8746BD98EE357DD205760547E728C65D7F331C1F293345B4AE363DD`). It cannot be published or distributed securely in this state.
3. **Backup Exposure:** `android:allowBackup="true"` is set in `AndroidManifest.xml`. On non-rooted devices, `adb backup` can dump the application data sandbox including trading records.
4. **Cleartext & Mixed Content:** In `capacitor.config.json`, `"cleartext": true` and `"allowMixedContent": true` are enabled, and `android:usesCleartextTraffic="true"` is merged into the manifest.
5. **Missing Content Security Policy (CSP):** `index.html` has no `<meta http-equiv="Content-Security-Policy">` tag defined.
6. **No Third-Party Spyware / Backdoor:** Static disassembly of the DEX files shows only standard AndroidX, Kotlin standard library, and Capacitor bridge classes. No third-party ad networks, tracking SDKs, or remote shell execution mechanisms were found.
