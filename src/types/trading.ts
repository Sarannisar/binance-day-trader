export interface CryptoPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  name: string;
  priceDecimals: number;
  qtyDecimals: number;
  minQty: number;
  minNotional: number; // Minimum USDT trade value (Binance requires $5 or $10)
}

export interface Candle {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TickerData {
  symbol: string;
  price: number;
  priceChange: number;
  priceChangePercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume24h: number;
}

export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'TAKE_PROFIT';
export type OrderSide = 'BUY' | 'SELL';
export type OrderStatus = 'NEW' | 'FILLED' | 'CANCELLED' | 'REJECTED';

export interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  price: number; // Execution price or limit price
  quantity: number; // In base asset (e.g. SOL)
  totalValue: number; // USDT
  triggerPrice?: number; // For stop-loss or take-profit
  fee: number; // In USDT (0.10% or 0.075%)
  feeRate: number; // 0.001 or 0.00075
  status: OrderStatus;
  createdAt: number;
  filledAt?: number;
}

export interface Position {
  symbol: string;
  quantity: number; // Amount of SOL held
  avgEntryPrice: number;
  totalCost: number; // Total USDT spent (including entry fee)
  entryFeePaid: number;
  currentPrice: number;
  currentValue: number;
  unrealizedGrossPnl: number;
  unrealizedGrossPnlPercent: number;
  estimatedExitFee: number;
  unrealizedNetPnl: number;
  unrealizedNetPnlPercent: number;
  stopLossPrice?: number;
  takeProfitPrice?: number;
}

export interface CompletedTrade {
  id: string;
  symbol: string;
  side: OrderSide;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  grossPnl: number;
  grossPnlPercent: number;
  feesPaid: number; // Total entry fee + exit fee
  netPnl: number;
  netPnlPercent: number;
  entryTime: number;
  exitTime: number;
  durationSeconds: number;
  strategyTag?: string;
}

export interface StrategyIndicators {
  ema20: number | null;
  ema50: number | null;
  vwap: number | null;
  rsi: number | null;
  atr: number | null;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  signal: 'BUY_SETUP' | 'TAKE_PROFIT' | 'STOP_OUT' | 'WAIT';
  signalReason: string;
  suggestedStopLoss: number | null;
  suggestedTakeProfit: number | null;
  riskRewardRatio: number | null;
}

export interface RiskSettings {
  accountBalance: number;
  riskPercentPerTrade: number; // Recommended 1.0% - 2.0%
  useBnbFeeDiscount: boolean; // 0.075% if true, 0.10% if false
  maxAllInWarning: boolean;
  slippagePercent: number; // 0.02% simulated slippage
}
