import React, { useState } from 'react';
import { useTrading } from '../context/TradingContext';
import { ShieldCheck, X, AlertTriangle, ArrowRight } from 'lucide-react';

interface RiskCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPositionSize: (amountUsdt: number, stopLoss: number, takeProfit: number) => void;
}

export const RiskCalculatorModal: React.FC<RiskCalculatorModalProps> = ({
  isOpen,
  onClose,
  onApplyPositionSize,
}) => {
  const {
    totalPortfolioValue,
    currentTicker,
    selectedPair,
    strategy,
    riskSettings,
  } = useTrading();

  const currentPrice = currentTicker?.price || 150;
  const [accountSize, setAccountSize] = useState<number>(totalPortfolioValue || 5000);
  const [riskPercent, setRiskPercent] = useState<number>(riskSettings.riskPercentPerTrade || 1.5);
  const [entryPrice, setEntryPrice] = useState<number>(currentPrice);
  const [stopLossPrice, setStopLossPrice] = useState<number>(
    strategy.suggestedStopLoss || Number((currentPrice * 0.985).toFixed(2))
  );
  const [takeProfitPrice, setTakeProfitPrice] = useState<number>(
    strategy.suggestedTakeProfit || Number((currentPrice * 1.035).toFixed(2))
  );

  if (!isOpen) return null;

  // Mathematical Calculations
  const riskDollarAmount = accountSize * (riskPercent / 100);
  const stopLossDistance = Math.max(0.01, entryPrice - stopLossPrice);
  const stopLossPercent = (stopLossDistance / entryPrice) * 100;

  // Position Size = Risk $ / (Price - SL)
  // Total USDT Allocation = Position Qty * Entry Price
  const positionQty = stopLossDistance > 0 ? riskDollarAmount / stopLossDistance : 0;
  const positionValueUsdt = positionQty * entryPrice;

  // Binance Fees (0.10% or 0.075%)
  const feeRate = riskSettings.useBnbFeeDiscount ? 0.00075 : 0.001;
  const entryFee = positionValueUsdt * feeRate;
  const exitTargetValue = positionQty * takeProfitPrice;
  const exitTargetFee = exitTargetValue * feeRate;
  const totalFeesAtTarget = entryFee + exitTargetFee;

  // Profits & R:R
  const grossProfit = Math.max(0, (takeProfitPrice - entryPrice) * positionQty);
  const netProfit = grossProfit - totalFeesAtTarget;
  const actualRR = stopLossDistance > 0 ? (takeProfitPrice - entryPrice) / stopLossDistance : 0;

  const isOverExposed = positionValueUsdt > accountSize;

  const handleApply = () => {
    const finalUsdt = Math.min(positionValueUsdt, accountSize);
    onApplyPositionSize(Number(finalUsdt.toFixed(2)), stopLossPrice, takeProfitPrice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#121824] border border-[#222b40] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#222b40] bg-[#0b0e14]">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-[#0ecb81]/20 text-[#0ecb81] rounded-lg">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#eaecef]">Position Sizing & Risk Calculator</h3>
              <p className="text-[11px] text-[#848e9c]">Trade with math instead of going "All-In"</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#848e9c] hover:text-[#eaecef] p-1">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs font-mono-numbers">
          {/* Account & Risk % */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#848e9c] block mb-1 font-sans">Trading Capital (USDT)</label>
              <input
                type="number"
                value={accountSize}
                onChange={(e) => setAccountSize(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0b0e14] border border-[#222b40] rounded-lg px-2.5 py-1.5 text-[#eaecef] focus:border-[#f0b90b] outline-none"
              />
            </div>
            <div>
              <label className="text-[#848e9c] block mb-1 font-sans">Max Risk per Trade (%)</label>
              <div className="flex space-x-1">
                {[1.0, 1.5, 2.0, 3.0].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRiskPercent(r)}
                    className={`flex-1 py-1 rounded text-[11px] font-bold ${
                      riskPercent === r
                        ? 'bg-[#f0b90b] text-[#0b0e14]'
                        : 'bg-[#0b0e14] text-[#848e9c] border border-[#222b40]'
                    }`}
                  >
                    {r}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing Inputs */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[#848e9c] block mb-1 font-sans">Entry Price ($)</label>
              <input
                type="number"
                value={entryPrice}
                onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0b0e14] border border-[#222b40] rounded-lg px-2 py-1.5 text-[#eaecef] focus:border-[#f0b90b] outline-none"
              />
            </div>
            <div>
              <label className="text-[#f6465d] block mb-1 font-sans">Stop Loss ($)</label>
              <input
                type="number"
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0b0e14] border border-[#f6465d]/40 rounded-lg px-2 py-1.5 text-[#f6465d] focus:border-[#f6465d] outline-none"
              />
            </div>
            <div>
              <label className="text-[#0ecb81] block mb-1 font-sans">Take Profit ($)</label>
              <input
                type="number"
                value={takeProfitPrice}
                onChange={(e) => setTakeProfitPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0b0e14] border border-[#0ecb81]/40 rounded-lg px-2 py-1.5 text-[#0ecb81] focus:border-[#0ecb81] outline-none"
              />
            </div>
          </div>

          {/* Auto-fill buttons from Strategy */}
          {strategy.suggestedStopLoss && (
            <div className="flex justify-between items-center text-[11px] bg-[#0b0e14] px-2.5 py-1.5 rounded-lg border border-[#222b40]">
              <span className="text-[#848e9c]">Strategy Recommendation:</span>
              <button
                type="button"
                onClick={() => {
                  setEntryPrice(currentPrice);
                  setStopLossPrice(strategy.suggestedStopLoss!);
                  setTakeProfitPrice(strategy.suggestedTakeProfit!);
                }}
                className="text-[#f0b90b] hover:underline font-bold"
              >
                Use 1.5x ATR Stop (${strategy.suggestedStopLoss.toFixed(2)}) & 1:2.5 Target
              </button>
            </div>
          )}

          {/* Calculation Output Box */}
          <div className="bg-[#0b0e14] p-3.5 rounded-xl border border-[#222b40] space-y-2.5">
            <div className="text-[11px] font-sans font-semibold text-[#848e9c] uppercase tracking-wider">
              Mathematical Execution Blueprint
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#121824] p-2.5 rounded-lg border border-[#222b40]">
                <span className="text-[#848e9c] block text-[10px]">SAFE POSITION SIZE</span>
                <span className="text-white font-bold text-sm">
                  ${Math.min(positionValueUsdt, accountSize).toFixed(2)} USDT
                </span>
                <span className="text-[11px] text-[#f0b90b] block mt-0.5">
                  ≈ {positionQty.toFixed(3)} {selectedPair.baseAsset}
                </span>
              </div>

              <div className="bg-[#121824] p-2.5 rounded-lg border border-[#222b40]">
                <span className="text-[#848e9c] block text-[10px]">MAX RISK IF SL HITS</span>
                <span className="text-[#f6465d] font-bold text-sm">
                  -${riskDollarAmount.toFixed(2)}
                </span>
                <span className="text-[11px] text-[#848e9c] block mt-0.5">
                  ({riskPercent.toFixed(1)}% of Capital)
                </span>
              </div>
            </div>

            {/* Fees and Net Returns breakdown */}
            <div className="pt-2 border-t border-[#222b40] space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#848e9c]">Stop Loss Distance:</span>
                <span className="text-[#eaecef]">-{stopLossPercent.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#848e9c]">Risk-to-Reward Ratio:</span>
                <span className="text-[#0ecb81] font-bold">1:{actualRR.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#848e9c]">Binance Round-Trip Fees ({feeRate === 0.001 ? '0.20%' : '0.15% BNB'}):</span>
                <span className="text-[#f0b90b]">-${totalFeesAtTarget.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-[#222b40]/60">
                <span className="text-[#0ecb81]">Estimated NET Profit (After Fees):</span>
                <span className="text-[#0ecb81] text-xs">+${netProfit.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {isOverExposed && (
            <div className="flex items-center space-x-2 text-[11px] text-[#f0b90b] bg-[#f0b90b]/10 p-2.5 rounded-lg border border-[#f0b90b]/20">
              <AlertTriangle size={16} className="shrink-0" />
              <span>
                Stop Loss is very tight. Position size is capped at 100% of your current USDT capital.
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-[#222b40] bg-[#0b0e14] flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-[#848e9c] hover:bg-[#121824] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[#f0b90b] text-[#0b0e14] hover:bg-[#deb00a] transition-colors shadow-lg"
          >
            <span>Apply to Order Form</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
