"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/clientApi";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
} from "firebase/firestore";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [bets, setBets] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [upgradeStatus, setUpgradeStatus] = useState(null);
  const [submittingUpgrade, setSubmittingUpgrade] = useState(false);
  const [activeTab, setActiveTab] = useState("bets");
  const [loading, setLoading] = useState(true);

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
          // Refresh metrics after bet change (simple approach)
          try {
            const m = await apiFetch("/api/users/me/metrics");
            setMetrics(m);
          } catch {}
        });
        setLoading(false);
        return () => {
          unsubUser();
          unsubBets();
        };
      } else {
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);

  async function handleUpgradeRequest() {
    setSubmittingUpgrade(true);
    try {
      await apiFetch("/api/users/upgrade-request", { method: "POST" });
      setUpgradeStatus("requested");
      // refresh profile
      const p = await apiFetch("/api/users/me");
      setProfile(p);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingUpgrade(false);
    }
  }

  if (!user) return <div>Please login.</div>;
  if (loading)
    return (
      <div className="animate-pulse h-40 bg-neutral-900 border border-neutral-800 rounded" />
    );

  const isAdmin = profile?.role === "admin";
  const requested = profile?.upgradeRequested;
  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="text-neutral-400 text-base mt-1">
            Welcome, {profile?.displayName || user.email}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-neutral-900 border border-neutral-700 px-5 py-3 rounded-xl text-base font-semibold">
            Balance:{" "}
            <span className="text-cyan-400 font-semibold">
              {profile?.balance}
            </span>
          </div>
          {!isAdmin && (
            <button
              disabled={requested || submittingUpgrade}
              onClick={handleUpgradeRequest}
              className="ui-btn disabled:opacity-50"
            >
              {requested
                ? "Requested"
                : submittingUpgrade
                ? "Requesting..."
                : "Request Admin"}
            </button>
          )}
          {isAdmin && (
            <span className="px-3 py-2 rounded bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wide">
              Admin
            </span>
          )}
        </div>
      </header>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Staked"
          value={metrics ? metrics.totalStake : "-"}
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
          value={metrics ? metrics.profit.toFixed(2) : "-"}
          positive={metrics?.profit >= 0}
        />
      </section>

      <div>
        <div className="flex border-b border-neutral-800 mb-6 text-sm">
          {["bets", "ledger"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 -mb-px border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-cyan-500 text-cyan-300"
                  : "border-transparent hover:text-neutral-200 text-neutral-500"
              }`}
            >
              {tab === "bets" ? "Bets" : "Ledger"}
            </button>
          ))}
        </div>
        {activeTab === "bets" && (
          <div className="space-y-3 text-sm">
            {bets.map((b) => (
              <div
                key={b.id}
                className="grid grid-cols-5 items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-lg p-3"
              >
                <span className="col-span-1 capitalize font-medium {b.outcome && b.outcome===b.side ? 'text-lime-400':' '}">
                  {b.side}
                </span>
                <span className="col-span-1">{b.stake}</span>
                <span className="col-span-1 text-neutral-500">
                  {b.oddsSnapshot
                    ? (b.oddsSnapshot * 100).toFixed(1) + "%"
                    : ""}
                </span>
                <span className="col-span-1 text-xs {b.settled ? (b.outcome===b.side ? 'text-lime-400':'text-red-400'):'text-neutral-500'}">
                  {b.settled ? (b.outcome === b.side ? "Won" : "Lost") : "Open"}
                </span>
                <span className="col-span-1 text-right text-cyan-300">
                  {b.payout ? b.payout.toFixed(2) : ""}
                </span>
              </div>
            ))}
            {!bets.length && (
              <div className="text-neutral-500">No bets yet.</div>
            )}
          </div>
        )}
        {activeTab === "ledger" && (
          <div className="text-sm text-neutral-500">Ledger coming soon.</div>
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
