# SCOPE & LIMITATIONS REPORT
**Project:** Binance SOL/USDT Day Trader & Paper Trading App  
**Package ID:** `com.binancetrader.papertrading`  
**Audit Phase:** Phase 1 — Discovery & Baseline Definition  
**Date:** October 14, 2026

---

## 1. Scope of the Phase 1 Audit

The Phase 1 audit was executed strictly under **Read-Only Audit Mode**, adhering to the non-negotiable guidelines.

### In-Scope Activities Conducted:
1. **Source Code Inspection:**
   - Full review of React 19 / TypeScript SPA source code in `src/`.
   - Inspection of entry points, state contexts, data storage hooks, indicator calculations, and network services.
   - Comprehensive search for DOM manipulation sinks (`dangerouslySetInnerHTML`, `innerHTML`, `eval()`).
   - Audit of JavaScript package manifests (`package.json`, `package-lock.json`).
2. **Android Wrapper Audit:**
   - Review of `capacitor.config.json`, Gradle build files (`build.gradle`, `variables.gradle`), and `MainActivity.java`.
   - Analysis of merged `AndroidManifest.xml`, permissions, exported components, and `FileProvider` path configs.
3. **APK Binary & Signature Audit:**
   - Cryptographic hashing (SHA-256) of `BinanceDayTrader.apk` and build artifacts.
   - Signature scheme and certificate inspection via Android SDK `apksigner`.
   - Binary package inspection via `aapt2` and Python ZIP/DEX parsers.
   - Discrepancy analysis between local build outputs (`dist/`) and packaged APK assets (`assets/public/`).
4. **Data Privacy & Storage Audit:**
   - Mapping of all `localStorage` keys and data schemas.
   - Verification of inbound and outbound network destinations.

---

## 2. Explicit Testing Limitations & Exclusions (Phase 1)

In compliance with the mandate to avoid unapproved or potentially destructive actions during Phase 1, the following tests were **NOT** performed during this phase:

| Testing Activity | Current Status | Reason / Justification |
| :--- | :--- | :--- |
| **Active Emulator / Device Execution** | **Deferred to Phase 2/3** | Requires user confirmation of baseline and approval of isolated test environment before APK installation. |
| **Live Network MitM Interception** | **Deferred to Phase 2/3** | Burp Suite / mitmproxy runtime interception requires active running instance with CA certificate injection. |
| **Code Refactoring & Patching** | **Prohibited in Phase 1** | Initial audit must remain read-only; remediation takes place in Phase 5. |
| **Dependency Upgrades (`npm audit fix`)** | **Prohibited in Phase 1** | Baseline lockfile and dependency tree must be preserved for accurate vulnerability tracking. |
| **Automated MobSF / JADX-GUI Scan** | **Tooling Limitation** | Neither MobSF nor JADX-GUI is pre-installed on host PATH. Static analysis was performed using native Android SDK CLI tools (`aapt2`, `apksigner`) and custom Python byte analyzers. |

---

## 3. Assumptions & Baseline Presumptions

1. **Exchange Trust:** Binance public API endpoints (`api.binance.com`, `stream.binance.com`) are assumed to deliver authentic market tick data when TLS is unbroken. The threat of forged market data is considered in the threat model under cleartext/MitM scenarios.
2. **Zero Backend Dependency:** The application is evaluated as a client-side-only paper trading journal; no cloud backend database exists to audit.
3. **Hardware Isolation:** The host machine running this audit is assumed to be an authorized development environment.

---

## 4. Criteria for Transition to Phase 2

Transition to Phase 2 (Specialist Audit Team Deployment) requires:
1. Complete delivery and user review of all Phase 1 documentation (`baseline.md`, `architecture.md`, `data-flow.md`, `threat-model.md`, `apk-inventory.md`, `scope-and-limitations.md`).
2. Approval of the proposed multi-agent configuration and assigned specialized audit responsibilities.
3. Confirmation of whether runtime emulator/device testing should be scheduled or if static verification is prioritized.
