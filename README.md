# 🚀 Binance SOL/USDT Day Trader & Paper Trading App

An institutional-grade spot day-trading simulator and risk management application built with **React**, **Vite**, **Tailwind CSS**, **TradingView Lightweight Charts**, and **Capacitor Android**.

![Status](https://img.shields.io/badge/Status-Production%20Ready-0ecb81)
![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Android%20APK-f0b90b)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## 📱 Features

- **Live Binance Market Feed:** Direct WebSocket streaming for real-time `SOL/USDT`, `BTC/USDT`, `ETH/USDT`, `BNB/USDT`, and `DOGE/USDT` (zero API keys required).
- **Automated Chart Signals:**
  - 🟢 **`▲ BUY` Markers:** Plotted when 50 EMA trend + 20 EMA/VWAP pullback + RSI momentum align.
  - 🔴 **`▼ SELL` Markers:** Plotted when overbought conditions (RSI > 70) or trend breakdown occur.
- **Dynamic 1-Tap "Apply Setup":** Dynamically syncs live market price with 1.5× ATR Stop Loss and 1:2.5 Take Profit target.
- **Binance 0.1% Fee Accounting:** Accurately deducts 0.10% on entry and 0.10% on exit (or 0.075% with BNB discount toggle).
- **Anti-All-In Risk Sizer:** Calculates the exact safe position size based on a 1.0%–2.0% account risk rule to protect capital.
- **Dedicated Performance Tracker:**
  - Net Profit/Loss ($ and %)
  - Win Rate gauge & Profit Factor
  - Cumulative Binance fees paid
  - Filterable trade log (`All`, `Wins`, `Losses`)
  - 1-click **CSV Export**
- **Plain-English Strategy Guide & 20-Trade Simulator:** Interactive coaching tool built directly into the app.
- **Standalone Android APK:** Fully compiled native Android app packaged with Capacitor (`BinanceDayTrader.apk`).

---

## 📦 Standalone Android APK Download

The standalone native APK installer is included in the root of this repository:
- **File:** [`BinanceDayTrader.apk`](./BinanceDayTrader.apk) (~12 MB)
- Transfer it to any Android phone and tap to install. Runs standalone without needing a PC.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Charting Engine:** TradingView `lightweight-charts` v5
- **Mobile Engine:** Capacitor v7 Android Native Bridge
- **Market Data:** Binance Public WebSocket & REST API

---

## 🚀 Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build production web bundle
npm run build

# Sync web assets to Android
npx cap sync android

# Build Android APK
cd android
./gradlew assembleDebug
```
