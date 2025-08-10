"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useToast } from "@/components/ToastProvider";

function EventCard({ ev }) {
  const yes = ev.yesStake || 0;
  const no = ev.noStake || 0;
  const total = yes + no;
  const yesProb = total > 0 ? yes / total : 0.5;
  const noProb = 1 - yesProb;
  return (
    <Link
      href={`/events/${ev.id}`}
  className="ui-card hoverable group relative overflow-hidden flex flex-col min-h-[150px]"
    >
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-cyan-500/5 via-transparent to-indigo-600/10" />
      <div className="flex items-start justify-between mb-3 gap-3 relative">
        <h3 className="font-medium text-sm line-clamp-2 flex-1 group-hover:text-white transition-colors tracking-tight">
          {ev.title}
        </h3>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${
            ev.status === "open"
              ? "bg-cyan-500/10 text-cyan-300 border-cyan-600/40"
              : "bg-neutral-700/30 text-neutral-300 border-neutral-600/40"
          }`}
        >
          {ev.status}
        </span>
      </div>
      <div className="flex justify-end text-[11px] text-[var(--c-text-faint)] font-medium mt-2">
        <span className="text-neutral-400">{total} coins</span>
      </div>
      <div className="mt-auto flex justify-between gap-2 pt-2">
        <span className="flex-1">
          <span className="block w-full rounded-full py-1.5 text-center font-semibold text-sm bg-cyan-900/60 text-cyan-300 border border-cyan-700">
            Yes {(yesProb * 100).toFixed(1)}%
          </span>
        </span>
        <span className="flex-1">
          <span className="block w-full rounded-full py-1.5 text-center font-semibold text-sm bg-pink-900/60 text-pink-300 border border-pink-700">
            No {(noProb * 100).toFixed(1)}%
          </span>
        </span>
      </div>
    </Link>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("new");
  const { push } = useToast();
  useEffect(() => {
    const qRef = query(collection(db, "events"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      qRef,
      (snap) => {
        setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        push(err.message, "error");
      }
    );
    return () => unsub();
  }, [push]);

  const filtered = useMemo(() => {
    if (!events) return null;
    let list = [...events];
    if (status !== "all") list = list.filter((e) => e.status === status);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.title?.toLowerCase().includes(q));
    }
    if (sort === "liquidity") {
      list.sort((a, b) => (b.totalStake || 0) - (a.totalStake || 0));
    } else if (sort === "yesprob") {
      const p = (ev) => {
        const y = ev.yesStake || 0;
        const n = ev.noStake || 0;
        const t = y + n;
        return t ? y / t : 0.5;
      };
      list.sort((a, b) => p(b) - p(a));
    } // default 'new' already ordered by createdAt desc
    return list;
  }, [events, search, status, sort]);

  const openCount = events?.filter((e) => e.status === "open").length || 0;
  const totalVol = events?.reduce((s, e) => s + (e.totalStake || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Markets</h1>
          <p className="text-xs text-neutral-500 mt-1">
            {openCount} open • {totalVol} total coins staked
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm focus:outline-none"
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm focus:outline-none"
          >
            <option value="new">Newest</option>
            <option value="liquidity">Liquidity</option>
            <option value="yesprob">Yes %</option>
          </select>
        </div>
      </div>
      {!filtered && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-neutral-800 p-4 bg-neutral-900 h-32"
            />
          ))}
        </div>
      )}
      {filtered && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((ev) => (
            <EventCard key={ev.id} ev={ev} />
          ))}
          {!filtered.length && (
            <div className="text-neutral-500">No markets found.</div>
          )}
        </div>
      )}
    </div>
  );
}
