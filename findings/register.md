# MASTER FINDINGS REGISTER
**Project:** Binance SOL/USDT Day Trader & Paper Trading App  
**Package ID:** `com.binancetrader.papertrading`  
**Audit Standard:** OWASP MASVS v2.0 / MASTG  
**Audit Phase:** Phase 4 — Findings Management  
**Date:** October 14, 2026

---

## 1. Executive Findings Dashboard

| Finding ID | Severity | Category | Verification Status | Title | Release Blocker? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-CRIT-01** | **CRITICAL** | Platform | **CONFIRMED** | Production APK Built with `android:debuggable="true"` | **YES** |
| **SEC-CRIT-02** | **CRITICAL** | Signing | **CONFIRMED** | APK Signed with Insecure Android Debug Keystore | **YES** |
| **SEC-HIGH-01** | **HIGH** | Privacy | **CONFIRMED** | Unencrypted Plaintext Storage of Trading Logs in LocalStorage | **YES (for Dist)** |
| **SEC-HIGH-02** | **HIGH** | Platform | **CONFIRMED** | Insecure Android Application Backup Enabled (`allowBackup=true`) | **YES (for Dist)** |
| **SEC-HIGH-03** | **HIGH** | Network | **CONFIRMED** | Cleartext Traffic Permitted (`usesCleartextTraffic="true"`) | **YES (for Dist)** |
| **SEC-MED-01** | **MEDIUM** | Web Sec | **CONFIRMED** | Missing Content Security Policy (CSP) in Webview Document | Recommended |
| **SEC-MED-02** | **MEDIUM** | WebView | **CONFIRMED** | Insecure Mixed Content Allowed in WebView Configuration | Recommended |
| **SEC-MED-03** | **MEDIUM** | Packaging | **CONFIRMED** | Recursive Nested APK Inside Web Assets Causes 12.35 MB Bloat | Recommended |
| **SEC-MED-04** | **MEDIUM** | UI / WV | **CONFIRMED** | CSV Export Incompatible with WebView (`Blob` & `<a download>`) | Functional Fix |
| **SEC-MED-05** | **MEDIUM** | QA / Math | **CONFIRMED** | Broken Partial Sell Functionality (Liquidates 100% Unconditionally) | Functional Fix |
| **SEC-LOW-01** | **LOW** | QA / Math | **CONFIRMED** | Cross-Asset Order Cancellation State Corruption | Functional Fix |
| **SEC-LOW-02** | **LOW** | QA / Math | **CONFIRMED** | Unvalidated Numerical Inverted Stop Loss Triggers Instant Close | Functional Fix |
| **SEC-LOW-03** | **LOW** | Web Sec | **CONFIRMED** | Potential CSV Formula Injection on Negative PnL and Strings | Hardening |
| **SEC-INFO-01** | **INFO** | Supply | **CONFIRMED** | Moderate Vulnerability in CLI Dev-Dependency (`uuid < 11.1.1`) | Informational |
| **SEC-INFO-02** | **INFO** | Hardening | **CONFIRMED** | ProGuard / R8 Bytecode Obfuscation and Minification Disabled | Informational |

---

## 2. Findings Detail Table

