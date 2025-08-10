"use client";
import { useEffect, useState, useRef } from "react";
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
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [bets, setBets] = useState([]);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const lastFirstBetId = useRef(null);
  const { push } = useToast();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
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

  if (!event)
    return <div className="mt-10">{error ? error : "Loading event..."}</div>;

  const yes = event.yesStake || 0;
  const no = event.noStake || 0;
  const total = yes + no;
  const prob = total > 0 ? yes / total : 0.5;

  // Prepare recharts data: array of { time, yes, no }
  const chartData = (() => {
    if (!bets.length) return null;
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
          ? new Date(b.createdAt.seconds * 1000).toLocaleString()
          : "-",
        Yes: tot > 0 ? (yesSum / tot) * 100 : 50,
        No: tot > 0 ? (noSum / tot) * 100 : 50,
      };
    });
  })();

  return (
    <div className="flex flex-col md:flex-row gap-8 mt-4">
      {/* Left: Event details and chart */}
      <div className="flex-1 min-w-0 space-y-8">
        <div>
          <h1 className="text-4xl font-extrabold mb-4 leading-tight tracking-tight">
            {event.title}
          </h1>
          <p className="text-base text-neutral-400 whitespace-pre-line leading-relaxed">
            {event.description}
          </p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex gap-2 mb-3">
                <span className="flex-1 text-center py-1 rounded-full bg-cyan-950 text-cyan-300 font-semibold">
                  Yes {(prob * 100).toFixed(1)}%
                </span>
                <span className="flex-1 text-center py-1 rounded-full bg-indigo-950 text-indigo-300 font-semibold">
                  No {((1 - prob) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm text-neutral-400 font-medium">
                <span className="text-neutral-300">Total {total}</span>
              </div>
            </div>
            <div className="text-right text-sm space-y-1">
              <div>
                Status: <span className="font-medium">{event.status}</span>
              </div>
              {event.resolvedOutcome && (
                <div>Outcome: {event.resolvedOutcome}</div>
              )}
            </div>
          </div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-sm min-h-[280px] flex flex-col">
          <h2 className="font-semibold text-lg mb-2 tracking-tight">
            Yes/No Ratio Over Time
          </h2>
          <div className="flex-1 min-h-[220px]">
            {chartData && chartData.length > 0 ? (
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
                  />
                  <Line
                    type="monotone"
                    dataKey="No"
                    stroke="#818cf8"
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-neutral-500 flex items-center justify-center h-full">
                No bets yet to show chart.
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Right: Bet form and recent bets */}
      <div className="w-full md:w-[380px] flex-shrink-0 space-y-8">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-sm">
          {user && event.status === "open" ? (
            <BetForm eventId={event.id} />
          ) : (
            <div className="text-neutral-500 text-center">
              Sign in to place a bet.
            </div>
          )}
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-lg mb-4 tracking-tight">
            Recent Bets
          </h2>
          <div className="space-y-3 text-sm">
            {bets.slice(0, 25).map((b) => (
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
            {!bets.length && (
              <div className="text-neutral-500">No bets yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
