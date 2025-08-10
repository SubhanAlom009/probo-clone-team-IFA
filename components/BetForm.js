"use client";
import { useState, useMemo, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";
import { db } from "@/lib/firebase";
import {
  collection,
  serverTimestamp,
  runTransaction,
  doc,
} from "firebase/firestore";

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

// Props:
//  - eventId
//  - onPlaced: callback after successful order
//  - orderBook: { yes:[{price,qty}], no:[{price,qty}] }
//  - market: { yesStake, noStake, prob }
//  - selectedOrder: { side, price } (lifted selection from OrderBookDisplay)
//  - onClearSelected: function to clear external selection (optional)
export default function BetForm({
  eventId,
  onPlaced,
  orderBook,
  market,
  selectedOrder,
  onClearSelected,
  userId,
}) {
  const ob = orderBook || fallbackOrderBook;
  const defaultYesPrice = ob.yes?.length
    ? ob.yes[0].price
    : market
    ? Number((market.prob * 10).toFixed(2))
    : 5;
  const defaultNoPrice = ob.no?.length ? ob.no[0].price : 10 - defaultYesPrice;

  const { push } = useToast();
  const [side, setSide] = useState("yes");
  const [price, setPrice] = useState(defaultYesPrice);
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warn, setWarn] = useState(null); // non-blocking info

  // Derive best bid / ask from order book (YES = bids, NO = asks in this simplified mapping)
  const bestYesBid = ob.yes?.[0]?.price ?? null; // highest YES price (array assumed sorted desc)
  const bestNoAsk = ob.no?.[0]?.price ?? null; // lowest NO price (array assumed sorted asc or desc? We'll sort.)

  // Ensure consistent ordering: sort YES descending, NO ascending for price logic
  const sortedYes = useMemo(
    () => [...(ob.yes || [])].sort((a, b) => b.price - a.price),
    [ob]
  );
  const sortedNo = useMemo(
    () => [...(ob.no || [])].sort((a, b) => a.price - b.price),
    [ob]
  );

  // Opposite side liquidity at chosen price (YES buy consumes NO sell liquidity at same or better price)
  const oppositeLevels = useMemo(
    () => (side === "yes" ? sortedNo : sortedYes),
    [side, sortedNo, sortedYes]
  );

  const maxQtyAtPrice = useMemo(() => {
    const p = Number(price);
    if (!p) return 0;
    // Sum quantities for opposite side levels that are as good or better (<= for asks when buying YES, >= for bids when buying NO)
    if (side === "yes") {
      // For YES buy, we look at NO side offers with price >= chosen price? In this inverted model we treat NO side as offers that set implied YES price = 10 - noPrice.
      // Simpler: match only exact price level if exists.
      const lvl = oppositeLevels.find((l) => Number(l.price) === p);
      return lvl ? Number(lvl.qty) : 0;
    } else {
      const lvl = oppositeLevels.find((l) => Number(l.price) === p);
      return lvl ? Number(lvl.qty) : 0;
    }
  }, [price, side, oppositeLevels]);

  // Price bounds (VERY simplified):
  // If buying YES: price must be >= best NO price (crossing) if one exists.
  // If buying NO: price must be <= best YES price.
  const bestOppositePrice = useMemo(
    () => (side === "yes" ? sortedNo[0]?.price : sortedYes[0]?.price),
    [side, sortedNo, sortedYes]
  );

  // Respond to external order book selection
  useEffect(() => {
    if (selectedOrder) {
      setSide(selectedOrder.side);
      setPrice(selectedOrder.price);
      // Clear any previous messages
      setError(null);
      setWarn(null);
    }
  }, [selectedOrder]);

  const normalizedPrice = useMemo(() => {
    const p = Number(price) || 0;
    return Math.min(9.99, Math.max(0.01, p));
  }, [price]);

  function handleSideSwitch(newSide) {
    setSide(newSide);
    setWarn(null);
    onClearSelected?.();
  }

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

  // Inline input validations
  useEffect(() => {
    setError(null);
    setWarn(null);
    const p = Number(price);
    const q = Number(quantity);
    if (p) {
      if (side === "yes" && bestOppositePrice && p < bestOppositePrice) {
        setError(
          `Price too low. Must be ≥ best NO price ₹${bestOppositePrice}`
        );
      } else if (side === "no" && bestOppositePrice && p > bestOppositePrice) {
        setError(
          `Price too high. Must be ≤ best YES price ₹${bestOppositePrice}`
        );
      }
    }
    if (q) {
      if (maxQtyAtPrice && q > maxQtyAtPrice) {
        setError(
          `Quantity exceeds available liquidity (${maxQtyAtPrice}) at this price`
        );
      } else if (maxQtyAtPrice && q === maxQtyAtPrice) {
        setWarn(
          `You are taking all available (${maxQtyAtPrice}) at this price`
        );
      }
      if (!maxQtyAtPrice) {
        setWarn(
          "No opposite liquidity at this price — order may rest (future logic)"
        );
      }
    }
  }, [price, quantity, side, bestOppositePrice, maxQtyAtPrice]);

  async function submit(e, forcedSide) {
    e.preventDefault();
    const useSide = forcedSide || side;
    setError(null);
    const p = Number(normalizedPrice);
    const q = Number(quantity);
    if (!Number.isFinite(p) || p <= 0)
      return setError("Price must be greater than 0");
    if (p > 10) return setError("Price cannot exceed ₹10");
    if (!Number.isFinite(q) || q <= 0)
      return setError("Quantity must be greater than 0");
    setLoading(true);
    try {
      // Query open opposite orders at this price (outside transaction)
      let matchSide = useSide === "yes" ? "no" : "yes";
      const oppOrdersQuery = await import("firebase/firestore").then(
        ({ query, where, getDocs, orderBy }) => {
          return query(
            collection(db, "orders"),
            where("eventId", "==", eventId),
            where("side", "==", matchSide),
            where("price", "==", p),
            where("status", "==", "open"),
            where("quantityRemaining", ">", 0),
            orderBy("createdAt", "asc")
          );
        }
      );
      const { getDocs } = await import("firebase/firestore");
      const oppOrdersSnap = await getDocs(oppOrdersQuery);
      const oppOrders = oppOrdersSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      await runTransaction(db, async (tx) => {
        if (!userId) throw new Error("Not signed in");
        const userRef = doc(db, "users", userId);
        const userSnap = await tx.get(userRef);
        if (!userSnap.exists()) throw new Error("User not found");
        const userData = userSnap.data();
        if (userData.balance == null) throw new Error("No balance field");
        let remainingQty = q;
        let totalCost = 0;
        let totalMatched = 0;
        for (const opp of oppOrders) {
          if (remainingQty <= 0) break;
          const fillQty = Math.min(remainingQty, opp.quantityRemaining);
          // Update matched order
          const oppOrderRef = doc(db, "orders", opp.id);
          tx.update(oppOrderRef, {
            quantityRemaining: opp.quantityRemaining - fillQty,
            status: opp.quantityRemaining - fillQty === 0 ? "filled" : "open",
          });
          // Update this user's balance (they pay for fillQty * price)
          totalCost += fillQty * p;
          totalMatched += fillQty;
          // Credit counterparty user
          const counterpartyRef = doc(db, "users", opp.userId);
          const counterpartySnap = await tx.get(counterpartyRef);
          if (counterpartySnap.exists()) {
            const counterparty = counterpartySnap.data();
            // Release lockedAmount for filled qty, add payout
            const refund = fillQty * p;
            const payout = fillQty * 10;
            tx.update(counterpartyRef, {
              balance: Number(
                (counterparty.balance + refund + payout - refund).toFixed(2)
              ),
              updatedAt: serverTimestamp(),
            });
            // Ledger for counterparty
            const ledgerRef = doc(
              collection(db, "users", opp.userId, "ledger")
            );
            tx.set(ledgerRef, {
              type: "order_fill",
              eventId,
              orderId: opp.id,
              amount: payout,
              side: opp.side,
              price: p,
              quantity: fillQty,
              createdAt: serverTimestamp(),
            });
          }
          // Create bet for both users
          const betsCol = collection(db, "bets");
          const betRef = doc(betsCol);
          tx.set(betRef, {
            eventId,
            price: p,
            quantity: fillQty,
            yesUserId: useSide === "yes" ? userId : opp.userId,
            noUserId: useSide === "no" ? userId : opp.userId,
            createdAt: serverTimestamp(),
          });
          remainingQty -= fillQty;
        }
        // Deduct only for matched qty
        if (userData.balance < totalCost)
          throw new Error("Insufficient balance for matched orders");
        tx.update(userRef, {
          balance: Number((userData.balance - totalCost).toFixed(2)),
          updatedAt: serverTimestamp(),
        });
        // Ledger for this user
        if (totalMatched > 0) {
          const ledgerRef = doc(collection(db, "users", userId, "ledger"));
          tx.set(ledgerRef, {
            type: "order_fill",
            eventId,
            amount: -totalCost,
            side: useSide,
            price: p,
            quantity: totalMatched,
            createdAt: serverTimestamp(),
          });
        }
        // If any remaining, rest as open order and lock funds
        if (remainingQty > 0) {
          const restCost = Number((remainingQty * p).toFixed(2));
          if (userData.balance < totalCost + restCost)
            throw new Error("Insufficient balance for resting order");
          const ordersCol = collection(db, "orders");
          const orderRef = doc(ordersCol);
          tx.set(orderRef, {
            eventId,
            userId,
            side: useSide,
            price: p,
            quantity: remainingQty,
            quantityRemaining: remainingQty,
            lockedAmount: restCost,
            status: "open",
            createdAt: serverTimestamp(),
          });
          tx.update(userRef, {
            balance: Number(
              (userData.balance - totalCost - restCost).toFixed(2)
            ),
            updatedAt: serverTimestamp(),
          });
          const ledgerRef = doc(collection(db, "users", userId, "ledger"));
          tx.set(ledgerRef, {
            type: "order_place",
            eventId,
            orderId: orderRef.id,
            amount: -restCost,
            side: useSide,
            price: p,
            quantity: remainingQty,
            createdAt: serverTimestamp(),
          });
        }
      });
      setQuantity("");
      onClearSelected?.();
      push(
        `Order placed: ${useSide.toUpperCase()} @ ₹${p} × ${q} (matched/placed)`,
        "info"
      );
      onPlaced?.();
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
      <form
        onSubmit={(e) => submit(e, side)}
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
              min="0.01"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 placeholder:text-neutral-500"
              placeholder="Price"
            />
            <span className="pointer-events-none absolute -top-2 left-2 bg-neutral-900 px-1 text-[10px] font-medium text-cyan-500 tracking-wide">
              PRICE (₹)
            </span>
            {bestOppositePrice && (
              <div className="mt-1 text-[10px] text-neutral-500">
                {side === "yes"
                  ? `Best NO price: ₹${bestOppositePrice}`
                  : `Best YES price: ₹${bestOppositePrice}`}
              </div>
            )}
          </div>
          <div className="flex-1 relative">
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 placeholder:text-neutral-500"
              placeholder="Quantity"
            />
            <span className="pointer-events-none absolute -top-2 left-2 bg-neutral-900 px-1 text-[10px] font-medium text-cyan-500 tracking-wide">
              QTY
            </span>
            {maxQtyAtPrice > 0 && (
              <div className="mt-1 text-[10px] text-neutral-500">
                Max at this price: {maxQtyAtPrice}
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[11px] font-medium">
          <div className="bg-neutral-800 rounded-md px-3 py-2 flex flex-col">
            <span className="text-neutral-400">TOTAL</span>
            <span className="text-cyan-400 font-semibold">₹{totalCost}</span>
          </div>
          <div className="bg-neutral-800 rounded-md px-3 py-2 flex flex-col">
            <span className="text-neutral-400">PAYOUT</span>
            <span className="text-emerald-400 font-semibold">₹{payout}</span>
          </div>
          <div className="bg-neutral-800 rounded-md px-3 py-2 flex flex-col">
            <span className="text-neutral-400">PROFIT</span>
            <span
              className={`font-semibold ${
                Number(profit) >= 0 ? "text-lime-400" : "text-rose-400"
              }`}
            >
              ₹{profit}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={loading || !quantity || !price || side !== "yes"}
            onClick={(e) => submit(e, "yes")}
            className="flex-1 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-2 rounded-md shadow transition"
          >
            Buy YES
          </button>
          <button
            type="button"
            disabled={loading || !quantity || !price || side !== "no"}
            onClick={(e) => submit(e, "no")}
            className="flex-1 bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white font-semibold py-2 rounded-md shadow transition"
          >
            Buy NO
          </button>
        </div>
        <div className="text-[10px] text-neutral-500 -mt-1">
          Only the selected side&apos;s button is enabled. Use the YES/NO toggle
          above to switch.
        </div>
        {error && <div className="text-rose-400 text-xs">{error}</div>}
        {!error && warn && <div className="text-amber-400 text-xs">{warn}</div>}
        {loading && (
          <div className="text-xs text-neutral-500">Placing order...</div>
        )}
      </form>
      <p className="text-[10px] text-neutral-500 leading-relaxed">
        Each winning share pays ₹10 on resolution. Profit = (₹10 − price) ×
        quantity if your side wins.
      </p>
    </div>
  );
}
