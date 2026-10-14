import React, { useState } from 'react';
import { useTrading } from '../context/TradingContext';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Clock,
  Award,
  Filter,
  Download,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const TradeTrackerTab: React.FC = () => {
  const {
    completedTrades,
    totalFeesPaid,
    netRealizedPnl,
    winRate,
    initialBalance,
    totalPortfolioValue,
    usdtBalance,
  } = useTrading();

  const [filterType, setFilterType] = useState<'ALL' | 'WINS' | 'LOSSES'>('ALL');

  const totalWins = completedTrades.filter((t) => t.netPnl > 0);
  const totalLosses = completedTrades.filter((t) => t.netPnl <= 0);

  const grossWinSum = totalWins.reduce((acc, t) => acc + t.grossPnl, 0);
  const grossLossSum = Math.abs(totalLosses.reduce((acc, t) => acc + t.grossPnl, 0));

  const avgWin = totalWins.length > 0 ? grossWinSum / totalWins.length : 0;
  const avgLoss = totalLosses.length > 0 ? grossLossSum / totalLosses.length : 0;
  const profitFactor = grossLossSum > 0 ? (grossWinSum / grossLossSum).toFixed(2) : grossWinSum > 0 ? '∞' : '0.00';

  const totalGrowthPercent = initialBalance > 0 ? ((totalPortfolioValue - initialBalance) / initialBalance) * 100 : 0;

  // Filtered list
  const filteredTrades = completedTrades.filter((t) => {
    if (filterType === 'WINS') return t.netPnl > 0;
    if (filterType === 'LOSSES') return t.netPnl <= 0;
    return true;
  });

  // Export CSV
  const handleExportCSV = () => {
    if (completedTrades.length === 0) return;
    const sanitize = (val: any) => {
      const s = String(val ?? '');
      if (/^[=+\-@\t\r]/.test(s) && isNaN(Number(s))) {
        return `'${s.replace(/"/g, '""')}`;
      }
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const headers = 'ID,Symbol,Side,EntryPrice,ExitPrice,Quantity,GrossPnL,FeesPaid,NetPnL,ExitTime\n';
    const rows = completedTrades
      .map(
        (t) =>
          `${sanitize(t.id)},${sanitize(t.symbol)},${sanitize(t.side)},${t.entryPrice},${t.exitPrice},${t.quantity},${t.grossPnl.toFixed(2)},${t.feesPaid.toFixed(3)},${t.netPnl.toFixed(2)},"${new Date(
            t.exitTime
          ).toISOString()}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `binance-paper-trades-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-3 sm:p-4 space-y-4 text-xs font-sans text-[#eaecef] pb-28">
      {/* 1. Account Growth & Equity Header Card */}
      <div className="bg-[#0b0e14] p-4 rounded-2xl border border-[#222b40] shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-[#222b40]/80">
          <div>
            <span className="text-[11px] text-[#848e9c] uppercase tracking-wider block font-medium">
              TOTAL PAPER ACCOUNT VALUE
            </span>
            <div className="text-2xl font-black font-mono-numbers text-white mt-0.5">
              ${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xs text-[#848e9c] font-normal ml-1.5">USDT</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-[#848e9c] block font-medium">TOTAL GROWTH</span>
            <div
              className={`text-base font-bold font-mono-numbers flex items-center justify-end ${
                totalGrowthPercent >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'
              }`}
            >
              {totalGrowthPercent >= 0 ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
              {totalGrowthPercent >= 0 ? '+' : ''}{totalGrowthPercent.toFixed(2)}%
            </div>
            <span className="text-[10px] text-[#848e9c]">
              Started at ${initialBalance.toLocaleString()} USDT
            </span>
          </div>
        </div>

        {/* Cash vs Crypto Distribution Bar */}
        <div className="mt-3 pt-1 space-y-1.5">
          <div className="flex justify-between text-[11px] text-[#848e9c]">
            <span>Cash: <strong className="text-white">${usdtBalance.toFixed(2)}</strong></span>
            <span>Invested in Trades: <strong className="text-[#f0b90b]">${(totalPortfolioValue - usdtBalance).toFixed(2)}</strong></span>
          </div>
          <div className="w-full h-2 bg-[#121824] rounded-full overflow-hidden flex border border-[#222b40]">
            <div
              className="bg-[#0ecb81] h-full transition-all"
              style={{ width: `${Math.min(100, Math.max(0, (usdtBalance / totalPortfolioValue) * 100))}%` }}
              title="USDT Cash"
            />
            <div
              className="bg-[#f0b90b] h-full transition-all"
              style={{ width: `${Math.min(100, Math.max(0, ((totalPortfolioValue - usdtBalance) / totalPortfolioValue) * 100))}%` }}
              title="Crypto Positions"
            />
          </div>
        </div>
      </div>

      {/* 2. Key Trading Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono-numbers">
        {/* Win Rate */}
        <div className="bg-[#0b0e14] p-3 rounded-xl border border-[#222b40]">
          <div className="flex items-center justify-between text-[11px] text-[#848e9c] font-sans mb-1">
            <span>WIN RATE</span>
            <Percent size={13} className="text-[#f0b90b]" />
          </div>
          <div className="text-lg font-bold text-white">
            {winRate.toFixed(1)}%
          </div>
          <div className="text-[10px] text-[#848e9c] mt-0.5 font-sans">
            <span className="text-[#0ecb81] font-semibold">{totalWins.length} Won</span> / <span className="text-[#f6465d] font-semibold">{totalLosses.length} Lost</span>
          </div>
        </div>

        {/* Net Realized Profit */}
        <div className="bg-[#0b0e14] p-3 rounded-xl border border-[#222b40]">
          <div className="flex items-center justify-between text-[11px] text-[#848e9c] font-sans mb-1">
            <span>NET PNL (AFTER FEES)</span>
            <Award size={13} className="text-[#0ecb81]" />
          </div>
          <div className={`text-lg font-bold ${netRealizedPnl >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
            {netRealizedPnl >= 0 ? '+' : ''}${netRealizedPnl.toFixed(2)}
          </div>
          <div className="text-[10px] text-[#848e9c] mt-0.5 font-sans">
            Realized cash gain
          </div>
        </div>

        {/* Binance Fees Paid */}
        <div className="bg-[#0b0e14] p-3 rounded-xl border border-[#f0b90b]/30">
          <div className="flex items-center justify-between text-[11px] text-[#f0b90b] font-sans font-semibold mb-1">
            <span>BINANCE 0.1% FEES</span>
            <DollarSign size={13} />
          </div>
          <div className="text-lg font-bold text-[#f0b90b]">
            -${totalFeesPaid.toFixed(2)}
          </div>
          <div className="text-[10px] text-[#848e9c] mt-0.5 font-sans">
            Round-trip cost tracked
          </div>
        </div>

        {/* Profit Factor / Edge */}
        <div className="bg-[#0b0e14] p-3 rounded-xl border border-[#222b40]">
          <div className="flex items-center justify-between text-[11px] text-[#848e9c] font-sans mb-1">
            <span>PROFIT FACTOR</span>
            <Zap size={13} className="text-[#00d2ff]" />
          </div>
          <div className="text-lg font-bold text-white">
            {profitFactor}
          </div>
          <div className="text-[10px] text-[#848e9c] mt-0.5 font-sans">
            Avg Win ${avgWin.toFixed(0)} vs Loss ${avgLoss.toFixed(0)}
          </div>
        </div>
      </div>

      {/* 3. Trade Discipline Coach Insight */}
      <div className="bg-[#0b0e14] p-3.5 rounded-xl border border-[#222b40] flex items-start space-x-3">
        <div className="p-2 bg-[#0ecb81]/15 text-[#0ecb81] rounded-lg shrink-0 mt-0.5">
          <ShieldCheck size={18} />
        </div>
        <div className="text-xs leading-relaxed">
          <h4 className="font-bold text-white mb-0.5">Discipline & Edge Assessment</h4>
          {completedTrades.length === 0 ? (
            <p className="text-[#848e9c]">
              No closed trades yet. Use the <strong>Order Entry</strong> tab or click <strong>Apply Setup</strong> to practice your first pullback day trade.
            </p>
          ) : winRate >= 50 && Number(profitFactor) >= 1.5 ? (
            <p className="text-[#848e9c]">
              <strong className="text-[#0ecb81]">Outstanding Execution!</strong> Your average win is larger than your average loss, and your win rate is positive. You are absorbing Binance fees effortlessly!
            </p>
          ) : avgLoss > avgWin ? (
            <p className="text-[#848e9c]">
              <strong className="text-[#f6465d]">Attention:</strong> Your average loss (${avgLoss.toFixed(2)}) is higher than your average win (${avgWin.toFixed(2)}). Always respect your Stop Loss and avoid holding onto losing trades!
            </p>
          ) : (
            <p className="text-[#848e9c]">
              Good start. Continue practicing until you have at least 20 trades logged with proper 1.5% position sizing before trading real funds.
            </p>
          )}
        </div>
      </div>

      {/* 4. Complete Trade Log with Filter & Export */}
      <div className="bg-[#0b0e14] p-3.5 rounded-xl border border-[#222b40] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#222b40]">
          <div className="flex items-center space-x-2">
            <Filter size={15} className="text-[#f0b90b]" />
            <h4 className="font-bold text-white text-xs">Trade History Log ({filteredTrades.length})</h4>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Filter buttons */}
            {(['ALL', 'WINS', 'LOSSES'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterType(mode)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  filterType === mode
                    ? 'bg-[#222b40] text-[#f0b90b]'
                    : 'text-[#848e9c] hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}

            {completedTrades.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="flex items-center space-x-1 bg-[#121824] hover:bg-[#1b2234] border border-[#222b40] text-[#eaecef] px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ml-1"
                title="Export trade history to CSV"
              >
                <Download size={12} />
                <span>CSV</span>
              </button>
            )}
          </div>
        </div>

        {/* Trade cards */}
        {filteredTrades.length === 0 ? (
          <div className="text-center py-8 text-[#848e9c] border border-dashed border-[#222b40] rounded-xl">
            {completedTrades.length === 0
              ? 'No trades logged yet. Place a trade to see your performance metrics here.'
              : 'No trades match the selected filter.'}
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filteredTrades.map((trade) => {
              const isProfit = trade.netPnl >= 0;
              return (
                <div
                  key={trade.id}
                  className="bg-[#121824] p-3 rounded-xl border border-[#222b40] flex items-center justify-between text-xs font-mono-numbers hover:border-[#36425d] transition-colors"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-[#eaecef] font-sans text-sm">{trade.symbol}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-sans font-bold ${
                          isProfit ? 'bg-[#0ecb81]/20 text-[#0ecb81]' : 'bg-[#f6465d]/20 text-[#f6465d]'
                        }`}
                      >
                        {isProfit ? 'WIN' : 'LOSS'}
                      </span>
                      <span className="text-[10px] text-[#848e9c] font-sans">
                        {trade.strategyTag || 'Market Trade'}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#848e9c] mt-1">
                      ${trade.entryPrice.toFixed(2)} → ${trade.exitPrice.toFixed(2)} ({trade.quantity.toFixed(3)} {trade.symbol.replace('USDT', '')})
                    </div>

                    <div className="text-[10px] text-[#848e9c] flex items-center space-x-2 mt-0.5">
                      <span className="flex items-center">
                        <Clock size={10} className="mr-1" />
                        {new Date(trade.exitTime).toLocaleTimeString()}
                      </span>
                      {trade.durationSeconds > 0 && (
                        <span>• Held {Math.floor(trade.durationSeconds / 60)}m {trade.durationSeconds % 60}s</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-sm font-bold flex items-center justify-end ${isProfit ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                      {isProfit ? <TrendingUp size={14} className="mr-0.5" /> : <TrendingDown size={14} className="mr-0.5" />}
                      {isProfit ? '+' : ''}${trade.netPnl.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-[#848e9c]">
                      Gross: {trade.grossPnl >= 0 ? '+' : ''}${trade.grossPnl.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-[#f0b90b]">
                      Fee: -${trade.feesPaid.toFixed(3)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
