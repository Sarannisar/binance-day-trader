import type { Candle, TickerData } from '../types/trading';

const BINANCE_REST_ENDPOINTS = [
  'https://api.binance.com/api/v3',
  'https://data-api.binance.vision/api/v3',
  'https://api1.binance.com/api/v3',
];

const BINANCE_WS_ENDPOINT = 'wss://stream.binance.com:9443/ws';

export class BinanceService {
  private ws: WebSocket | null = null;
  private tickerWs: WebSocket | null = null;
  private symbol: string = 'SOLUSDT';
  private interval: string = '5m';
  private onCandleUpdate: ((candle: Candle, isClosed: boolean) => void) | null = null;
  private onTickerUpdate: ((ticker: TickerData) => void) | null = null;
  private reconnectTimeout: number | null = null;

  /**
   * Fetches historical candlestick data
   */
  async fetchHistoricalKlines(symbol: string, interval: string, limit: number = 100): Promise<Candle[]> {
    this.symbol = symbol.toUpperCase();
    this.interval = interval;

    for (const baseUrl of BINANCE_REST_ENDPOINTS) {
      try {
        const url = `${baseUrl}/klines?symbol=${this.symbol}&interval=${this.interval}&limit=${limit}`;
        const res = await fetch(url);
        if (!res.ok) continue;

        const data = await res.json();
        return data.map((d: any[]) => ({
          time: Math.floor(d[0] / 1000), // convert ms to seconds for lightweight-charts
          open: parseFloat(d[1]),
          high: parseFloat(d[2]),
          low: parseFloat(d[3]),
          close: parseFloat(d[4]),
          volume: parseFloat(d[5]),
        }));
      } catch (err) {
        console.warn(`Failed fetching from ${baseUrl}:`, err);
      }
    }

    // Fallback simulated candles if network fails or offline
    console.warn('Network offline or Binance blocked; generating simulated baseline candles.');
    return this.generateSimulatedCandles(symbol, limit);
  }

  /**
   * Subscribes to live WebSocket price feeds
   */
  subscribe(
    symbol: string,
    interval: string,
    onCandle: (candle: Candle, isClosed: boolean) => void,
    onTicker: (ticker: TickerData) => void
  ) {
    this.symbol = symbol.toUpperCase();
    this.interval = interval;
    this.onCandleUpdate = onCandle;
    this.onTickerUpdate = onTicker;

    this.disconnect();
    this.connectKlineWs();
    this.connectTickerWs();
  }

  private connectKlineWs() {
    try {
      const streamName = `${this.symbol.toLowerCase()}@kline_${this.interval}`;
      const url = `${BINANCE_WS_ENDPOINT}/${streamName}`;
      
      this.ws = new WebSocket(url);

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.k) {
            const k = msg.k;
            const candle: Candle = {
              time: Math.floor(k.t / 1000),
              open: parseFloat(k.o),
              high: parseFloat(k.h),
              low: parseFloat(k.l),
              close: parseFloat(k.c),
              volume: parseFloat(k.v),
            };
            const isClosed = k.x;
            if (this.onCandleUpdate) {
              this.onCandleUpdate(candle, isClosed);
            }
          }
        } catch (e) {
          console.error('Error parsing kline ws message:', e);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('Binance Kline WS error:', err);
      };

      this.ws.onclose = () => {
        this.scheduleReconnect();
      };
    } catch (e) {
      console.error('Error initializing Kline WebSocket:', e);
    }
  }

  private connectTickerWs() {
    try {
      const streamName = `${this.symbol.toLowerCase()}@ticker`;
      const url = `${BINANCE_WS_ENDPOINT}/${streamName}`;

      this.tickerWs = new WebSocket(url);

      this.tickerWs.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.s) {
            const ticker: TickerData = {
              symbol: msg.s,
              price: parseFloat(msg.c),
              priceChange: parseFloat(msg.p),
              priceChangePercent: parseFloat(msg.P),
              high24h: parseFloat(msg.h),
              low24h: parseFloat(msg.l),
              volume24h: parseFloat(msg.v),
              quoteVolume24h: parseFloat(msg.q),
            };
            if (this.onTickerUpdate) {
              this.onTickerUpdate(ticker);
            }
          }
        } catch (e) {
          console.error('Error parsing ticker ws message:', e);
        }
      };

      this.tickerWs.onerror = (err) => {
        console.warn('Binance Ticker WS error:', err);
      };

      this.tickerWs.onclose = () => {
        this.scheduleReconnect();
      };
    } catch (e) {
      console.error('Error initializing Ticker WebSocket:', e);
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return;
    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectTimeout = null;
      if (this.onCandleUpdate && this.onTickerUpdate) {
        this.connectKlineWs();
        this.connectTickerWs();
      }
    }, 4000);
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    if (this.tickerWs) {
      this.tickerWs.onclose = null;
      this.tickerWs.close();
      this.tickerWs = null;
    }
  }

  /**
   * Generates realistic simulated candle movement if network is offline
   */
  private generateSimulatedCandles(symbol: string, count: number): Candle[] {
    const basePrice = symbol.includes('SOL') ? 155.0 : symbol.includes('BTC') ? 68000.0 : 2600.0;
    const candles: Candle[] = [];
    let current = basePrice;
    const now = Math.floor(Date.now() / 1000);
    const stepSeconds = 300;

    for (let i = count; i >= 0; i--) {
      const time = now - i * stepSeconds;
      const change = (Math.random() - 0.49) * (basePrice * 0.008);
      const open = current;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * (basePrice * 0.004);
      const low = Math.min(open, close) - Math.random() * (basePrice * 0.004);
      const volume = Math.random() * 5000 + 1000;
      candles.push({ time, open, high, low, close, volume });
      current = close;
    }

    return candles;
  }
}

export const binanceService = new BinanceService();
