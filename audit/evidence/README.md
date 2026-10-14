# AUDIT EVIDENCE REPOSITORY & LOGS
**Project:** Binance SOL/USDT Day Trader & Paper Trading App  
**Package ID:** `com.binancetrader.papertrading`  
**Audit Standard:** OWASP MASVS v2.0 / MASTG  
**Audit Phase:** Phase 4 — Evidence Management  
**Date:** October 14, 2026

---

## 1. Cryptographic Hashes & Artifact Registry

| Artifact | Filesystem Path | SHA-256 Hash | Size (Bytes) | Verification Tool |
| :--- | :--- | :--- | :--- | :--- |
| **Distributable APK** | `.\BinanceDayTrader.apk` | `BE7607C02567756BFCEFA233BFA36601607E4DC63FC44E7828C6B29A16F52311` | 16,414,078 | PowerShell `Get-FileHash` |
| **Debug Build APK** | `.\android\app\build\outputs\apk\debug\app-debug.apk` | `BE7607C02567756BFCEFA233BFA36601607E4DC63FC44E7828C6B29A16F52311` | 16,414,078 | PowerShell `Get-FileHash` |
| **Nested Asset APK** | `[APK Archive] assets/public/BinanceDayTrader.apk` | `A317801BCA0DD580150E1A171B4E9CEF2AC503F3D74FEC1217430B20F47DF745` | 12,350,687 | Python `hashlib.sha256` |
| **Local Web Bundle** | `.\dist\assets\index-BMpCdL2r.js` | `919EEF7B2297351D00D8078A57164F5D85B02A14CB33F7F6A9990736566D6AAD` | 489,287 | Python `hashlib.sha256` |
| **Packaged Web Bundle**| `[APK Archive] assets/public/assets/index-BMpCdL2r.js`| `919EEF7B2297351D00D8078A57164F5D85B02A14CB33F7F6A9990736566D6AAD` | 489,287 | Python `hashlib.sha256` |
| **Capacitor Bridge** | `[APK Archive] assets/native-bridge.js` | `E80C75D8DB73AC875F0D9BC073FFB03A5F456B75EEBFD32C55E1A1B283A49B0D` | 53,118 | Python `hashlib.sha256` |

---

## 2. Evidence Log 01: Signing Key & Certificate Inspection

**Command Executed:**
```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
& "C:\Users\SERVER-GSM\AppData\Local\Android\Sdk\build-tools\35.0.0\apksigner.bat" verify --verbose --print-certs .\BinanceDayTrader.apk
```

**Captured Raw Output:**
```
Verifies
Verified using v1 scheme (JAR signing): false
Verified using v2 scheme (APK Signature Scheme v2): true
Verified using v3 scheme (APK Signature Scheme v3): false
Verified using v3.1 scheme (APK Signature Scheme v3.1): false
Verified using v4 scheme (APK Signature Scheme v4): false
Verified for SourceStamp: false
Number of signers: 1
Signer #1 certificate DN: C=US, O=Android, CN=Android Debug
Signer #1 certificate SHA-256 digest: 99d6700cc8746bd98ee357dd205760547e728c65d7f331c1f293345b4ae363dd
Signer #1 certificate SHA-1 digest: 4eb24c790322c4755e7136eddbeecec1016bbdc2
Signer #1 certificate MD5 digest: 7171cafec9c8acdd89f0578f05210ffa
Signer #1 key algorithm: RSA
Signer #1 key size (bits): 2048
Signer #1 public key SHA-256 digest: b9d907b6205f9ad193066fab7c191d52204366d12678467c337c7ddb2601673a
Signer #1 public key SHA-1 digest: aa8f5f8cf46733bfdd96c8df7319b822c27dd827
Signer #1 public key MD5 digest: 91b518a7511eaff432ff7dbe737e3d85
```

---

## 3. Evidence Log 02: AAPT2 Badging & Manifest Verification

**Command Executed:**
```powershell
& "C:\Users\SERVER-GSM\AppData\Local\Android\Sdk\build-tools\35.0.0\aapt2.exe" dump badging .\BinanceDayTrader.apk
```

**Key Extracted Attributes:**
- `package: name='com.binancetrader.papertrading' versionCode='1' versionName='1.0'`
- `minSdkVersion:'24'`
- `targetSdkVersion:'36'`
- `uses-permission: name='android.permission.INTERNET'`
- `uses-permission: name='com.binancetrader.papertrading.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION'`
- `application: label='Binance Day Trader' icon='res/mipmap-anydpi-v26/ic_launcher.xml'`
- `application-debuggable`: **CONFIRMED PRESENT**
- `launchable-activity: name='com.binancetrader.papertrading.MainActivity'`

---

## 4. Evidence Log 03: Binary DEX Package & Class Hierarchy Scan

**Command Executed:** Python regular expression analysis scanning class descriptors `L[a-zA-Z0-9_\/$]+;` across `classes.dex` through `classes6.dex`.

**Extracted Class Groups:**
- **App Specific:** `com.binancetrader.papertrading.MainActivity`, `com.binancetrader.papertrading.R*`
- **Framework:** `com.getcapacitor.BridgeActivity`, `com.getcapacitor.Bridge`, `com.getcapacitor.Plugin`
- **AndroidX:** `androidx.activity.*`, `androidx.appcompat.*`, `androidx.core.*`, `androidx.webkit.*`, `androidx.profileinstaller.*`
- **Kotlin:** `kotlin.*`, `kotlinx.coroutines.*`
- **Third-Party Trackers Found:** **NONE (0 detected)**
- **Ad Networks Found:** **NONE (0 detected)**
- **Native `.so` Binaries:** **NONE (0 detected)**

---

## 5. Evidence Log 04: Embedded Network Endpoints & URLs

**Command Executed:** Python binary string extractor scanning for `(?:https?|wss?):\/\/[^\s\"\'<>]+`.

**Extracted Production Endpoints:**
1. `https://api.binance.com/api/v3`
2. `https://data-api.binance.vision/api/v3`
3. `https://api1.binance.com/api/v3`
4. `wss://stream.binance.com:9443/ws`
5. `https://www.tradingview.com/` (Attribution link in lightweight-charts)
6. `https://react.dev/errors/` (React minified error decoder)

**Verdict:** Zero covert analytics, zero remote command-and-control, zero external database servers.
