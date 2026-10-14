import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import type {
  CryptoPair,
  Candle,
  TickerData,
  Order,
  Position,
  CompletedTrade,
  StrategyIndicators,
  RiskSettings,
  OrderSide,
} from '../types/trading';
import { DEFAULT_PAIR } from '../constants/pairs';
import { binanceService } from '../services/binance';
import { analyzeStrategy } from '../utils/indicators';
import { notificationService } from '../services/notificationService';

interface TradingContextType {
  selectedPair: CryptoPair;
  setSelectedPair: (pair: CryptoPair) => void;
  timeframe: string;
  setTimeframe: (tf: string) => void;
  candles: Candle[];
  currentTicker: TickerData | null;
  strategy: StrategyIndicators;
  
  // Wallet & Positions
  usdtBalance: number;
  holdings: Record<string, number>;
  initialBalance: number;
  permanentInitialBalance: number;
  setPermanentInitialBalance: (amount: number, updateCurrentUsdt?: boolean) => void;
  positions: Record<string, Position>;
  currentPosition: Position | null;
  totalPortfolioValue: number;
  
  // Orders & Trades
  openOrders: Order[];
  completedTrades: CompletedTrade[];
  
  // Risk & Settings
  riskSettings: RiskSettings;
  updateRiskSettings: (settings: Partial<RiskSettings>) => void;
  
  // Actions
  placeMarketBuy: (usdtAmount: number, stopLossPrice?: number, takeProfitPrice?: number) => { success: boolean; message: string };
  placeMarketSell: (qtyPercent?: number) => { success: boolean; message: string };
  placeLimitOrder: (side: OrderSide, price: number, qty: number, stopLoss?: number, takeProfit?: number) => { success: boolean; message: string };
  cancelOrder: (orderId: string) => void;
  closeCurrentPosition: () => void;
  resetAccount: (initialUsdt?: number) => void;
  
  // Stats
  totalFeesPaid: number;
  netRealizedPnl: number;
  winRate: number;
}

const STORAGE_KEYS = {
  BALANCE: 'paper_trade_usdt_balance',
  HOLDINGS: 'paper_trade_holdings',
  INITIAL_BAL: 'paper_trade_initial_balance',
  PERM_INITIAL_BAL: 'paper_trade_permanent_initial_balance',
  ORDERS: 'paper_trade_open_orders',
  TRADES: 'paper_trade_completed_trades',
  POSITIONS: 'paper_trade_positions',
  SETTINGS: 'paper_trade_risk_settings',
};

