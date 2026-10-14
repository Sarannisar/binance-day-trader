import React from 'react';
import { useTrading } from '../context/TradingContext';
import { TrendingUp, TrendingDown, BookOpen, DollarSign, Percent, Clock } from 'lucide-react';

export const TradeJournal: React.FC = () => {
  const { completedTrades, totalFeesPaid, netRealizedPnl, winRate, initialBalance } = useTrading();

  const totalWins = completedTrades.filter(t => t.netPnl > 0);
  const totalLosses = completedTrades.filter(t => t.netPnl <= 0);
  const grossWinSum = totalWins.reduce((acc, t) => acc + t.grossPnl, 0);
  const grossLossSum = Math.abs(totalLosses.reduce((acc, t) => acc + t.grossPnl, 0));
  const profitFactor = grossLossSum > 0 ? (grossWinSum / grossLossSum).toFixed(2) : grossWinSum > 0 ? '∞' : '0.00';
  const totalNetPercent = initialBalance > 0 ? (netRealizedPnl / initialBalance) * 100 : 0;

  return (
    <div className="bg-[#121824] p-3 text-xs font-mono-numbers">
      <div className="flex items-center justify-between pb-3 border-b border-[#222b40]">
        <div className="flex items-center space-x-2">
          <BookOpen size={16} className="text-[#f0b90b]" />
          <h3 className="font-bold text-sm text-[#eaecef] font-sans">Performance & Journal</h3>
        </div>
        <span className="text-[11px] text-[#848e9c]">
          {completedTrades.length} Completed Trades
        </span>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3">
        <div className="bg-[#0b0e14] p-2.5 rounded-xl border border-[#222b40]">
          <span className="text-[10px] text-[#848e9c] block font-sans">NET REALIZED PNL</span>
          <div className={`font-bold text-sm flex items-center ${netRealizedPnl >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
            {netRealizedPnl >= 0 ? '+' : ''}${netRealizedPnl.toFixed(2)}
          </div>
          <span className={`text-[10px] ${netRealizedPnl >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
            {totalNetPercent >= 0 ? '+' : ''}{totalNetPercent.toFixed(2)}% on capital
          </span>
        </div>

        <div className="bg-[#0b0e14] p-2.5 rounded-xl border border-[#222b40]">
          <span className="text-[10px] text-[#848e9c] block font-sans">WIN RATE</span>
          <div className="font-bold text-sm text-white flex items-center">
            <Percent size={13} className="mr-0.5 text-[#f0b90b]" />
            {winRate.toFixed(1)}%
          </div>
          <span className="text-[10px] text-[#848e9c]">
            {totalWins.length}W / {totalLosses.length}L
          </span>
        </div>

        <div className="bg-[#0b0e14] p-2.5 rounded-xl border border-[#222b40]">
          <span className="text-[10px] text-[#f0b90b] block font-sans font-semibold">TOTAL BINANCE FEES</span>
          <div className="font-bold text-sm text-[#f0b90b] flex items-center">
            <DollarSign size={13} className="mr-0.5" />
            ${totalFeesPaid.toFixed(2)}
          </div>
          <span className="text-[10px] text-[#848e9c]">
            0.1% Round-Trip Cost
          </span>
        </div>

        <div className="bg-[#0b0e14] p-2.5 rounded-xl border border-[#222b40]">
          <span className="text-[10px] text-[#848e9c] block font-sans">PROFIT FACTOR</span>
          <div className="font-bold text-sm text-white">
            {profitFactor}
          </div>
          <span className="text-[10px] text-[#848e9c]">
            Gross Wins / Losses
          </span>
        </div>
      </div>

      {/* Trades List */}
      {completedTrades.length === 0 ? (
        <div className="text-center py-8 text-[#848e9c] border border-dashed border-[#222b40] rounded-xl font-sans">
          No trades logged yet. Place orders to record paper trades and track fee analytics.
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {completedTrades.map((trade) => {
            const isProfit = trade.netPnl >= 0;
            return (
              <div
                key={trade.id}
                className="bg-[#0b0e14] p-2.5 rounded-xl border border-[#222b40] flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-[#eaecef]">{trade.symbol}</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-[#222b40] rounded text-[#848e9c]">
                      {trade.strategyTag || 'Market Trade'}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#848e9c] mt-0.5">
                    ${trade.entryPrice.toFixed(2)} → ${trade.exitPrice.toFixed(2)} ({trade.quantity.toFixed(3)} {trade.symbol.replace('USDT', '')})
                  </div>
                  <div className="text-[10px] text-[#848e9c] flex items-center mt-0.5">
                    <Clock size={10} className="mr-1" />
                    {new Date(trade.exitTime).toLocaleTimeString()}
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-bold flex items-center justify-end ${isProfit ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                    {isProfit ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />}
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
  );
};
