"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs,
} from "firebase/firestore";
import { useToast } from "@/app/components/ToastProvider";
import EventCard from "@/app/components/EventCard";

export default function EventsPage() {
  const [events, setEvents] = useState(null);
  const [marketData, setMarketData] = useState({}); // { [eventId]: { bestYes, bestNo, lastMatched } }
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("new");
  const { push } = useToast();

  useEffect(() => {
    const qRef = query(collection(db, "events"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      qRef,
      async (snap) => {
        const evs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setEvents(evs);
        // Fetch Option B prices (last trade driven with order book fallback) for each event
        const data = {};
        await Promise.all(
          evs.map(async (ev) => {
            // Last trade (bet) fetch first
            const betsQ = query(
              collection(db, "bets"),
              where("eventId", "==", ev.id),
              orderBy("createdAt", "desc")
            );
            const betsSnap = await getDocs(betsQ);
            let lastTradeYes = null; // YES price view
            const firstBet = betsSnap.docs[0]?.data();
            if (firstBet && typeof firstBet.price === "number") {
              lastTradeYes =
                firstBet.side === "yes" ? firstBet.price : 10 - firstBet.price;
            }

            // Order book fallbacks
            const noQ = query(
              collection(db, "orders"),
              where("eventId", "==", ev.id),
              where("side", "==", "no"),
              where("status", "==", "open")
            );
            const yesQ = query(
              collection(db, "orders"),
              where("eventId", "==", ev.id),
              where("side", "==", "yes"),
              where("status", "==", "open")
            );
            const [noSnap, yesSnap] = await Promise.all([
              getDocs(noQ),
              getDocs(yesQ),
            ]);
            let bestNoAsk = null;
            noSnap.forEach((d) => {
              const o = d.data();
              if (typeof o.price === "number") {
                if (bestNoAsk === null || o.price < bestNoAsk)
                  bestNoAsk = o.price;
              }
            });
            let bestYesAsk = null;
            yesSnap.forEach((d) => {
              const o = d.data();
              if (typeof o.price === "number") {
                if (bestYesAsk === null || o.price < bestYesAsk)
                  bestYesAsk = o.price;
              }
            });

            let currentYesPrice;
            let currentNoPrice;
            if (typeof lastTradeYes === "number") {
              currentYesPrice = lastTradeYes;
              currentNoPrice = Number((10 - currentYesPrice).toFixed(2));
            } else if (typeof bestNoAsk === "number") {
              currentYesPrice = bestNoAsk;
              currentNoPrice = Number((10 - currentYesPrice).toFixed(2));
            } else if (typeof bestYesAsk === "number") {
              currentNoPrice = bestYesAsk;
              currentYesPrice = Number((10 - currentNoPrice).toFixed(2));
            } else {
              currentYesPrice = 5;
              currentNoPrice = 5;
            }

            data[ev.id] = { currentYesPrice, currentNoPrice };
          })
        );
        setMarketData(data);
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
      // Sort by best YES price (higher = more likely)
      list.sort((a, b) => {
        const ay = marketData[a.id]?.bestYes ?? 0;
        const by = marketData[b.id]?.bestYes ?? 0;
        return by - ay;
      });
    } // default 'new' already ordered by createdAt desc
    return list;
  }, [events, search, status, sort, marketData]);

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
            <option value="yesprob">Best YES Price</option>
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
            <EventCard key={ev.id} ev={{ ...ev, ...marketData[ev.id] }} />
          ))}
          {!filtered.length && (
            <div className="text-neutral-500">No markets found.</div>
          )}
        </div>
      )}
    </div>
  );
}
