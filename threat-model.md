# THREAT MODEL & PRIORITY SECURITY SCENARIOS
**Project:** Binance SOL/USDT Day Trader & Paper Trading App  
**Package ID:** `com.binancetrader.papertrading`  
**Audit Standard:** OWASP MASVS v2.0 / MASTG & STRIDE  
**Audit Phase:** Phase 1 — Threat Modeling  
**Date:** October 14, 2026

---

## 1. Threat Actors & Attack Surfaces

| Threat Actor | Capabilities & Access | Objective | Primary Target Surface |
| :--- | :--- | :--- | :--- |
| **Malicious Co-located App** | Unprivileged app on the same Android device | Steal or tamper with user's trade history, balance, or strategy | IPC intents, exported activities/receivers, shared external storage |
| **Network Adversary (MitM)** | Controls local Wi-Fi, DNS, or router on user's path | Intercept or manipulate market prices; inject malicious payloads | Cleartext HTTP / WebSocket fallback (`usesCleartextTraffic=true`) |
| **Physical Possessor / ADB User**| Device physically accessible or connected via USB debugging | Extract unencrypted paper trade logs and journal records | Debuggable application sandbox (`run-as`, `adb backup`) |
| **Supply Chain / Upstream** | Compromised npm dependency or build tool | Introduce remote code execution or data exfiltration | Build-time npm scripts, bundled JavaScript libraries |
| **Malicious APK Repackager** | Re-distributes tampered APK on third-party stores | Inject spyware or trojan while preserving trading UI | Unsigned/Debug-signed APK lacking tamper detection |

---

## 2. Priority Security Scenarios Evaluation (Phase 3 Baseline)

