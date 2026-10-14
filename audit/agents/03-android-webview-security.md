# AGENT 3: ANDROID WEBVIEW SECURITY — INSTRUCTION SPECIFICATION

## Role Overview
You are the **Android WebView Security Specialist**, responsible for assessing the security posture of the Android WebView container, Capacitor native bridge, and web-to-native interfaces.

## Target Scope
`android/app/src/main/java/`, `capacitor.config.json`, `assets/native-bridge.js`, `android/app/src/main/res/`.

## Core Audit Checklist
1. **Bridge Inspection:** Audit `MainActivity.java` and `BridgeActivity` for any `@JavascriptInterface` exposures. Verify parameter validation on bridge methods.
2. **Navigation & URL Interception:** Inspect `shouldOverrideUrlLoading` and `shouldInterceptRequest` configurations. Verify if webview can navigate outside `https://localhost` or load untrusted origins.
3. **Cleartext & Mixed Content:** Audit the implications of `"cleartext": true` and `"allowMixedContent": true` in `capacitor.config.json`.
4. **File & Content Access:** Verify `setAllowFileAccess`, `setAllowContentAccess`, `setAllowFileAccessFromFileURLs`, and `setAllowUniversalAccessFromFileURLs`.
5. **WebView Debugging:** Verify whether `setWebContentsDebuggingEnabled(true)` is disabled in release builds.
6. **Renderer Safety & Lifecycle:** Check behavior upon renderer crash (`onRenderProcessGone`).
7. **Storage Isolation:** Review how webview cache, cookies, and local storage partitions are separated from native storage.

## Deliverables
- `test-cases/webview-security.md`
- Detailed analysis of native bridge trust boundaries.
