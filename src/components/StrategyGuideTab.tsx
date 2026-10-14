import React, { useState } from 'react';
import {
  Zap,
  HelpCircle,
} from 'lucide-react';

export const StrategyGuideTab: React.FC = () => {
  const [tradeCapital, setTradeCapital] = useState<number>(5000);
  const [riskPct, setRiskPct] = useState<number>(1.5);
  const [winRateSlider, setWinRateSlider] = useState<number>(60);

  // Simulation over 20 trades
  const totalTrades = 20;
  const wins = Math.round((winRateSlider / 100) * totalTrades);
  const losses = totalTrades - wins;
  const riskPerTrade = tradeCapital * (riskPct / 100); // e.g. $75
  const winReward = riskPerTrade * 2.5; // 1:2.5 R:R e.g. $187.50

  const roundTripFeePerTrade = (tradeCapital * 0.4) * 0.002; // Average 0.2% round-trip fee on position
  const totalFees = totalTrades * roundTripFeePerTrade;
  const grossProfit = wins * winReward - losses * riskPerTrade;
  const netProfit = grossProfit - totalFees;

  return (
    <div className="p-4 space-y-4 text-xs font-sans leading-relaxed text-[#eaecef]">
      {/* Title Banner */}
      <div className="bg-[#0b0e14] p-3.5 rounded-xl border border-[#222b40]">
        <div className="flex items-center space-x-2 text-[#f0b90b] font-bold text-sm mb-1">
          <HelpCircle size={18} />
          <h3>Understanding the Strategy: In Plain English</h3>
        </div>
        <p className="text-[#848e9c] text-xs">
          Trading is not about guessing if the market will go up or down. It is about waiting for a <strong>discounted price</strong> in a clear trend, setting a trap, and letting the math protect you.
        </p>
      </div>

      {/* The 4-Step Plain English Breakdown */}
      <div className="space-y-3">
        {/* Step 1 */}
        <div className="bg-[#0b0e14] p-3.5 rounded-xl border border-[#222b40] space-y-1.5">
          <div className="flex items-center space-x-2 text-[#00d2ff] font-bold text-xs">
            <span className="w-5 h-5 rounded-full bg-[#00d2ff]/20 flex items-center justify-center text-[11px]">1</span>
            <h4>Rule 1: Never Buy in a Downtrend (The Highway Rule)</h4>
          </div>
          <p className="text-[#848e9c]">
            On Binance Spot, you can only make money when prices rise. If SOL is driving downhill, <strong>never try to catch a falling knife</strong>.
          </p>
          <div className="bg-[#121824] p-2.5 rounded-lg border border-[#222b40] text-[11px] text-[#eaecef]">
            <span className="text-[#aa3bff] font-bold">The Rule:</span> Look at the purple <strong>50 EMA line</strong>. If SOL's price is ABOVE this line, the highway is going uphill. Only then do we consider buying. If price is below, we keep 100% of our money in USDT cash.
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-[#0b0e14] p-3.5 rounded-xl border border-[#222b40] space-y-1.5">
          <div className="flex items-center space-x-2 text-[#f0b90b] font-bold text-xs">
            <span className="w-5 h-5 rounded-full bg-[#f0b90b]/20 flex items-center justify-center text-[11px]">2</span>
            <h4>Rule 2: Don't Chase Rockets—Wait for the Trampoline (Pullback)</h4>
          </div>
          <p className="text-[#848e9c]">
            When you see a huge green candle jumping from $150 to $155, your brain screams: <em>"Buy now before it goes to $200!"</em> (This is FOMO). When you buy at $155, smart traders sell to you, and the price drops.
          </p>
          <div className="bg-[#121824] p-2.5 rounded-lg border border-[#222b40] text-[11px] text-[#eaecef]">
            <span className="text-[#f0b90b] font-bold">The Rule:</span> Let the rocket launch. Then wait patiently for it to cool off and dip back toward the yellow <strong>20 EMA</strong> or cyan <strong>VWAP line</strong>. These lines act like a <strong>trampoline floor</strong> where buyers naturally step back in.
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-[#0b0e14] p-3.5 rounded-xl border border-[#222b40] space-y-1.5">
          <div className="flex items-center space-x-2 text-[#0ecb81] font-bold text-xs">
            <span className="w-5 h-5 rounded-full bg-[#0ecb81]/20 flex items-center justify-center text-[11px]">3</span>
            <h4>Rule 3: Check the Fuel Gauge (RSI Momentum)</h4>
          </div>
          <p className="text-[#848e9c]">
            The RSI indicator measures how tired the buyers or sellers are:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#848e9c] text-[11px]">
            <li><strong>RSI Above 70:</strong> The engine is redlining and overheating. DO NOT BUY.</li>
            <li><strong>RSI Between 40 and 55 on a dip:</strong> The engine has cooled down, but the car is still facing uphill. This is your green light to buy.</li>
          </ul>
        </div>

        {/* Step 4 */}
        <div className="bg-[#0b0e14] p-3.5 rounded-xl border border-[#222b40] space-y-1.5">
          <div className="flex items-center space-x-2 text-[#f6465d] font-bold text-xs">
            <span className="w-5 h-5 rounded-full bg-[#f6465d]/20 flex items-center justify-center text-[11px]">4</span>
            <h4>Rule 4: The 1:2.5 Asymmetric Math (Crushing Binance Fees)</h4>
          </div>
          <p className="text-[#848e9c]">
            Binance takes 0.1% when you buy and 0.1% when you sell (0.2% round-trip). If you try to grab small 0.4% moves, fees eat half your money.
          </p>
          <div className="bg-[#121824] p-2.5 rounded-lg border border-[#222b40] text-[11px] text-[#eaecef] space-y-1">
            <div>• Place your <strong>Stop Loss</strong> just below the local low (e.g. 1.5% below entry).</div>
            <div>• Place your <strong>Take Profit</strong> target 2.5x higher (e.g. 3.75% above entry).</div>
            <div className="text-[#0ecb81] font-bold pt-1">
              Result: You risk $1 to make $2.50. Even with a 50% win rate, you generate massive net profits after all exchange fees!
            </div>
          </div>
        </div>
      </div>

      {/* Interactive 20-Trade Mathematical Simulator */}
      <div className="bg-[#0b0e14] p-4 rounded-xl border border-[#f0b90b]/40 space-y-3 font-mono-numbers">
        <div className="flex items-center space-x-2 text-[#f0b90b] font-bold font-sans text-xs">
          <Zap size={16} />
          <h4>Interactive Simulator: Why Position Sizing Kills Fear</h4>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-[#848e9c] block mb-1 font-sans text-[11px]">Your Capital ($USDT)</label>
            <input
              type="number"
              value={tradeCapital}
              onChange={(e) => setTradeCapital(parseFloat(e.target.value) || 1000)}
              className="w-full bg-[#121824] border border-[#222b40] rounded px-2.5 py-1 text-white"
            />
          </div>
          <div>
            <label className="text-[#848e9c] block mb-1 font-sans text-[11px]">Risk Per Trade (%)</label>
            <div className="flex space-x-1">
              {[1.0, 1.5, 2.0].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRiskPct(r)}
                  className={`flex-1 py-1 rounded text-[11px] font-bold ${
                    riskPct === r ? 'bg-[#f0b90b] text-[#0b0e14]' : 'bg-[#121824] text-[#848e9c]'
                  }`}
                >
                  {r}%
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] font-sans text-[#848e9c] mb-1">
            <span>Projected Win Rate: <strong className="text-white">{winRateSlider}%</strong></span>
            <span>({wins} Wins / {losses} Losses out of 20 Trades)</span>
          </div>
          <input
            type="range"
            min="40"
            max="80"
            step="5"
            value={winRateSlider}
            onChange={(e) => setWinRateSlider(parseInt(e.target.value))}
            className="w-full accent-[#f0b90b]"
          />
        </div>

        {/* Results Box */}
        <div className="bg-[#121824] p-3 rounded-lg border border-[#222b40] space-y-1.5 text-xs">
          <div className="flex justify-between text-[11px]">
            <span className="text-[#848e9c]">Risk per trade (SL loss):</span>
            <span className="text-[#f6465d] font-bold">-${riskPerTrade.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-[#848e9c]">Profit per win (1:2.5 R:R):</span>
            <span className="text-[#0ecb81] font-bold">+${winReward.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-[#848e9c]">Estimated Binance 0.1% Fees (20 Trades):</span>
            <span className="text-[#f0b90b]">-${totalFees.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs pt-1 border-t border-[#222b40] font-bold">
            <span className="text-[#eaecef]">Net Projected Profit:</span>
            <span className={netProfit >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}>
              {netProfit >= 0 ? '+' : ''}${netProfit.toFixed(2)} ({((netProfit / tradeCapital) * 100).toFixed(1)}% growth)
            </span>
          </div>
        </div>

        <div className="text-[11px] font-sans text-[#848e9c] bg-[#121824]/60 p-2.5 rounded-lg border border-[#222b40]/60">
          💡 <strong className="text-white">Why this eliminates fear:</strong> Even if you lose 4 trades in a row, you only lose ~6% of your account. You will never blow up, and your heart rate stays completely calm!
        </div>
      </div>
    </div>
  );
};
