import React from 'react';
import { useTrading } from '../context/TradingContext';
import { Zap, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface StrategyBannerProps {
  onApplySignalSetup?: (entryPrice: number, stopLoss: number, takeProfit: number) => void;
}

export const StrategyBanner: React.FC<StrategyBannerProps> = ({ onApplySignalSetup }) => {
  const { strategy, currentTicker, selectedPair } = useTrading();

  const isBuy = strategy.signal === 'BUY_SETUP';
  const isTakeProfit = strategy.signal === 'TAKE_PROFIT';

  const livePrice = currentTicker?.price || 0;
  const atr = strategy.atr || (livePrice * 0.015);
  const liveStopLoss = Math.max(0.01, livePrice - atr * 1.5);
  const liveTakeProfit = livePrice + (atr * 1.5 * 2.5);
  const liveRiskDistance = livePrice - liveStopLoss;
  const liveRewardDistance = liveTakeProfit - livePrice;
  const liveRR = liveRiskDistance > 0 ? (liveRewardDistance / liveRiskDistance).toFixed(1) : '2.5';

  const handleApply = () => {
    if (onApplySignalSetup && livePrice > 0) {
      onApplySignalSetup(
        Number(livePrice.toFixed(selectedPair.priceDecimals)),
        Number(liveStopLoss.toFixed(selectedPair.priceDecimals)),
        Number(liveTakeProfit.toFixed(selectedPair.priceDecimals))
      );
    }
  };

  return (
    <div className="bg-[#121824] border-b border-[#222b40] p-3 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Signal Header & Rationale */}
        <div className="flex items-start space-x-2.5">
          <div
            className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
              isBuy
                ? 'bg-[#0ecb81]/20 text-[#0ecb81]'
                : isTakeProfit
                ? 'bg-[#f0b90b]/20 text-[#f0b90b]'
                : 'bg-[#222b40] text-[#848e9c]'
            }`}
          >
            {isBuy ? (
              <Zap size={16} />
            ) : isTakeProfit ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertTriangle size={16} />
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span
                className={`font-bold uppercase tracking-wider text-[11px] px-2 py-0.5 rounded ${
                  isBuy
                    ? 'bg-[#0ecb81] text-[#0b0e14] shadow'
                    : isTakeProfit
                    ? 'bg-[#f0b90b] text-[#0b0e14]'
                    : 'bg-[#222b40] text-[#848e9c]'
                }`}
              >
                {strategy.signal === 'BUY_SETUP'
                  ? '🎯 Day Trade Long Setup'
                  : strategy.signal === 'TAKE_PROFIT'
                  ? 'Overextended / Take Profit'
                  : 'Wait / Preserve Capital'}
              </span>

              <span className="text-[#848e9c] text-[11px]">
                Trend: <strong className={strategy.trend === 'BULLISH' ? 'text-[#0ecb81]' : strategy.trend === 'BEARISH' ? 'text-[#f6465d]' : 'text-[#848e9c]'}>{strategy.trend}</strong>
              </span>
            </div>

            <p className="text-[#848e9c] mt-1 text-[11px] leading-relaxed">
              {strategy.signalReason}
            </p>
          </div>
        </div>

        {/* Dynamic Real-time Levels & Auto-Updating Apply Button */}
        {livePrice > 0 && (
          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#222b40]/60 shrink-0 font-mono-numbers">
            <div className="text-left sm:text-right">
              <div className="text-[10px] text-[#848e9c] flex items-center space-x-1 sm:justify-end">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0ecb81] animate-pulse"></span>
                <span>Live R:R: <strong className="text-[#f0b90b]">1:{liveRR}</strong></span>
              </div>
              <div className="text-[11px] text-[#eaecef]">
                SL: <span className="text-[#f6465d]">${liveStopLoss.toFixed(2)}</span> | TP: <span className="text-[#0ecb81]">${liveTakeProfit.toFixed(2)}</span>
              </div>
            </div>

            {onApplySignalSetup && (
              <button
                onClick={handleApply}
                className={`flex items-center space-x-1 font-bold px-3 py-2 rounded-xl text-xs transition-all shadow-md shrink-0 ${
                  isBuy
                    ? 'bg-[#0ecb81] hover:bg-[#0bb874] text-[#0b0e14] ring-2 ring-[#0ecb81]/40 animate-bounce sm:animate-none'
                    : 'bg-[#222b40] hover:bg-[#2e3a54] text-[#eaecef]'
                }`}
                title="Automatically sets live price, 1.5x ATR stop loss, and 1:2.5 target in the order form"
              >
                <ShieldCheck size={14} />
                <span>Apply Setup</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Technical Indicators Ribbon */}
      <div className="grid grid-cols-2 xs:grid-cols-4 gap-2 mt-2.5 pt-2 border-t border-[#222b40]/60 text-[11px] font-mono-numbers">
        <div className="bg-[#0b0e14]/60 px-2 py-1 rounded border border-[#222b40]/40">
          <span className="text-[#848e9c] block text-[9px] uppercase">EMA 20</span>
          <span className="text-[#f0b90b] font-semibold">{strategy.ema20 ? `$${strategy.ema20.toFixed(2)}` : '...'}</span>
        </div>
        <div className="bg-[#0b0e14]/60 px-2 py-1 rounded border border-[#222b40]/40">
          <span className="text-[#848e9c] block text-[9px] uppercase">EMA 50</span>
          <span className="text-[#aa3bff] font-semibold">{strategy.ema50 ? `$${strategy.ema50.toFixed(2)}` : '...'}</span>
        </div>
        <div className="bg-[#0b0e14]/60 px-2 py-1 rounded border border-[#222b40]/40">
          <span className="text-[#848e9c] block text-[9px] uppercase">VWAP</span>
          <span className="text-[#00d2ff] font-semibold">{strategy.vwap ? `$${strategy.vwap.toFixed(2)}` : '...'}</span>
        </div>
        <div className="bg-[#0b0e14]/60 px-2 py-1 rounded border border-[#222b40]/40">
          <span className="text-[#848e9c] block text-[9px] uppercase">RSI (14)</span>
          <span
            className={`font-semibold ${
              strategy.rsi && strategy.rsi > 70
                ? 'text-[#f6465d]'
                : strategy.rsi && strategy.rsi < 35
                ? 'text-[#0ecb81]'
                : 'text-[#eaecef]'
            }`}
          >
            {strategy.rsi ? strategy.rsi.toFixed(1) : '...'}
          </span>
        </div>
      </div>
    </div>
  );
};
