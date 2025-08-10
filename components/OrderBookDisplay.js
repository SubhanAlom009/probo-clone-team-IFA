"use client";
import React from "react";

// Displays two columns of order book levels (YES = buy, NO = sell)
// Props:
//  - orderBook: { yes: [{price, qty}], no: [{price, qty}] }
//  - onSelect?: (price:number, side:'yes'|'no') => void
//  - maxRows?: number (truncate display)
export default function OrderBookDisplay({
  orderBook,
  onSelect,
  maxRows = 15,
}) {
  const yesLevels = (orderBook?.yes || []).slice(0, maxRows);
  const noLevels = (orderBook?.no || []).slice(0, maxRows);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2 text-[11px] font-semibold tracking-wide text-neutral-400">
        <span>YES ORDERS (Buy)</span>
        <span>NO ORDERS (Sell)</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {/* YES side */}
        <div className="space-y-1 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-neutral-700">
          {yesLevels.length === 0 && (
            <div className="text-neutral-600 text-xs py-2">No YES orders</div>
          )}
          {yesLevels.map((lvl, i) => (
            <button
              key={`yes-${i}`}
              type="button"
              onClick={() => onSelect?.(lvl.price, "yes")}
              className="w-full group flex items-center justify-between gap-2 rounded-md border border-emerald-700/30 bg-emerald-950/40 hover:bg-emerald-900/60 px-2 py-1 text-xs font-medium text-emerald-300 transition"
            >
              <span className="font-mono">₹{lvl.price}</span>
              <span className="tabular-nums text-emerald-400 group-hover:text-emerald-200">
                {lvl.qty}
              </span>
            </button>
          ))}
        </div>
        {/* NO side */}
        <div className="space-y-1 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-neutral-700">
          {noLevels.length === 0 && (
            <div className="text-neutral-600 text-xs py-2">No NO orders</div>
          )}
          {noLevels.map((lvl, i) => (
            <button
              key={`no-${i}`}
              type="button"
              onClick={() => onSelect?.(lvl.price, "no")}
              className="w-full group flex items-center justify-between gap-2 rounded-md border border-rose-700/30 bg-rose-950/40 hover:bg-rose-900/60 px-2 py-1 text-xs font-medium text-rose-300 transition"
            >
              <span className="font-mono">₹{lvl.price}</span>
              <span className="tabular-nums text-rose-400 group-hover:text-rose-200">
                {lvl.qty}
              </span>
            </button>
          ))}
        </div>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">
        Click a level to pre-fill an order (future enhancement). Each quantity
        unit is a share paying ₹10 if correct.
      </p>
    </div>
  );
}
