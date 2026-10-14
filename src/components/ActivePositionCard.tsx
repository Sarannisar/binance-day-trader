import React from 'react';
import { useTrading } from '../context/TradingContext';
import { TrendingUp, TrendingDown, ShieldAlert, Target } from 'lucide-react';

export const ActivePositionCard: React.FC = () => {
  const {
    currentPosition,
    selectedPair,
    closeCurrentPosition,
    placeMarketSell,
    riskSettings,
  } = useTrading();

  if (!currentPosition || currentPosition.quantity <= 0) {
    return (
      <div className="bg-[#121824] border-b border-[#222b40] p-3 text-center text-xs text-[#848e9c]">
        No active {selectedPair.baseAsset} position. Use the Order Panel below or click <strong className="text-[#f0b90b]">Apply Setup</strong> to enter a safe day trade.
      </div>
    );
  }

  const isNetProfit = currentPosition.unrealizedNetPnl >= 0;
  const isGrossProfit = currentPosition.unrealizedGrossPnl >= 0;

  return (
    <div className="bg-[#121824] border-b border-[#222b40] p-3 text-xs font-mono-numbers">
      <div className="flex items-center justify-between pb-2 border-b border-[#222b40]">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-sm text-[#eaecef]">
            {selectedPair.baseAsset} Long Position
          </span>
          <span className="text-[10px] px-1.5 py-0.5 bg-[#0ecb81]/15 text-[#0ecb81] font-semibold rounded">
            Live Spot
          </span>
        </div>

        {/* Quick Close Actions */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => placeMarketSell(50)}
            className="px-2 py-1 bg-[#222b40] hover:bg-[#2e3a54] text-[#eaecef] rounded font-semibold text-[11px] transition-colors"
          >
            Sell 50%
          </button>
          <button
            onClick={closeCurrentPosition}
            className="px-2.5 py-1 bg-[#f6465d] hover:bg-[#e03a50] text-white rounded font-bold text-[11px] transition-colors shadow"
          >
            Market Close
          </button>
        </div>
      </div>

      {/* Main Position Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2.5">
        <div>
          <span className="text-[10px] text-[#848e9c] block font-sans">QUANTITY HELD</span>
          <span className="text-white font-bold text-xs">
            {currentPosition.quantity.toFixed(4)} {selectedPair.baseAsset}
          </span>
          <span className="text-[10px] text-[#848e9c] block">
            ≈ ${currentPosition.currentValue.toFixed(2)}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-[#848e9c] block font-sans">AVG ENTRY PRICE</span>
          <span className="text-white font-semibold text-xs">
            ${currentPosition.avgEntryPrice.toFixed(2)}
          </span>
          <span className="text-[10px] text-[#848e9c] block">
            Entry Fee: ${currentPosition.entryFeePaid.toFixed(3)}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-[#848e9c] block font-sans">GROSS PNL</span>
          <div className={`flex items-center font-bold text-xs ${isGrossProfit ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
            {isGrossProfit ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />}
            {isGrossProfit ? '+' : ''}${currentPosition.unrealizedGrossPnl.toFixed(2)} ({currentPosition.unrealizedGrossPnlPercent.toFixed(2)}%)
          </div>
          <span className="text-[10px] text-[#848e9c] block">
            Exit Fee: ~${currentPosition.estimatedExitFee.toFixed(3)}
          </span>
        </div>

        <div className="bg-[#0b0e14] p-1.5 rounded-lg border border-[#222b40]">
          <span className="text-[10px] text-[#f0b90b] block font-sans font-bold">NET PNL (AFTER FEES)</span>
          <div className={`flex items-center font-bold text-xs ${isNetProfit ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
            {isNetProfit ? '+' : ''}${currentPosition.unrealizedNetPnl.toFixed(2)}
          </div>
          <span className={`text-[10px] font-semibold block ${isNetProfit ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
            {isNetProfit ? '+' : ''}{currentPosition.unrealizedNetPnlPercent.toFixed(2)}% net
          </span>
        </div>
      </div>

      {/* Target & Protection levels row */}
      {(currentPosition.stopLossPrice || currentPosition.takeProfitPrice) && (
        <div className="flex items-center justify-between text-[11px] mt-2.5 pt-2 border-t border-[#222b40]/60">
          <div className="flex items-center space-x-3">
            {currentPosition.stopLossPrice && (
              <span className="flex items-center text-[#f6465d]">
                <ShieldAlert size={12} className="mr-1" />
                Stop Loss: ${currentPosition.stopLossPrice.toFixed(2)}
              </span>
            )}
            {currentPosition.takeProfitPrice && (
              <span className="flex items-center text-[#0ecb81]">
                <Target size={12} className="mr-1" />
                Target: ${currentPosition.takeProfitPrice.toFixed(2)}
              </span>
            )}
          </div>
          <span className="text-[10px] text-[#848e9c]">
            Binance Fee: {riskSettings.useBnbFeeDiscount ? '0.075% BNB' : '0.10% Standard'}
          </span>
        </div>
      )}
    </div>
  );
};
