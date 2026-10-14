# HIGH SEVERITY FINDINGS
**Project:** Binance SOL/USDT Day Trader & Paper Trading App  
**Audit Standard:** OWASP MASVS v2.0 / MASTG  
**Category:** High-Risk Vulnerabilities (Must Fix Prior to Distribution)

---

## 1. SEC-HIGH-01: Unencrypted Plaintext Storage of Trading Logs in LocalStorage

### Metadata
- **Finding ID:** `SEC-HIGH-01`
- **CVSS v3.1 Score:** 7.1 (High)
- **Status:** **CONFIRMED**
- **Affected File:** [`src/context/TradingContext.tsx`](file:///c:/Users/SERVER-GSM/Desktop/trade/src/context/TradingContext.tsx#L56-L143)
- **MASVS Category:** MASVS-STORAGE-1 (Data at Rest)

### Vulnerability Mechanism
All trading activity, completed trades, active positions, and account balance values are serialized directly into `window.localStorage` via `JSON.stringify()`. Under Android's WebView implementation, `localStorage` is persisted on disk inside an unencrypted LevelDB database at:
`/data/data/com.binancetrader.papertrading/app_webview/Default/Local Storage/leveldb/`

### Realistic Exploitation Scenarios
1. **Device Theft / Physical Forensic Extraction:** If a phone is lost or stolen without full-disk hardware encryption, or if a user plugs the phone into a forensic workstation, an attacker can extract the raw LevelDB files and inspect the complete financial journal.
2. **Co-located Malware with Root Access:** Any process operating with root privileges can read this unencrypted folder directly.

### Remediation Plan
1. Use the Web Crypto API (`SubtleCrypto`) to encrypt data with AES-256-GCM before writing to `localStorage`, deriving a key from a user PIN or Android Keystore master key.
2. Alternatively, migrate sensitive persistence to `@capacitor/preferences` with hardware-backed encryption (via Android KeyStore and EncryptedSharedPreferences).

---

## 2. SEC-HIGH-02: Insecure Android Application Backup Enabled (`allowBackup="true"`)

### Metadata
- **Finding ID:** `SEC-HIGH-02`
- **CVSS v3.1 Score:** 6.8 (Medium/High)
- **Status:** **CONFIRMED**
- **Affected File:** [`android/app/src/main/AndroidManifest.xml`](file:///c:/Users/SERVER-GSM/Desktop/trade/android/app/src/main/AndroidManifest.xml#L5)
- **MASVS Category:** MASVS-STORAGE-2 (Data Backup & Transmission)

### Vulnerability Mechanism
`android:allowBackup="true"` is declared on the application tag in `AndroidManifest.xml`. By default on Android, this allows the Android Backup Manager and ADB backup utilities to archive the entire private internal data directory to an external computer or Google Drive cloud backups.

### Realistic Exploitation Scenarios
1. **Unattended ADB Backup Extraction:**
   An adversary with temporary physical access to an unlocked phone with USB debugging enabled can run:
   ```bash
   adb backup -noapk com.binancetrader.papertrading -f backup.ab
   ```
   The generated `.ab` file can be unpacked using `tar` or `Android Backup Extractor` to extract the entire plaintext `localStorage` database, including all trades and balances.

### Remediation Plan
Set `android:allowBackup="false"` in `android/app/src/main/AndroidManifest.xml`:
```xml
<application
    android:allowBackup="false"
    ... >
```

---

## 3. SEC-HIGH-03: Cleartext Traffic Permitted in Configuration & Manifest

### Metadata
- **Finding ID:** `SEC-HIGH-03`
- **CVSS v3.1 Score:** 6.5 (Medium/High)
- **Status:** **CONFIRMED**
- **Affected File:** [`capacitor.config.json`](file:///c:/Users/SERVER-GSM/Desktop/trade/capacitor.config.json#L8), [`AndroidManifest.xml`](file:///c:/Users/SERVER-GSM/Desktop/trade/android/app/build/intermediates/merged_manifest/debug/processDebugMainManifest/AndroidManifest.xml#L31)
- **MASVS Category:** MASVS-NETWORK-1 (Secure Network Communication)

### Vulnerability Mechanism
`capacitor.config.json` specifies:
```json
"server": {
  "androidScheme": "https",
  "cleartext": true
}
```
During Gradle manifest merging, this injects `android:usesCleartextTraffic="true"` into the application tag.

### Realistic Exploitation Scenarios
1. **Network Downgrade / Rogue Wi-Fi Interception:**
   Android 9 (API 28) and higher disable cleartext HTTP by default to protect users against unencrypted network eavesdropping. By explicitly enabling `cleartext`, the application bypasses this operating-system guardrail. If an attacker performs DNS spoofing or redirects traffic on an untrusted public Wi-Fi network, the Android system will not block unencrypted HTTP fallback requests.

### Remediation Plan
1. In `capacitor.config.json`, remove `"cleartext": true` or set `"cleartext": false`.
2. Add a restrictive `res/xml/network_security_config.xml` that enforces `cleartextTrafficPermitted="false"`.
