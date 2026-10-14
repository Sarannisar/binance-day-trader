import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export interface NotificationPreferences {
  enabled: boolean;
  tradeFills: boolean;
  rsiAlerts: boolean;
  trendAlerts: boolean;
  strategyAlerts: boolean;
  priceBreakouts: boolean;
  sound: boolean;
  inAppBanner: boolean;
}

export interface InAppAlert {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'alert' | 'warning' | 'danger';
  timestamp: number;
}

const PREFS_STORAGE_KEY = 'paper_trade_notification_prefs';

const DEFAULT_PREFS: NotificationPreferences = {
  enabled: true,
  tradeFills: true,
  rsiAlerts: true,
  trendAlerts: true,
  strategyAlerts: true,
  priceBreakouts: true,
  sound: true,
  inAppBanner: true,
};

class NotificationService {
  private prefs: NotificationPreferences;
  private channelReady = false;
  private lastAlertTimes: Record<string, number> = {};
  private listeners: ((alert: InAppAlert) => void)[] = [];

  constructor() {
    this.prefs = this.loadPreferences();
    this.setupChannel();
  }

  public loadPreferences(): NotificationPreferences {
    try {
      const saved = localStorage.getItem(PREFS_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_PREFS, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return { ...DEFAULT_PREFS };
  }

  public savePreferences(newPrefs: Partial<NotificationPreferences>): NotificationPreferences {
    this.prefs = { ...this.prefs, ...newPrefs };
    try {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(this.prefs));
    } catch {
      // ignore storage errors
    }
    return this.prefs;
  }

  public getPreferences(): NotificationPreferences {
    return { ...this.prefs };
  }

  private async setupChannel() {
    if (!Capacitor.isNativePlatform() || this.channelReady) return;
    try {
      await LocalNotifications.createChannel({
        id: 'market_alerts',
        name: 'Market State & Trade Alerts',
        description: 'Instant notifications for trade execution and technical market conditions',
        importance: 5,
        visibility: 1,
        vibration: true,
      });
      this.channelReady = true;
    } catch {
      // Channel creation failed or not supported
    }
  }

  public async checkPermissions(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      try {
        const status = await LocalNotifications.checkPermissions();
        return status.display === 'granted';
      } catch {
        return false;
      }
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return true;
  }

  public async requestPermissions(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      try {
        await this.setupChannel();
        const result = await LocalNotifications.requestPermissions();
        return result.display === 'granted';
      } catch {
        return false;
      }
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        return result === 'granted';
      } catch {
        return false;
      }
    }
    return true;
  }

  public subscribeInApp(callback: (alert: InAppAlert) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private playTone(type: 'success' | 'alert' | 'warning' | 'danger') {
    if (!this.prefs.sound || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'success') {
        // Joyful chime for profit/order fill: 880Hz -> 1320Hz
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.14);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'danger') {
        // Warning tone for stop loss or sharp breakdown: 440Hz -> 330Hz
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(330, now + 0.2);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else {
        // Neutral market alert: 660Hz -> 880Hz
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch {
      // User hasn't interacted or audio context blocked
    }
  }

  public async sendAlert(options: {
    idKey?: string;
    title: string;
    body: string;
    type: 'success' | 'alert' | 'warning' | 'danger';
    minIntervalMs?: number; // Cooldown in ms
  }) {
    if (!this.prefs.enabled) return;

    // Throttle check
    const now = Date.now();
    if (options.idKey) {
      const last = this.lastAlertTimes[options.idKey] || 0;
      const minInterval = options.minIntervalMs ?? 180000; // default 3-minute cooldown
      if (now - last < minInterval) {
        return;
      }
      this.lastAlertTimes[options.idKey] = now;
    }

    // Sound
    this.playTone(options.type);

    // In-app banner event
    if (this.prefs.inAppBanner) {
      const alertItem: InAppAlert = {
        id: `alert_${now}_${Math.random().toString(36).substring(2, 6)}`,
        title: options.title,
        message: options.body,
        type: options.type,
        timestamp: now,
      };
      this.listeners.forEach(cb => {
        try {
          cb(alertItem);
        } catch {
          // ignore error
        }
      });
    }

    // Android Native Push Notification
    if (Capacitor.isNativePlatform()) {
      try {
        await this.setupChannel();
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Math.floor(Math.random() * 1000000),
              title: options.title,
              body: options.body,
              channelId: 'market_alerts',
              smallIcon: 'ic_launcher',
              sound: 'beep.wav',
            },
          ],
        });
      } catch (err) {
        console.warn('Failed to schedule local notification', err);
      }
    } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(options.title, { body: options.body, icon: '/favicon.png' });
      } catch {
        // web notification failed
      }
    }
  }

  // Helper: Trade Execution Alerts
  public notifyTradeFill(details: {
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'LIMIT' | 'TP' | 'SL';
    price: number;
    quantity: number;
    pnl?: number;
  }) {
    if (!this.prefs.tradeFills) return;

    let title = '';
    let body = '';
    let type: 'success' | 'alert' | 'warning' | 'danger' = 'success';

    const formattedPrice = `$${details.price.toFixed(2)}`;
    const formattedQty = `${details.quantity} ${details.symbol.replace('USDT', '')}`;

    if (details.type === 'TP') {
      title = `🎯 Take Profit Triggered (${details.symbol})`;
      body = `Target met! Sold ${formattedQty} @ ${formattedPrice} (Net PnL: +$${(details.pnl || 0).toFixed(2)})`;
      type = 'success';
    } else if (details.type === 'SL') {
      title = `🛡️ Stop Loss Triggered (${details.symbol})`;
      body = `Capital protected. Sold ${formattedQty} @ ${formattedPrice} (Net PnL: $${(details.pnl || 0).toFixed(2)})`;
      type = 'danger';
    } else {
      title = `✅ Limit ${details.side} Filled (${details.symbol})`;
      body = `Executed ${details.side} for ${formattedQty} @ ${formattedPrice}.`;
      type = 'success';
    }

    this.sendAlert({
      title,
      body,
      type,
    });
  }

  // Helper: Market State Alerts (RSI, EMA trend, Breakouts)
  public evaluateMarketState(params: {
    symbol: string;
    currentPrice: number;
    rsi: number | null;
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    signal: 'BUY_SETUP' | 'TAKE_PROFIT' | 'STOP_OUT' | 'WAIT';
    high24h?: number;
    low24h?: number;
    priceChangePercent?: number;
  }) {
    const { symbol, currentPrice, rsi, trend, signal, high24h, low24h } = params;

    // 1. RSI Extreme Alert
    if (this.prefs.rsiAlerts && rsi !== null) {
      if (rsi >= 70) {
        this.sendAlert({
          idKey: `${symbol}_RSI_HIGH`,
          title: `⚠️ ${symbol} Overbought (RSI ${rsi.toFixed(1)})`,
          body: `Market extended at $${currentPrice.toFixed(2)}. Watch for resistance or potential pullback.`,
          type: 'warning',
          minIntervalMs: 300000, // 5 min cooldown
        });
      } else if (rsi <= 30) {
        this.sendAlert({
          idKey: `${symbol}_RSI_LOW`,
          title: `⚡ ${symbol} Oversold (RSI ${rsi.toFixed(1)})`,
          body: `Price deeply discounted at $${currentPrice.toFixed(2)}. Potential technical bounce zone.`,
          type: 'alert',
          minIntervalMs: 300000, // 5 min cooldown
        });
      }
    }

    // 2. Trend Change Alert
    if (this.prefs.trendAlerts && trend !== 'NEUTRAL') {
      if (trend === 'BULLISH') {
        this.sendAlert({
          idKey: `${symbol}_TREND_BULLISH`,
          title: `🚀 ${symbol} Bullish Trend Active`,
          body: `Price ($${currentPrice.toFixed(2)}) above 50 EMA with bullish moving average alignment.`,
          type: 'success',
          minIntervalMs: 600000, // 10 min cooldown
        });
      } else if (trend === 'BEARISH') {
        this.sendAlert({
          idKey: `${symbol}_TREND_BEARISH`,
          title: `🔻 ${symbol} Bearish Trend Breakdown`,
          body: `Price ($${currentPrice.toFixed(2)}) trading below 50 EMA. Maintain capital discipline.`,
          type: 'danger',
          minIntervalMs: 600000, // 10 min cooldown
        });
      }
    }

    // 3. Strategy Setup Alert
    if (this.prefs.strategyAlerts && signal === 'BUY_SETUP') {
      this.sendAlert({
        idKey: `${symbol}_BUY_SETUP`,
        title: `🎯 Buy Setup Opportunity on ${symbol}`,
        body: `Bullish pullback confirmed at $${currentPrice.toFixed(2)} near 20 EMA/VWAP support.`,
        type: 'success',
        minIntervalMs: 300000, // 5 min cooldown
      });
    }

    // 4. 24h High/Low Price Breakout Alert
    if (this.prefs.priceBreakouts) {
      if (high24h && currentPrice >= high24h * 0.999) {
        this.sendAlert({
          idKey: `${symbol}_24H_HIGH`,
          title: `🔥 ${symbol} Testing 24H High`,
          body: `Trading at $${currentPrice.toFixed(2)}, right at the 24h peak ($${high24h.toFixed(2)})!`,
          type: 'alert',
          minIntervalMs: 600000,
        });
      } else if (low24h && currentPrice <= low24h * 1.001) {
        this.sendAlert({
          idKey: `${symbol}_24H_LOW`,
          title: `❄️ ${symbol} Testing 24H Low`,
          body: `Trading at $${currentPrice.toFixed(2)}, at the 24h floor ($${low24h.toFixed(2)}).`,
          type: 'warning',
          minIntervalMs: 600000,
        });
      }
    }
  }
}

export const notificationService = new NotificationService();
