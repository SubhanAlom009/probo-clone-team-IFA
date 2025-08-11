"use client";
import React from "react";

// Enhanced OrderBookDisplay: highlights best bid/ask, user's orders, and clarifies order book model
// Props:
//  - orderBook: { yes: [{price, qty, userId?}], no: [{price, qty, userId?}] }
//  - onSelect?: (price:number, side:'yes'|'no') => void
//  - maxRows?: number (truncate display)
//  - userId?: string (optional, to highlight user's orders)
export default function OrderBookDisplay({
  orderBook,
  onSelect,
  maxRows = 15,
  userId,
}) {
  // Sort YES descending, NO ascending for price ladder
  const yesLevels = [...(orderBook?.yes || [])]
    .sort((a, b) => b.price - a.price)
    .slice(0, maxRows);
  const noLevels = [...(orderBook?.no || [])]
    .sort((a, b) => a.price - b.price)
    .slice(0, maxRows);

  // (No explicit best labeling per user request)
  const bestYes = yesLevels[0]?.price; // kept internally if needed later
  const bestNo = noLevels[0]?.price;

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
          {yesLevels.map((lvl, i) => {
            const isBest = false; // suppress best highlighting
            const isMine = userId && lvl.userId === userId;
            return (
              <button
                key={`yes-${i}`}
                type="button"
                onClick={() => onSelect?.(lvl.price, "yes")}
                className={`w-full group flex items-center justify-between gap-2 rounded-md border px-2 py-1 text-xs font-medium transition
                  border-emerald-700/30 bg-emerald-950/40
                  ${isMine ? "ring-2 ring-cyan-400/60" : ""}
                  hover:bg-emerald-900/60 text-emerald-300`}
                title={isMine ? "Your order" : "Click to pre-fill order form"}
              >
                <span className="font-mono">₹{lvl.price}</span>
                <span className="tabular-nums text-emerald-400 group-hover:text-emerald-200">
                  {lvl.qty}
                </span>
                {/* Best label removed */}
                {isMine && (
                  <span className="ml-1 text-[10px] text-cyan-300">Mine</span>
                )}
              </button>
            );
          })}
        </div>
        {/* NO side */}
        <div className="space-y-1 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-neutral-700">
          {noLevels.length === 0 && (
            <div className="text-neutral-600 text-xs py-2">No NO orders</div>
          )}
          {noLevels.map((lvl, i) => {
            const isBest = false; // suppress best highlighting
            const isMine = userId && lvl.userId === userId;
            return (
              <button
                key={`no-${i}`}
                type="button"
                onClick={() => onSelect?.(lvl.price, "no")}
                className={`w-full group flex items-center justify-between gap-2 rounded-md border px-2 py-1 text-xs font-medium transition
                  border-rose-700/30 bg-rose-950/40
                  ${isMine ? "ring-2 ring-cyan-400/60" : ""}
                  hover:bg-rose-900/60 text-rose-300`}
                title={isMine ? "Your order" : "Click to pre-fill order form"}
              >
                <span className="font-mono">₹{lvl.price}</span>
                <span className="tabular-nums text-rose-400 group-hover:text-rose-200">
                  {lvl.qty}
                </span>
                {/* Best label removed */}
                {isMine && (
                  <span className="ml-1 text-[10px] text-cyan-300">Mine</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-2 text-[10px] leading-relaxed text-neutral-500">
        <b>Order Book Model:</b> Each row is a limit order to buy YES or NO at a
        price. When an opposite order matches at the same price, a bet is
        created. Unmatched orders rest and can be cancelled.
        <br />
        <span className="text-neutral-400">
          <b>Mine</b> = your order. Prices are per share (pays ₹10 if correct).
        </span>
      </div>
    </div>
  );
}
