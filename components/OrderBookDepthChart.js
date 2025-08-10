"use client";
import { useMemo, useState, useEffect, useRef } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  BarChart,
  Bar,
  Brush,
} from "recharts";

/**
 * OrderBookDepthChart
 * Props:
 *  - orderBook: { yes: [{price, qty}], no: [{price, qty}] }
 *  - height (optional)
 *  - type: 'area' | 'bar' (optional toggle; default 'area')
 */
export default function OrderBookDepthChart({
  orderBook,
  height = 260,
  type = "area",
}) {
  const [chartType, setChartType] = useState(type);
  const [debouncedOrderBook, setDebouncedOrderBook] = useState(orderBook);
  const timerRef = useRef();

  // Debounce updates to orderBook (15s)
  useEffect(() => {
    if (!orderBook) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedOrderBook(orderBook);
    }, 15000);
    // If first mount or debouncedOrderBook is null, update immediately
    if (!debouncedOrderBook) setDebouncedOrderBook(orderBook);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line
  }, [orderBook]);

  // Transform debounced order book into unified depth data
  const data = useMemo(() => {
    if (!debouncedOrderBook) return [];
    const map = new Map(); // key: price -> { price, buy, sell }
    const add = (arr, key) => {
      arr?.forEach((lvl) => {
        const p = Number(lvl.price);
        if (!map.has(p)) map.set(p, { price: p, buy: 0, sell: 0 });
        map.get(p)[key] += Number(lvl.qty) || 0;
      });
    };
    add(debouncedOrderBook.yes, "buy"); // treat YES side as buy
    add(debouncedOrderBook.no, "sell"); // treat NO side as sell
    return Array.from(map.values()).sort((a, b) => a.price - b.price);
  }, [debouncedOrderBook]);

  const maxVol = useMemo(
    () => data.reduce((m, d) => Math.max(m, d.buy, d.sell), 0),
    [data]
  );

  const tooltipFormatter = (value, name) => [
    value,
    name === "buy" ? "Buy Volume" : "Sell Volume",
  ];
  const tooltipLabelFormatter = (label) => `Price ₹${label}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg tracking-tight text-white">
          Order Book Depth
        </h2>
        <div className="flex gap-1 text-[11px]">
          <button
            onClick={() => setChartType("area")}
            className={`px-2 py-1 rounded-md border border-neutral-700 ${
              chartType === "area"
                ? "bg-neutral-700 text-white"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Area
          </button>
          <button
            onClick={() => setChartType("bar")}
            className={`px-2 py-1 rounded-md border border-neutral-700 ${
              chartType === "bar"
                ? "bg-neutral-700 text-white"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Bar
          </button>
        </div>
      </div>
      <div className="text-[11px] text-neutral-500">
        Shows available liquidity (quantity) at each price level. YES side
        treated as Buy, NO side as Sell.
      </div>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "area" ? (
            <AreaChart
              data={data}
              margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis
                dataKey="price"
                tick={{ fill: "#888", fontSize: 12 }}
                tickFormatter={(p) => `₹${p}`}
              />
              <YAxis
                domain={[0, maxVol || 10]}
                tick={{ fill: "#888", fontSize: 12 }}
              />
              <Tooltip
                formatter={tooltipFormatter}
                labelFormatter={tooltipLabelFormatter}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="buy"
                stackId="1"
                stroke="#10b981"
                fill="#10b98155"
                name="Buy (YES)"
              />
              <Area
                type="monotone"
                dataKey="sell"
                stackId="1"
                stroke="#f43f5e"
                fill="#f43f5e55"
                name="Sell (NO)"
              />
              <Brush height={18} stroke="#444" travellerWidth={8} gap={1} />
            </AreaChart>
          ) : (
            <BarChart
              data={data}
              margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis
                dataKey="price"
                tick={{ fill: "#888", fontSize: 12 }}
                tickFormatter={(p) => `₹${p}`}
              />
              <YAxis
                domain={[0, maxVol || 10]}
                tick={{ fill: "#888", fontSize: 12 }}
              />
              <Tooltip
                formatter={tooltipFormatter}
                labelFormatter={tooltipLabelFormatter}
              />
              <Legend />
              <Bar dataKey="buy" stackId="a" fill="#0ea5e9" name="Buy (YES)" />
              <Bar dataKey="sell" stackId="a" fill="#f97316" name="Sell (NO)" />
              <Brush height={18} stroke="#444" travellerWidth={8} gap={1} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
