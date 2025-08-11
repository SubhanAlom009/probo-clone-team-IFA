"use client";
import { useEffect, useState } from "react";
import { getDocs, doc, getDoc, collection, limit } from "firebase/firestore";
import { apiFetch } from "@/lib/clientApi";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { query, where, orderBy, onSnapshot } from "firebase/firestore";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [bets, setBets] = useState([]);
  const [eventTitles, setEventTitles] = useState({});
  const [metrics, setMetrics] = useState(null);
  const [activeTab, setActiveTab] = useState("bets");
  const [openOrders, setOpenOrders] = useState([]);
  const [lockedValue, setLockedValue] = useState(0);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  // Recharge handler
  async function handleRecharge() {
    const amount = prompt("Enter amount to recharge:");
    const n = Number(amount);
    if (!n || n <= 0) return alert("Please enter a valid amount.");
    try {
      await apiFetch("/api/users/recharge", {
        method: "POST",
        body: JSON.stringify({ amount: n }),
      });
      // No need to manually refresh profile; Firestore listener will update balance in real time
      alert("Balance recharged!");
    } catch (e) {
      alert(e.message || "Recharge failed");
    }
  }

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Initial fetch (fallback)
        try {
          const p = await apiFetch("/api/users/me");
          setProfile(p);
          const m = await apiFetch("/api/users/me/metrics");
          setMetrics(m);
        } catch {}
        // Realtime user doc (balance & role updates)
        const userRef = doc(db, "users", u.uid);
        const unsubUser = onSnapshot(userRef, (snap) => {
          if (snap.exists())
            setProfile((prev) => ({
              ...(prev || {}),
              ...snap.data(),
              id: snap.id,
            }));
        });
        // Realtime bets
        const qB = query(
          collection(db, "bets"),
          where("userId", "==", u.uid),
          orderBy("createdAt", "desc")
        );
        const unsubBets = onSnapshot(qB, async (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setBets(list);
          // Fetch event titles for bets
          const eventIds = Array.from(
            new Set(list.map((b) => b.eventId).filter(Boolean))
          );
          const titles = {};
          await Promise.all(
            eventIds.map(async (eid) => {
              try {
                const evSnap = await getDoc(doc(db, "events", eid));
                if (evSnap.exists()) titles[eid] = evSnap.data().title;
              } catch {}
            })
          );
          setEventTitles(titles);
          // Refresh metrics after bet change (simple approach)
          try {
            const m = await apiFetch("/api/users/me/metrics");
            setMetrics(m);
          } catch {}
        });
        // Open orders subscription (aggregate locked amount & count)
        const qOrders = query(
          collection(db, "orders"),
          where("userId", "==", u.uid),
          where("status", "==", "open")
        );
        const unsubOrders = onSnapshot(qOrders, (snap) => {
          const ords = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setOpenOrders(ords);
          const locked = ords.reduce(
            (sum, o) => sum + (Number(o.lockedAmount) || 0),
            0
          );
          setLockedValue(Number(locked.toFixed(2)));
        });
        // Ledger feed (recent 30 entries)
        const qLedger = query(
          collection(db, "users", u.uid, "ledger"),
          orderBy("createdAt", "desc"),
          limit(30)
        );
        const unsubLedger = onSnapshot(qLedger, (snap) => {
          setLedger(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        });

        setLoading(false);
        return () => {
          unsubUser();
          unsubBets();
          unsubOrders();
          unsubLedger();
        };
      } else {
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);

  if (!user) return <div>Please login.</div>;
  if (loading)
    return (
      <div className="animate-pulse h-40 bg-neutral-900 border border-neutral-800 rounded" />
    );

  const isAdmin = profile?.role === "admin";
  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
            Dashboard
          </h1>
          <p className="text-neutral-400 text-sm sm:text-base mt-1">
            Welcome, {profile?.displayName || user.email}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="bg-neutral-900 border border-neutral-700 px-3 sm:px-5 py-2 sm:py-3 rounded-xl text-sm sm:text-base font-semibold flex items-center gap-2">
            Balance:{" "}
            <span className="text-cyan-400 font-semibold">
              ₹{profile?.balance}
            </span>
            <button
              onClick={handleRecharge}
              className="ml-2 px-2 py-1 text-xs rounded bg-cyan-800 text-white hover:bg-cyan-700 transition"
              title="Recharge Balance"
            >
              Recharge
            </button>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="px-2 sm:px-3 py-1 sm:py-2 rounded bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wide">
              Admin
            </span>
            <Link
              href="/admin/events/new"
              className="ui-btn px-3 sm:px-4 py-2 text-xs font-semibold"
            >
              Create Event
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-6">
        <MetricCard
          label="Total Staked"
          value={metrics ? `₹${metrics.totalStake}` : "-"}
        />
        <MetricCard
          label="Resolved Bets"
          value={metrics ? metrics.resolvedBets : "-"}
        />
        <MetricCard
          label="Win Rate"
          value={metrics ? (metrics.winRate * 100).toFixed(1) + "%" : "-"}
        />
        <MetricCard
          label="Profit"
          value={metrics ? `₹${metrics.profit.toFixed(2)}` : "-"}
          positive={metrics?.profit >= 0}
        />
        <MetricCard label="Open Orders" value={openOrders.length} positive />
        <MetricCard
          label="Locked Value"
          value={`₹${lockedValue.toFixed(2)}`}
          positive={lockedValue === 0}
        />
      </section>
      <div>
        <div className="flex border-b border-neutral-800 mb-6 text-xs sm:text-sm gap-1 sm:gap-2 overflow-x-auto">
          {[
            { key: "bets", label: "Bets" },
            { key: "orders", label: `Orders (${openOrders.length})` },
            { key: "ledger", label: "Ledger" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-3 sm:px-4 py-2 -mb-px border-b-2 transition-colors rounded-t whitespace-nowrap ${
                activeTab === t.key
                  ? "border-cyan-500 text-cyan-300"
                  : "border-transparent hover:text-neutral-200 text-neutral-500"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {activeTab === "bets" && (
          <div className="space-y-3 text-xs sm:text-sm">
            {bets.map((b) => (
              <div
                key={b.id}
                className="flex flex-col sm:grid sm:grid-cols-6 sm:items-center gap-2 sm:gap-3 bg-neutral-900 border border-neutral-800 rounded-lg p-3"
              >
                <span
                  className="sm:col-span-2 font-semibold text-white truncate"
                  title={eventTitles[b.eventId] || b.eventId}
                >
                  {eventTitles[b.eventId] ? (
                    <Link
                      href={`/events/${b.eventId}`}
                      className="hover:underline text-cyan-400"
                    >
                      {eventTitles[b.eventId]}
                    </Link>
                  ) : (
                    <span className="text-neutral-500">(Event)</span>
                  )}
                </span>
                <div className="flex flex-wrap gap-2 sm:contents">
                  <span
                    className={`sm:col-span-1 capitalize font-medium px-2 py-1 text-xs rounded ${
                      b.outcome && b.outcome === b.side
                        ? "bg-lime-900 text-lime-400 border border-lime-700"
                        : "bg-neutral-800 text-neutral-300"
                    }`}
                  >
                    {b.side}
                  </span>
                  <span className="sm:col-span-1 text-neutral-300">
                    ₹{b.stake}
                  </span>
                  <span className="sm:col-span-1 text-neutral-500 text-xs">
                    {b.oddsSnapshot
                      ? (b.oddsSnapshot * 100).toFixed(1) + "%"
                      : ""}
                  </span>
                  <span
                    className={`sm:col-span-1 text-xs px-2 py-1 rounded ${
                      b.settled
                        ? b.outcome === b.side
                          ? "bg-lime-900 text-lime-400 border border-lime-700"
                          : "bg-red-900 text-red-400 border border-red-700"
                        : "bg-neutral-800 text-neutral-500"
                    }`}
                  >
                    {b.settled
                      ? b.outcome === b.side
                        ? "Won"
                        : "Lost"
                      : "Open"}
                  </span>
                  <span className="sm:col-span-1 sm:text-right text-cyan-300 font-mono">
                    {b.payout ? `₹${b.payout.toFixed(2)}` : "-"}
                  </span>
                </div>
              </div>
            ))}
            {!bets.length && (
              <div className="text-neutral-500 text-center py-8">
                No bets yet.
              </div>
            )}
          </div>
        )}
        {activeTab === "orders" && (
          <div className="space-y-2 text-sm">
            {openOrders.map((o) => (
              <div
                key={o.id}
                className="grid grid-cols-6 items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-lg p-3"
              >
                <span className="col-span-2 truncate">
                  <Link
                    href={`/events/${o.eventId}`}
                    className="text-cyan-400 hover:underline"
                  >
                    {o.eventId}
                  </Link>
                </span>
                <span
                  className={`col-span-1 text-xs font-semibold px-2 py-1 rounded-full text-center w-fit ${
                    o.side === "yes"
                      ? "bg-emerald-900 text-emerald-300 border border-emerald-700"
                      : "bg-rose-900 text-rose-300 border border-rose-700"
                  }`}
                >
                  {o.side.toUpperCase()}
                </span>
                <span className="col-span-1 font-mono text-cyan-300">
                  ₹{o.price}
                </span>
                <span className="col-span-1 font-mono">
                  {o.quantityRemaining ?? o.quantity}
                </span>
                <span className="col-span-1 font-mono text-neutral-400">
                  {o.lockedAmount != null ? `₹${o.lockedAmount}` : "-"}
                </span>
              </div>
            ))}
            {!openOrders.length && (
              <div className="text-neutral-500">No open orders.</div>
            )}
          </div>
        )}
        {activeTab === "ledger" && (
          <div className="space-y-2 text-sm">
            {ledger.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-lg p-3"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-neutral-200">
                    {formatLedgerType(l.type)}
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    {l.eventId && (
                      <Link
                        href={`/events/${l.eventId}`}
                        className="text-cyan-400 hover:underline"
                      >
                        {l.eventId}
                      </Link>
                    )}
                  </span>
                </div>
                <span
                  className={`font-mono text-sm font-semibold ${
                    l.amount >= 0 ? "text-lime-400" : "text-rose-400"
                  }`}
                >
                  {l.amount >= 0 ? "+" : ""}
                  {l.amount.toFixed(2)}
                </span>
              </div>
            ))}
            {!ledger.length && (
              <div className="text-neutral-500">No ledger entries.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, positive }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col gap-3 shadow-sm">
      <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium">
        {label}
      </span>
      <span
        className={`text-2xl font-bold leading-none ${
          positive === undefined
            ? ""
            : positive
            ? "text-lime-400"
            : "text-red-400"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function formatLedgerType(t) {
  switch (t) {
    case "order_place":
      return "Order Placed";
    case "order_cancel_refund":
      return "Order Cancelled";
    case "payout":
      return "Event Payout";
    default:
      return t;
  }
}
