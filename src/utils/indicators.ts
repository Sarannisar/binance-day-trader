import type { Candle, StrategyIndicators } from '../types/trading';

/**
 * Calculates Exponential Moving Average (EMA)
 */
export function calculateEMA(data: number[], period: number): number[] {
  if (data.length < period) return new Array(data.length).fill(NaN);
  
  const k = 2 / (period + 1);
  const ema: number[] = new Array(data.length).fill(NaN);
  
  // Simple moving average for the first point
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  ema[period - 1] = sum / period;
  
  // Calculate remaining EMAs
  for (let i = period; i < data.length; i++) {
    ema[i] = data[i] * k + ema[i - 1] * (1 - k);
  }
  
  return ema;
}

/**
 * Calculates Volume Weighted Average Price (VWAP)
 */
export function calculateVWAP(candles: Candle[]): number[] {
  const vwap: number[] = [];
  let cumulativeTypicalVolume = 0;
  let cumulativeVolume = 0;
  
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const typicalPrice = (c.high + c.low + c.close) / 3;
    cumulativeTypicalVolume += typicalPrice * c.volume;
    cumulativeVolume += c.volume;
    
    if (cumulativeVolume > 0) {
      vwap.push(cumulativeTypicalVolume / cumulativeVolume);
    } else {
      vwap.push(typicalPrice);
    }
  }
  
  return vwap;
}

/**
 * Calculates Relative Strength Index (RSI - 14)
 */
export function calculateRSI(closes: number[], period: number = 14): number[] {
  if (closes.length <= period) return new Array(closes.length).fill(50);
  
  const rsi: number[] = new Array(closes.length).fill(50);
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }
  
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    
    if (avgLoss === 0) {
      rsi[i + 1] = 100;
    } else {
      const rs = avgGain / avgLoss;
      rsi[i + 1] = 100 - (100 / (1 + rs));
    }
  }
  
  return rsi;
}

/**
 * Calculates Average True Range (ATR - 14) for dynamic volatility stops
 */
export function calculateATR(candles: Candle[], period: number = 14): number[] {
  if (candles.length < 2) return new Array(candles.length).fill(0);
  
  const trueRanges: number[] = [candles[0].high - candles[0].low];
  
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }
  
  return calculateEMA(trueRanges, period);
}

export interface ChartMarker {
  time: number;
  position: 'aboveBar' | 'belowBar' | 'inBar';
  color: string;
  shape: 'arrowUp' | 'arrowDown' | 'circle' | 'square';
  text: string;
  size?: number;
}

/**
 * Scans historical candles and generates visual BUY / SELL strategy markers for the chart
 */
export function generateStrategyMarkers(candles: Candle[]): ChartMarker[] {
  if (candles.length < 35) return [];

  const markers: ChartMarker[] = [];
  const closes = candles.map(c => c.close);
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const vwap = calculateVWAP(candles);
  const rsi = calculateRSI(closes, 14);

  let lastMarkerIndex = -10;
  let lastMarkerType: 'BUY' | 'SELL' | null = null;

  for (let i = 30; i < candles.length; i++) {
    const c = candles[i];
    const prevC = candles[i - 1];
    const e20 = ema20[i];
    const e50 = ema50[i];
    const vw = vwap[i];
    const r = rsi[i];

    if (isNaN(e20) || isNaN(e50) || isNaN(vw) || isNaN(r)) continue;

    // Cooldown: at least 4 candles between markers
    if (i - lastMarkerIndex < 4) continue;

    const isUptrend = c.close > e50 && e20 >= e50 * 0.998;
    const isDowntrend = c.close < e50 && e20 < e50;

    // BUY condition:
    // 1. Uptrend (Price > EMA 50)
    // 2. Pullback touches EMA 20 or VWAP (within 1.0% threshold)
    // 3. Healthy RSI bounce (between 38 and 62)
    // 4. Bullish confirmation bar (green candle or bounce)
    const touchesSupport = Math.abs(c.low - e20) / e20 < 0.01 || Math.abs(c.low - vw) / vw < 0.01;
    const isBullishCandle = c.close >= c.open && c.close >= prevC.close * 0.998;

    if (isUptrend && touchesSupport && r >= 38 && r <= 64 && isBullishCandle) {
      if (lastMarkerType !== 'BUY') {
        markers.push({
          time: c.time,
          position: 'belowBar',
          color: '#0ecb81',
          shape: 'arrowUp',
          text: 'BUY',
          size: 1,
        });
        lastMarkerIndex = i;
        lastMarkerType = 'BUY';
      }
    }
    // SELL / TAKE PROFIT condition:
    // 1. Overbought RSI (> 70) with red rejection candle
    // OR 2. Breakdown below EMA 50
    else if ((r > 70 && c.close < c.open) || (lastMarkerType === 'BUY' && isDowntrend)) {
      if (lastMarkerType !== 'SELL') {
        markers.push({
          time: c.time,
          position: 'aboveBar',
          color: '#f6465d',
          shape: 'arrowDown',
          text: 'SELL',
          size: 1,
        });
        lastMarkerIndex = i;
        lastMarkerType = 'SELL';
      }
    }
  }

  return markers;
}

