# CRITICAL SEVERITY FINDINGS
**Project:** Binance SOL/USDT Day Trader & Paper Trading App  
**Audit Standard:** OWASP MASVS v2.0 / MASTG  
**Category:** Release Blockers

---

## 1. SEC-CRIT-01: Production APK Built with `android:debuggable="true"`

### Metadata
- **Finding ID:** `SEC-CRIT-01`
- **CVSS v3.1 Score:** 8.4 (High/Critical)
- **Status:** **CONFIRMED & REPRODUCED**
- **Affected Artifact:** `BinanceDayTrader.apk`, `android/app/build/outputs/apk/debug/app-debug.apk`
- **MASVS Category:** MASVS-RESILIENCE-1 (Testing & Debugging Capabilities)

### Vulnerability Mechanism
The compiled APK distributed in the repository root was built using the Gradle debug build variant (`assembleDebug`). In this configuration, Android injects `android:debuggable="true"` into the `<application>` tag of `AndroidManifest.xml`. 

### Proof of Evidence
1. **AAPT2 Dump:**
   ```
   aapt2.exe dump badging .\BinanceDayTrader.apk
   -> Output contains: "application-debuggable"
   ```
2. **Merged Manifest:**
   In `android/app/build/intermediates/merged_manifest/debug/processDebugMainManifest/AndroidManifest.xml`:
   ```xml
   <application
       android:allowBackup="true"
       android:appComponentFactory="androidx.core.app.CoreComponentFactory"
       android:debuggable="true" ...>
   ```

### Realistic Exploitation Scenarios
1. **Local Sandbox Extraction via ADB (`run-as`):**
   On any standard Android phone with USB debugging enabled, a malicious actor or malware with adb access can run:
   ```bash
   adb shell run-as com.binancetrader.papertrading
   cd /data/data/com.binancetrader.papertrading/app_webview/Default/Local\ Storage/leveldb/
   cat *
   ```
   This completely bypasses Android's Linux UID isolation and dumps all trade logs, balance, and account history without needing root access.
2. **WebView Remote Debugging Attachment:**
   Capacitor automatically enables `setWebContentsDebuggingEnabled(true)` when `debuggable="true"`. Anyone who plugs the device into a PC can navigate to `chrome://inspect` in Google Chrome, attach DevTools to the live trading app, execute arbitrary JavaScript, manipulate balances, and inspect all memory variables.

### Remediation Plan
1. Configure `signingConfigs` in `android/app/build.gradle`.
2. Compile production release packages using `./gradlew assembleRelease` or `npx cap build android`.
3. Verify that `android:debuggable="false"` is enforced.

---

## 2. SEC-CRIT-02: Distributable APK Signed with Insecure Android Debug Keystore

### Metadata
- **Finding ID:** `SEC-CRIT-02`
- **CVSS v3.1 Score:** 7.5 (High/Critical)
- **Status:** **CONFIRMED & REPRODUCED**
- **Affected Artifact:** `BinanceDayTrader.apk`
- **MASVS Category:** MASVS-PLATFORM-1 (App Integrity & Code Signing)

### Vulnerability Mechanism
The distributed APK is signed with the public, well-known Android SDK debug keystore located at `~/.android/debug.keystore`. 

### Proof of Evidence
Verified using Android SDK `apksigner`:
```
Number of signers: 1
Signer #1 certificate DN: C=US, O=Android, CN=Android Debug
Signer #1 certificate SHA-256 digest: 99d6700cc8746bd98ee357dd205760547e728c65d7f331c1f293345b4ae363dd
Signer #1 key algorithm: RSA (2048 bits)
```

### Realistic Exploitation Scenarios
1. **Application Spoofing & Trojan Replacement:**
   Because the private key of the Android debug keystore is publicly available in the Android SDK (`password: android`), any malicious third party can recompile the app, inject malicious payloads, and sign it with the exact same debug certificate. Android OS will treat the trojan as a legitimate update to the installed app, allowing silent replacement.
2. **App Store Ineligibility:**
   Google Play Store, F-Droid, and enterprise MDMs reject debug-signed APKs automatically.

### Remediation Plan
1. Generate a dedicated, password-protected production release keystore:
   ```bash
   keytool -genkeypair -v -keystore release.jks -alias binancetrader -keyalg RSA -keysize 4096 -validity 10000
   ```
2. Configure `build.gradle` to sign release builds using environment variables for the keystore credentials (never hardcoding passwords into Git).
