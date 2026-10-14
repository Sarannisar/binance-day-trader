# TEST SUITE: ANDROID WEBVIEW & NATIVE BRIDGE SECURITY
**Project:** Binance SOL/USDT Day Trader & Paper Trading App  
**Audit Standard:** OWASP MASVS v2.0 / MASTG  
**Category:** WebView Configuration & Bridge Integrity

---

## Test Case WV-01: Native Bridge Injection & Reflection Surface

| Test Attribute | Specification |
| :--- | :--- |
| **Objective** | Verify that no dangerous native methods or reflection APIs are exposed to the WebView via `@JavascriptInterface`. |
| **Target Component** | [`MainActivity.java`](file:///c:/Users/SERVER-GSM/Desktop/trade/android/app/src/main/java/com/binancetrader/papertrading/MainActivity.java), `BridgeActivity`, `assets/native-bridge.js` |
| **Prerequisites** | APK decompiled or source available. |
| **Execution Steps** | 1. Inspect `MainActivity.java` for `addJavascriptInterface` calls.<br>2. Search DEX bytecode for `@JavascriptInterface` annotations.<br>3. Inspect `assets/capacitor.plugins.json` for installed third-party native plugins. |
| **Observed Result** | 1. `MainActivity.java` contains 0 custom methods.<br>2. `capacitor.plugins.json` is `[]` (0 plugins registered).<br>3. Only base Capacitor 8 bridge methods exist, which enforce API 17+ reflection safety. |
| **Status** | **PASS (No exposed custom native surface)** |

---

## Test Case WV-02: External Scheme & Navigation Hijacking

| Test Attribute | Specification |
| :--- | :--- |
| **Objective** | Verify whether the WebView can be redirected or navigated to an arbitrary external origin. |
| **Target Component** | [`index.html`](file:///c:/Users/SERVER-GSM/Desktop/trade/index.html), [`capacitor.config.json`](file:///c:/Users/SERVER-GSM/Desktop/trade/capacitor.config.json) |
| **Prerequisites** | Source code & configuration review. |
| **Execution Steps** | 1. Check all anchor tags (`<a>`) in the React code.<br>2. Review `server.androidScheme` in `capacitor.config.json`.<br>3. Test if `window.location.href = 'https://attacker.com'` can be triggered by any external message. |
| **Observed Result** | 1. All web content is served locally from `https://localhost` (Capacitor asset handler).<br>2. No `window.open` or untrusted external redirects exist in the application code.<br>3. **Vulnerability Identified:** Missing CSP meta tag in `index.html` (Logged as `SEC-MED-01`). |
| **Status** | **DEFICIENT (Requires CSP hardening)** |

---

## Test Case WV-03: Mixed Content Mode Verification

| Test Attribute | Specification |
| :--- | :--- |
| **Objective** | Verify whether the WebView blocks insecure HTTP assets on secure origins. |
| **Target Component** | [`capacitor.config.json`](file:///c:/Users/SERVER-GSM/Desktop/trade/capacitor.config.json#L11) |
| **Execution Steps** | Check `"android": { "allowMixedContent": true }` configuration. |
| **Observed Result** | `allowMixedContent: true` is explicitly enabled, allowing HTTP subresources. (Logged as `SEC-MED-02`). |
| **Status** | **FAIL** |

---

## Test Case WV-04: Cleartext Traffic Enforcement

| Test Attribute | Specification |
| :--- | :--- |
| **Objective** | Verify whether unencrypted HTTP communication is blocked at the OS layer. |
| **Target Component** | [`AndroidManifest.xml`](file:///c:/Users/SERVER-GSM/Desktop/trade/android/app/build/intermediates/merged_manifest/debug/processDebugMainManifest/AndroidManifest.xml#L31) |
| **Execution Steps** | Inspect `android:usesCleartextTraffic` in merged manifest. |
| **Observed Result** | `android:usesCleartextTraffic="true"` is active. (Logged as `SEC-HIGH-03`). |
| **Status** | **FAIL** |

---

## Test Case WV-05: WebContents Debugging Exposure

| Test Attribute | Specification |
| :--- | :--- |
| **Objective** | Verify whether Chrome Remote DevTools can attach to the production WebView. |
| **Target Component** | `AndroidManifest.xml`, APK binary |
| **Execution Steps** | Check `android:debuggable` flag. |
| **Observed Result** | `android:debuggable="true"` is active, enabling `setWebContentsDebuggingEnabled(true)`. (Logged as `SEC-CRIT-01`). |
| **Status** | **FAIL (Release Blocker)** |