### Scenario 1: Input Injection / Cross-Site Scripting (XSS)
- **Attack Scenario:** A crafted trade symbol, note, or imported file injects executable HTML/JS into the DOM.
- **Expected Boundary:** React JSX must escape all text nodes by default; no `dangerouslySetInnerHTML`, `innerHTML`, or `eval()` should be reachable.
- **Audit Findings:**
  - Codebase search confirmed **zero instances** of `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `document.write`, or `eval()`.
  - Symbols are restricted to fixed hardcoded lists in [`pairs.ts`](file:///c:/Users/SERVER-GSM/Desktop/trade/src/constants/pairs.ts) (`SOLUSDT`, `BTCUSDT`, `ETHUSDT`, `BNBUSDT`, `DOGEUSDT`).
  - There is currently no freeform "trade note" text field or file import mechanism implemented in the UI.
- **Status:** **LOW RISK / NOT APPLICABLE IN CURRENT FEATURE SET**

### Scenario 2: Attacker-Controlled URL or Redirect in Privileged WebView
- **Attack Scenario:** A link or external redirect navigates the WebView to an external malicious website, which inherits WebView bridge privileges.
- **Expected Boundary:** The WebView must restrict navigation exclusively to local bundled assets (`https://localhost` or `http://localhost`) and intercept external links (`shouldOverrideUrlLoading`) to open in the system browser.
- **Audit Findings:**
  - The app contains an external link in [`SettingsModal.tsx`](file:///c:/Users/SERVER-GSM/Desktop/trade/src/components/SettingsModal.tsx#L125-L132): `<a href="/BinanceDayTrader.apk" download>`.
  - TradingView lightweight-charts embeds an attribution link to `tradingview.com`.
  - Capacitor's default Android WebView configuration handles internal vs external schemes, but because `"cleartext": true` and `"allowMixedContent": true` are active in `capacitor.config.json`, mixed content warnings are suppressed.
- **Status:** **SUSPECTED / REQUIRES RUNTIME DEEP-DIVE IN PHASE 2**

### Scenario 3: Native Bridge Exploitation (`addJavascriptInterface`)
- **Attack Scenario:** Malicious script running in the WebView invokes Java reflection or native methods via Capacitor's bridge.
- **Expected Boundary:** Native methods exposed via `@JavascriptInterface` must be strictly validated and inaccessible to external origins.
- **Audit Findings:**
  - `MainActivity.java` contains **no custom `@JavascriptInterface`** methods.
  - No third-party Capacitor plugins are installed (`capacitor.plugins.json` is `[]`).
  - The only native bridge present is Capacitor's core bridge (`assets/native-bridge.js`), which enforces Android API 17+ `@JavascriptInterface` restrictions.
- **Status:** **MINIMAL RISK (DEFAULT CAPACITOR 8 CORE SURFACE ONLY)**

### Scenario 4: Exported Component or Intent Hijacking
- **Attack Scenario:** An exported activity, receiver, or content provider is triggered with malformed intents to bypass authentication or alter state.
- **Expected Boundary:** Only the main launcher activity should be exported. Internal receivers and providers must be protected with signature permissions or `android:exported="false"`.
- **Audit Findings:**
  - `MainActivity` is exported (`android:exported="true"`) with `android.intent.action.MAIN` and `CATEGORY_LAUNCHER`, which is standard for an app launcher.
  - `androidx.core.content.FileProvider` is configured with `android:exported="false"`.
  - `androidx.profileinstaller.ProfileInstallReceiver` is exported but protected with `android.permission.DUMP` (system permission).
- **Status:** **VERIFIED PROTECTED (No unauthenticated exported components exposed)**

### Scenario 5: Data Leakage via Backups, Logs, Exports, or Sandboxes
- **Attack Scenario:** Unencrypted trade logs, initial capital, and trading history are extracted via system backup or ADB.
- **Expected Boundary:** Sensitive user data must not be backed up to unencrypted cloud/USB backups (`allowBackup=false`), and must be protected against local extraction.
- **Audit Findings:**
  - **CONFIRMED VULNERABILITY 1:** `AndroidManifest.xml` specifies `android:allowBackup="true"`. On any Android device with adb or cloud backup enabled, all trading history in `localStorage` can be extracted using `adb backup`.
  - **CONFIRMED VULNERABILITY 2:** The APK is built in debug mode (`android:debuggable="true"`). Any attacker with temporary USB access can execute `adb shell run-as com.binancetrader.papertrading cat /data/data/com.binancetrader.papertrading/app_webview/Default/Local\ Storage/leveldb/...` and dump all trades.
  - **CONFIRMED VULNERABILITY 3:** Data is stored as plaintext JSON in `localStorage` without encryption.
- **Status:** **HIGH SEVERITY (CONFIRMED ARCHITECTURAL ISSUE)**

### Scenario 6: Third-Party Library Data Exfiltration / Phone-Home
- **Attack Scenario:** A bundled dependency quietly transmits user logs or telemetry to an external server.
- **Expected Boundary:** Network traffic must strictly be confined to user-approved market endpoints.
- **Audit Findings:**
  - Binary inspection of all DEX files and the compiled JavaScript bundle confirmed **no tracking SDKs** (no Google Analytics, no Firebase, no Facebook SDK, no Sentry).
  - Outbound network requests are limited to `api.binance.com`, `data-api.binance.vision`, `api1.binance.com`, and `stream.binance.com`.
- **Status:** **VERIFIED CLEAN (No covert exfiltration detected in static baseline)**

### Scenario 7: Dynamic Code Loading / Remote Backdoors
- **Attack Scenario:** The application downloads executable JavaScript, DEX files, or native libraries at runtime.
- **Expected Boundary:** All code must be statically bundled at build time; `eval()`, `Function()`, and `DexClassLoader` must be absent.
- **Audit Findings:**
  - No `DexClassLoader` or `PathClassLoader` dynamic loading calls exist in the application code.
  - No dynamic `import()` or remote script loading tags (`<script src="https://...">`) exist.
  - All web assets are loaded locally from `assets/public/`.
- **Status:** **VERIFIED CLEAN (Zero dynamic remote code loading)**

### Scenario 8: Source Code vs. Packaged APK Discrepancies
- **Attack Scenario:** The pre-compiled APK contains malicious code or backdoors injected during the build process that are absent from the source.
- **Expected Boundary:** The compiled JS bundle in the APK must match the local build output (`dist/`).
- **Audit Findings:**
  - Cryptographic comparison of `dist/assets/index-BMpCdL2r.js` vs. `assets/public/assets/index-BMpCdL2r.js` inside the APK yielded an **exact SHA-256 match**: `919EEF7B2297351D00D8078A57164F5D85B02A14CB33F7F6A9990736566D6AAD`.
  - Anomaly found: An older 12.35 MB APK was accidentally bundled into the APK assets due to placement in `public/`.
- **Status:** **SOURCE PARITY VERIFIED (Packaging hygiene issue identified)**

### Scenario 9: Multi-User / Cross-App Data Exposure
- **Attack Scenario:** Another user profile or app reads or modifies the trading database.
- **Expected Boundary:** Android Linux UID sandboxing must enforce strict application isolation.
- **Audit Findings:**
  - Standard Android internal storage (`/data/data/com.binancetrader.papertrading`) enforces Linux file permissions (`rwx------`) per UID.
  - FileProvider does not expose the internal `leveldb` directory; it only exposes `external-path` and `cache-path` for images.
- **Status:** **VERIFIED PROTECTED (Standard OS sandbox active)**

### Scenario 10: Insecure Release & Debug Capabilities
- **Attack Scenario:** The production APK retains debug capabilities, debug signing, or enabled developer interfaces.
- **Expected Boundary:** Release APKs must be signed with a production v2/v3 keystore, marked `android:debuggable="false"`, have cleartext disabled, and have ProGuard/R8 minification enabled.
- **Audit Findings:**
  - **CONFIRMED:** `android:debuggable="true"` is active.
  - **CONFIRMED:** Signed with standard insecure `CN=Android Debug` key.
  - **CONFIRMED:** `android:usesCleartextTraffic="true"` and `"allowMixedContent": true` are active.
  - **CONFIRMED:** ProGuard/R8 code shrinking is disabled (`minifyEnabled false` in `build.gradle`).
- **Status:** **CRITICAL RELEASE BLOCKER (App is strictly a Debug build)**
