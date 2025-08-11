"use client";
import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Brush,
  ReferenceLine,
  BarChart,
  Bar,
  ComposedChart,
  Scatter,
  Cell,
} from "recharts";

/**
 * MarketTimelineChart
 * Props:
 *  - data: [{ time: Date|number, yesPrice: number, prob: number }]
 *  - height?: number
 */
export default function MarketTimelineChart({ data, height = 260 }) {
  const [mode, setMode] = useState("price"); // 'price' | 'prob'
  const [side, setSide] = useState("yes"); // 'yes' | 'no'

  // Build chart data for both sides, include volume
  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map((d) => {
      const t = typeof d.time === "number" ? d.time : d.time.getTime();
      const ts = d.time instanceof Date ? d.time : new Date(d.time);
      // YES
      const yesPrice = Number(d.yesPrice?.toFixed(2));
      const yesProb = Number((d.prob * 100).toFixed(2));
      // NO
      let noPrice = null,
        noProb = null;
      if (typeof d.yesPrice === "number") {
        noPrice = Number((10 - d.yesPrice).toFixed(2));
        noProb = Number((100 - yesProb).toFixed(2));
      }
      // Volume: use d.quantity if present, else 1
      const volume = Number(d.quantity) || 1;
      return { t, ts, yesPrice, yesProb, noPrice, noProb, volume };
    });
  }, [data]);

  const domainY = useMemo(
    () => (mode === "price" ? [0, 10] : [0, 100]),
    [mode]
  );

  const formatTime = (ts) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, "0")}:${d
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  // Latest values for header
  const latest = chartData.length ? chartData[chartData.length - 1] : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg tracking-tight text-white">
          Market Timeline
        </h2>
        <div className="flex gap-1 text-[11px]">
          <button
            onClick={() => setSide("yes")}
            className={`px-2 py-1 rounded-md border border-neutral-700 ${
              side === "yes"
                ? "bg-emerald-700 text-white"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            YES
          </button>
          <button
            onClick={() => setSide("no")}
            className={`px-2 py-1 rounded-md border border-neutral-700 ${
              side === "no"
                ? "bg-rose-700 text-white"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            NO
          </button>
          <button
            onClick={() => setMode("price")}
            className={`px-2 py-1 rounded-md border border-neutral-700 ${
              mode === "price"
                ? "bg-neutral-700 text-white"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Price
          </button>
          <button
            onClick={() => setMode("prob")}
            className={`px-2 py-1 rounded-md border border-neutral-700 ${
              mode === "prob"
                ? "bg-neutral-700 text-white"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Probability
          </button>
        </div>
      </div>
      {/* Latest probability header */}
      {latest && (
        <div className="flex gap-4 text-xs font-semibold mb-1">
          <span className="text-emerald-400">
            YES Probability: {latest.yesProb}%
          </span>
          <span className="text-rose-400">
            NO Probability: {latest.noProb}%
          </span>
        </div>
      )}
      <div className="text-[11px] text-neutral-500">
        {mode === "price"
          ? `${
              side === "yes" ? "YES" : "NO"
            } share traded price over time (₹ per winning ₹10 payout).`
          : `Implied ${
              side === "yes" ? "YES" : "NO"
            } probability over time (price / 10).`}
      </div>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 15, left: 0, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
            <XAxis
              dataKey="t"
              tickFormatter={formatTime}
              tick={{ fill: "#888", fontSize: 11 }}
              minTickGap={30}
            />
            <YAxis
              yAxisId="left"
              domain={domainY}
              tick={{ fill: "#888", fontSize: 11 }}
              tickFormatter={(v) =>
                mode === "price" ? `₹${v}` : `${v.toFixed ? v.toFixed(0) : v}%`
              }
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              allowDecimals={false}
              tick={{ fill: "#888", fontSize: 10 }}
              width={40}
              dataKey="volume"
              axisLine={false}
              tickLine={false}
              label={{
                value: "Volume",
                angle: -90,
                position: "insideRight",
                fill: "#888",
                fontSize: 10,
              }}
            />
            <Tooltip
              labelFormatter={(label) => {
                const d = new Date(label);
                return d.toLocaleString();
              }}
              formatter={(value, name) => {
                if (
                  name ===
                  (mode === "price"
                    ? side === "yes"
                      ? "yesPrice"
                      : "noPrice"
                    : side === "yes"
                    ? "yesProb"
                    : "noProb")
                ) {
                  return [
                    mode === "price" ? `₹${value}` : `${value}%`,
                    mode === "price"
                      ? `${side === "yes" ? "YES" : "NO"} Price`
                      : `${side === "yes" ? "YES" : "NO"} Probability`,
                  ];
                }
                if (name === "volume") {
                  return [value, "Matched Volume"];
                }
                return [value, name];
              }}
            />
            <ReferenceLine
              y={mode === "price" ? 5 : 50}
              stroke="#444"
              strokeDasharray="4 3"
            />
            <Bar
              yAxisId="right"
              dataKey="volume"
              barSize={12}
              fill="#6366f1"
              opacity={0.25}
              name="Matched Volume"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey={
                mode === "price"
                  ? side === "yes"
                    ? "yesPrice"
                    : "noPrice"
                  : side === "yes"
                  ? "yesProb"
                  : "noProb"
              }
              stroke={side === "yes" ? "#0ea5e9" : "#f43f5e"}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              name={
                mode === "price"
                  ? `${side === "yes" ? "YES" : "NO"} Price`
                  : `${side === "yes" ? "YES" : "NO"} Probability`
              }
            />
            <Scatter
              yAxisId="left"
              dataKey={
                mode === "price"
                  ? side === "yes"
                    ? "yesPrice"
                    : "noPrice"
                  : side === "yes"
                  ? "yesProb"
                  : "noProb"
              }
              fill={side === "yes" ? "#0ea5e9" : "#f43f5e"}
              name="Trade"
              shape="circle"
              opacity={0.7}
              isAnimationActive={false}
            />
            <Brush
              dataKey="t"
              travellerWidth={8}
              height={18}
              stroke="#444"
              tickFormatter={formatTime}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {chartData.length === 0 && (
        <div className="text-[11px] text-neutral-500">No trades yet.</div>
      )}
    </div>
  );
}
