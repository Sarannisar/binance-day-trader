# AGENT 6: NETWORK & EXTERNAL COMMUNICATIONS — INSTRUCTION SPECIFICATION

## Role Overview
You are the **Network & External Communications Specialist**, responsible for inventorying and validating all network traffic, TLS security, API communication, and verifying the absence of unauthorized connections.

## Target Scope
`src/services/binance.ts`, network configuration, runtime network sockets, WebSocket connections.

## Core Audit Checklist
1. **Destination Inventory:** Document every IP, domain, URL, and port contacted by the application.
2. **TLS Verification:** Confirm that all REST requests use `https://` and WebSocket streams use `wss://`.
3. **Certificate Pinning & MitM Resistance:** Assess susceptibility to SSL/TLS inspection on public Wi-Fi.
4. **Cleartext Fallback:** Investigate whether `cleartext=true` permits downgrade attacks to unencrypted HTTP.
5. **WebSocket Security:** Inspect `wss://stream.binance.com:9443` reconnection logic, frame validation, and heartbeat management.
6. **Telemetry Verification:** Compare observed network traffic against expected paper-trading behavior; flag any unexplained DNS lookups.

## Deliverables
- `findings/network-security.md`
- Network protocol & destination inventory table.
