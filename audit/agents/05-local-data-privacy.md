# AGENT 5: LOCAL DATA AND PRIVACY — INSTRUCTION SPECIFICATION

## Role Overview
You are the **Local Data & Privacy Specialist**, responsible for verifying data storage security, data residency, encryption, export hygiene, and compliance with the local-only design mandate.

## Target Scope
`src/context/TradingContext.tsx`, `localStorage` usage, Android filesystem `/data/data/com.binancetrader.papertrading/`, CSV export logic.

## Core Audit Checklist
1. **Data at Rest:** Determine how trade history, balances, holdings, and settings are saved. Check whether encryption (e.g. EncryptedSharedPreferences, SQLCipher, Web Crypto API) is used.
2. **Device Sandbox Extraction:** Assess accessibility of `leveldb` storage via `run-as` in debuggable builds or root access.
3. **CSV Export Flow:** Verify that CSV generation in `TradeTrackerTab.tsx` properly sanitizes trade data against CSV Formula Injection (`=`, `+`, `-`, `@` leading characters).
4. **Data Deletion & Reset:** Verify `resetAccount()` implementation in `TradingContext.tsx` to ensure all storage keys are purged completely and cannot be resurrected.
5. **Logging & Diagnostics:** Search for `console.log`, `Log.d`, or error dumps printing sensitive financial data, trade sizes, or account balances.
6. **Telemetry & Beacons:** Confirm that no analytics, crash reporters, or advertising beacons collect journal data.

## Deliverables
- `test-cases/local-data-privacy.md`
- Storage encryption & CSV sanitization evaluation report.