const DEFAULT_INITIAL_BALANCE = 2000; // $2,000 USDT default paper trading starting balance

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedPair, setSelectedPair] = useState<CryptoPair>(DEFAULT_PAIR);
  const [timeframe, setTimeframe] = useState<string>('5m');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [currentTicker, setCurrentTicker] = useState<TickerData | null>(null);

  // Persistent States
  const [permanentInitialBalance, setPermanentInitialBalanceState] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PERM_INITIAL_BAL);
    if (saved) return parseFloat(saved);
    const initialBal = localStorage.getItem(STORAGE_KEYS.INITIAL_BAL);
    return initialBal ? parseFloat(initialBal) : DEFAULT_INITIAL_BALANCE;
  });

  const [initialBalance, setInitialBalance] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INITIAL_BAL);
    if (saved) return parseFloat(saved);
    const perm = localStorage.getItem(STORAGE_KEYS.PERM_INITIAL_BAL);
    return perm ? parseFloat(perm) : DEFAULT_INITIAL_BALANCE;
  });

  const [usdtBalance, setUsdtBalance] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BALANCE);
    return saved ? parseFloat(saved) : DEFAULT_INITIAL_BALANCE;
  });

  const setPermanentInitialBalance = (amount: number, updateCurrentUsdt: boolean = false) => {
    const cleanAmount = Math.max(1, amount);
    setPermanentInitialBalanceState(cleanAmount);
    setInitialBalance(cleanAmount);
    localStorage.setItem(STORAGE_KEYS.PERM_INITIAL_BAL, cleanAmount.toString());
    localStorage.setItem(STORAGE_KEYS.INITIAL_BAL, cleanAmount.toString());
    if (updateCurrentUsdt) {
      setUsdtBalance(cleanAmount);
      localStorage.setItem(STORAGE_KEYS.BALANCE, cleanAmount.toString());
    }
  };

  const [holdings, setHoldings] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HOLDINGS);
    return saved ? JSON.parse(saved) : { SOL: 0, BTC: 0, ETH: 0, BNB: 0, DOGE: 0 };
  });

  const [positions, setPositions] = useState<Record<string, Position>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.POSITIONS);
    return saved ? JSON.parse(saved) : {};
  });

  const [openOrders, setOpenOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return saved ? JSON.parse(saved) : [];
  });

  const [completedTrades, setCompletedTrades] = useState<CompletedTrade[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRADES);
    return saved ? JSON.parse(saved) : [];
  });

  const [riskSettings, setRiskSettings] = useState<RiskSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved
      ? JSON.parse(saved)
      : {
          accountBalance: DEFAULT_INITIAL_BALANCE,
          riskPercentPerTrade: 1.5,
          useBnbFeeDiscount: false, // 0.10% Binance standard default
          maxAllInWarning: true,
          slippagePercent: 0.02,
        };
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BALANCE, usdtBalance.toString());
  }, [usdtBalance]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INITIAL_BAL, initialBalance.toString());
  }, [initialBalance]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PERM_INITIAL_BAL, permanentInitialBalance.toString());
  }, [permanentInitialBalance]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HOLDINGS, JSON.stringify(holdings));
  }, [holdings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(positions));
  }, [positions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(openOrders));
  }, [openOrders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(completedTrades));
  }, [completedTrades]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(riskSettings));
  }, [riskSettings]);

  // Fee rate calculation
  const currentFeeRate = riskSettings.useBnbFeeDiscount ? 0.00075 : 0.0010; // 0.075% vs 0.10%

  // Load Klines and Subscribe to Binance WebSockets
  useEffect(() => {
    let isSubscribed = true;

    async function loadData() {
      const historical = await binanceService.fetchHistoricalKlines(selectedPair.symbol, timeframe, 120);
      if (isSubscribed) {
        setCandles(historical);
        if (historical.length > 0) {
          const last = historical[historical.length - 1];
          setCurrentTicker((prev) => ({
            symbol: selectedPair.symbol,
            price: last.close,
            priceChange: last.close - last.open,
            priceChangePercent: ((last.close - last.open) / last.open) * 100,
            high24h: Math.max(...historical.map(c => c.high)),
            low24h: Math.min(...historical.map(c => c.low)),
            volume24h: historical.reduce((acc, c) => acc + c.volume, 0),
            quoteVolume24h: historical.reduce((acc, c) => acc + c.volume * c.close, 0),
            ...prev,
          }));
        }
      }

      binanceService.subscribe(
        selectedPair.symbol,
        timeframe,
        (candle) => {
          if (!isSubscribed) return;
          setCandles((prevCandles) => {
            if (prevCandles.length === 0) return [candle];
            const last = prevCandles[prevCandles.length - 1];
            if (last.time === candle.time) {
              const copy = [...prevCandles];
              copy[copy.length - 1] = candle;
              return copy;
            } else if (candle.time > last.time) {
              return [...prevCandles.slice(1), candle];
            }
            return prevCandles;
          });
        },
        (ticker) => {
          if (!isSubscribed) return;
          setCurrentTicker(ticker);
        }
      );
    }

    loadData();

    return () => {
      isSubscribed = false;
      binanceService.disconnect();
    };
  }, [selectedPair.symbol, timeframe]);

  // Strategy Analysis on candle update
  const strategy = useMemo(() => {
    const price = currentTicker?.price || (candles.length > 0 ? candles[candles.length - 1].close : 0);
    return analyzeStrategy(candles, price);
  }, [candles, currentTicker?.price]);

  // Monitor & Notify Market State Changes (RSI, Trends, 24h Extrema, Strategy Setups)
  useEffect(() => {
    if (!currentTicker || currentTicker.price <= 0) return;
    notificationService.evaluateMarketState({
      symbol: selectedPair.symbol,
      currentPrice: currentTicker.price,
      rsi: strategy.rsi,
      trend: strategy.trend,
      signal: strategy.signal,
      high24h: currentTicker.high24h,
      low24h: currentTicker.low24h,
      priceChangePercent: currentTicker.priceChangePercent,
    });
  }, [selectedPair.symbol, currentTicker?.price, strategy.rsi, strategy.trend, strategy.signal, currentTicker?.high24h, currentTicker?.low24h, currentTicker?.priceChangePercent]);

  // Real-time Order Matching Engine & TP/SL Trigger
  const latestPrice = currentTicker?.price || 0;
  const isMatchingRef = useRef(false);

  useEffect(() => {
    if (latestPrice <= 0 || isMatchingRef.current) return;
    isMatchingRef.current = true;

    try {
      // 1. Check open position automatic Stop Loss & Take Profit
      const currentPos = positions[selectedPair.symbol];
      if (currentPos && currentPos.quantity > 0) {
        // Trigger Stop Loss
        if (currentPos.stopLossPrice && latestPrice <= currentPos.stopLossPrice) {
          executePositionClose(
            selectedPair.symbol,
            latestPrice,
            'Automated Stop Loss triggered to protect capital'
          );
        }
        // Trigger Take Profit
        else if (currentPos.takeProfitPrice && latestPrice >= currentPos.takeProfitPrice) {
          executePositionClose(
            selectedPair.symbol,
            latestPrice,
            'Automated Take Profit target achieved'
          );
        }
      }

      // 2. Check open limit & trigger orders
      if (openOrders.length > 0) {
        const remainingOrders: Order[] = [];
        let balanceDelta = 0;
        const newCompletedTrades: CompletedTrade[] = [];

        for (const order of openOrders) {
          if (order.symbol !== selectedPair.symbol) {
            remainingOrders.push(order);
            continue;
          }

          let filled = false;
          let fillPrice = order.price;

          if (order.side === 'BUY' && order.type === 'LIMIT' && latestPrice <= order.price) {
            filled = true;
            fillPrice = order.price;
          } else if (order.side === 'SELL' && order.type === 'LIMIT' && latestPrice >= order.price) {
            filled = true;
            fillPrice = order.price;
          }

          if (filled) {
            const executionValue = order.quantity * fillPrice;
            const fee = executionValue * order.feeRate;

            if (order.side === 'BUY') {
              // Buy filled
              const baseAsset = selectedPair.baseAsset;
              setHoldings(prev => ({
                ...prev,
                [baseAsset]: (prev[baseAsset] || 0) + order.quantity
              }));

              // Update position
              setPositions(prev => {
                const existing = prev[selectedPair.symbol];
                if (existing && existing.quantity > 0) {
                  const newQty = existing.quantity + order.quantity;
                  const newCost = existing.totalCost + executionValue + fee;
                  return {
                    ...prev,
                    [selectedPair.symbol]: {
                      ...existing,
                      quantity: newQty,
                      totalCost: newCost,
                      avgEntryPrice: newCost / newQty,
                      entryFeePaid: existing.entryFeePaid + fee,
                    }
                  };
                } else {
                  return {
                    ...prev,
                    [selectedPair.symbol]: {
                      symbol: selectedPair.symbol,
                      quantity: order.quantity,
                      avgEntryPrice: fillPrice,
                      totalCost: executionValue + fee,
                      entryFeePaid: fee,
                      currentPrice: fillPrice,
                      currentValue: executionValue,
                      unrealizedGrossPnl: 0,
                      unrealizedGrossPnlPercent: 0,
                      estimatedExitFee: fee,
                      unrealizedNetPnl: -fee * 2,
                      unrealizedNetPnlPercent: (-fee * 2 / executionValue) * 100,
                    }
                  };
                }
              });

              notificationService.notifyTradeFill({
                symbol: selectedPair.symbol,
                side: 'BUY',
                type: 'LIMIT',
                price: fillPrice,
                quantity: order.quantity,
              });
            } else {
              // Sell filled
              const baseAsset = selectedPair.baseAsset;
              const grossProceeds = executionValue;
              const netProceeds = grossProceeds - fee;
              balanceDelta += netProceeds;

              setHoldings(prev => ({
                ...prev,
                [baseAsset]: Math.max(0, (prev[baseAsset] || 0) - order.quantity)
              }));

              const existingPos = positions[selectedPair.symbol];
              const costBasis = existingPos ? existingPos.avgEntryPrice * order.quantity : executionValue;
              const grossPnl = grossProceeds - costBasis;
              const totalFees = (existingPos ? (existingPos.entryFeePaid * (order.quantity / existingPos.quantity)) : fee) + fee;
              const netPnl = grossPnl - totalFees;

              newCompletedTrades.push({
                id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                symbol: selectedPair.symbol,
                side: 'SELL',
                entryPrice: existingPos ? existingPos.avgEntryPrice : fillPrice,
                exitPrice: fillPrice,
                quantity: order.quantity,
                grossPnl,
                grossPnlPercent: (grossPnl / costBasis) * 100,
                feesPaid: totalFees,
                netPnl,
                netPnlPercent: (netPnl / costBasis) * 100,
                entryTime: order.createdAt,
                exitTime: Date.now(),
                durationSeconds: Math.floor((Date.now() - order.createdAt) / 1000),
                strategyTag: 'Limit Order Fill'
              });

              notificationService.notifyTradeFill({
                symbol: selectedPair.symbol,
                side: 'SELL',
                type: 'LIMIT',
                price: fillPrice,
                quantity: order.quantity,
                pnl: netPnl,
              });
            }
          } else {
            remainingOrders.push(order);
          }
        }

        if (balanceDelta > 0) {
          setUsdtBalance(prev => prev + balanceDelta);
        }
        if (newCompletedTrades.length > 0) {
          setCompletedTrades(prev => [...newCompletedTrades, ...prev]);
        }
        setOpenOrders(remainingOrders);
      }
    } finally {
      isMatchingRef.current = false;
    }
  }, [latestPrice, selectedPair.symbol, openOrders, positions]);

  // Execute full or partial position close
  const executePositionClose = (
    symbol: string,
    exitPrice: number,
    strategyTag: string,
    closeFraction: number = 1
  ) => {
    const pos = positions[symbol];
    if (!pos || pos.quantity <= 0) return;

    const fraction = Math.min(1, Math.max(0.01, closeFraction));
    const isFullClose = fraction >= 0.999;
    const exitQty = isFullClose ? pos.quantity : pos.quantity * fraction;

    const grossValue = exitQty * exitPrice;
    const exitFee = grossValue * currentFeeRate;
    const netProceeds = grossValue - exitFee;
    const entryFeeShare = isFullClose ? pos.entryFeePaid : pos.entryFeePaid * fraction;
    const totalFees = entryFeeShare + exitFee;
    const costBasis = isFullClose ? pos.totalCost : pos.totalCost * fraction;
    const grossPnl = grossValue - (pos.avgEntryPrice * exitQty);
    const netPnl = grossPnl - totalFees;

    // Credit USDT balance
    setUsdtBalance(prev => prev + netProceeds);

    // Update holding
    const baseAsset = symbol.replace('USDT', '');
    setHoldings(prev => ({
      ...prev,
      [baseAsset]: isFullClose ? 0 : Math.max(0, (prev[baseAsset] || 0) - exitQty),
    }));

    // Record completed trade
    const completedTrade: CompletedTrade = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      symbol: symbol,
      side: 'SELL',
      entryPrice: pos.avgEntryPrice,
      exitPrice: exitPrice,
      quantity: exitQty,
      grossPnl,
      grossPnlPercent: costBasis > 0 ? (grossPnl / costBasis) * 100 : 0,
      feesPaid: totalFees,
      netPnl,
      netPnlPercent: costBasis > 0 ? (netPnl / costBasis) * 100 : 0,
      entryTime: Date.now() - 60000,
      exitTime: Date.now(),
      durationSeconds: 60,
      strategyTag: strategyTag,
    };

    setCompletedTrades(prev => [completedTrade, ...prev]);

    // Trigger notification if automated Stop Loss or Take Profit
    if (strategyTag.includes('Stop Loss')) {
      notificationService.notifyTradeFill({
        symbol,
        side: 'SELL',
        type: 'SL',
        price: exitPrice,
        quantity: exitQty,
        pnl: netPnl,
      });
    } else if (strategyTag.includes('Take Profit')) {
      notificationService.notifyTradeFill({
        symbol,
        side: 'SELL',
        type: 'TP',
        price: exitPrice,
        quantity: exitQty,
        pnl: netPnl,
      });
    }

    // Update active position
    setPositions(prev => {
      const copy = { ...prev };
      if (isFullClose) {
        delete copy[symbol];
      } else {
        const remainingQty = pos.quantity - exitQty;
        const remainingCost = pos.totalCost - costBasis;
        copy[symbol] = {
          ...pos,
          quantity: remainingQty,
          totalCost: remainingCost,
          entryFeePaid: pos.entryFeePaid - entryFeeShare,
          currentPrice: exitPrice,
          currentValue: remainingQty * exitPrice,
          unrealizedGrossPnl: (remainingQty * exitPrice) - remainingCost,
        };
      }
      return copy;
    });
  };

  // Place Market Buy
  const placeMarketBuy = (usdtAmount: number, stopLossPrice?: number, takeProfitPrice?: number) => {
    if (usdtAmount <= 0) return { success: false, message: 'Invalid trade amount.' };
    if (usdtAmount > usdtBalance) {
      return { success: false, message: 'Insufficient USDT balance.' };
    }
    if (latestPrice <= 0) {
      return { success: false, message: 'Awaiting live Binance price.' };
    }

    // Apply simulated slippage (0.02%)
    const executionPrice = latestPrice * (1 + riskSettings.slippagePercent / 100);
    const entryFee = usdtAmount * currentFeeRate;
    const netUsdtForCrypto = usdtAmount - entryFee;
    const cryptoQty = netUsdtForCrypto / executionPrice;

    // Deduct USDT from wallet
    setUsdtBalance(prev => prev - usdtAmount);

    // Add crypto holding
    const baseAsset = selectedPair.baseAsset;
    setHoldings(prev => ({
      ...prev,
      [baseAsset]: (prev[baseAsset] || 0) + cryptoQty,
    }));

    // Update active position
    setPositions(prev => {
      const existing = prev[selectedPair.symbol];
      if (existing && existing.quantity > 0) {
        const combinedQty = existing.quantity + cryptoQty;
        const combinedCost = existing.totalCost + usdtAmount;
        return {
          ...prev,
          [selectedPair.symbol]: {
            ...existing,
            quantity: combinedQty,
            totalCost: combinedCost,
            avgEntryPrice: combinedCost / combinedQty,
            entryFeePaid: existing.entryFeePaid + entryFee,
            stopLossPrice: stopLossPrice ?? existing.stopLossPrice,
            takeProfitPrice: takeProfitPrice ?? existing.takeProfitPrice,
          }
        };
      } else {
        return {
          ...prev,
          [selectedPair.symbol]: {
            symbol: selectedPair.symbol,
            quantity: cryptoQty,
            avgEntryPrice: executionPrice,
            totalCost: usdtAmount,
            entryFeePaid: entryFee,
            currentPrice: executionPrice,
            currentValue: netUsdtForCrypto,
            unrealizedGrossPnl: 0,
            unrealizedGrossPnlPercent: 0,
            estimatedExitFee: entryFee,
            unrealizedNetPnl: -entryFee,
            unrealizedNetPnlPercent: (-entryFee / usdtAmount) * 100,
            stopLossPrice,
            takeProfitPrice,
          }
        };
      }
    });

    return {
      success: true,
      message: `Bought ${cryptoQty.toFixed(4)} ${baseAsset} @ $${executionPrice.toFixed(2)}. Binance fee: $${entryFee.toFixed(3)}.`
    };
  };

  // Place Market Sell (Partial or 100%)
  const placeMarketSell = (qtyPercent: number = 100) => {
    const baseAsset = selectedPair.baseAsset;
    const currentQty = holdings[baseAsset] || 0;
    if (currentQty <= 0) return { success: false, message: `No ${baseAsset} to sell.` };
    if (latestPrice <= 0) return { success: false, message: 'Awaiting live Binance price.' };

    const fraction = Math.min(1, Math.max(0.01, qtyPercent / 100));
    const sellQty = currentQty * fraction;
    const executionPrice = latestPrice * (1 - riskSettings.slippagePercent / 100);

    executePositionClose(selectedPair.symbol, executionPrice, `Market Sell (${qtyPercent}%)`, fraction);
    return { success: true, message: `Sold ${sellQty.toFixed(4)} ${baseAsset} @ $${executionPrice.toFixed(2)}.` };
  };

  // Place Limit Order
  const placeLimitOrder = (
    side: OrderSide,
    price: number,
    qty: number,
    stopLoss?: number,
    _takeProfit?: number
  ) => {
    const totalVal = price * qty;
    const fee = totalVal * currentFeeRate;

    if (side === 'BUY') {
      if (totalVal + fee > usdtBalance) {
        return { success: false, message: 'Insufficient USDT for limit buy.' };
      }
      setUsdtBalance(prev => prev - (totalVal + fee)); // Escrow funds
    } else {
      const baseAsset = selectedPair.baseAsset;
      if ((holdings[baseAsset] || 0) < qty) {
        return { success: false, message: `Insufficient ${baseAsset} for limit sell.` };
      }
      setHoldings(prev => ({
        ...prev,
        [baseAsset]: prev[baseAsset] - qty,
      }));
    }

    const newOrder: Order = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      symbol: selectedPair.symbol,
      side,
      type: 'LIMIT',
      price,
      quantity: qty,
      totalValue: totalVal,
      fee,
      feeRate: currentFeeRate,
      status: 'NEW',
      createdAt: Date.now(),
      triggerPrice: stopLoss,
    };

    setOpenOrders(prev => [newOrder, ...prev]);
    return { success: true, message: `Limit ${side} order placed for ${qty} ${selectedPair.baseAsset} @ $${price}.` };
  };

  // Cancel Order
  const cancelOrder = (orderId: string) => {
    const order = openOrders.find(o => o.id === orderId);
    if (!order) return;

    if (order.side === 'BUY') {
      // Refund escrowed USDT
      setUsdtBalance(prev => prev + order.totalValue + order.fee);
    } else {
      // Refund escrowed crypto
      const baseAsset = order.symbol.replace('USDT', '');
      setHoldings(prev => ({
        ...prev,
        [baseAsset]: (prev[baseAsset] || 0) + order.quantity
      }));
    }

    setOpenOrders(prev => prev.filter(o => o.id !== orderId));
  };

  const closeCurrentPosition = () => {
    if (latestPrice > 0) {
      executePositionClose(selectedPair.symbol, latestPrice, 'Manual Quick Close');
    }
  };

  // Reset paper trading account
  const resetAccount = (initialUsdt?: number) => {
    const targetBalance = initialUsdt !== undefined ? initialUsdt : permanentInitialBalance;
    setUsdtBalance(targetBalance);
    setInitialBalance(targetBalance);
    setHoldings({ SOL: 0, BTC: 0, ETH: 0, BNB: 0, DOGE: 0 });
    setPositions({});
    setOpenOrders([]);
    setCompletedTrades([]);
    localStorage.setItem(STORAGE_KEYS.BALANCE, targetBalance.toString());
    localStorage.setItem(STORAGE_KEYS.INITIAL_BAL, targetBalance.toString());
    localStorage.removeItem(STORAGE_KEYS.HOLDINGS);
    localStorage.removeItem(STORAGE_KEYS.POSITIONS);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.TRADES);
  };

  const updateRiskSettings = (settings: Partial<RiskSettings>) => {
    setRiskSettings(prev => ({ ...prev, ...settings }));
  };

  // Current Position with live unrealized calculations
  const rawPosition = positions[selectedPair.symbol];
  const currentPosition: Position | null = useMemo(() => {
    if (!rawPosition || rawPosition.quantity <= 0 || latestPrice <= 0) return null;

    const currentValue = rawPosition.quantity * latestPrice;
    const grossPnl = currentValue - (rawPosition.avgEntryPrice * rawPosition.quantity);
    const grossPnlPercent = (grossPnl / rawPosition.totalCost) * 100;
    const exitFee = currentValue * currentFeeRate;
    const netPnl = grossPnl - (rawPosition.entryFeePaid + exitFee);
    const netPnlPercent = (netPnl / rawPosition.totalCost) * 100;

    return {
      ...rawPosition,
      currentPrice: latestPrice,
      currentValue,
      unrealizedGrossPnl: grossPnl,
      unrealizedGrossPnlPercent: grossPnlPercent,
      estimatedExitFee: exitFee,
      unrealizedNetPnl: netPnl,
      unrealizedNetPnlPercent: netPnlPercent,
    };
  }, [rawPosition, latestPrice, currentFeeRate]);

  // Total Portfolio Value
  const totalPortfolioValue = useMemo(() => {
    let cryptoValue = 0;
    Object.entries(holdings).forEach(([asset, qty]) => {
      if (qty > 0) {
        if (asset === selectedPair.baseAsset) {
          cryptoValue += qty * latestPrice;
        } else {
          const p = positions[`${asset}USDT`];
          cryptoValue += qty * (p?.currentPrice || p?.avgEntryPrice || 0);
        }
      }
    });
    return usdtBalance + cryptoValue;
  }, [usdtBalance, holdings, latestPrice, selectedPair.baseAsset, positions]);

  // Overall Stats
  const totalFeesPaid = useMemo(() => {
    return completedTrades.reduce((acc, t) => acc + t.feesPaid, 0);
  }, [completedTrades]);

  const netRealizedPnl = useMemo(() => {
    return completedTrades.reduce((acc, t) => acc + t.netPnl, 0);
  }, [completedTrades]);

  const winRate = useMemo(() => {
    if (completedTrades.length === 0) return 0;
    const wins = completedTrades.filter(t => t.netPnl > 0).length;
    return (wins / completedTrades.length) * 100;
  }, [completedTrades]);

  return (
    <TradingContext.Provider
      value={{
        selectedPair,
        setSelectedPair,
        timeframe,
        setTimeframe,
        candles,
        currentTicker,
        strategy,
        usdtBalance,
        holdings,
        initialBalance,
        permanentInitialBalance,
        setPermanentInitialBalance,
        positions,
        currentPosition,
        totalPortfolioValue,
        openOrders,
        completedTrades,
        riskSettings,
        updateRiskSettings,
        placeMarketBuy,
        placeMarketSell,
        placeLimitOrder,
        cancelOrder,
        closeCurrentPosition,
        resetAccount,
        totalFeesPaid,
        netRealizedPnl,
        winRate,
      }}
    >
      {children}
    </TradingContext.Provider>
  );
};

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
};
