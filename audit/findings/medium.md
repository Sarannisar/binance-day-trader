# MEDIUM SEVERITY FINDINGS
**Project:** Binance SOL/USDT Day Trader & Paper Trading App  
**Audit Standard:** OWASP MASVS v2.0 / MASTG  
**Category:** Medium Severity Security & Functional Deficiencies

---

## 1. SEC-MED-01: Missing Content Security Policy (CSP)

### Metadata
- **Finding ID:** `SEC-MED-01`
- **CVSS v3.1 Score:** 5.4 (Medium)
- **Status:** **CONFIRMED**
- **Affected File:** [`index.html`](file:///c:/Users/SERVER-GSM/Desktop/trade/index.html)
- **MASVS Category:** MASVS-CODE-2 (Web & Injection Defense)

### Vulnerability Mechanism
`index.html` has no `<meta http-equiv="Content-Security-Policy">` tag. The WebView loads and executes scripts without an enforced origin boundary.

### Impact & Exploitation
If an XSS vector is introduced in future revisions or a third-party script injection occurs, the lack of CSP allows malicious scripts to make unauthorized outbound requests to arbitrary domains.

### Remediation Plan
Add a restrictive CSP to `<head>` in `index.html`:
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.binance.com https://data-api.binance.vision https://api1.binance.com wss://stream.binance.com:9443;" />
```

---

## 2. SEC-MED-02: Mixed Content Allowed in WebView Configuration

### Metadata
- **Finding ID:** `SEC-MED-02`
- **CVSS v3.1 Score:** 4.8 (Medium)
- **Status:** **CONFIRMED**
- **Affected File:** [`capacitor.config.json`](file:///c:/Users/SERVER-GSM/Desktop/trade/capacitor.config.json#L11)
- **MASVS Category:** MASVS-NETWORK-1 (Secure Network Communication)

### Vulnerability Mechanism
`capacitor.config.json` specifies `"android": { "allowMixedContent": true }`. This enables `WebSettings.MIXED_CONTENT_ALWAYS_ALLOW` in Chromium.

### Impact & Exploitation
Allows the WebView to load unencrypted HTTP assets (images, stylesheets, scripts) even while the primary document is served over secure HTTPS. This weakens transport security against local network tampering.

### Remediation Plan
Remove `"allowMixedContent": true` from `capacitor.config.json`.

---

## 3. SEC-MED-03: Packaging Anomaly: Recursive Nested APK Bloat

### Metadata
- **Finding ID:** `SEC-MED-03`
- **Severity:** Medium (Build & Package Integrity)
- **Status:** **CONFIRMED & REPRODUCED**
- **Affected File:** [`public/BinanceDayTrader.apk`](file:///c:/Users/SERVER-GSM/Desktop/trade/public/), [`dist/BinanceDayTrader.apk`](file:///c:/Users/SERVER-GSM/Desktop/trade/dist/)

### Vulnerability Mechanism
The repository included `BinanceDayTrader.apk` inside the `public/` directory so that users could tap a download link in `SettingsModal.tsx`. Because Vite's build pipeline copies every file in `public/` into `dist/`, and Capacitor syncs `dist/` into Android assets, an entire previous build of the APK was packaged inside the web assets inside the APK!

### Proof of Evidence
In `BinanceDayTrader.apk`:
- Total APK size: **16,414,078 bytes**
- Nested asset `assets/public/BinanceDayTrader.apk`: **12,350,687 bytes** (57% of total APK size!)
- True web code size: only **~4.1 MB**

### Remediation Plan
1. Delete `public/BinanceDayTrader.apk` and `dist/BinanceDayTrader.apk`.
2. Add `*.apk` to `.gitignore` under `public/` and `dist/`.
3. In `SettingsModal.tsx`, link the "Download APK" button to an external URL (such as GitHub Releases) rather than serving a local duplicate binary asset.

---

## 4. SEC-MED-04: CSV Export Incompatible with Android WebView

### Metadata
- **Finding ID:** `SEC-MED-04`
- **Severity:** Medium (Functional Failure)
- **Status:** **CONFIRMED**
- **Affected File:** [`src/components/TradeTrackerTab.tsx`](file:///c:/Users/SERVER-GSM/Desktop/trade/src/components/TradeTrackerTab.tsx#L49-L67)

### Vulnerability Mechanism
```typescript
const blob = new Blob([headers + rows], { type: 'text/csv' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `binance-paper-trades-${new Date().toISOString().slice(0, 10)}.csv`;
a.click();
```
In Android WebView, anchor clicks with `blob:` URLs do not trigger automatic downloads because Android WebView does not implement a default download manager without custom Java bridge code or Capacitor plugins.

### Impact
When users tap "Export CSV" on an Android device, nothing happens. The user cannot back up or export their trading records.

### Remediation Plan
Integrate `@capacitor/filesystem` and `@capacitor/share` to write the CSV to temporary app storage and trigger the native Android Sharesheet dialog.

---

## 5. SEC-MED-05: Broken Partial Sell Functionality (Liquidates 100% Unconditionally)

### Metadata
- **Finding ID:** `SEC-MED-05`
- **Severity:** Medium (Financial Simulation Failure)
- **Status:** **CONFIRMED & REPRODUCED**
- **Affected File:** [`src/context/TradingContext.tsx`](file:///c:/Users/SERVER-GSM/Desktop/trade/src/context/TradingContext.tsx#L488-L499)

### Vulnerability Mechanism
`placeMarketSell` accepts `qtyPercent` (e.g. 25%, 50%), but unconditionally invokes `executePositionClose`, which executes:
```typescript
// Clear holding
const baseAsset = symbol.replace('USDT', '');
setHoldings(prev => ({ ...prev, [baseAsset]: 0 }));
// Remove active position
delete copy[symbol];
```
### Impact
If a user holds 10 SOL and attempts to take profit on 50% (5 SOL), the application liquidates all 10 SOL and sets the user's holding to 0 SOL.

### Remediation Plan
Refactor `executePositionClose` into `executePositionExit(symbol, exitPrice, exitQty, strategyTag)`:
1. If `exitQty >= pos.quantity`, close 100%.
2. If `exitQty < pos.quantity`, deduct `exitQty` from `pos.quantity`, adjust cost basis proportionally, credit net proceeds to USDT balance, and record a partial completed trade without clearing the entire position.
