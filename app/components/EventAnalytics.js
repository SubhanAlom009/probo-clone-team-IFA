import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

// Props: eventId
export default function EventAnalytics({ eventId }) {
  const [stats, setStats] = useState({
    totalVolume: 0,
    orderCount: 0,
    lastMatchedPrice: null,
    uniqueTraders: 0,
    openYes: 0,
    openNo: 0,
  });

  useEffect(() => {
    if (!eventId) return;
    // Listen to bets for volume, last price, unique traders
    const betsQ = query(
      collection(db, "bets"),
      where("eventId", "==", eventId)
    );
    const unsubBets = onSnapshot(betsQ, (snap) => {
      let volume = 0;
      let lastPrice = null;
      const traders = new Set();
      snap.docs.forEach((d) => {
        const b = d.data();
        volume += Number(b.quantity) || 0;
        lastPrice = b.price || lastPrice;
        if (b.userId) traders.add(b.userId);
      });
      setStats((s) => ({
        ...s,
        totalVolume: volume,
        lastMatchedPrice: lastPrice,
        uniqueTraders: traders.size,
      }));
    });
    // Listen to orders for order count and open book depth
    const ordersQ = query(
      collection(db, "orders"),
      where("eventId", "==", eventId)
    );
    const unsubOrders = onSnapshot(ordersQ, (snap) => {
      let openYes = 0,
        openNo = 0;
      snap.docs.forEach((d) => {
        const o = d.data();
        if (o.status === "open" && o.quantityRemaining > 0) {
          if (o.side === "yes") openYes += Number(o.quantityRemaining);
          if (o.side === "no") openNo += Number(o.quantityRemaining);
        }
      });
      setStats((s) => ({ ...s, orderCount: snap.size, openYes, openNo }));
    });
    return () => {
      unsubBets();
      unsubOrders();
    };
  }, [eventId]);

  return (
    <div className="mb-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800 shadow text-xs text-neutral-300">
      <div className="font-semibold text-sm mb-2 text-cyan-300">
        Event Analytics
      </div>
      <div className="flex flex-wrap gap-4">
        <div>
          <span className="block text-neutral-400">Matched Volume</span>
          <span className="font-mono text-emerald-400">
            {stats.totalVolume}
          </span>
        </div>
        <div>
          <span className="block text-neutral-400">Order Count</span>
          <span className="font-mono text-cyan-400">{stats.orderCount}</span>
        </div>
        <div>
          <span className="block text-neutral-400">Order Book Depth</span>
          <span className="font-mono text-emerald-400">
            YES: {stats.openYes}
          </span>{" "}
          <span className="font-mono text-rose-400 ml-2">
            NO: {stats.openNo}
          </span>
        </div>
        <div>
          <span className="block text-neutral-400">Last Matched Price</span>
          <span className="font-mono text-yellow-400">
            {stats.lastMatchedPrice !== null
              ? `₹${stats.lastMatchedPrice}`
              : "-"}
          </span>
        </div>
        <div>
          <span className="block text-neutral-400">Unique Traders</span>
          <span className="font-mono text-pink-400">{stats.uniqueTraders}</span>
        </div>
      </div>
    </div>
  );
}