/**
 * Strategy Analyzer: Evaluates Dynamic Trend, Pullbacks & Invalidation
 */
export function analyzeStrategy(candles: Candle[], currentPrice: number): StrategyIndicators {
  if (candles.length < 30) {
    return {
      ema20: null,
      ema50: null,
      vwap: null,
      rsi: null,
      atr: null,
      trend: 'NEUTRAL',
      signal: 'WAIT',
      signalReason: 'Insufficient candle data to establish trend.',
      suggestedStopLoss: null,
      suggestedTakeProfit: null,
      riskRewardRatio: null,
    };
  }
  
  const closes = candles.map(c => c.close);
  const ema20Arr = calculateEMA(closes, 20);
  const ema50Arr = calculateEMA(closes, 50);
  const vwapArr = calculateVWAP(candles);
  const rsiArr = calculateRSI(closes, 14);
  const atrArr = calculateATR(candles, 14);
  
  const lastIndex = candles.length - 1;
  const ema20 = ema20Arr[lastIndex] || currentPrice;
  const ema50 = ema50Arr[lastIndex] || currentPrice;
  const vwap = vwapArr[lastIndex] || currentPrice;
  const rsi = rsiArr[lastIndex] || 50;
  const atr = atrArr[lastIndex] || (currentPrice * 0.015);
  
  // Trend determination:
  // Bullish if Price > EMA 50 and EMA 20 > EMA 50
  // Bearish if Price < EMA 50 and EMA 20 < EMA 50
  let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  if (currentPrice > ema50 && ema20 >= ema50) {
    trend = 'BULLISH';
  } else if (currentPrice < ema50 && ema20 <= ema50) {
    trend = 'BEARISH';
  }
  
  // Calculate dynamic Stop Loss (1.5x ATR below entry)
  const stopLossDistance = atr * 1.5;
  const suggestedStopLoss = Math.max(0, currentPrice - stopLossDistance);
  
  // Target 1:2.5 Risk to Reward ratio to cleanly beat the 0.2% round-trip Binance fee
  const profitDistance = stopLossDistance * 2.5;
  const suggestedTakeProfit = currentPrice + profitDistance;
  const riskRewardRatio = 2.5;
  
  let signal: 'BUY_SETUP' | 'TAKE_PROFIT' | 'STOP_OUT' | 'WAIT' = 'WAIT';
  let signalReason = 'Waiting for high-probability value entry.';
  
  // Pullback detection:
  // In a Bullish Trend, price is near EMA 20 or VWAP (within 1.0% distance) and RSI is not overbought (< 65)
  const distToEMA20 = Math.abs(currentPrice - ema20) / ema20;
  const distToVWAP = Math.abs(currentPrice - vwap) / vwap;
  
  if (trend === 'BULLISH') {
    if (rsi > 72) {
      signal = 'TAKE_PROFIT';
      signalReason = 'Overextended (RSI > 72). Consider locking in profits; avoid entering new longs.';
    } else if ((distToEMA20 < 0.01 || distToVWAP < 0.01) && rsi >= 38 && rsi <= 64) {
      signal = 'BUY_SETUP';
      signalReason = `Bullish Pullback Confirmed: Price retesting 20 EMA / VWAP with healthy momentum (RSI ${rsi.toFixed(1)}). Risk/Reward is 1:${riskRewardRatio.toFixed(1)}.`;
    } else {
      signal = 'WAIT';
      signalReason = 'Uptrend intact, but price is mid-move. Wait for pullback to 20 EMA or VWAP before entering.';
    }
  } else if (trend === 'BEARISH') {
    signal = 'WAIT';
    signalReason = 'Downtrend active (Price below 50 EMA). Preserve capital in USDT. No spot buying permitted.';
  } else {
    signal = 'WAIT';
    signalReason = 'Market consolidating with low directional conviction. Stand aside.';
  }
  
  return {
    ema20,
    ema50,
    vwap,
    rsi,
    atr,
    trend,
    signal,
    signalReason,
    suggestedStopLoss,
    suggestedTakeProfit,
    riskRewardRatio,
  };
}
