import React from 'react';
import { useTrading } from '../context/TradingContext';
import { ListFilter, XCircle } from 'lucide-react';

export const OpenOrdersList: React.FC = () => {
  const { openOrders, cancelOrder } = useTrading();

  if (openOrders.length === 0) {
    return (
      <div className="bg-[#121824] p-3 text-center text-xs text-[#848e9c]">
        No active limit orders.
      </div>
    );
  }

  return (
    <div className="bg-[#121824] p-3 text-xs font-mono-numbers">
      <div className="flex items-center space-x-2 pb-2 mb-2 border-b border-[#222b40]">
        <ListFilter size={15} className="text-[#f0b90b]" />
        <span className="font-bold text-sm text-[#eaecef] font-sans">Open Orders ({openOrders.length})</span>
      </div>

      <div className="space-y-2">
        {openOrders.map((order) => {
          const isBuy = order.side === 'BUY';
          return (
            <div
              key={order.id}
              className="bg-[#0b0e14] p-2.5 rounded-xl border border-[#222b40] flex items-center justify-between"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`font-bold text-xs px-1.5 py-0.2 rounded ${
                      isBuy ? 'bg-[#0ecb81]/20 text-[#0ecb81]' : 'bg-[#f6465d]/20 text-[#f6465d]'
                    }`}
                  >
                    {order.side} {order.type}
                  </span>
                  <span className="font-bold text-[#eaecef]">{order.symbol}</span>
                </div>
                <div className="text-[11px] text-[#848e9c] mt-1">
                  Qty: {order.quantity.toFixed(4)} @ ${order.price.toFixed(2)} (${order.totalValue.toFixed(2)} USDT)
                </div>
              </div>

              <button
                onClick={() => cancelOrder(order.id)}
                className="flex items-center space-x-1 text-[#f6465d] hover:bg-[#f6465d]/10 px-2 py-1 rounded transition-colors text-xs font-semibold"
              >
                <XCircle size={14} />
                <span>Cancel</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
