import React from 'react';
import { X, ShieldAlert, Award, AlertTriangle, Zap, CheckCircle2 } from 'lucide-react';

interface RiskGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RiskGuideModal: React.FC<RiskGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#121824] border border-[#222b40] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#222b40] bg-[#0b0e14]">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-[#f0b90b]/20 text-[#f0b90b] rounded-lg">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#eaecef]">Day Trading Psychology & Survival Blueprint</h3>
              <p className="text-[11px] text-[#848e9c]">Overcoming fear and eliminating the all-in habit</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#848e9c] hover:text-[#eaecef] p-1">
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs text-[#eaecef] leading-relaxed">
          {/* Section 1: The Root of Your Fear */}
          <div className="bg-[#0b0e14] p-3.5 rounded-xl border border-[#222b40] space-y-2">
            <div className="flex items-center space-x-2 text-[#f0b90b] font-bold text-xs">
              <AlertTriangle size={15} />
              <h4>1. Why You Feel Scared Right Now (The Survival Instinct)</h4>
            </div>
            <p className="text-[#848e9c]">
              You aren't afraid of the market—you are afraid because <strong className="text-white">you know subconsciously that a single bad candle can erase months of hard-won profits</strong>.
            </p>
            <p className="text-[#848e9c]">
              When you trade "All-In", your biological threat-detection system goes into overdrive because your survival is exposed. The cure is <strong className="text-[#0ecb81]">proper position sizing</strong>. When you risk only 1.5% of your capital, your emotions stay completely calm because even 5 losses in a row leave 92.5% of your capital intact!
            </p>
          </div>

          {/* Section 2: The Gambler's Ruin */}
          <div className="bg-[#0b0e14] p-3.5 rounded-xl border border-[#222b40] space-y-2">
            <div className="flex items-center space-x-2 text-[#f6465d] font-bold text-xs">
              <Zap size={15} />
              <h4>2. The Math of Going "All-In" (Gambler's Ruin)</h4>
            </div>
            <p className="text-[#848e9c]">
              Going All-In feels amazing during a winning streak, but mathematically, its expected long-term value is zero:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[#848e9c]">
              <li>If you make +20% five times, but have one -50% flash crash on SOL, you are below where you started.</li>
              <li>A single unexpected exchange delay, flash wick, or panic market sell will wipe out your account.</li>
              <li>Professional institutional day traders <strong className="text-white">never</strong> bet more than 1% to 2% per trade.</li>
            </ul>
          </div>

          {/* Section 3: Binance 0.1% Fee Trap */}
          <div className="bg-[#0b0e14] p-3.5 rounded-xl border border-[#222b40] space-y-2">
            <div className="flex items-center space-x-2 text-[#00d2ff] font-bold text-xs">
              <Award size={15} />
              <h4>3. The 0.1% Binance Fee Survival Rule</h4>
            </div>
            <p className="text-[#848e9c]">
              Binance charges 0.10% when buying and 0.10% when selling (<strong className="text-white">0.20% round-trip</strong>).
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="bg-[#121824] p-2 rounded border border-[#f6465d]/30 text-[#f6465d]">
                <strong className="block text-white">The Scalping Mistake</strong>
                Targeting +0.5% moves. Fees eat 40% of your gross win, but losses cost you -0.7% net!
              </div>
              <div className="bg-[#121824] p-2 rounded border border-[#0ecb81]/30 text-[#0ecb81]">
                <strong className="block text-white">The Pro Day Trade Rule</strong>
                Target +2.0% to +4.0% swing moves with a 1:2.5 R:R. Fees become less than 7% of your profit!
              </div>
            </div>
          </div>

          {/* Section 4: Daily Execution Checklist */}
          <div className="bg-[#0b0e14] p-3.5 rounded-xl border border-[#222b40] space-y-2">
            <div className="flex items-center space-x-2 text-[#0ecb81] font-bold text-xs">
              <CheckCircle2 size={15} />
              <h4>4. Your 4-Step SOL/USDT Trading Checklist</h4>
            </div>
            <ol className="list-decimal pl-5 space-y-1.5 text-[#848e9c]">
              <li><strong className="text-white">Trend Filter:</strong> Only buy SOL when price is above the 50 EMA and VWAP is rising.</li>
              <li><strong className="text-white">Patience on Pullback:</strong> Do not FOMO green candles. Wait for price to pull back to the 20 EMA or VWAP value zone.</li>
              <li><strong className="text-white">Use the Risk Sizer:</strong> Never enter an order without an exact Stop Loss price and max 1.5% capital risk.</li>
              <li><strong className="text-white">Paper Trade for 30 Trades:</strong> Achieve at least a 55% win rate with positive net PnL on paper before returning to real capital!</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#222b40] bg-[#0b0e14] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-[#f0b90b] text-[#0b0e14] hover:bg-[#deb00a] transition-colors"
          >
            I Understand & Will Practice
          </button>
        </div>
      </div>
    </div>
  );
};
