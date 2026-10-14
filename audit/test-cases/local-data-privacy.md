# TEST SUITE: LOCAL DATA STORAGE & PRIVACY
**Project:** Binance SOL/USDT Day Trader & Paper Trading App  
**Audit Standard:** OWASP MASVS v2.0 / MASTG  
**Category:** Data at Rest, Privacy & Extraction Resistance

---

## Test Case DP-01: Plaintext LocalStorage Inspection

| Test Attribute | Specification |
| :--- | :--- |
| **Objective** | Verify whether sensitive financial data is stored in plaintext on disk. |
| **Target Component** | [`TradingContext.tsx`](file:///c:/Users/SERVER-GSM/Desktop/trade/src/context/TradingContext.tsx#L56-L143) |
| **Execution Steps** | 1. Analyze `STORAGE_KEYS` serialization in `TradingContext.tsx`.<br>2. Inspect disk storage format inside Android WebView LevelDB. |
| **Observed Result** | All trade records (`paper_trade_completed_trades`), positions, and USDT balances are written as unencrypted raw JSON strings. (Logged as `SEC-HIGH-01`). |
| **Status** | **FAIL** |

---

## Test Case DP-02: ADB Backup Extraction Resistance

| Test Attribute | Specification |
| :--- | :--- |
| **Objective** | Verify whether an attacker can extract data using `adb backup`. |
| **Target Component** | [`AndroidManifest.xml`](file:///c:/Users/SERVER-GSM/Desktop/trade/android/app/src/main/AndroidManifest.xml#L5) |
| **Execution Steps** | Check `android:allowBackup` attribute on `<application>` tag. |
| **Observed Result** | `android:allowBackup="true"` is declared. Backups are permitted without restriction. (Logged as `SEC-HIGH-02`). |
| **Status** | **FAIL** |

---

## Test Case DP-03: ADB Shell `run-as` Sandbox Extraction

| Test Attribute | Specification |
| :--- | :--- |
| **Objective** | Verify whether internal files can be copied via `run-as` in ADB. |
| **Target Component** | Merged `AndroidManifest.xml` (`android:debuggable`) |
| **Execution Steps** | 1. Check if package can be targeted with `run-as com.binancetrader.papertrading`.<br>2. Read LevelDB storage path. |
| **Observed Result** | Because the APK is debuggable, `run-as` succeeds on standard production devices, exposing all private storage files. (Logged as `SEC-CRIT-01`). |
| **Status** | **FAIL** |

---

## Test Case DP-04: Data Purge & Account Reset Hygiene

| Test Attribute | Specification |
| :--- | :--- |
| **Objective** | Verify whether `resetAccount()` thoroughly purges all persisted data. |
| **Target Component** | [`TradingContext.tsx`](file:///c:/Users/SERVER-GSM/Desktop/trade/src/context/TradingContext.tsx#L574-L586) |
| **Execution Steps** | 1. Trigger `resetAccount()`.<br>2. Inspect remaining keys in `localStorage`. |
| **Observed Result** | `BALANCE`, `HOLDINGS`, `POSITIONS`, `ORDERS`, and `TRADES` are removed. However, `INITIAL_BAL` and `SETTINGS` are preserved, and empty arrays `[]` are re-persisted. Clean state transition succeeds. |
| **Status** | **PASS** |

---

## Test Case DP-05: Covert Telemetry & Outbound Privacy Leakage

| Test Attribute | Specification |
| :--- | :--- |
| **Objective** | Confirm that zero trade records or user behaviors are transmitted over the network. |
| **Target Component** | `src/services/binance.ts`, DEX strings, JavaScript bundle |
| **Execution Steps** | 1. Review all `fetch()` and `WebSocket` calls.<br>2. Grep compiled bundles for analytics domains (`google-analytics`, `firebase`, `sentry`, `facebook`). |
| **Observed Result** | Zero analytics SDKs present. Network traffic is strictly limited to public Binance market candlestick feeds. No user data leaves the device. |
| **Status** | **PASS (Zero telemetry verified)** |
