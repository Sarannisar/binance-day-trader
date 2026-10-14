import React, { useState, useEffect } from 'react';
import { useTrading } from '../context/TradingContext';
import { ShieldCheck, ArrowDownCircle, ArrowUpCircle, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

interface OrderPanelProps {
  onOpenRiskCalculator: () => void;
  appliedUsdtAmount?: number | null;
  appliedStopLoss?: number | null;
  appliedTakeProfit?: number | null;
  appliedPrice?: number | null;
}

export const OrderPanel: React.FC<OrderPanelProps> = ({
  onOpenRiskCalculator,
  appliedUsdtAmount,
  appliedStopLoss,
  appliedTakeProfit,
  appliedPrice,
}) => {
  const {
    selectedPair,
    currentTicker,
    usdtBalance,
    holdings,
    placeMarketBuy,
    placeMarketSell,
    placeLimitOrder,
    riskSettings,
  } = useTrading();

  const [orderSide, setOrderSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [usdtAmount, setUsdtAmount] = useState<string>('');
  const [limitPrice, setLimitPrice] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [feedback, setFeedback] = useState<{ message: string; isError: boolean } | null>(null);
  const [setupBanner, setSetupBanner] = useState<string | null>(null);

  const currentPrice = currentTicker?.price || 0;
  const baseAsset = selectedPair.baseAsset;
  const currentHoldingQty = holdings[baseAsset] || 0;

  // React to applied values from Risk Calculator or Strategy
  useEffect(() => {
    if (appliedUsdtAmount) {
      setUsdtAmount(appliedUsdtAmount.toString());
      setOrderSide('BUY');
    }
    if (appliedPrice) {
      setLimitPrice(appliedPrice.toString());
    }
    if (appliedStopLoss) {
      setStopLoss(appliedStopLoss.toString());
    }
    if (appliedTakeProfit) {
      setTakeProfit(appliedTakeProfit.toString());
    }
    if (appliedStopLoss || appliedTakeProfit) {
      setSetupBanner(`Strategy applied at $${appliedPrice || currentPrice.toFixed(2)}: SL $${appliedStopLoss} | TP $${appliedTakeProfit}`);
    }
  }, [appliedUsdtAmount, appliedStopLoss, appliedTakeProfit, appliedPrice]);

  // Handle Quick Percentage clicks
  const handlePercentClick = (percent: number) => {
    if (orderSide === 'BUY') {
      const amount = (usdtBalance * (percent / 100)).toFixed(2);
      setUsdtAmount(amount);
    } else {
      const qty = (currentHoldingQty * (percent / 100)).toFixed(selectedPair.qtyDecimals);
      setUsdtAmount(qty);
    }
  };

  const parsedAmount = parseFloat(usdtAmount) || 0;
  const parsedLimitPrice = parseFloat(limitPrice) || currentPrice;
  const parsedStopLoss = parseFloat(stopLoss) || undefined;
  const parsedTakeProfit = parseFloat(takeProfit) || undefined;

  // Fee calculation
  const feeRate = riskSettings.useBnbFeeDiscount ? 0.00075 : 0.0010;
  const estimatedFee = (orderSide === 'BUY' ? parsedAmount : parsedAmount * currentPrice) * feeRate;

  // Order Execution
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (orderSide === 'BUY') {
      if (parsedAmount <= 0) {
        setFeedback({ message: 'Enter a valid USDT amount to trade.', isError: true });
        return;
      }
      if (parsedAmount > usdtBalance) {
        setFeedback({ message: 'USDT amount exceeds available balance.', isError: true });
        return;
      }

      const refPrice = orderType === 'MARKET' ? currentPrice : parsedLimitPrice;
      if (parsedStopLoss && parsedStopLoss >= refPrice) {
        setFeedback({
          message: `Stop Loss ($${parsedStopLoss}) must be below entry price ($${refPrice.toFixed(2)}) for BUY orders.`,
          isError: true,
        });
        return;
      }
      if (parsedTakeProfit && parsedTakeProfit <= refPrice) {
        setFeedback({
          message: `Take Profit ($${parsedTakeProfit}) must be above entry price ($${refPrice.toFixed(2)}) for BUY orders.`,
          isError: true,
        });
        return;
      }

      if (orderType === 'MARKET') {
        const res = placeMarketBuy(parsedAmount, parsedStopLoss, parsedTakeProfit);
        setFeedback({ message: res.message, isError: !res.success });
      } else {
        const qty = parsedAmount / parsedLimitPrice;
        const res = placeLimitOrder('BUY', parsedLimitPrice, qty, parsedStopLoss, parsedTakeProfit);
        setFeedback({ message: res.message, isError: !res.success });
      }
    } else {
      // SELL
      if (currentHoldingQty <= 0) {
        setFeedback({ message: `You have 0 ${baseAsset} to sell.`, isError: true });
        return;
      }
      const qtyToSell = Math.min(parsedAmount || currentHoldingQty, currentHoldingQty);
      if (orderType === 'MARKET') {
        const pct = (qtyToSell / currentHoldingQty) * 100;
        const res = placeMarketSell(pct);
        setFeedback({ message: res.message, isError: !res.success });
      } else {
        const res = placeLimitOrder('SELL', parsedLimitPrice, qtyToSell, parsedStopLoss, parsedTakeProfit);
        setFeedback({ message: res.message, isError: !res.success });
      }
    }
  };

  const isAllIn = orderSide === 'BUY' && parsedAmount >= usdtBalance * 0.95 && usdtBalance > 50;

  return (
    <div className="bg-[#121824] p-3 text-xs pb-32 sm:pb-16 font-sans">
      {/* Side Selector (BUY vs SELL) & Risk Sizer Trigger */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="grid grid-cols-2 gap-1.5 flex-1 bg-[#0b0e14] p-1 rounded-xl border border-[#222b40]">
          <button
            type="button"
            onClick={() => setOrderSide('BUY')}
            className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-lg font-bold transition-all ${
              orderSide === 'BUY'
                ? 'bg-[#0ecb81] text-[#0b0e14] shadow'
                : 'text-[#848e9c] hover:text-[#eaecef]'
            }`}
          >
            <ArrowUpCircle size={16} />
            <span>BUY / LONG</span>
          </button>
          <button
            type="button"
            onClick={() => setOrderSide('SELL')}
            className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-lg font-bold transition-all ${
              orderSide === 'SELL'
                ? 'bg-[#f6465d] text-white shadow'
                : 'text-[#848e9c] hover:text-[#eaecef]'
            }`}
          >
            <ArrowDownCircle size={16} />
            <span>SELL / EXIT</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenRiskCalculator}
          className="flex items-center space-x-1.5 bg-[#f0b90b]/15 hover:bg-[#f0b90b]/25 border border-[#f0b90b]/40 text-[#f0b90b] px-3.5 py-2.5 rounded-xl font-bold transition-colors shrink-0"
          title="Calculate safe position size without going all-in"
        >
          <ShieldCheck size={16} />
          <span>Risk Sizer</span>
        </button>
      </div>

      {/* Applied Setup Notification Banner */}
      {setupBanner && (
        <div className="flex items-center justify-between bg-[#0ecb81]/15 border border-[#0ecb81]/30 text-[#0ecb81] p-2 rounded-xl mb-3 text-[11px]">
          <div className="flex items-center space-x-1.5 font-medium">
            <CheckCircle2 size={14} className="shrink-0" />
            <span>{setupBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSetupBanner(null)}
            className="text-[#848e9c] hover:text-white ml-2 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 font-mono-numbers">
        {/* Order Type Toggle (Market vs Limit) */}
        <div className="flex items-center justify-between text-[11px] text-[#848e9c]">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setOrderType('MARKET')}
              className={`pb-1 border-b-2 font-semibold transition-colors ${
                orderType === 'MARKET' ? 'border-[#f0b90b] text-[#f0b90b]' : 'border-transparent'
              }`}
            >
              Market Order
            </button>
            <button
              type="button"
              onClick={() => {
                setOrderType('LIMIT');
                if (!limitPrice) setLimitPrice(currentPrice.toFixed(selectedPair.priceDecimals));
              }}
              className={`pb-1 border-b-2 font-semibold transition-colors ${
                orderType === 'LIMIT' ? 'border-[#f0b90b] text-[#f0b90b]' : 'border-transparent'
              }`}
            >
              Limit Order
            </button>
          </div>

          <div>
            Avail:{' '}
            <span className="text-[#eaecef] font-bold">
              {orderSide === 'BUY'
                ? `$${usdtBalance.toFixed(2)} USDT`
                : `${currentHoldingQty.toFixed(4)} ${baseAsset}`}
            </span>
          </div>
        </div>

        {/* Limit Price Input (if Limit Order) */}
        {orderType === 'LIMIT' && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[#848e9c] font-sans text-[11px]">Limit Price (USDT)</label>
              <button
                type="button"
                onClick={() => setLimitPrice(currentPrice.toFixed(selectedPair.priceDecimals))}
                className="text-[10px] text-[#f0b90b] hover:underline flex items-center space-x-0.5"
              >
                <RefreshCw size={10} className="mr-0.5" />
                <span>Use Live Price (${currentPrice.toFixed(2)})</span>
              </button>
            </div>
            <input
              type="number"
              step="any"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder={currentPrice.toFixed(selectedPair.priceDecimals)}
              className="w-full bg-[#0b0e14] border border-[#222b40] rounded-xl px-3 py-2 text-[#eaecef] focus:border-[#f0b90b] outline-none"
            />
          </div>
        )}

        {/* Amount Input */}
        <div>
          <label className="text-[#848e9c] block mb-1 font-sans text-[11px]">
            {orderSide === 'BUY' ? 'Amount (USDT)' : `Amount to Sell (${baseAsset})`}
          </label>
          <div className="relative">
            <input
              type="number"
              step="any"
              value={usdtAmount}
              onChange={(e) => setUsdtAmount(e.target.value)}
              placeholder={orderSide === 'BUY' ? '150.00' : currentHoldingQty.toFixed(4)}
              className="w-full bg-[#0b0e14] border border-[#222b40] rounded-xl px-3 py-2.5 text-[#eaecef] focus:border-[#f0b90b] outline-none pr-14 text-sm"
            />
            <span className="absolute right-3 top-3 text-[#848e9c] text-xs font-bold font-sans">
              {orderSide === 'BUY' ? 'USDT' : baseAsset}
            </span>
          </div>
        </div>

        {/* Percentage Quick Select */}
        <div className="flex space-x-1.5 text-[11px]">
          {[25, 50, 75, 100].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => handlePercentClick(pct)}
              className={`flex-1 py-1.5 rounded-lg bg-[#0b0e14] hover:bg-[#1b2234] border transition-colors font-medium ${
                pct === 100 && orderSide === 'BUY'
                  ? 'border-[#f6465d]/40 text-[#f6465d]'
                  : 'border-[#222b40] text-[#848e9c]'
              }`}
            >
              {pct}%
            </button>
          ))}
        </div>

        {/* All-in Warning alert */}
        {isAllIn && (
          <div className="flex items-start space-x-2 bg-[#f6465d]/10 border border-[#f6465d]/30 text-[#f6465d] p-2.5 rounded-xl text-[11px] font-sans">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>
              <strong>All-In Warning:</strong> Risking 100% of capital creates high stress during violent swings. Tap <strong>Risk Sizer</strong> above to trade 1.5% safely.
            </span>
          </div>
        )}

        {/* Protection Levels (Stop Loss & Take Profit) */}
        {orderSide === 'BUY' && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-[#f6465d] block mb-1 font-sans text-[11px]">Stop Loss ($)</label>
              <input
                type="number"
                step="any"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="Optional"
                className="w-full bg-[#0b0e14] border border-[#f6465d]/30 rounded-xl px-3 py-2 text-[#f6465d] focus:border-[#f6465d] outline-none text-xs"
              />
            </div>
            <div>
              <label className="text-[#0ecb81] block mb-1 font-sans text-[11px]">Take Profit ($)</label>
              <input
                type="number"
                step="any"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="Optional"
                className="w-full bg-[#0b0e14] border border-[#0ecb81]/30 rounded-xl px-3 py-2 text-[#0ecb81] focus:border-[#0ecb81] outline-none text-xs"
              />
            </div>
          </div>
        )}

        {/* Binance Fee Preview */}
        <div className="flex justify-between items-center text-[11px] pt-1 text-[#848e9c]">
          <span>Binance Spot Fee ({riskSettings.useBnbFeeDiscount ? '0.075%' : '0.10%'}):</span>
          <span className="text-[#f0b90b] font-semibold font-mono-numbers">
            ≈ ${estimatedFee.toFixed(3)} USDT
          </span>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-2.5 rounded-xl text-xs font-sans ${
              feedback.isError
                ? 'bg-[#f6465d]/15 text-[#f6465d] border border-[#f6465d]/30'
                : 'bg-[#0ecb81]/15 text-[#0ecb81] border border-[#0ecb81]/30'
            }`}
          >
            {feedback.message}
          </div>
        )}

        {/* Main Action Button with ample padding to clear navigation bar */}
        <div className="pt-1">
          <button
            type="submit"
            className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all shadow-xl ${
              orderSide === 'BUY'
                ? 'bg-[#0ecb81] hover:bg-[#0bb874] text-[#0b0e14]'
                : 'bg-[#f6465d] hover:bg-[#e03a50] text-white'
            }`}
          >
            {orderSide === 'BUY'
              ? `BUY ${baseAsset} (${orderType})`
              : `SELL ${baseAsset} (${orderType})`}
          </button>
        </div>
      </form>
    </div>
  );
};
