import React, { useState } from 'react';
import { useTrading } from '../context/TradingContext';
import { SUPPORTED_PAIRS } from '../constants/pairs';
import type { CryptoPair } from '../types/trading';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  SlidersHorizontal,
  Wallet,
  ShieldAlert,
} from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenRiskGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onOpenRiskGuide }) => {
  const {
    selectedPair,
    setSelectedPair,
    currentTicker,
    usdtBalance,
    totalPortfolioValue,
    resetAccount,
  } = useTrading();

  const [pairDropdownOpen, setPairDropdownOpen] = useState(false);

  const price = currentTicker?.price || 0;
  const changePercent = currentTicker?.priceChangePercent || 0;
  const isUp = changePercent >= 0;

  return (
    <header className="sticky top-0 z-30 bg-[#0b0e14] border-b border-[#222b40] px-3 py-2 sm:px-4">
      <div className="flex items-center justify-between">
        {/* Pair Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setPairDropdownOpen(!pairDropdownOpen)}
            className="flex items-center space-x-2.5 bg-[#121824] hover:bg-[#1b2234] border border-[#222b40] px-2.5 py-1.5 rounded-lg transition-colors text-left"
          >
            <img src="/logo.png" alt="App Logo" className="w-7 h-7 rounded-md shrink-0 object-contain" />
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-sm tracking-wide text-[#eaecef]">
                  {selectedPair.baseAsset}/{selectedPair.quoteAsset}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 bg-[#222b40] rounded text-[#848e9c]">
                  Spot
                </span>
              </div>
              <div className="flex items-center space-x-1 text-xs font-mono-numbers">
                <span className="font-semibold text-white">
                  ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: selectedPair.priceDecimals })}
                </span>
                <span
                  className={`flex items-center text-[11px] ${
                    isUp ? 'text-[#0ecb81]' : 'text-[#f6465d]'
                  }`}
                >
                  {isUp ? <TrendingUp size={11} className="mr-0.5" /> : <TrendingDown size={11} className="mr-0.5" />}
                  {isUp ? '+' : ''}{changePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </button>

          {/* Dropdown Menu */}
          {pairDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-56 bg-[#121824] border border-[#222b40] rounded-xl shadow-2xl py-1 z-50">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-[#848e9c] uppercase border-b border-[#222b40]">
                Select Trading Pair
              </div>
              {SUPPORTED_PAIRS.map((pair: CryptoPair) => (
                <button
                  key={pair.symbol}
                  onClick={() => {
                    setSelectedPair(pair);
                    setPairDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-[#1b2234] transition-colors ${
                    selectedPair.symbol === pair.symbol ? 'bg-[#1b2234] text-[#f0b90b]' : 'text-[#eaecef]'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-bold">{pair.baseAsset}/{pair.quoteAsset}</div>
                    <div className="text-[10px] text-[#848e9c]">{pair.name}</div>
                  </div>
                  {pair.symbol === 'SOLUSDT' && (
                    <span className="text-[10px] bg-[#f0b90b]/10 text-[#f0b90b] px-1.5 py-0.5 rounded font-medium">
                      Best Day Trade
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Portfolio Balance & Action Icons */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Quick Balance Pill */}
          <div className="hidden xs:flex flex-col items-end px-2.5 py-1 bg-[#121824] border border-[#222b40] rounded-lg text-right">
            <span className="text-[10px] text-[#848e9c] flex items-center">
              <Wallet size={10} className="mr-1" />
              Paper Equity
            </span>
            <span className="text-xs font-bold text-[#eaecef] font-mono-numbers">
              ${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Risk Guide Button */}
          <button
            onClick={onOpenRiskGuide}
            className="flex items-center space-x-1 bg-[#121824] hover:bg-[#1b2234] border border-[#f0b90b]/30 text-[#f0b90b] px-2 py-1.5 rounded-lg text-xs font-medium transition-colors"
            title="Psychology & Risk Management Guide"
          >
            <ShieldAlert size={14} />
            <span className="hidden md:inline">Risk Guide</span>
          </button>

          {/* Settings / Fee Config Button */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 bg-[#121824] hover:bg-[#1b2234] border border-[#222b40] text-[#848e9c] hover:text-[#eaecef] rounded-lg transition-colors"
            title="App Settings & Binance Fee Config"
          >
            <SlidersHorizontal size={16} />
          </button>

          {/* Reset Account Button */}
          <button
            onClick={() => {
              if (window.confirm('Reset your paper trading account to $5,000 USDT?')) {
                resetAccount(5000);
              }
            }}
            className="p-1.5 bg-[#121824] hover:bg-[#1b2234] border border-[#222b40] text-[#848e9c] hover:text-[#f6465d] rounded-lg transition-colors"
            title="Reset Paper Account"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* 24h Stats Bar */}
      {currentTicker && (
        <div className="flex items-center space-x-4 mt-2 text-[11px] text-[#848e9c] overflow-x-auto whitespace-nowrap scrollbar-none font-mono-numbers">
          <div>
            24h High: <span className="text-[#eaecef]">${currentTicker.high24h.toFixed(2)}</span>
          </div>
          <div>
            24h Low: <span className="text-[#eaecef]">${currentTicker.low24h.toFixed(2)}</span>
          </div>
          <div>
            24h Vol ({selectedPair.baseAsset}): <span className="text-[#eaecef]">{Math.floor(currentTicker.volume24h).toLocaleString()}</span>
          </div>
          <div>
            Cash: <span className="text-[#0ecb81] font-semibold">${usdtBalance.toFixed(2)} USDT</span>
          </div>
        </div>
      )}
    </header>
  );
};
