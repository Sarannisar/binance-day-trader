# DISTRIBUTABLE APK INVENTORY & BINARY REPORT
**File Under Audit:** `BinanceDayTrader.apk`  
**Audit Phase:** Phase 1 — Binary & Manifest Verification  
**Date:** October 14, 2026  
**Auditor Mode:** Read-Only Verification

---

## 1. Cryptographic Identity & Metadata

| Attribute | Audited Value | Significance / Standard |
| :--- | :--- | :--- |
| **Primary File Path** | `C:\Users\SERVER-GSM\Desktop\trade\BinanceDayTrader.apk` | Master APK artifact in project root |
| **Secondary File Path** | `android\app\build\outputs\apk\debug\app-debug.apk` | Build output artifact (Identical) |
| **File Size (Compressed)** | **16,414,078 bytes** (~15.65 MB) | Total APK archive size |
| **File Size (Uncompressed)**| **22,590,365 bytes** (~21.54 MB) | Unzipped payload size |
| **SHA-256 Hash** | `BE7607C02567756BFCEFA233BFA36601607E4DC63FC44E7828C6B29A16F52311` | Immutable baseline hash |
| **Package ID** | `com.binancetrader.papertrading` | Application unique ID |
| **Version Code** | `1` | Build counter |
| **Version Name** | `1.0` | User-facing version string |
| **Minimum SDK** | `24` | Android 7.0 (Nougat) |
| **Target SDK** | `36` | Android 16 |
| **Compile SDK** | `36` | Android 16 |

---

## 2. Signature & Certificate Verification

Verified using Android SDK `apksigner verify --verbose --print-certs`:

```
Verified using v1 scheme (JAR signing): false
Verified using v2 scheme (APK Signature Scheme v2): true
Verified using v3 scheme (APK Signature Scheme v3): false
Verified using v4 scheme (APK Signature Scheme v4): false
Number of signers: 1
Signer #1 certificate DN: C=US, O=Android, CN=Android Debug
Signer #1 certificate SHA-256 digest: 99d6700cc8746bd98ee357dd205760547e728c65d7f331c1f293345b4ae363dd
Signer #1 certificate SHA-1 digest: 4eb24c790322c4755e7136eddbeecec1016bbdc2
Signer #1 certificate MD5 digest: 7171cafec9c8acdd89f0578f05210ffa
Signer #1 key algorithm: RSA (2048 bits)
```

> [!CAUTION]
> **Debug Signing Key Confirmed:**
> The APK is signed with the well-known Android Debug certificate (`CN=Android Debug`). Any app signed with a debug certificate:
> 1. Cannot be uploaded to Google Play or other production app distribution platforms.
> 2. Can easily be spoofed or replaced on a user's device by another debug APK.
> 3. Signals that the application has not been compiled under a hardened production release profile.

---

## 3. Archive Structure & Binary Payload Analysis

Summary of uncompressed sizes by directory/component inside `BinanceDayTrader.apk`:

| Archive Component | Uncompressed Size | Percentage | Description |
| :--- | :--- | :--- | :--- |
| `assets/` | 12,963,768 bytes | 57.38% | Packaged web assets, configs & **nested APK** |
| `classes.dex` | 8,398,240 bytes | 37.18% | AndroidX, Kotlin & Capacitor framework bytecode |
| `res/` | 535,468 bytes | 2.37% | Android XML layouts, icons, mipmaps |
| `resources.arsc` | 290,352 bytes | 1.29% | Compiled resource table |
| `classes3.dex` | 153,260 bytes | 0.68% | Secondary DEX table |
| `classes5.dex` | 132,364 bytes | 0.59% | Secondary DEX table |
| `classes4.dex` | 51,876 bytes | 0.23% | Secondary DEX table |
| `kotlin/` | 29,945 bytes | 0.13% | Kotlin metadata |
| `classes2.dex` | 21,820 bytes | 0.10% | Secondary DEX table |
| `AndroidManifest.xml` | 6,220 bytes | 0.03% | Compiled binary Android manifest |
| `classes6.dex` | 668 bytes | <0.01% | Secondary DEX table |
| `lib/` (Native `.so`) | **0 bytes** | **0.00%** | **No native C/C++ libraries present** |

