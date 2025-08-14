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
  const [allOrders, setAllOrders] = useState([]);
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
        // Realtime bets - need to query both yesUserId and noUserId
        // Simplified queries without orderBy to avoid index issues
        const qBetsYes = query(
          collection(db, "bets"),
          where("yesUserId", "==", u.uid)
        );
        const qBetsNo = query(
          collection(db, "bets"),
          where("noUserId", "==", u.uid)
        );

        const unsubBetsYes = onSnapshot(qBetsYes, async (snap) => {
          const yesBets = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

          // Get no bets as well
          const noBetsSnap = await getDocs(qBetsNo);
          const noBets = noBetsSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));

          // Combine and deduplicate
          const allUserBets = [...yesBets, ...noBets];
          const uniqueBets = allUserBets.filter(
            (bet, index, self) =>
              index === self.findIndex((b) => b.id === bet.id)
          );

          // Sort by creation date
          uniqueBets.sort(
            (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
          );

          setBets(uniqueBets);

          // Fetch event titles for bets
          const eventIds = Array.from(
            new Set(uniqueBets.map((b) => b.eventId).filter(Boolean))
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

        // All orders subscription for order history
        const qAllOrders = query(
          collection(db, "orders"),
          where("userId", "==", u.uid),
          orderBy("createdAt", "desc")
        );
        const unsubAllOrders = onSnapshot(qAllOrders, async (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setAllOrders(list);
          // Fetch event titles for orders
          const eventIds = Array.from(
            new Set(list.map((o) => o.eventId).filter(Boolean))
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
          setEventTitles((prev) => ({ ...prev, ...titles }));
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
          unsubBetsYes();
          unsubOrders();
          unsubAllOrders();
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
        <div className="flex border-b border-neutral-800 mb-6 text-xs sm:text-sm gap-1 sm:gap-3">
          {[
            { key: "bets", label: "Bets" },
            { key: "orders", label: `Orders (${openOrders.length})` },
            { key: "history", label: "History" },
            { key: "ledger", label: "Ledger" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-2 sm:px-4 py-2 -mb-px border-b-2 transition-colors rounded-t flex-1 sm:flex-none text-center ${
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
            {bets.map((b) => {
              // Check if this is a self-match (same user on both sides)
              const isSelfMatch =
                b.yesUserId === b.noUserId && b.yesUserId === user.uid;

              // Determine user's side and stake
              const userSide = b.yesUserId === user.uid ? "yes" : "no";
              const userStake =
                userSide === "yes" ? b.yesLocked || 0 : b.noLocked || 0;

              // For self-matches, show total stake and net result
              const totalStake = isSelfMatch
                ? (b.yesLocked || 0) + (b.noLocked || 0)
                : userStake;
              const displaySide = isSelfMatch ? "both" : userSide;

              const isWinner =
                !isSelfMatch &&
                b.status === "settled" &&
                ((b.winner === "yes" && userSide === "yes") ||
                  (b.winner === "no" && userSide === "no"));
              const isLoser =
                !isSelfMatch && b.status === "settled" && !isWinner;

              return (
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
                        isSelfMatch
                          ? "bg-purple-900 text-purple-300 border border-purple-700"
                          : displaySide === "yes"
                          ? "bg-emerald-900 text-emerald-300 border border-emerald-700"
                          : "bg-rose-900 text-rose-300 border border-rose-700"
                      }`}
                    >
                      {isSelfMatch ? "Self-Match" : displaySide}
                    </span>
                    <span className="sm:col-span-1 text-neutral-300">
                      ₹{totalStake.toFixed(2)}
                    </span>
                    <span className="sm:col-span-1 text-neutral-500 text-xs">
                      {isSelfMatch
                        ? "Hedge"
                        : b.oddsSnapshot
                        ? (b.oddsSnapshot * 100).toFixed(1) + "%"
                        : ""}
                    </span>
                    <span
                      className={`sm:col-span-1 text-xs px-2 py-1 rounded ${
                        b.status === "settled"
                          ? isSelfMatch
                            ? "bg-orange-900 text-orange-400 border border-orange-700"
                            : isWinner
                            ? "bg-lime-900 text-lime-400 border border-lime-700"
                            : "bg-red-900 text-red-400 border border-red-700"
                          : "bg-neutral-800 text-neutral-500"
                      }`}
                    >
                      {b.status === "settled"
                        ? isSelfMatch
                          ? "Commission Paid"
                          : isWinner
                          ? "Won"
                          : "Lost"
                        : "Open"}
                    </span>
                    <span className="sm:col-span-1 sm:text-right text-cyan-300 font-mono">
                      {isSelfMatch && b.status === "settled" ? (
                        <div className="text-right">
                          <div className="text-red-400">
                            -₹{(b.commission || 0).toFixed(2)}
                          </div>
                          <div className="text-xs text-neutral-500">
                            (commission loss)
                          </div>
                        </div>
                      ) : isWinner ? (
                        <div className="text-right">
                          <div className="text-cyan-300">
                            ₹
                            {(
                              b.finalPayout ||
                              (b.yesLocked || 0) + (b.noLocked || 0)
                            ).toFixed(2)}
                          </div>
                          {b.commission && (
                            <div className="text-xs text-neutral-500">
                              (₹{b.commission.toFixed(2)} fee)
                            </div>
                          )}
                        </div>
                      ) : isLoser ? (
                        "₹0.00"
                      ) : (
                        "-"
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
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
        {activeTab === "history" && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-7 gap-3 px-3 py-2 bg-neutral-800 rounded-lg text-xs font-semibold text-neutral-400 uppercase tracking-wide">
              <span className="col-span-2">Event</span>
              <span className="col-span-1 text-center">Side</span>
              <span className="col-span-1 text-center">Price</span>
              <span className="col-span-1 text-center">Quantity</span>
              <span className="col-span-1 text-center">Status</span>
              <span className="col-span-1 text-center">Amount</span>
            </div>
            {allOrders.map((o) => (
              <div
                key={o.id}
                className="grid grid-cols-7 items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-lg p-3"
              >
                <span className="col-span-2 truncate">
                  <Link
                    href={`/events/${o.eventId}`}
                    className="text-cyan-400 hover:underline"
                    title={eventTitles[o.eventId] || o.eventId}
                  >
                    {eventTitles[o.eventId] || o.eventId}
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
                  {o.quantity}
                  {o.quantityRemaining !== undefined &&
                  o.quantityRemaining !== o.quantity
                    ? ` (${o.quantityRemaining} left)`
                    : ""}
                </span>
                <span className="col-span-1 text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      o.status === "open"
                        ? "bg-cyan-900 text-cyan-300 border border-cyan-700"
                        : o.status === "filled"
                        ? "bg-lime-900 text-lime-300 border border-lime-700"
                        : o.status === "cancelled"
                        ? "bg-neutral-800 text-neutral-400 border border-neutral-700"
                        : o.status === "refunded"
                        ? "bg-orange-900 text-orange-300 border border-orange-700"
                        : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                    }`}
                  >
                    {o.status === "refunded"
                      ? "Refunded"
                      : o.status === "filled"
                      ? "Filled"
                      : o.status === "cancelled"
                      ? "Cancelled"
                      : o.status === "open"
                      ? "Open"
                      : o.status}
                  </span>
                </span>
                <span className="col-span-1 font-mono text-neutral-400 text-xs">
                  {o.refundedAmount
                    ? `₹${o.refundedAmount}`
                    : o.lockedAmount
                    ? `₹${o.lockedAmount}`
                    : "-"}
                </span>
              </div>
            ))}
            {!allOrders.length && (
              <div className="text-neutral-500">No order history.</div>
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
    case "self-match-settlement":
      return "Self-Match Commission";
    default:
      return t;
  }
}
