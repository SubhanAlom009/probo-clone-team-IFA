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
import { useToast } from "@/components/ToastProvider";

// Props: eventId, userId
export default function MyOrders({ eventId, userId }) {
  const [orders, setOrders] = useState([]);
  const [eventTitles, setEventTitles] = useState({});
  const { push } = useToast();

  useEffect(() => {
    if (!userId) return;
    let q;
    if (eventId) {
      q = query(
        collection(db, "orders"),
        where("eventId", "==", eventId),
        where("userId", "==", userId),
        where("status", "==", "open")
      );
    } else {
      q = query(
        collection(db, "orders"),
        where("userId", "==", userId),
        where("status", "==", "open")
      );
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

  async function cancelOrder(orderId) {
    try {
      await runTransaction(db, async (tx) => {
        const orderRef = doc(db, "orders", orderId);
        const orderSnap = await tx.get(orderRef);
        if (!orderSnap.exists()) throw new Error("Order not found");
        const order = orderSnap.data();
        if (order.userId !== userId) throw new Error("Not owner");
        if (order.status !== "open") throw new Error("Already closed");
        const refund =
          order.lockedAmount != null
            ? order.lockedAmount
            : Number(order.price) *
              Number(order.quantityRemaining ?? order.quantity);
        const userRef = doc(db, "users", userId);
        const userSnap = await tx.get(userRef);
        if (!userSnap.exists()) throw new Error("User missing");
        const userData = userSnap.data();
        const newBalance = Number(
          ((userData.balance || 0) + refund).toFixed(2)
        );
        tx.update(userRef, {
          balance: newBalance,
          updatedAt: serverTimestamp(),
        });
        tx.update(orderRef, {
          status: "cancelled",
          cancelledAt: serverTimestamp(),
          quantityRemaining: order.quantityRemaining ?? order.quantity,
        });
        const ledgerRef = doc(collection(db, "users", userId, "ledger"));
        tx.set(ledgerRef, {
          type: "order_cancel_refund",
          eventId: order.eventId,
          orderId,
          amount: refund,
          createdAt: serverTimestamp(),
        });
      });
      push("Order cancelled & refunded", "info");
    } catch (err) {
      push(err.message || "Failed to cancel order", "error");
    }
  }

  if (!userId) return null;
  if (!orders.length)
    return (
      <div className="my-4 bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center text-sm text-neutral-500 shadow">
        <span className="block text-lg mb-2 font-semibold text-neutral-300">
          My Open Orders
        </span>
        <span>No open orders yet. Place a bet to see it here!</span>
      </div>
    );

  return (
    <div className="my-4 bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow">
      <h3 className="text-base font-bold mb-4 text-neutral-200">
        My Open Orders
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-neutral-800 text-neutral-400">
              <th className="p-2 text-left">Event</th>
              <th className="p-2 text-left">Side</th>
              <th className="p-2 text-right">Price</th>
              <th className="p-2 text-right">Qty</th>
              <th className="p-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
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
                  {o.quantityRemaining ?? o.quantity}
                </td>
                <td className="p-2 text-center">
                  <button
                    onClick={() => cancelOrder(o.id)}
                    className="px-3 py-1 rounded-full bg-rose-700/80 hover:bg-rose-600 text-white text-xs font-semibold shadow transition focus:outline-none focus:ring-2 focus:ring-rose-400"
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