---

## 4. Complete Inventory of Packaged Assets (`assets/`)

| File in APK Archive | Size (Bytes) | SHA-256 Hash | Notes |
| :--- | :--- | :--- | :--- |
| `assets/public/BinanceDayTrader.apk` | **12,350,687** | `A317801BCA0DD580150E1A171B4E9CEF2AC503F3D74FEC1217430B20F47DF745` | **ANOMALY:** Earlier APK build bundled inside the assets |
| `assets/public/assets/index-BMpCdL2r.js` | 489,287 | `919EEF7B2297351D00D8078A57164F5D85B02A14CB33F7F6A9990736566D6AAD` | React 19 + TradingView Web Application Bundle |
| `assets/native-bridge.js` | 53,118 | `E80C75D8DB73AC875F0D9BC073FFB03A5F456B75EEBFD32C55E1A1B283A49B0D` | Capacitor v8 Native JavaScript Bridge |
| `assets/public/assets/index-BvjG2gPp.css` | 30,186 | `FE5D6FE484210DDF967814CF325988A7BA5F7F85F8C625F06248F2F7FF2B02A8` | Tailwind CSS v4 compiled stylesheet |
| `assets/public/icon-512.png` | 20,081 | - | High-res icon asset |
| `assets/public/icon-192.png` | 6,743 | - | Mobile icon asset |
| `assets/public/icons.svg` | 5,031 | - | SVG icons sprite |
| `assets/public/logo.png` | 4,146 | - | Binance logo asset |
| `assets/public/favicon.png` | 2,115 | - | Favicon |
| `assets/public/index.html` | 1,064 | - | Web entry point |
| `assets/public/manifest.json` | 602 | - | PWA web app manifest |
| `assets/public/favicon.svg` | 465 | - | Vector favicon |
| `assets/capacitor.config.json` | 240 | - | Capacitor runtime config |
| `assets/capacitor.plugins.json` | 3 | - | Empty array `[]` (zero plugins) |
| `assets/public/cordova.js` | 0 | - | Empty stub |
| `assets/public/cordova_plugins.js` | 0 | - | Empty stub |

---

## 5. Source-to-Binary Parity Audit

We cross-verified whether the packaged web code matches the audited source code:

1. **JavaScript Bundle Parity:**
   - Source build output: `dist/assets/index-BMpCdL2r.js` (SHA-256: `919EEF7B2297351D00D8...`)
   - Packaged APK asset: `assets/public/assets/index-BMpCdL2r.js` (SHA-256: `919EEF7B2297351D00D8...`)
   - **Verdict:** **100% BIT-FOR-BIT MATCH**. No unauthorized code was injected into the JavaScript payload between `vite build` and APK packaging.

2. **DEX Bytecode Parity:**
   - Classes declared in DEX: `com.binancetrader.papertrading.MainActivity`, `com.getcapacitor.*`, `androidx.*`, `kotlin.*`.
   - **Verdict:** **MATCHES EXPECTED CAPACITOR RUNTIME**. No unauthorized third-party JARs or stealth DEX classes were found.

---

## 6. Manifest & Permission Configuration Summary

Extracted via `aapt2 dump badging`:

- **Requested Permissions:**
  - `android.permission.INTERNET` (Required for live Binance WebSocket & REST candles).
  - `com.binancetrader.papertrading.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` (Android 14+ internal broadcast protection).
  - *No unnecessary permissions requested* (no camera, no contacts, no location, no storage permissions).
- **Security Flags:**
  - `application-debuggable`: **PRESENT** (Insecure for release).
  - `allowBackup`: `true` (Insecure for private journal).
  - `usesCleartextTraffic`: `true` (Insecure for financial apps).
