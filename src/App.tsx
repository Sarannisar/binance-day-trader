import { useState } from 'react';
import { TradingProvider, useTrading } from './context/TradingContext';
import { Header } from './components/Header';
import { TradingChart } from './components/TradingChart';
import { StrategyBanner } from './components/StrategyBanner';
import { ActivePositionCard } from './components/ActivePositionCard';
import { OrderPanel } from './components/OrderPanel';
import { OpenOrdersList } from './components/OpenOrdersList';
import { TradeTrackerTab } from './components/TradeTrackerTab';
import { StrategyGuideTab } from './components/StrategyGuideTab';
import { RiskCalculatorModal } from './components/RiskCalculatorModal';
import { RiskGuideModal } from './components/RiskGuideModal';
import { SettingsModal } from './components/SettingsModal';
import { NotificationBanner } from './components/NotificationBanner';
import { TrendingUp, ListFilter, BarChart3, GraduationCap } from 'lucide-react';

export function MainTradingApp() {
  const [activeTab, setActiveTab] = useState<'TRADE' | 'TRACKER' | 'ORDERS' | 'GUIDE'>('TRADE');
  const [isRiskCalcOpen, setIsRiskCalcOpen] = useState(false);
  const [isRiskGuideOpen, setIsRiskGuideOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Values passed dynamically to Order Form
  const [appliedUsdt, setAppliedUsdt] = useState<number | null>(null);
  const [appliedStopLoss, setAppliedStopLoss] = useState<number | null>(null);
  const [appliedTakeProfit, setAppliedTakeProfit] = useState<number | null>(null);
  const [appliedPrice, setAppliedPrice] = useState<number | null>(null);

  const { usdtBalance, totalPortfolioValue } = useTrading();

  // Handlers
  const handleApplyPositionSize = (usdt: number, sl: number, tp: number) => {
    setAppliedUsdt(usdt);
    setAppliedStopLoss(sl);
    setAppliedTakeProfit(tp);
    setActiveTab('TRADE');
  };

  const handleApplySignalSetup = (entryPrice: number, sl: number, tp: number) => {
    // Dynamically calculate safe 1.5% position size based on current capital
    const capital = usdtBalance > 20 ? usdtBalance : totalPortfolioValue;
    const riskDollar = capital * 0.015; // 1.5% risk
    const riskDistance = Math.max(0.1, entryPrice - sl);
    const safeQty = riskDollar / riskDistance;
    const safeUsdt = Math.min(capital, safeQty * entryPrice);

    setAppliedPrice(entryPrice);
    setAppliedStopLoss(sl);
    setAppliedTakeProfit(tp);
    setAppliedUsdt(Number(safeUsdt.toFixed(2)));
    setActiveTab('TRADE');
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-[#eaecef] flex flex-col max-w-4xl mx-auto shadow-2xl border-x border-[#222b40]/50 relative pb-20">
      {/* Floating In-App Market Notification Banner */}
      <NotificationBanner />

      {/* 1. Header with Pair Switcher & Live Equity */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenRiskGuide={() => setIsRiskGuideOpen(true)}
      />

      {/* Main Content Area based on Tab */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'TRADE' && (
          <div className="space-y-0">
            {/* Real-time Candlestick Chart with Auto Markers */}
            <TradingChart showIndicators={true} />

            {/* Dynamic Real-time Strategy Radar with Auto-Updating Apply Button */}
            <StrategyBanner onApplySignalSetup={handleApplySignalSetup} />

            {/* Active Position Tracker */}
            <ActivePositionCard />

            {/* Order Entry Panel (has generous bottom padding for Android navbar) */}
            <OrderPanel
              onOpenRiskCalculator={() => setIsRiskCalcOpen(true)}
              appliedUsdtAmount={appliedUsdt}
              appliedStopLoss={appliedStopLoss}
              appliedTakeProfit={appliedTakeProfit}
              appliedPrice={appliedPrice}
            />
          </div>
        )}

        {activeTab === 'TRACKER' && (
          <TradeTrackerTab />
        )}

        {activeTab === 'ORDERS' && (
          <div className="p-3 space-y-3 pb-24">
            <ActivePositionCard />
            <OpenOrdersList />
          </div>
        )}

        {activeTab === 'GUIDE' && (
          <div className="pb-24">
            <StrategyGuideTab />
          </div>
        )}
      </main>

      {/* Modern, Clean Bottom Navigation Bar (Easy to maneuver, finger-friendly) */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-4xl mx-auto z-40 bg-[#121824]/95 backdrop-blur-md border-t border-[#222b40] px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom">
        <button
          onClick={() => setActiveTab('TRADE')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'TRADE'
              ? 'text-[#f0b90b] font-bold scale-105'
              : 'text-[#848e9c] hover:text-[#eaecef]'
          }`}
        >
          <TrendingUp size={18} />
          <span className="text-[10px] mt-0.5">Trade</span>
        </button>

        <button
          onClick={() => setActiveTab('TRACKER')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'TRACKER'
              ? 'text-[#f0b90b] font-bold scale-105'
              : 'text-[#848e9c] hover:text-[#eaecef]'
          }`}
        >
          <BarChart3 size={18} />
          <span className="text-[10px] mt-0.5">Tracker</span>
        </button>

        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'ORDERS'
              ? 'text-[#f0b90b] font-bold scale-105'
              : 'text-[#848e9c] hover:text-[#eaecef]'
          }`}
        >
          <ListFilter size={18} />
          <span className="text-[10px] mt-0.5">Orders</span>
        </button>

        <button
          onClick={() => setActiveTab('GUIDE')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'GUIDE'
              ? 'text-[#00d2ff] font-bold scale-105'
              : 'text-[#848e9c] hover:text-[#eaecef]'
          }`}
        >
          <GraduationCap size={18} />
          <span className="text-[10px] mt-0.5">Guide</span>
        </button>
      </nav>

      {/* Modals */}
      <RiskCalculatorModal
        isOpen={isRiskCalcOpen}
        onClose={() => setIsRiskCalcOpen(false)}
        onApplyPositionSize={handleApplyPositionSize}
      />

      <RiskGuideModal
        isOpen={isRiskGuideOpen}
        onClose={() => setIsRiskGuideOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <TradingProvider>
      <MainTradingApp />
    </TradingProvider>
  );
}
