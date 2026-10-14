# REGRESSION & VERIFICATION TEST MATRIX
**Project:** Binance SOL/USDT Day Trader & Paper Trading App  
**Audit Standard:** OWASP MASVS v2.0 / MASTG  
**Category:** Post-Remediation Verification Suite

---

## Post-Remediation Test Cases

| Test ID | Target Vulnerability | Verification Procedure | Expected Passing Result |
| :--- | :--- | :--- | :--- |
| **REG-01** | `SEC-CRIT-01` (Debuggable APK) | Run `aapt2 dump badging <new-apk>` | `application-debuggable` must **NOT** be present in output. |
| **REG-02** | `SEC-CRIT-02` (Debug Signing) | Run `apksigner verify --verbose --print-certs <new-apk>` | Signer DN must reflect private release key; must verify under v2/v3 schemes. |
| **REG-03** | `SEC-HIGH-01` (Plaintext Storage) | Inspect LevelDB files in `/data/data/...` | Values in LevelDB must be encrypted ciphertext. |
| **REG-04** | `SEC-HIGH-02` (Backup Allowed) | Run `adb backup com.binancetrader.papertrading` | Android must report "Backup rejected by application". |
| **REG-05** | `SEC-HIGH-03` (Cleartext Traffic) | Inspect merged manifest | `android:usesCleartextTraffic` must be `false` or absent. |
| **REG-06** | `SEC-MED-01` (Missing CSP) | Inspect `<head>` in `index.html` | Restrictive CSP `<meta>` tag must be present and active. |
| **REG-07** | `SEC-MED-02` (Mixed Content) | Inspect `capacitor.config.json` | `allowMixedContent` must be removed or set to `false`. |
| **REG-08** | `SEC-MED-03` (Nested APK Bloat) | Inspect APK ZIP archive contents | `assets/public/BinanceDayTrader.apk` must **NOT** exist; total APK size must be ~4 MB. |
| **REG-09** | `SEC-MED-04` (CSV Export on Android) | Tap "Export CSV" on Android test device | Native Android share/save dialog must open with populated CSV data. |
| **REG-10** | `SEC-MED-05` (Partial Sell Logic) | Open position of 10 SOL; execute 50% market sell | Remaining position must be 5 SOL; USDT balance must increase by proceeds of 5 SOL. |
| **REG-11** | `SEC-LOW-01` (Order Cancel State) | Place BTC limit order; switch UI to ETH; cancel BTC order | BTC balance must be refunded; ETH balance must remain unchanged. |
| **REG-12** | `SEC-LOW-02` (Inverted Stop Loss) | Attempt BUY order with Stop Loss > Entry Price | UI must show error message and prevent order execution. |
| **REG-13** | **CORE INTEGRITY** (Live Feeds) | Launch application with network connection | Candlestick chart must render live candles and WebSocket prices from Binance. |