### Finding SEC-CRIT-01: Production APK Built as Debuggable
- **Severity:** CRITICAL (CVSS v3.1: 8.4)
- **Status:** CONFIRMED & REPRODUCED
- **Affected File:** [`android/app/build.gradle`](file:///c:/Users/SERVER-GSM/Desktop/trade/android/app/build.gradle), [`AndroidManifest.xml`](file:///c:/Users/SERVER-GSM/Desktop/trade/android/app/build/intermediates/merged_manifest/debug/processDebugMainManifest/AndroidManifest.xml#L24)
- **Evidence:** `aapt2 dump badging BinanceDayTrader.apk` displays `application-debuggable`.
- **Expected Behavior:** Distributable release APKs must have `android:debuggable="false"` to prevent arbitrary process attachment and memory dumping.
- **Actual Behavior:** The APK was built using `assembleDebug`, leaving debugging flags permanently active.
- **Realistic Impact:** Any user with physical access or a connected workstation can run `adb shell run-as com.binancetrader.papertrading` to bypass Android Linux UID isolation and extract the entire LevelDB database, modify balances, or inspect active trades. Chrome DevTools (`chrome://inspect`) can attach to the WebView and run arbitrary scripts.
- **Remediation:** Build the distribution artifact using Gradle release task (`./gradlew assembleRelease`).
- **Retest Procedure:** Run `aapt2 dump badging <new-apk>` and verify that `application-debuggable` is absent.

---

### Finding SEC-CRIT-02: APK Signed with Insecure Android Debug Keystore
- **Severity:** CRITICAL (CVSS v3.1: 7.5)
- **Status:** CONFIRMED & REPRODUCED
- **Affected File:** [`BinanceDayTrader.apk`](file:///c:/Users/SERVER-GSM/Desktop/trade/BinanceDayTrader.apk)
- **Evidence:** `apksigner verify --print-certs` reports `Signer #1 certificate DN: C=US, O=Android, CN=Android Debug`.
- **Expected Behavior:** Publicly distributable or shared APKs must be signed with a secure, private release key using Scheme v2/v3.
- **Actual Behavior:** The APK is signed with Android's default public debug key (`~/.android/debug.keystore`).
- **Realistic Impact:** The application identity is untrusted. Malicious third parties can easily recompile a modified APK with a backdoor using the identical well-known debug key, or overwrite the app on user devices. Android app stores automatically reject debug-signed APKs.
- **Remediation:** Generate an isolated release keystore (`keytool -genkeypair`) and configure `signingConfigs.release` in `android/app/build.gradle`.
- **Retest Procedure:** Run `apksigner verify --print-certs <new-apk>` and verify signer DN reflects the private release identity.

---

### Finding SEC-HIGH-01: Unencrypted Plaintext Storage of Trading Logs in LocalStorage
- **Severity:** HIGH (CVSS v3.1: 7.1)
- **Status:** CONFIRMED
- **Affected File:** [`src/context/TradingContext.tsx`](file:///c:/Users/SERVER-GSM/Desktop/trade/src/context/TradingContext.tsx#L56-L143)
- **Evidence:** `localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(completedTrades))` serializes trading logs as plaintext JSON directly into the Chromium LevelDB datastore.
- **Expected Behavior:** Sensitive financial journals, account balances, and trading performance metrics should be stored encrypted at rest or safeguarded via EncryptedSharedPreferences / Web Crypto AES-GCM.
- **Actual Behavior:** Plaintext JSON strings are written directly to disk without encryption.
- **Realistic Impact:** Any physical access, backup extraction, or device compromise reveals the trader's entire trading history, equity size, win rate, and habits.
- **Remediation:** Implement client-side encryption (Web Crypto API AES-GCM) or native encrypted storage bridge before persisting journal data to storage.
- **Retest Procedure:** Inspect LevelDB storage files on disk and confirm all values appear as encrypted ciphertext.

---

### Finding SEC-HIGH-02: Insecure Android Application Backup Enabled
- **Severity:** HIGH (CVSS v3.1: 6.8)
- **Status:** CONFIRMED
- **Affected File:** [`android/app/src/main/AndroidManifest.xml`](file:///c:/Users/SERVER-GSM/Desktop/trade/android/app/src/main/AndroidManifest.xml#L5)
- **Evidence:** `android:allowBackup="true"` is declared on the `<application>` tag.
- **Expected Behavior:** Financial applications containing private transaction logs should set `android:allowBackup="false"` or declare explicit backup inclusion/exclusion rules.
- **Actual Behavior:** Full application data backup is enabled for the entire app sandbox.
- **Realistic Impact:** Anyone with USB debugging access can execute `adb backup com.binancetrader.papertrading` without root to create an unencrypted `.ab` backup file and extract the complete paper trading history.
- **Remediation:** Set `android:allowBackup="false"` in `AndroidManifest.xml`.
- **Retest Procedure:** Execute `adb backup com.binancetrader.papertrading` on an emulator/device and confirm backup is rejected.

---

### Finding SEC-HIGH-03: Cleartext Traffic Permitted in Configuration & Manifest
- **Severity:** HIGH (CVSS v3.1: 6.5)
- **Status:** CONFIRMED
- **Affected File:** [`capacitor.config.json`](file:///c:/Users/SERVER-GSM/Desktop/trade/capacitor.config.json#L8), [`AndroidManifest.xml`](file:///c:/Users/SERVER-GSM/Desktop/trade/android/app/build/intermediates/merged_manifest/debug/processDebugMainManifest/AndroidManifest.xml#L31)
- **Evidence:** `"server": { "cleartext": true }` in `capacitor.config.json` injects `android:usesCleartextTraffic="true"` into the merged manifest.
- **Expected Behavior:** Financial applications should enforce strict TLS 1.3/HTTPS transport and disallow unencrypted HTTP traffic.
- **Actual Behavior:** Cleartext network communications are permitted globally.
- **Realistic Impact:** If an unencrypted fallback endpoint or rogue network Wi-Fi intercepts connections, traffic will not be blocked by the operating system, allowing potential man-in-the-middle price tampering.
- **Remediation:** Remove `"cleartext": true` from `capacitor.config.json` and ensure `android:usesCleartextTraffic="false"`.
- **Retest Procedure:** Inspect merged manifest and verify `usesCleartextTraffic="false"` or omitted.

---

### Finding SEC-MED-01: Missing Content Security Policy (CSP)
- **Severity:** MEDIUM (CVSS v3.1: 5.4)
- **Status:** CONFIRMED
- **Affected File:** [`index.html`](file:///c:/Users/SERVER-GSM/Desktop/trade/index.html)
- **Evidence:** `index.html` has no `<meta http-equiv="Content-Security-Policy">` header.
- **Expected Behavior:** Web applications inside WebViews should specify a restrictive CSP defining valid script, style, and connection origins.
- **Actual Behavior:** No CSP is defined.
- **Realistic Impact:** If a script injection vulnerability were introduced in a future feature or dependency, the lack of CSP permits arbitrary script execution and unrestricted outbound connections.
- **Remediation:** Add a restrictive CSP meta tag permitting only `'self'`, `'unsafe-inline'` (for styles), and connections to Binance endpoints (`https://*.binance.com`, `https://*.binance.vision`, `wss://stream.binance.com:9443`).
- **Retest Procedure:** Inspect DOM in WebView DevTools and verify CSP enforcement.

---

### Finding SEC-MED-02: Mixed Content Allowed in WebView
- **Severity:** MEDIUM (CVSS v3.1: 4.8)
- **Status:** CONFIRMED
- **Affected File:** [`capacitor.config.json`](file:///c:/Users/SERVER-GSM/Desktop/trade/capacitor.config.json#L11)
- **Evidence:** `"android": { "allowMixedContent": true }`.
- **Expected Behavior:** Mixed content mode should be set to `MIXED_CONTENT_NEVER_ALLOW`.
- **Actual Behavior:** Mixed content is explicitly allowed.
- **Remediation:** Remove `"allowMixedContent": true` from `capacitor.config.json`.

---

### Finding SEC-MED-03: Packaging Anomaly: Recursive Nested APK in Web Assets
- **Severity:** MEDIUM (Code & Build Quality)
- **Status:** CONFIRMED & REPRODUCED
- **Affected File:** [`public/BinanceDayTrader.apk`](file:///c:/Users/SERVER-GSM/Desktop/trade/public/), [`dist/BinanceDayTrader.apk`](file:///c:/Users/SERVER-GSM/Desktop/trade/dist/)
- **Evidence:** An older 12.35 MB APK is bundled inside `assets/public/BinanceDayTrader.apk` inside `BinanceDayTrader.apk` (accounting for 57% of total APK size).
- **Expected Behavior:** Static web assets should only contain compiled JS, CSS, icons, and HTML. Binary installer APKs must not reside inside `public/`.
- **Actual Behavior:** Placing the APK in `public/` caused Vite and Capacitor to bundle the APK recursively into itself.
- **Remediation:** Delete `BinanceDayTrader.apk` from `public/` and `dist/`. Remove the in-app `<a href="/BinanceDayTrader.apk">` download button or link to external GitHub releases.
- **Retest Procedure:** Rebuild web bundle and APK; verify APK size drops from ~16.4 MB to ~4.1 MB.

---

### Finding SEC-MED-04: CSV Export Incompatible with Android WebView
- **Severity:** MEDIUM (Functional Failure)
- **Status:** CONFIRMED
- **Affected File:** [`src/components/TradeTrackerTab.tsx`](file:///c:/Users/SERVER-GSM/Desktop/trade/src/components/TradeTrackerTab.tsx#L49-L67)
- **Evidence:** `handleExportCSV` creates a `blob:` URL and triggers `a.click()`.
- **Expected Behavior:** Tapping "Export CSV" on Android should save the CSV file to the user's Downloads directory.
- **Actual Behavior:** Android WebView ignores `<a download>` on `blob:` URLs unless a native `DownloadListener` or Capacitor Filesystem plugin handles the stream. On mobile, tapping the button fails silently.
- **Remediation:** Use `@capacitor/filesystem` and `@capacitor/share` to write the CSV file and open the native Android system share dialog.
- **Retest Procedure:** Test CSV export button on Android device/emulator and confirm file save prompt appears.

---

### Finding SEC-MED-05: Broken Partial Sell Functionality
- **Severity:** MEDIUM (Financial / Functional Logic)
- **Status:** CONFIRMED
- **Affected File:** [`src/context/TradingContext.tsx`](file:///c:/Users/SERVER-GSM/Desktop/trade/src/context/TradingContext.tsx#L488-L499)
- **Evidence:** `placeMarketSell(qtyPercent)` computes `sellQty = currentQty * (qtyPercent / 100)`, but then invokes `executePositionClose`, which completely clears the position and sets `holdings[baseAsset]: 0`.
- **Expected Behavior:** Choosing 25% or 50% sell should liquidate only the requested proportion of the position, keeping the remaining position active.
- **Actual Behavior:** Calling `placeMarketSell` with any percentage unconditionally closes 100% of the position.
- **Remediation:** Refactor `executePositionClose` to support partial closure: reduce position quantity and total cost proportionally, rather than unconditionally deleting the record.
- **Retest Procedure:** Place a 10 SOL position; sell 50%; verify remaining holding is 5 SOL.

---

### Finding SEC-LOW-01: Cross-Asset Order Cancellation State Corruption
- **Severity:** LOW (Financial / State Logic)
- **Status:** CONFIRMED
- **Affected File:** [`src/context/TradingContext.tsx`](file:///c:/Users/SERVER-GSM/Desktop/trade/src/context/TradingContext.tsx#L554)
- **Evidence:** `const baseAsset = selectedPair.baseAsset; setHoldings(prev => ({ ...prev, [baseAsset]: (prev[baseAsset] || 0) + order.quantity }));`.
- **Expected Behavior:** Cancelling an order must refund the exact cryptocurrency symbol of the cancelled order (`order.symbol.replace('USDT', '')`).
- **Actual Behavior:** Refunds are credited to whichever pair is currently selected in the UI dropdown (`selectedPair.baseAsset`).
- **Remediation:** Replace `selectedPair.baseAsset` with `order.symbol.replace('USDT', '')`.
- **Retest Procedure:** Place BTC limit sell, switch UI to ETH, cancel BTC order; verify BTC balance is refunded, not ETH.

---

### Finding SEC-LOW-02: Unvalidated Inverted Stop Loss Triggers Instant Liquidation
- **Severity:** LOW (Financial Logic)
- **Status:** CONFIRMED
- **Affected File:** [`src/components/OrderPanel.tsx`](file:///c:/Users/SERVER-GSM/Desktop/trade/src/components/OrderPanel.tsx#L77-L106), [`TradingContext.tsx`](file:///c:/Users/SERVER-GSM/Desktop/trade/src/context/TradingContext.tsx#L224)
- **Evidence:** No validation enforces that `stopLossPrice < executionPrice` for a BUY order.
- **Actual Behavior:** Entering a stop loss above market price causes the tick matcher (`latestPrice <= stopLossPrice`) to immediately trigger an auto-liquidation on the very first incoming tick.
- **Remediation:** Add UI validation: reject BUY orders if Stop Loss $\ge$ Entry Price.

---

### Finding SEC-LOW-03: Potential CSV Formula Injection Risk
- **Severity:** LOW (Web / File Security)
- **Status:** CONFIRMED
- **Affected File:** [`src/components/TradeTrackerTab.tsx`](file:///c:/Users/SERVER-GSM/Desktop/trade/src/components/TradeTrackerTab.tsx#L55)
- **Evidence:** Rows are formatted directly into CSV without checking for leading `=`, `+`, `-`, or `@`.
- **Actual Behavior:** Negative Net PnL (e.g. `-15.20`) starts with `-`, which spreadsheet software interprets as a formula prefix.
- **Remediation:** Sanitize all CSV fields; wrap or prefix text with single quotes if starting with dangerous formula characters.

---

### Finding SEC-INFO-01: Moderate Vulnerability in Dev-Dependency (`uuid`)
- **Severity:** INFORMATIONAL
- **Status:** CONFIRMED
- **Affected File:** `package-lock.json`
- **Evidence:** `npm audit` flags moderate advisory GHSA-w5hq-g745-h8pq (`uuid < 11.1.1` via `@capacitor/cli -> xcode`).
- **Impact:** Dev-dependency used only during iOS project generation; zero impact on the Android runtime.

---

### Finding SEC-INFO-02: ProGuard / R8 Bytecode Obfuscation Disabled
- **Severity:** INFORMATIONAL
- **Status:** CONFIRMED
- **Affected File:** [`android/app/build.gradle`](file:///c:/Users/SERVER-GSM/Desktop/trade/android/app/build.gradle#L21)
- **Evidence:** `buildTypes.release.minifyEnabled false`.
- **Impact:** DEX bytecode is not obfuscated; reverse-engineering decompiles clean Java/Kotlin symbols.
