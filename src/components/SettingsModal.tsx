import React, { useState } from 'react';
import { useTrading } from '../context/TradingContext';
import { X, SlidersHorizontal, Smartphone, RefreshCw, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { riskSettings, updateRiskSettings, resetAccount, usdtBalance } = useTrading();

  const [useBnb, setUseBnb] = useState<boolean>(riskSettings.useBnbFeeDiscount);
  const [riskPercent, setRiskPercent] = useState<number>(riskSettings.riskPercentPerTrade);
  const [slippage, setSlippage] = useState<number>(riskSettings.slippagePercent);
  const [initialBalInput, setInitialBalInput] = useState<number>(5000);
  const [savedMessage, setSavedMessage] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    updateRiskSettings({
      useBnbFeeDiscount: useBnb,
      riskPercentPerTrade: riskPercent,
      slippagePercent: slippage,
    });
    setSavedMessage(true);
    setTimeout(() => {
      setSavedMessage(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#121824] border border-[#222b40] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#222b40] bg-[#0b0e14]">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal size={16} className="text-[#f0b90b]" />
            <h3 className="font-bold text-sm text-[#eaecef]">Settings & Fee Configuration</h3>
          </div>
          <button onClick={onClose} className="text-[#848e9c] hover:text-[#eaecef] p-1">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Binance Fee Configuration */}
          <div className="bg-[#0b0e14] p-3 rounded-xl border border-[#222b40] space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-[#eaecef] block">Binance Fee Tier</span>
                <span className="text-[11px] text-[#848e9c]">
                  {useBnb ? 'Using BNB 25% discount (0.075%)' : 'Standard Spot Fee (0.100%)'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setUseBnb(!useBnb)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  useBnb ? 'bg-[#f0b90b]' : 'bg-[#222b40]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#0b0e14] shadow transition duration-200 ease-in-out ${
                    useBnb ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Default Risk Percent */}
          <div className="bg-[#0b0e14] p-3 rounded-xl border border-[#222b40] space-y-2">
            <span className="font-bold text-[#eaecef] block">Default Risk Per Trade</span>
            <div className="flex space-x-2">
              {[1.0, 1.5, 2.0].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRiskPercent(val)}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${
                    riskPercent === val
                      ? 'bg-[#f0b90b] text-[#0b0e14]'
                      : 'bg-[#121824] text-[#848e9c] border border-[#222b40]'
                  }`}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>

          {/* Simulated Slippage */}
          <div className="bg-[#0b0e14] p-3 rounded-xl border border-[#222b40] space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[#eaecef]">Simulated Slippage</span>
              <span className="text-[#f0b90b] font-mono-numbers font-semibold">{slippage}%</span>
            </div>
            <input
              type="range"
              min="0.00"
              max="0.10"
              step="0.01"
              value={slippage}
              onChange={(e) => setSlippage(parseFloat(e.target.value))}
              className="w-full accent-[#f0b90b]"
            />
          </div>

          {/* Android Standalone APK Information */}
          <div className="bg-[#0b0e14] p-3.5 rounded-xl border border-[#0ecb81]/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-[#0ecb81] font-bold">
                <Smartphone size={16} />
                <span>Standalone Android APK</span>
              </div>
              <span className="text-[10px] bg-[#0ecb81]/15 text-[#0ecb81] px-2 py-0.5 rounded font-mono font-bold">Capacitor Native</span>
            </div>
            <p className="text-[#848e9c] text-[11px] leading-relaxed">
              Standalone native Android application packaged with Capacitor. Local-only encrypted journal storage with zero telemetry.
            </p>
            <div className="text-[10px] text-[#848e9c] bg-[#121824] p-2 rounded border border-[#222b40] font-mono">
              Package: com.binancetrader.papertrading
            </div>
          </div>

          {/* Android App Installation Guide */}
          <div className="bg-[#0b0e14] p-3.5 rounded-xl border border-[#00d2ff]/30 space-y-2">
            <div className="flex items-center space-x-2 text-[#00d2ff] font-bold">
              <Smartphone size={16} />
              <span>Alternative: Install via Web PWA</span>
            </div>
            <p className="text-[#848e9c] text-[11px] leading-relaxed">
              Open this web page in Android Chrome, tap the <strong className="text-white">three dots menu (⋮)</strong>, and select <strong className="text-[#00d2ff]">"Install App"</strong>.
            </p>
          </div>

          {/* Reset Account */}
          <div className="bg-[#0b0e14] p-3 rounded-xl border border-[#f6465d]/30 space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold text-[#f6465d] block">Reset Paper Balance</span>
                <span className="text-[11px] text-[#848e9c]">Current: ${usdtBalance.toFixed(2)} USDT</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  value={initialBalInput}
                  onChange={(e) => setInitialBalInput(parseFloat(e.target.value) || 1000)}
                  className="w-20 bg-[#121824] border border-[#222b40] rounded px-2 py-1 text-right text-[#eaecef]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Reset paper trading account to $${initialBalInput} USDT?`)) {
                      resetAccount(initialBalInput);
                      onClose();
                    }
                  }}
                  className="px-2.5 py-1 bg-[#f6465d] hover:bg-[#e03a50] text-white rounded font-bold text-xs flex items-center space-x-1"
                >
                  <RefreshCw size={12} />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#222b40] bg-[#0b0e14] flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-[#848e9c] hover:bg-[#121824]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-1 px-4 py-2 rounded-lg text-xs font-bold bg-[#f0b90b] text-[#0b0e14] hover:bg-[#deb00a]"
          >
            {savedMessage ? <Check size={14} /> : null}
            <span>{savedMessage ? 'Saved!' : 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
