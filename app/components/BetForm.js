"use client";

import { useState, useEffect, useMemo } from "react";
import { doc, getDoc } from "firebase/firestore";
import { placeOrder } from "@/lib/db";
import { db } from "@/lib/firebase";
import { useToast } from "@/app/components/ToastProvider";

// Fallback book for empty state
const fallbackOrderBook = {
  yes: [
    { price: 7.5, qty: 20 },
    { price: 7.0, qty: 15 },
    { price: 6.5, qty: 10 },
  ],
  no: [
    { price: 2.5, qty: 18 },
    { price: 3.0, qty: 12 },
    { price: 3.5, qty: 8 },
  ],
};

export default function BetForm({
  eventId,
  userId,
  orderBook,
  market,
  selectedOrder,
  onClearSelected,
  onPlaced,
  onBetPlaced,
}) {
  const ob = orderBook || fallbackOrderBook;
  const inferredYes = market?.prob ? Number((market.prob * 10).toFixed(2)) : 5;
  const defaultYesPrice = ob.yes?.[0]?.price || inferredYes;
  const defaultNoPrice = ob.no?.[0]?.price || 10 - defaultYesPrice;

  const { push } = useToast();
  const [side, setSide] = useState("yes");
  const [price, setPrice] = useState(defaultYesPrice);
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warn, setWarn] = useState(null);
  const [balance, setBalance] = useState(null);

  // Fetch user balance
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", userId));
        if (snap.exists()) setBalance(snap.data().balance ?? 0);
      } catch (_) {}
    })();
  }, [userId]);

  // Apply selected order
  useEffect(() => {
    if (selectedOrder) {
      setSide(selectedOrder.side);
      setPrice(selectedOrder.price);
      setError(null);
      setWarn(null);
    }
  }, [selectedOrder]);

  function handleSideSwitch(s) {
    setSide(s);
    setWarn(null);
    onClearSelected?.();
  }

  const normalizedPrice = useMemo(() => {
    const p = Number(price) || 0;
    return Math.min(10, Math.max(1, p));
  }, [price]);

  const totalCost = useMemo(() => {
    const q = Number(quantity) || 0;
    return (normalizedPrice * q).toFixed(2);
  }, [normalizedPrice, quantity]);

  const payout = useMemo(() => {
    const q = Number(quantity) || 0;
    return (q * 10).toFixed(2);
  }, [quantity]);

  const profit = useMemo(
    () => (Number(payout) - Number(totalCost)).toFixed(2),
    [payout, totalCost]
  );

  const yesProbPct = useMemo(
    () => ((normalizedPrice / 10) * 100).toFixed(1),
    [normalizedPrice]
  );
  const noProbPct = useMemo(
    () => (100 - Number(yesProbPct)).toFixed(1),
    [yesProbPct]
  );

  const lockedAmount = useMemo(() => {
    const q = Number(quantity) || 0;
    return side === "yes"
      ? (q * normalizedPrice).toFixed(2)
      : (q * (10 - normalizedPrice)).toFixed(2);
  }, [quantity, side, normalizedPrice]);

  // Simple validation watcher
  useEffect(() => {
    setError(null);
    if (!quantity) return;
    const q = Number(quantity);
    if (q <= 0) setError("Quantity must be > 0");
  }, [quantity]);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setWarn(null);
    const p = Number(normalizedPrice);
    const q = Number(quantity);
    if (!Number.isFinite(p) || p < 1 || p > 10)
      return setError("Price must be between 1 and 10");
    if (!Number.isFinite(q) || q <= 0) return setError("Invalid quantity");
    if (balance !== null && Number(lockedAmount) > balance)
      return setError("Insufficient balance");
    setLoading(true);
    try {
      await placeOrder({ eventId, userId, side, price: p, quantity: q });
      setQuantity("");
      onClearSelected?.();
      push(`Order placed: ${side.toUpperCase()} @ ₹${p} × ${q}`);
      onPlaced?.();
      onBetPlaced?.();
    } catch (err) {
      setError(err.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex justify-between items-start gap-4 text-sm">
        <div className="space-y-1">
          <p className="text-neutral-400 text-[11px] tracking-wide">
            YES PRICE
          </p>
          <p className="text-lg font-semibold text-emerald-400">
            ₹{defaultYesPrice}
          </p>
        </div>
        <div className="text-center space-y-1">
          <p className="text-neutral-400 text-[11px] tracking-wide">
            MARKET PROBABILITY
          </p>
          <p className="text-cyan-400 font-semibold text-sm">
            YES {yesProbPct}% • NO {noProbPct}%
          </p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-neutral-400 text-[11px] tracking-wide">NO PRICE</p>
          <p className="text-lg font-semibold text-rose-400">
            ₹{defaultNoPrice}
          </p>
        </div>
      </div>
      <div className="bg-neutral-800 border border-neutral-700 rounded-md p-3 text-xs text-neutral-300 mb-2">
        <b>Order Book:</b> Enter a price (₹1-₹10). A bet forms only when an
        opposite order matches at the same price. Unmatched quantity rests and
        keeps funds locked.
      </div>
      <form
        onSubmit={submit}
        className="space-y-4 bg-neutral-900 border border-neutral-800 rounded-xl p-4"
      >
        <div className="inline-flex p-1 rounded-lg bg-neutral-800 border border-neutral-700">
          {["yes", "no"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSideSwitch(s)}
              className={`px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                side === s
                  ? s === "yes"
                    ? "bg-emerald-700 text-white"
                    : "bg-rose-700 text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="number"
              min="1"
              max="10"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Price (₹)"
              disabled={loading}
            />
            <span className="absolute right-3 top-2 text-xs text-neutral-500">
              ₹
            </span>
          </div>
          <div className="flex-1">
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Quantity"
              disabled={loading}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[11px] font-medium">
          <div className="bg-neutral-800 rounded-md px-3 py-2 flex flex-col">
            <span className="text-neutral-400">LOCKED</span>
            <span className="text-cyan-400 font-semibold">₹{lockedAmount}</span>
          </div>
          <div className="bg-neutral-800 rounded-md px-3 py-2 flex flex-col">
            <span className="text-neutral-400">PAYOUT</span>
            <span className="text-emerald-400 font-semibold">₹{payout}</span>
          </div>
          <div className="bg-neutral-800 rounded-md px-3 py-2 flex flex-col">
            <span className="text-neutral-400">PROFIT</span>
            <span
              className={
                Number(profit) >= 0
                  ? "text-lime-400 font-semibold"
                  : "text-rose-400 font-semibold"
              }
            >
              ₹{profit}
            </span>
          </div>
        </div>
        <div className="flex justify-between text-xs text-neutral-400">
          <span>
            Side:{" "}
            <b
              className={side === "yes" ? "text-emerald-400" : "text-rose-400"}
            >
              {side.toUpperCase()}
            </b>
          </span>
          {balance !== null && (
            <span>
              Balance: <b>₹{balance}</b>
            </span>
          )}
        </div>
        {error && <div className="text-red-500 text-xs">{error}</div>}
        {warn && !error && (
          <div className="text-yellow-400 text-xs">{warn}</div>
        )}
        <button
          type="submit"
          className="w-full py-2 px-4 rounded-md bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-sm disabled:opacity-50"
          disabled={loading || !quantity || !price}
        >
          {loading ? "Placing..." : `Place ${side.toUpperCase()} Order`}
        </button>
      </form>
      <p className="text-[10px] text-neutral-500 leading-relaxed">
        Each winning share pays ₹10. Locked = price × qty (YES) or (10 − price)
        × qty (NO).
      </p>
    </div>
  );
}
