import React, { useState, useEffect } from 'react';
import { useTrading } from '../context/TradingContext';
import { notificationService, type NotificationPreferences } from '../services/notificationService';
import {
  X,
  SlidersHorizontal,
  Smartphone,
  RefreshCw,
  Check,
  Bell,
  BellRing,
  DollarSign,
  Volume2,
  TrendingUp,
  Flame,
  CheckCircle2,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    riskSettings,
    updateRiskSettings,
    resetAccount,
    usdtBalance,
    permanentInitialBalance,
    setPermanentInitialBalance,
  } = useTrading();

  const [useBnb, setUseBnb] = useState<boolean>(riskSettings.useBnbFeeDiscount);
  const [riskPercent, setRiskPercent] = useState<number>(riskSettings.riskPercentPerTrade);
  const [slippage, setSlippage] = useState<number>(riskSettings.slippagePercent);

  // Permanent Initial Balance
  const [permBalInput, setPermBalInput] = useState<number>(permanentInitialBalance || 2000);
  const [resetBalInput, setResetBalInput] = useState<number>(permanentInitialBalance || 2000);
  const [startingSavedMessage, setStartingSavedMessage] = useState(false);

  // Notification Preferences
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(() =>
    notificationService.getPreferences()
  );
  const [hasNotifPermission, setHasNotifPermission] = useState<boolean>(true);
  const [testSent, setTestSent] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPermBalInput(permanentInitialBalance || 2000);
      setResetBalInput(permanentInitialBalance || 2000);
      setNotifPrefs(notificationService.getPreferences());
      notificationService.checkPermissions().then(setHasNotifPermission);
    }
  }, [isOpen, permanentInitialBalance]);

  if (!isOpen) return null;

  const handleTogglePref = (key: keyof NotificationPreferences) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    notificationService.savePreferences(updated);
  };

  const handleRequestPermission = async () => {
    const granted = await notificationService.requestPermissions();
    setHasNotifPermission(granted);
    if (granted) {
      notificationService.sendAlert({
        title: '🔔 Notifications Enabled',
        body: 'You will now receive alerts on market states and trade executions.',
        type: 'success',
      });
    }
  };

  const handleTestNotification = async () => {
    if (!hasNotifPermission) {
      await handleRequestPermission();
    }
    notificationService.sendAlert({
      title: '🔔 Test Market Alert',
      body: 'Binance Day Trader notifications are active & configured properly!',
      type: 'success',
    });
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2500);
  };

  const handleSave = () => {
    updateRiskSettings({
      useBnbFeeDiscount: useBnb,
      riskPercentPerTrade: riskPercent,
      slippagePercent: slippage,
    });
    // Save permanent initial balance if changed
    if (permBalInput > 0 && permBalInput !== permanentInitialBalance) {
      setPermanentInitialBalance(permBalInput, false);
    }
    notificationService.savePreferences(notifPrefs);

    setSavedMessage(true);
    setTimeout(() => {
      setSavedMessage(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#121824] border border-[#222b40] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#222b40] bg-[#0b0e14]">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal size={16} className="text-[#f0b90b]" />
            <h3 className="font-bold text-sm text-[#eaecef]">Settings & Market Notifications</h3>
          </div>
          <button onClick={onClose} className="text-[#848e9c] hover:text-[#eaecef] p-1">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Permanent Starting Capital Configuration */}
          <div className="bg-[#0b0e14] p-3.5 rounded-xl border border-[#f0b90b]/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-[#f0b90b] font-bold">
                <DollarSign size={16} />
                <span>Permanent Starting Capital</span>
              </div>
              <span className="text-[10px] bg-[#f0b90b]/15 text-[#f0b90b] px-2 py-0.5 rounded font-mono font-bold">
                Default $2,000
              </span>
            </div>
            <p className="text-[#848e9c] text-[11px] leading-relaxed">
              Permanently set your initial starting amount in USDT. This amount is saved as the baseline for all win/loss analytics, performance tracking, and future account resets.
            </p>

            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2 text-[#848e9c] text-xs font-mono">$</span>
                <input
                  type="number"
                  min="10"
                  max="10000000"
                  value={permBalInput}
                  onChange={(e) => setPermBalInput(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#121824] border border-[#222b40] rounded-lg pl-7 pr-3 py-1.5 text-xs font-mono text-[#eaecef] focus:border-[#f0b90b] focus:outline-none"
                  placeholder="2000"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const amt = permBalInput > 0 ? permBalInput : 2000;
                  setPermanentInitialBalance(amt, false);
                  setStartingSavedMessage(true);
                  setTimeout(() => setStartingSavedMessage(false), 2000);
                }}
                className="px-3 py-1.5 bg-[#121824] hover:bg-[#1a2336] text-[#f0b90b] border border-[#f0b90b]/40 rounded-lg font-bold text-xs whitespace-nowrap transition-colors flex items-center space-x-1"
              >
                {startingSavedMessage ? <Check size={12} /> : null}
                <span>{startingSavedMessage ? 'Saved!' : 'Save Baseline'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const amt = permBalInput > 0 ? permBalInput : 2000;
                  if (
                    window.confirm(
                      `Permanently save starting capital as $${amt.toLocaleString()} USDT and reset wallet balance now?`
                    )
                  ) {
                    setPermanentInitialBalance(amt, true);
                    resetAccount(amt);
                    setStartingSavedMessage(true);
                    setTimeout(() => setStartingSavedMessage(false), 2000);
                  }
                }}
                className="px-3 py-1.5 bg-[#f0b90b] hover:bg-[#deb00a] text-[#0b0e14] rounded-lg font-bold text-xs whitespace-nowrap transition-colors"
              >
                Apply & Reset
              </button>
            </div>

            {/* Quick Selection Presets */}
            <div className="grid grid-cols-4 gap-1.5 pt-0.5">
              {[1000, 2000, 5000, 10000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setPermBalInput(val)}
                  className={`py-1 rounded text-[11px] font-mono font-semibold transition-colors ${
                    permBalInput === val
                      ? 'bg-[#f0b90b] text-[#0b0e14]'
                      : 'bg-[#121824] text-[#848e9c] border border-[#222b40] hover:text-[#eaecef]'
                  }`}
                >
                  ${val.toLocaleString()}{val === 2000 ? ' (Def)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Push Notifications Configuration */}
          <div className="bg-[#0b0e14] p-3.5 rounded-xl border border-[#00d2ff]/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-[#00d2ff] font-bold">
                <BellRing size={16} />
                <span>Market Push Notifications</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleTogglePref('enabled')}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    notifPrefs.enabled ? 'bg-[#00d2ff]' : 'bg-[#222b40]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-[#0b0e14] shadow transition duration-200 ease-in-out ${
                      notifPrefs.enabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <p className="text-[#848e9c] text-[11px] leading-relaxed">
              Receive instant alerts for trade executions (TP/SL/Limit) and market condition shifts directly on your Android phone and browser.
            </p>

            {/* Notification Permission Banner if not granted */}
            {!hasNotifPermission && (
              <div className="p-2.5 rounded-lg bg-[#f0b90b]/10 border border-[#f0b90b]/40 flex items-center justify-between">
                <span className="text-[11px] text-[#f0b90b]">System notifications permission needed</span>
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="px-2 py-1 bg-[#f0b90b] text-[#0b0e14] font-bold text-[10px] rounded hover:bg-[#deb00a]"
                >
                  Grant Permission
                </button>
              </div>
            )}

            {/* Individual Market State Toggles */}
            <div className={`space-y-2 pt-1 ${notifPrefs.enabled ? '' : 'opacity-40 pointer-events-none'}`}>
              {/* Trade Fills */}
              <div className="flex items-center justify-between py-1 border-b border-[#222b40]/60">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 size={14} className="text-[#0ecb81]" />
                  <div>
                    <span className="text-[#eaecef] font-semibold block">Take Profit, Stop Loss & Limit Fills</span>
                    <span className="text-[10px] text-[#848e9c]">Instant notification when any order or stop executes</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.tradeFills}
                  onChange={() => handleTogglePref('tradeFills')}
                  className="accent-[#0ecb81] w-4 h-4 cursor-pointer"
                />
              </div>

              {/* RSI Overbought / Oversold */}
              <div className="flex items-center justify-between py-1 border-b border-[#222b40]/60">
                <div className="flex items-center space-x-2">
                  <TrendingUp size={14} className="text-[#f0b90b]" />
                  <div>
                    <span className="text-[#eaecef] font-semibold block">RSI Overbought / Oversold Alerts</span>
                    <span className="text-[10px] text-[#848e9c]">Alerts when RSI &gt; 70 (Overbought) or &lt; 30 (Oversold)</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.rsiAlerts}
                  onChange={() => handleTogglePref('rsiAlerts')}
                  className="accent-[#f0b90b] w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Trend Shift & EMA Cross */}
              <div className="flex items-center justify-between py-1 border-b border-[#222b40]/60">
                <div className="flex items-center space-x-2">
                  <Flame size={14} className="text-[#00d2ff]" />
                  <div>
                    <span className="text-[#eaecef] font-semibold block">Trend Direction & EMA Crossovers</span>
                    <span className="text-[10px] text-[#848e9c]">Notifies on Bullish EMA breakout or Bearish breakdown</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.trendAlerts}
                  onChange={() => handleTogglePref('trendAlerts')}
                  className="accent-[#00d2ff] w-4 h-4 cursor-pointer"
                />
              </div>

              {/* 24h High/Low Breakouts */}
              <div className="flex items-center justify-between py-1 border-b border-[#222b40]/60">
                <div className="flex items-center space-x-2">
                  <Bell size={14} className="text-[#f6465d]" />
                  <div>
                    <span className="text-[#eaecef] font-semibold block">24-Hour High / Low Breakouts</span>
                    <span className="text-[10px] text-[#848e9c]">Alerts when price tests or breaks 24h high or low</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.priceBreakouts}
                  onChange={() => handleTogglePref('priceBreakouts')}
                  className="accent-[#f6465d] w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Sound & In-App Toast */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center space-x-2">
                  <Volume2 size={14} className="text-[#eaecef]" />
                  <div>
                    <span className="text-[#eaecef] font-semibold block">Sound Chimes & In-App Banners</span>
                    <span className="text-[10px] text-[#848e9c]">Play audible tone & show floating card inside app</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.sound}
                  onChange={() => handleTogglePref('sound')}
                  className="accent-[#00d2ff] w-4 h-4 cursor-pointer"
                />
              </div>
            </div>

            {/* Test Notification Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleTestNotification}
                className="w-full py-1.5 bg-[#121824] hover:bg-[#1a2336] text-[#00d2ff] border border-[#00d2ff]/40 rounded-lg font-bold text-xs transition-colors flex items-center justify-center space-x-1.5"
              >
                {testSent ? <Check size={14} /> : <Bell size={14} />}
                <span>{testSent ? 'Test Notification Dispatched!' : 'Send Test Notification'}</span>
              </button>
            </div>
          </div>

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

          {/* Standalone Native App Info */}
          <div className="bg-[#0b0e14] p-3.5 rounded-xl border border-[#0ecb81]/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-[#0ecb81] font-bold">
                <Smartphone size={16} />
                <span>Standalone Android APK</span>
              </div>
              <span className="text-[10px] bg-[#0ecb81]/15 text-[#0ecb81] px-2 py-0.5 rounded font-mono font-bold">
                Capacitor Native v8
              </span>
            </div>
            <p className="text-[#848e9c] text-[11px] leading-relaxed">
              Standalone native Android application. Push notifications and local storage run fully locally on device without cloud telemetry.
            </p>
            <div className="text-[10px] text-[#848e9c] bg-[#121824] p-2 rounded border border-[#222b40] font-mono">
              Package: com.binancetrader.papertrading
            </div>
          </div>

          {/* Reset Account */}
          <div className="bg-[#0b0e14] p-3.5 rounded-xl border border-[#f6465d]/30 space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold text-[#f6465d] block">Reset Paper Balance</span>
                <span className="text-[11px] text-[#848e9c]">Current: ${usdtBalance.toFixed(2)} USDT</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  value={resetBalInput}
                  onChange={(e) => setResetBalInput(parseFloat(e.target.value) || 0)}
                  className="w-24 bg-[#121824] border border-[#222b40] rounded px-2 py-1 text-right text-[#eaecef] font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    const amt = resetBalInput > 0 ? resetBalInput : permanentInitialBalance;
                    if (window.confirm(`Reset paper trading account to $${amt.toLocaleString()} USDT?`)) {
                      resetAccount(amt);
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
