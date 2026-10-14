import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  ColorType,
  CandlestickSeries,
  LineSeries,
  createSeriesMarkers,
  type IChartApi,
  type ISeriesApi,
  type IPriceLine,
  type ISeriesMarkersPluginApi,
} from 'lightweight-charts';
import { useTrading } from '../context/TradingContext';
import { calculateEMA, calculateVWAP, generateStrategyMarkers } from '../utils/indicators';
import { Crosshair } from 'lucide-react';

interface TradingChartProps {
  showIndicators?: boolean;
}

export const TradingChart: React.FC<TradingChartProps> = ({ showIndicators = true }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const ema20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const vwapSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const markersPluginRef = useRef<ISeriesMarkersPluginApi<any> | null>(null);

  const entryLineRef = useRef<IPriceLine | null>(null);
  const slLineRef = useRef<IPriceLine | null>(null);
  const tpLineRef = useRef<IPriceLine | null>(null);

  const [showSignals, setShowSignals] = useState(true);

  const { candles, currentPosition, timeframe, setTimeframe } = useTrading();

  // Initialize Lightweight Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0b0e14' },
        textColor: '#848e9c',
      },
      grid: {
        vertLines: { color: 'rgba(34, 43, 64, 0.4)' },
        horzLines: { color: 'rgba(34, 43, 64, 0.4)' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#848e9c',
          width: 1,
          style: 3,
        },
        horzLine: {
          color: '#848e9c',
          width: 1,
          style: 3,
        },
      },
      timeScale: {
        borderColor: '#222b40',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#222b40',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      autoSize: true,
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#0ecb81',
      downColor: '#f6465d',
      borderVisible: false,
      wickUpColor: '#0ecb81',
      wickDownColor: '#f6465d',
    });

    // Create markers plugin for BUY / SELL arrows
    const markersPlugin = createSeriesMarkers(candlestickSeries, []);
    markersPluginRef.current = markersPlugin;

    const ema20Series = chart.addSeries(LineSeries, {
      color: '#f0b90b', // Yellow
      lineWidth: 1,
      title: 'EMA 20',
      priceLineVisible: false,
    });

    const ema50Series = chart.addSeries(LineSeries, {
      color: '#aa3bff', // Purple
      lineWidth: 1,
      title: 'EMA 50',
      priceLineVisible: false,
    });

    const vwapSeries = chart.addSeries(LineSeries, {
      color: '#00d2ff', // Cyan
      lineWidth: 1,
      title: 'VWAP',
      priceLineVisible: false,
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    ema20SeriesRef.current = ema20Series;
    ema50SeriesRef.current = ema50Series;
    vwapSeriesRef.current = vwapSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      markersPluginRef.current = null;
    };
  }, []);

  // Update Candle, Markers & Indicator Data
  useEffect(() => {
    if (!candlestickSeriesRef.current || candles.length === 0) return;

    // Filter duplicate or non-sequential timestamps to satisfy lightweight-charts requirement
    const sortedCandles = [...candles].sort((a, b) => a.time - b.time);
    const uniqueCandles = sortedCandles.filter((c, idx, arr) => {
      return idx === 0 || c.time > arr[idx - 1].time;
    });

    const chartData = uniqueCandles.map((c) => ({
      time: c.time as any,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    candlestickSeriesRef.current.setData(chartData);

    // Auto Plot Strategy BUY / SELL Markers
    if (markersPluginRef.current) {
      if (showSignals) {
        const markers = generateStrategyMarkers(uniqueCandles);
        markersPluginRef.current.setMarkers(markers as any);
      } else {
        markersPluginRef.current.setMarkers([]);
      }
    }

    if (showIndicators) {
      const closes = uniqueCandles.map((c) => c.close);
      const ema20 = calculateEMA(closes, 20);
      const ema50 = calculateEMA(closes, 50);
      const vwap = calculateVWAP(uniqueCandles);

      const ema20Data = uniqueCandles
        .map((c, i) => ({ time: c.time as any, value: ema20[i] }))
        .filter((d) => !isNaN(d.value));

      const ema50Data = uniqueCandles
        .map((c, i) => ({ time: c.time as any, value: ema50[i] }))
        .filter((d) => !isNaN(d.value));

      const vwapData = uniqueCandles
        .map((c, i) => ({ time: c.time as any, value: vwap[i] }))
        .filter((d) => !isNaN(d.value));

      ema20SeriesRef.current?.setData(ema20Data);
      ema50SeriesRef.current?.setData(ema50Data);
      vwapSeriesRef.current?.setData(vwapData);
    }
  }, [candles, showIndicators, showSignals]);

  // Update Visual Entry / Stop Loss / Take Profit Lines on Chart
  useEffect(() => {
    const series = candlestickSeriesRef.current;
    if (!series) return;

    // Clear old lines
    if (entryLineRef.current) {
      series.removePriceLine(entryLineRef.current);
      entryLineRef.current = null;
    }
    if (slLineRef.current) {
      series.removePriceLine(slLineRef.current);
      slLineRef.current = null;
    }
    if (tpLineRef.current) {
      series.removePriceLine(tpLineRef.current);
      tpLineRef.current = null;
    }

    if (currentPosition && currentPosition.quantity > 0) {
      // Entry line
      entryLineRef.current = series.createPriceLine({
        price: currentPosition.avgEntryPrice,
        color: '#f0b90b',
        lineWidth: 1,
        lineStyle: 0,
        axisLabelVisible: true,
        title: `ENTRY ($${currentPosition.avgEntryPrice.toFixed(2)})`,
      });

      // Stop loss line
      if (currentPosition.stopLossPrice) {
        slLineRef.current = series.createPriceLine({
          price: currentPosition.stopLossPrice,
          color: '#f6465d',
          lineWidth: 2,
          lineStyle: 2,
          axisLabelVisible: true,
          title: `STOP ($${currentPosition.stopLossPrice.toFixed(2)})`,
        });
      }

      // Take profit line
      if (currentPosition.takeProfitPrice) {
        tpLineRef.current = series.createPriceLine({
          price: currentPosition.takeProfitPrice,
          color: '#0ecb81',
          lineWidth: 2,
          lineStyle: 2,
          axisLabelVisible: true,
          title: `TARGET ($${currentPosition.takeProfitPrice.toFixed(2)})`,
        });
      }
    }
  }, [currentPosition]);

  return (
    <div className="relative w-full h-[340px] sm:h-[400px] bg-[#0b0e14] border-b border-[#222b40] flex flex-col">
      {/* Timeframe & Indicator Selector Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#121824] border-b border-[#222b40] text-xs">
        <div className="flex items-center space-x-1">
          {['1m', '5m', '15m', '1h', '4h'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                timeframe === tf
                  ? 'bg-[#222b40] text-[#f0b90b] font-bold'
                  : 'text-[#848e9c] hover:text-[#eaecef]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Signals & Indicators Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSignals(!showSignals)}
            className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
              showSignals
                ? 'bg-[#0ecb81]/20 text-[#0ecb81] border border-[#0ecb81]/40'
                : 'bg-[#222b40] text-[#848e9c]'
            }`}
            title="Toggle automatic BUY/SELL signal markers on candles"
          >
            <Crosshair size={12} />
            <span>Signals {showSignals ? 'ON' : 'OFF'}</span>
          </button>

          {showIndicators && (
            <div className="hidden sm:flex items-center space-x-2.5 text-[11px]">
              <span className="flex items-center space-x-1 text-[#f0b90b]">
                <span className="w-2 h-0.5 bg-[#f0b90b] inline-block"></span>
                <span>EMA20</span>
              </span>
              <span className="flex items-center space-x-1 text-[#aa3bff]">
                <span className="w-2 h-0.5 bg-[#aa3bff] inline-block"></span>
                <span>EMA50</span>
              </span>
              <span className="flex items-center space-x-1 text-[#00d2ff]">
                <span className="w-2 h-0.5 bg-[#00d2ff] inline-block"></span>
                <span>VWAP</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Chart Canvas Container */}
      <div ref={chartContainerRef} className="w-full flex-1" />
    </div>
  );
};
