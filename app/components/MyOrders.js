import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { useToast } from "@/app/components/ToastProvider";

// Props: eventId, userId
export default function MyOrders({ eventId, userId }) {
  const [orders, setOrders] = useState([]);
  const [eventTitles, setEventTitles] = useState({});
  const { push } = useToast();

  async function cancelOrder(orderId) {
    try {
      let refund = 0;
      await runTransaction(db, async (tx) => {
        const oRef = doc(db, "orders", orderId);
        const oSnap = await tx.get(oRef);
        if (!oSnap.exists()) throw new Error("Order not found");
        const order = oSnap.data();
        if (order.userId !== userId) throw new Error("Not your order");
        if (order.status !== "open") throw new Error("Cannot cancel");
        const uRef = doc(db, "users", userId);
        const uSnap = await tx.get(uRef);
        if (!uSnap.exists()) throw new Error("User missing");
        const user = uSnap.data();
        refund = order.lockedAmount || 0;
        tx.update(oRef, {
          status: "cancelled",
          cancelledAt: serverTimestamp(),
          refundedAmount: refund,
          lockedAmount: 0,
        });
        if (refund > 0) {
          tx.update(uRef, {
            balance: (user.balance || 0) + refund,
            updatedAt: serverTimestamp(),
          });
          const ledgerRef = doc(collection(db, "users", userId, "ledger"));
          tx.set(ledgerRef, {
            type: "cancel-refund",
            orderId,
            amount: refund,
            createdAt: serverTimestamp(),
          });
        }
      });
      push({
        type: "success",
        message: `Order cancelled. Refunded: ₹${refund}`,
      });
    } catch (e) {
      push({ type: "error", message: e.message || "Cancel failed" });
    }
  }

  useEffect(() => {
    if (!userId) return;
    let q;
    if (eventId) {
      q = query(
        collection(db, "orders"),
        where("eventId", "==", eventId),
        where("userId", "==", userId)
      );
    } else {
      q = query(collection(db, "orders"), where("userId", "==", userId));
    }
    const unsub = onSnapshot(q, async (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOrders(list);
      // fetch event titles (throttle by building set)
      const ids = Array.from(
        new Set(list.map((o) => o.eventId).filter(Boolean))
      );
      if (!ids.length) return;
      const titles = {};
      await Promise.all(
        ids.map(async (eid) => {
          try {
            const evSnap = await import("firebase/firestore").then(
              ({ doc, getDoc }) => getDoc(doc(db, "events", eid))
            );
            if (evSnap.exists()) titles[eid] = evSnap.data().title;
          } catch {}
        })
      );
      setEventTitles((prev) => ({ ...prev, ...titles }));
    });
    return () => unsub();
  }, [eventId, userId]);
  if (!userId) return null;
  if (!orders.length)
    return (
      <div className="my-4 bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center text-sm text-neutral-500 shadow">
        <span className="block text-lg mb-2 font-semibold text-neutral-300">
          My Orders
        </span>
        <span>No orders yet. Place an order to see it here!</span>
      </div>
    );

  // Sort: open > partial > filled > cancelled > refunded, then newest first
  const statusOrder = {
    open: 0,
    partial: 1,
    filled: 2,
    cancelled: 3,
    refunded: 4,
  };
  const sorted = [...orders].sort((a, b) => {
    const sa = statusOrder[a.status] ?? 99;
    const sb = statusOrder[b.status] ?? 99;
    if (sa !== sb) return sa - sb;
    return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
  });

  return (
    <div className="my-4 bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow">
      <h3 className="text-base font-bold mb-4 text-neutral-200">My Orders</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-neutral-800 text-neutral-400">
              <th className="p-2 text-left">Event</th>
              <th className="p-2 text-left">Side</th>
              <th className="p-2 text-right">Price</th>
              <th className="p-2 text-right">Qty</th>
              <th className="p-2 text-center">Status</th>
              <th className="p-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((o) => {
              let statusLabel = "";
              let statusClass = "";
              if (o.status === "open") {
                statusLabel =
                  o.quantityRemaining < o.quantity ? "Partial" : "Open";
                statusClass =
                  o.quantityRemaining < o.quantity
                    ? "bg-yellow-900 text-yellow-300 border border-yellow-700"
                    : "bg-cyan-900 text-cyan-300 border border-cyan-700";
              } else if (o.status === "cancelled") {
                statusLabel = "Cancelled";
                statusClass =
                  "bg-neutral-800 text-neutral-400 border border-neutral-700";
              } else if (o.status === "filled") {
                statusLabel = "Filled";
                statusClass =
                  "bg-lime-900 text-lime-300 border border-lime-700";
              } else if (o.status === "refunded") {
                statusLabel = "Refunded";
                statusClass =
                  "bg-orange-900 text-orange-300 border border-orange-700";
              } else {
                statusLabel = o.status;
                statusClass =
                  "bg-neutral-800 text-neutral-400 border border-neutral-700";
              }
              return (
                <tr
                  key={o.id}
                  className="border-b border-neutral-800 hover:bg-neutral-800/60 transition group"
                >
                  <td className="p-2 max-w-[140px] truncate">
                    <a
                      href={o.eventId ? `/events/${o.eventId}` : "#"}
                      className="text-cyan-300 hover:underline"
                      title={eventTitles[o.eventId] || o.eventId}
                    >
                      {eventTitles[o.eventId] || o.eventId || "-"}
                    </a>
                  </td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold tracking-wide shadow-sm
                        ${
                          o.side === "yes"
                            ? "bg-emerald-900 text-emerald-300 border border-emerald-700"
                            : "bg-rose-900 text-rose-300 border border-rose-700"
                        }
                      `}
                    >
                      {o.side.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-2 text-right font-mono text-cyan-300">
                    ₹{o.price}
                  </td>
                  <td className="p-2 text-right font-mono">
                    {o.quantity}
                    {(o.status === "open" || o.status === "partial") &&
                    o.quantityRemaining < o.quantity
                      ? ` (${o.quantityRemaining} left)`
                      : ""}
                  </td>
                  <td className="p-2 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${statusClass}`}
                    >
                      {statusLabel}
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    {o.status === "open" && (
                      <button
                        onClick={() => cancelOrder(o.id)}
                        className="px-3 py-1 rounded-full bg-rose-700/80 hover:bg-rose-600 text-white text-xs font-semibold shadow transition focus:outline-none focus:ring-2 focus:ring-rose-400"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-[10px] text-neutral-400">
        <b>Status:</b> Open = resting, Partial = partially matched, Filled =
        fully matched, Cancelled = user cancelled, Refunded = event resolved &
        refunded.
        <br />
        Only open orders can be cancelled. Quantity shows remaining to match.
      </div>
    </div>
  );
}
