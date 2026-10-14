import type { CryptoPair } from '../types/trading';

export const SUPPORTED_PAIRS: CryptoPair[] = [
  {
    symbol: 'SOLUSDT',
    baseAsset: 'SOL',
    quoteAsset: 'USDT',
    name: 'Solana / Tether',
    priceDecimals: 2,
    qtyDecimals: 3,
    minQty: 0.01,
    minNotional: 5,
  },
  {
    symbol: 'BTCUSDT',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    name: 'Bitcoin / Tether',
    priceDecimals: 2,
    qtyDecimals: 5,
    minQty: 0.0001,
    minNotional: 10,
  },
  {
    symbol: 'ETHUSDT',
    baseAsset: 'ETH',
    quoteAsset: 'USDT',
    name: 'Ethereum / Tether',
    priceDecimals: 2,
    qtyDecimals: 4,
    minQty: 0.001,
    minNotional: 10,
  },
  {
    symbol: 'BNBUSDT',
    baseAsset: 'BNB',
    quoteAsset: 'USDT',
    name: 'BNB / Tether',
    priceDecimals: 2,
    qtyDecimals: 3,
    minQty: 0.01,
    minNotional: 5,
  },
  {
    symbol: 'DOGEUSDT',
    baseAsset: 'DOGE',
    quoteAsset: 'USDT',
    name: 'Dogecoin / Tether',
    priceDecimals: 4,
    qtyDecimals: 1,
    minQty: 10,
    minNotional: 5,
  }
];

export const DEFAULT_PAIR = SUPPORTED_PAIRS[0]; // SOLUSDT

export const TIMEFRAMES = [
  { label: '1m', value: '1m', seconds: 60 },
  { label: '5m', value: '5m', seconds: 300 },
  { label: '15m', value: '15m', seconds: 900 },
  { label: '1h', value: '1h', seconds: 3600 },
  { label: '4h', value: '4h', seconds: 14400 },
];
