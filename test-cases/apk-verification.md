# TEST SUITE: APK INTEGRITY & REVERSE-ENGINEERING VERIFICATION
**Project:** Binance SOL/USDT Day Trader & Paper Trading App  
**Audit Standard:** OWASP MASVS v2.0 / MASTG  
**Category:** Binary Integrity, Packaging & Signing

---

## Test Case APK-01: Cryptographic Hash & Artifact Preservation

| Test Attribute | Specification |
| :--- | :--- |
| **Objective** | Verify the integrity and SHA-256 hash of the master APK. |
| **Target Artifact** | `BinanceDayTrader.apk` |
| **Execution Steps** | Calculate SHA-256 using PowerShell `Get-FileHash` and Python `hashlib`. |
| **Observed Result** | Hash: `BE7607C02567756BFCEFA233BFA36601607E4DC63FC44E7828C6B29A16F52311`<br>Matches build output `android/app/build/outputs/apk/debug/app-debug.apk`. |
| **Status** | **PASS (Cryptographic baseline established)** |

---

## Test Case APK-02: Code Signing Scheme & Keystore Verification

| Test Attribute | Specification |
| :--- | :--- |
| **Objective** | Verify that the APK is signed with a valid, secure release certificate using modern signature schemes. |
| **Target Artifact** | `BinanceDayTrader.apk` |
| **Execution Steps** | Run Android SDK `apksigner verify --verbose --print-certs`. |
| **Observed Result** | Signed with `CN=Android Debug` using Scheme v2 only. (Logged as `SEC-CRIT-02`). |
| **Status** | **FAIL (Release Blocker)** |

---

## Test Case APK-03: Source-to-Binary Bundle Parity

| Test Attribute | Specification |
| :--- | :--- |
| **Objective** | Confirm that web assets inside the APK match local build artifacts in `dist/`. |
| **Target Components** | `dist/assets/index-BMpCdL2r.js` vs `assets/public/assets/index-BMpCdL2r.js` |
| **Execution Steps** | Extract file from APK and compute SHA-256. |
| **Observed Result** | Both hashes equal `919EEF7B2297351D00D8078A57164F5D85B02A14CB33F7F6A9990736566D6AAD`. Exact bit-for-bit match. |
| **Status** | **PASS (Zero unauthorized code injection)** |

---

## Test Case APK-04: Asset Packaging Anomaly Check

| Test Attribute | Specification |
| :--- | :--- |
| **Objective** | Verify whether unnecessary or duplicate binary artifacts are packaged in the APK. |
| **Target Component** | APK archive `assets/` |
| **Execution Steps** | Enumerate all files in APK ZIP archive. |
| **Observed Result** | Found `assets/public/BinanceDayTrader.apk` (12,350,687 bytes), which is a nested earlier build of the APK. (Logged as `SEC-MED-03`). |
| **Status** | **FAIL** |

---

## Test Case APK-05: Native Library & Obfuscation Inspection

| Test Attribute | Specification |
| :--- | :--- |
| **Objective** | Inspect for native `.so` binaries and check if bytecode is obfuscated via ProGuard/R8. |
| **Target Component** | APK archive root (`lib/`), DEX classes |
| **Execution Steps** | 1. Check for `lib/` directory.<br>2. Inspect decompiled class names. |
| **Observed Result** | 1. Zero native `.so` libraries present.<br>2. ProGuard disabled (`minifyEnabled false`). (Logged as `SEC-INFO-02`). |
| **Status** | **PASS (Safe, though unminified)** |
