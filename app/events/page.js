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

  // Calculate dynamic prices based on probabilities
  const yesPrice = (yesProb * 10).toFixed(0); // Example: ₹7 for 70% chance
  const noPrice = (noProb * 10).toFixed(0); // Example: ₹3 for 30% chance

  return (
    <Link href={`/events/${ev.id}`}>
      <div className="bg-neutral-900 rounded-lg shadow-md p-5 flex flex-col justify-between cursor-pointer hover:shadow-lg transition-shadow">
        {/* Main Section */}
        <div className="flex flex-col mb-4">
          <h2 className="font-bold text-lg mb-2 text-white">{ev.title}</h2>
          <p className="text-[#a0a0a0] text-sm">
            {ev.description || "No description available."}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button className="flex-1 bg-[#0a3d62] text-white font-bold py-2 rounded hover:brightness-110">
            Yes ₹{yesPrice}
          </button>
          <button className="flex-1 bg-[#7b1113] text-white font-bold py-2 rounded hover:brightness-110">
            No ₹{noPrice}
          </button>
        </div>
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
    <div className="bg-[#121212] text-white min-h-screen p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All events</h1>
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-neutral-900 rounded-lg shadow-md p-5 flex flex-col justify-between min-h-[170px] border border-neutral-800"
            >
              <div className="flex flex-col mb-4 gap-2">
                <div className="h-6 w-2/3 bg-neutral-800 rounded" />
                <div className="h-4 w-full bg-neutral-800 rounded" />
                <div className="h-4 w-5/6 bg-neutral-800 rounded" />
              </div>
              <div className="flex gap-4 mt-auto">
                <div className="flex-1 h-9 bg-neutral-800 rounded-full" />
                <div className="flex-1 h-9 bg-neutral-800 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}
      {filtered && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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
