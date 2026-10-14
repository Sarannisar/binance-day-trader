# LOW & INFORMATIONAL FINDINGS
**Project:** Binance SOL/USDT Day Trader & Paper Trading App  
**Audit Standard:** OWASP MASVS v2.0 / MASTG  
**Category:** Low Severity & Informational Hygiene Findings

---

## 1. SEC-LOW-01: Cross-Asset Order Cancellation State Corruption

### Metadata
- **Finding ID:** `SEC-LOW-01`
- **Severity:** Low (State Logic Defect)
- **Status:** **CONFIRMED**
- **Affected File:** [`src/context/TradingContext.tsx`](file:///c:/Users/SERVER-GSM/Desktop/trade/src/context/TradingContext.tsx#L554)

### Vulnerability Mechanism
In `cancelOrder()`:
```typescript
const cancelOrder = (orderId: string) => {
  const order = openOrders.find(o => o.id === orderId);
  if (!order) return;
  if (order.side === 'BUY') {
    ...
  } else {
    const baseAsset = selectedPair.baseAsset; // <--- BUG: references active UI dropdown, not order.symbol
    setHoldings(prev => ({
      ...prev,
      [baseAsset]: (prev[baseAsset] || 0) + order.quantity,
    }));
  }
};
```
If a user has a pending Limit Sell order for BTC, navigates to the SOL trading chart (`selectedPair.baseAsset === 'SOL'`), and cancels the BTC order, the refunded balance is added to SOL holdings instead of BTC holdings.

### Remediation Plan
Derive `baseAsset` directly from `order.symbol`:
```typescript
const baseAsset = order.symbol.replace('USDT', '');
```

---

## 2. SEC-LOW-02: Unvalidated Inverted Stop Loss Triggers Instant Liquidation

### Metadata
- **Finding ID:** `SEC-LOW-02`
- **Severity:** Low (Financial Logic Validation)
- **Status:** **CONFIRMED**
- **Affected File:** [`src/components/OrderPanel.tsx`](file:///c:/Users/SERVER-GSM/Desktop/trade/src/components/OrderPanel.tsx#L77-L106), [`TradingContext.tsx`](file:///c:/Users/SERVER-GSM/Desktop/trade/src/context/TradingContext.tsx#L224)

### Vulnerability Mechanism
Neither `OrderPanel.tsx` nor `TradingContext.tsx` verifies that `stopLossPrice < currentPrice` on a BUY order. If a user enters an inverted Stop Loss (e.g., current price is $150, but user types Stop Loss as $160), the tick matching engine immediately executes the position close on the next incoming tick:
```typescript
if (currentPos.stopLossPrice && latestPrice <= currentPos.stopLossPrice) {
  executePositionClose(...);
}
```

### Remediation Plan
In `OrderPanel.tsx`, add an input validation rule:
```typescript
if (orderSide === 'BUY' && parsedStopLoss && parsedStopLoss >= currentPrice) {
  setFeedback({ message: 'Stop Loss must be below current entry price for BUY orders.', isError: true });
  return;
}
```

---

## 3. SEC-LOW-03: Potential CSV Formula Injection on Negative PnL

### Metadata
- **Finding ID:** `SEC-LOW-03`
- **Severity:** Low (Formula Injection Defense)
- **Status:** **CONFIRMED**
- **Affected File:** [`src/components/TradeTrackerTab.tsx`](file:///c:/Users/SERVER-GSM/Desktop/trade/src/components/TradeTrackerTab.tsx#L55)

### Vulnerability Mechanism
When generating CSV output, numerical negative PnL values (such as `-12.50`) begin with a minus sign (`-`). While spreadsheet applications handle standard numbers safely, any string starting with `=`, `+`, `-`, or `@` can be interpreted as an executable formula or DDE link in Excel.

### Remediation Plan
Sanitize all values before concatenating into the CSV string:
```typescript
const sanitizeCSV = (val: any) => {
  const str = String(val);
  if (/^[=+\-@\t\r]/.test(str) && isNaN(Number(str))) {
    return `'${str}`;
  }
  return str;
};
```

---

## 4. SEC-INFO-01: Moderate Vulnerability in Dev-Dependency (`uuid`)

### Metadata
- **Finding ID:** `SEC-INFO-01`
- **Severity:** Informational
- **Status:** **CONFIRMED**
- **Affected File:** `package-lock.json`
- **Advisory:** GHSA-w5hq-g745-h8pq (`uuid < 11.1.1` via `@capacitor/cli -> xcode`)

### Assessment
This dependency is used exclusively by `@capacitor/cli` during iOS Xcode project manipulation. It is not bundled into the production JavaScript web assets and has zero effect on the Android APK.

---

## 5. SEC-INFO-02: ProGuard / R8 Bytecode Obfuscation Disabled

### Metadata
- **Finding ID:** `SEC-INFO-02`
- **Severity:** Informational (Hardening)
- **Status:** **CONFIRMED**
- **Affected File:** [`android/app/build.gradle`](file:///c:/Users/SERVER-GSM/Desktop/trade/android/app/build.gradle#L21)

### Assessment
`buildTypes.release.minifyEnabled false` is configured. While not an immediate vulnerability, enabling ProGuard/R8 reduces APK binary size and makes decompilation significantly harder for adversaries.
