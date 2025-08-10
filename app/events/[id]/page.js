"use client";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { useParams } from "next/navigation";
import Link from "next/link";
import BetForm from "@/components/BetForm";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { useToast } from "@/components/ToastProvider";

export default function EventDetailPage() {
  // Ensure hooks are called unconditionally and in the correct order
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [bets, setBets] = useState([]);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const lastFirstBetId = useRef(null);
  const { push } = useToast();
  // Fetch user profile for admin check
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const p = await fetch("/api/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then((r) => r.json());
        setProfile(p);
      } catch {}
    })();
  }, [user]);

  // ...existing code...

  const chartData = useMemo(() => {
    const eventCreatedAtSec = event?.createdAt?.seconds || null;
    const defaultData = [
      {
        time: eventCreatedAtSec
          ? new Date(eventCreatedAtSec * 1000)
              .toISOString()
              .slice(0, 16)
              .replace("T", " ")
          : "Created",
        Yes: 50,
        No: 50,
      },
    ];
    if (!bets || !bets.length) return defaultData;
    const sorted = [...bets].sort(
      (a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
    );
    let yesSum = 0,
      noSum = 0;
    return sorted.map((b) => {
      if (b.side === "yes") yesSum += b.stake;
      else if (b.side === "no") noSum += b.stake;
      const tot = yesSum + noSum;
      return {
        time: b.createdAt?.seconds
          ? new Date(b.createdAt.seconds * 1000)
              .toISOString()
              .slice(0, 16)
              .replace("T", " ")
          : "-",
        Yes: tot > 0 ? (yesSum / tot) * 100 : 50,
        No: tot > 0 ? (noSum / tot) * 100 : 50,
      };
    });
  }, [bets, event]);

  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    setAnimate(true);
    const t = setTimeout(() => setAnimate(false), 600); // disable after first draw
    return () => clearTimeout(t);
  }, [bets, event]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!id) return;
    const evRef = doc(db, "events", id);
    const unsubEvent = onSnapshot(
      evRef,
      (snap) => {
        if (!snap.exists()) setError("Not found");
        else setEvent({ id: snap.id, ...snap.data() });
      },
      (err) => {
        setError(err.message);
      }
    );
    const betsQ = query(
      collection(db, "bets"),
      where("eventId", "==", id),
      orderBy("createdAt", "desc")
    );
    const unsubBets = onSnapshot(
      betsQ,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Compare with previous first bet id stored in ref
        const currentFirst = list[0]?.id;
        if (currentFirst && currentFirst !== lastFirstBetId.current) {
          if (lastFirstBetId.current !== null) {
            // highlight only after initial load
            lastFirstBetId.current = currentFirst;
          } else {
            // initial assignment without highlight
            lastFirstBetId.current = currentFirst;
          }
        }
        setBets(list);
      },
      (err) => push(err.message, "error")
    );
    return () => {
      unsubEvent();
      unsubBets();
    };
  }, [id, push]);

  // Add a callback to force refresh bets after placing a bet
  const handleBetPlaced = useCallback(() => {
    // This will trigger the Firestore listener to update bets
    // Optionally, you could re-fetch bets here if needed
    // For now, just a placeholder in case BetForm emits an event
  }, []);

  if (!event)
    return <div className="mt-10">{error ? error : "Loading event..."}</div>;

  const yes = event.yesStake || 0;
  const no = event.noStake || 0;
  const total = yes + no;
  const prob = total > 0 ? yes / total : 0.5;

  return (
    <div className="flex flex-col md:flex-row gap-8 mt-4">
      {/* Left: Event details and chart */}
      <div className="flex-1 min-w-0 space-y-8">
        {/* Admin/Resolve button for admins */}
        {profile?.role === "admin" && !event.resolvedOutcome && (
          <div className="mb-4">
            <Link
              href={`/admin/events/${id}`}
              className="inline-block bg-emerald-700 hover:bg-emerald-600 text-white font-semibold px-4 py-2 rounded transition shadow"
            >
              Resolve Event
            </Link>
          </div>
        )}
        <div>
          <h1 className="text-4xl font-extrabold mb-4 leading-tight tracking-tight text-white">
            {event.title}
          </h1>
          <p className="text-base text-neutral-400 whitespace-pre-line leading-relaxed">
            {event.description}
          </p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex gap-2 mb-3">
                <span className="flex-1 text-center py-1 rounded-full bg-[#0a3d62] text-white font-semibold">
                  Yes {(prob * 100).toFixed(1)}%
                </span>
                <span className="flex-1 text-center py-1 rounded-full bg-[#7b1113] text-white font-semibold">
                  No {((1 - prob) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm text-neutral-400 font-medium">
                <span className="text-neutral-300">Total {total}</span>
              </div>
            </div>
            <div className="text-right text-sm space-y-1">
              <div>
                Status:{" "}
                <span className="font-medium text-lime-400">
                  {event.status}
                </span>
              </div>
              {event.resolvedOutcome && (
                <div>
                  Outcome:{" "}
                  <span className="text-lime-400">{event.resolvedOutcome}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-lg min-h-[280px] flex flex-col relative">
          <h2 className="font-semibold text-lg mb-2 tracking-tight text-white">
            Yes/No Ratio Over Time
          </h2>
          <div className="flex-1 min-h-[220px] relative">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis
                  dataKey="time"
                  tick={{ fill: "#888", fontSize: 12 }}
                  minTickGap={20}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "#888", fontSize: 12 }}
                  tickFormatter={(v) => v + "%"}
                />
                <Tooltip formatter={(v) => v.toFixed(1) + "%"} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Yes"
                  stroke="#06b6d4"
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={animate}
                />
                <Line
                  type="monotone"
                  dataKey="No"
                  stroke="#818cf8"
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={animate}
                />
              </LineChart>
            </ResponsiveContainer>
            {(!bets || bets.length === 0) && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-neutral-500 bg-neutral-900/80 px-4 py-2 rounded-lg">
                  No bets yet. Chart shows default 50/50.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Right: Bet form and recent bets */}
      <div className="w-full md:w-[380px] flex-shrink-0 space-y-8">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-lg">
          {authLoading ? (
            <div className="text-neutral-500 text-center">
              Checking authentication...
            </div>
          ) : event.resolvedOutcome ? (
            <div className="text-lime-400 text-center font-semibold text-lg">
              Event resolved.
            </div>
          ) : user && event.status === "open" ? (
            <BetForm eventId={event.id} onBetPlaced={handleBetPlaced} />
          ) : (
            <div className="text-neutral-500 text-center">
              Sign in to place a bet.
            </div>
          )}
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-lg">
          <h2 className="font-semibold text-lg mb-4 tracking-tight text-white">
            Recent Bets
          </h2>
          <div className="space-y-3 text-sm max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-900 rounded-md">
            {bets.slice(0, 25).length === 0 && (
              <div className="text-neutral-500">No bets yet.</div>
            )}
            {bets.slice(0, 10).map((b) => (
              <div
                key={b.id}
                className={`flex justify-between bg-neutral-900 border border-neutral-800 rounded-lg p-3 transition-shadow ${
                  lastFirstBetId.current === b.id
                    ? "ring-2 ring-cyan-500/40 shadow-lg"
                    : ""
                }`}
              >
                <span
                  className={`capitalize font-medium ${
                    b.outcome && b.outcome === b.side ? "text-lime-400" : ""
                  }`}
                >
                  {b.side}
                </span>
                <span className="font-mono text-cyan-300">{b.stake}</span>
                <span className="text-neutral-500 font-mono">
                  {b.oddsSnapshot
                    ? (b.oddsSnapshot * 100).toFixed(1) + "%"
                    : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
