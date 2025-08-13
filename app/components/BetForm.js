"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
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
  market, // { yesPrice, noPrice }
  selectedOrder,
  onClearSelected,
  onPlaced,
  onBetPlaced,
}) {
  // Helper function to round price to nearest 0.5
  const roundToHalf = (price) => {
    return Math.round(price * 2) / 2;
  };

  // Use provided market (last-trade) prices as defaults; fallback gracefully
  const defaultYesPrice = roundToHalf(
    typeof market?.yesPrice === "number" ? market.yesPrice : 5
  );
  const defaultNoPrice = roundToHalf(
    typeof market?.noPrice === "number" ? market.noPrice : 5
  );

  const { push } = useToast();
  const [side, setSide] = useState("yes");
  const [price, setPrice] = useState(defaultYesPrice);
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warn, setWarn] = useState(null);
  const [balance, setBalance] = useState(null);

  // Listen for user balance in real time
  useEffect(() => {
    if (!userId) return;
    const userRef = doc(db, "users", userId);
    const unsub = onSnapshot(userRef, (snap) => {
      if (snap.exists()) setBalance(snap.data().balance ?? 0);
    });
    return () => unsub();
  }, [userId]);

  // Listen for event resolution and show win/loss toast
  const unsubEventRef = useRef(null);
  useEffect(() => {
    if (!eventId || !userId) return;
    const eventRef = doc(db, "events", eventId);
    let resolved = false;
    unsubEventRef.current?.();
    unsubEventRef.current = onSnapshot(eventRef, async (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (data.status === "resolved" && data.resolvedOutcome && !resolved) {
        resolved = true;
        // Find user's bets for this event
        try {
          // Query both yesUserId and noUserId fields like in profile page
          const betsQYes = await import("firebase/firestore").then(
            (firestore) =>
              firestore.query(
                firestore.collection(db, "bets"),
                firestore.where("yesUserId", "==", userId),
                firestore.where("eventId", "==", eventId)
              )
          );
          const betsQNo = await import("firebase/firestore").then((firestore) =>
            firestore.query(
              firestore.collection(db, "bets"),
              firestore.where("noUserId", "==", userId),
              firestore.where("eventId", "==", eventId)
            )
          );

          const [yesSnap, noSnap] = await Promise.all([
            import("firebase/firestore").then((firestore) =>
              firestore.getDocs(betsQYes)
            ),
            import("firebase/firestore").then((firestore) =>
              firestore.getDocs(betsQNo)
            ),
          ]);

          const allBets = [...yesSnap.docs, ...noSnap.docs];
          let win = false;
          let payout = 0;
          let found = false;
          allBets.forEach((doc) => {
            const b = doc.data();
            const userSide = b.yesUserId === userId ? "yes" : "no";
            if (b.status === "settled") {
              found = true;
              const isWinner =
                (b.winner === "yes" && userSide === "yes") ||
                (b.winner === "no" && userSide === "no");
              if (isWinner) {
                win = true;
                payout += (b.yesLocked || 0) + (b.noLocked || 0); // Winner gets both locked amounts
              }
            }
          });
          if (found) {
            if (win) {
              push(`You WON! Payout: ₹${payout.toFixed(2)}`, "success");
            } else {
              push("You lost this event.", "error");
            }
          } else {
            // No matched bets, check for refund
            // Check for refunded orders
            const ordersQ = await import("firebase/firestore").then(
              (firestore) =>
                firestore.query(
                  firestore.collection(db, "orders"),
                  firestore.where("userId", "==", userId),
                  firestore.where("eventId", "==", eventId),
                  firestore.where("status", "==", "refunded")
                )
            );
            const ordersDocs = await import("firebase/firestore").then(
              (firestore) => firestore.getDocs(ordersQ)
            );
            let refund = 0;
            ordersDocs.forEach((doc) => {
              const o = doc.data();
              refund += o.lockedAmount || 0;
            });
            if (refund > 0) {
              push(`Unmatched orders refunded: ₹${refund.toFixed(2)}`, "info");
            }
          }
        } catch (e) {
          // fallback toast
          push("Event resolved! Check your balance.", "info");
        }
      }
    });
    return () => {
      unsubEventRef.current?.();
    };
  }, [eventId, userId, push]);

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
    setPrice(s === "yes" ? defaultYesPrice : defaultNoPrice);
    setWarn(null);
    onClearSelected?.();
  }

  const normalizedPrice = useMemo(() => {
    const p = Number(price) || 0;
    return Math.min(9.5, Math.max(0.5, p));
  }, [price]);

  const totalCost = useMemo(() => {
    const q = Number(quantity) || 0;
    return (normalizedPrice * q).toFixed(2);
  }, [normalizedPrice, quantity]);

  const payout = useMemo(() => {
    const q = Number(quantity) || 0;
    return (q * 10).toFixed(2);
  }, [quantity]);

  const profit = useMemo(() => {
    const grossProfit = Number(payout) - Number(totalCost);
    // Apply 20% commission on winnings (profit portion only)
    if (grossProfit > 0) {
      const commission = grossProfit * 0.2;
      return (grossProfit - commission).toFixed(2);
    }
    return grossProfit.toFixed(2);
  }, [payout, totalCost]);

  const commission = useMemo(() => {
    const grossProfit = Number(payout) - Number(totalCost);
    return grossProfit > 0 ? (grossProfit * 0.2).toFixed(2) : "0.00";
  }, [payout, totalCost]);

  const yesProbPct = useMemo(() => {
    // Market probability shown at top should reflect current market yesPrice (not editing field) per Option B
    const yp = typeof defaultYesPrice === "number" ? defaultYesPrice : 5;
    return ((yp / 10) * 100).toFixed(1);
  }, [defaultYesPrice]);
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
    setWarn(null);
    if (!quantity) return;
    const q = Number(quantity);
    if (q <= 0) setError("Quantity must be > 0");
  }, [quantity]);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    const p = Number(normalizedPrice);
    const q = Number(quantity);
    if (!Number.isFinite(p) || p < 0.5 || p > 9.5)
      return setError("Price must be between 0.5 and 9.5");
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
            {typeof defaultYesPrice === "number" ? `₹${defaultYesPrice}` : "--"}
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
            {typeof defaultNoPrice === "number" ? `₹${defaultNoPrice}` : "--"}
          </p>
        </div>
      </div>
      <div className="bg-neutral-800 border border-neutral-700 rounded-md p-3 text-xs text-neutral-300 mb-2">
        <b>Order Book:</b> Enter a price (<b>₹0.5–₹9.5</b>).{" "}
        <b>YES at ₹P only matches NO at ₹(10−P).</b> Unmatched quantity rests
        and keeps funds locked.
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
          <div className="flex-1">
            <label className="block text-xs text-neutral-400 mb-2">
              Price (₹0.5-9.5)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const newPrice = Math.max(
                    0.5,
                    roundToHalf(Number(price) - 0.5)
                  );
                  setPrice(newPrice.toString());
                }}
                disabled={loading || Number(price) <= 0.5}
                className="w-8 h-8 flex items-center justify-center bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-md text-sm font-medium transition"
              >
                −
              </button>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={`₹${price}`}
                  readOnly
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white text-center focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const newPrice = Math.min(
                    9.5,
                    roundToHalf(Number(price) + 0.5)
                  );
                  setPrice(newPrice.toString());
                }}
                disabled={loading || Number(price) >= 9.5}
                className="w-8 h-8 flex items-center justify-center bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-md text-sm font-medium transition"
              >
                +
              </button>
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-xs text-neutral-400 mb-2">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Enter quantity"
              disabled={loading}
            />
          </div>
        </div>
        <div className="text-[10px] -mt-1 mb-1 text-neutral-400 leading-snug">
          <b>Matching rule:</b> YES at ₹P only matches NO at ₹(10−P). For
          example, YES ₹6 matches NO ₹4. Orders at the same price will never
          match.
          <br />
          {(() => {
            const p = Number(price) || 0;
            if (p <= 0) return null;
            if (side === "yes") {
              return (
                <>
                  YES price = ₹{p.toFixed(2)} (you pay this). Implied NO price =
                  ₹{(10 - p).toFixed(2)}.
                </>
              );
            }
            return (
              <>
                You entered a YES price of ₹{p.toFixed(2)} while taking NO. Your
                effective NO cost per share is ₹{(10 - p).toFixed(2)} (the
                complement). If this matches an opposite YES order, trade sets
                market YES = ₹{p.toFixed(2)}, NO = ₹{(10 - p).toFixed(2)}.
              </>
            );
          })()}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px] font-medium mt-2 mb-2">
          <div className="bg-neutral-800 rounded-lg px-3 py-3 flex flex-col items-center shadow-sm min-w-0">
            <span className="text-neutral-400 mb-1 tracking-wide">LOCKED</span>
            <span className="text-cyan-400 font-bold text-sm">
              ₹{lockedAmount}
            </span>
          </div>
          <div className="bg-neutral-800 rounded-lg px-3 py-3 flex flex-col items-center shadow-sm min-w-0">
            <span className="text-neutral-400 mb-1 tracking-wide">PAYOUT</span>
            <span className="text-emerald-400 font-bold text-sm">
              ₹{payout}
            </span>
          </div>
          <div className="bg-neutral-800 rounded-lg px-3 py-3 flex flex-col items-center shadow-sm min-w-0 overflow-x-auto">
            <span className="text-neutral-400 mb-1 tracking-wide">COMM.</span>
            <span className="text-yellow-400 font-bold text-sm break-words">
              ₹{commission}
            </span>
          </div>
          <div className="bg-neutral-800 rounded-lg px-3 py-3 flex flex-col items-center shadow-sm min-w-0">
            <span className="text-neutral-400 mb-1 tracking-wide">PROFIT</span>
            <span
              className={
                Number(profit) >= 0
                  ? "text-lime-400 font-bold text-sm"
                  : "text-rose-400 font-bold text-sm"
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
        × qty (NO). <span className="text-yellow-400">20% fee on profit.</span>
      </p>
    </div>
  );
}
