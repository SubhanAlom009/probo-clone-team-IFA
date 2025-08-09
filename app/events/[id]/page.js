"use client";
import { useEffect, useState } from "react";
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
      (snap) => setBets(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">{event.title}</h1>
        <p className="text-sm text-neutral-400 whitespace-pre-line">
          {event.description}
        </p>
      </div>
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-3 w-full bg-neutral-800 rounded overflow-hidden mb-2">
              <div
                className="h-full bg-indigo-500 transition-all"
                style={{ width: `${prob * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-neutral-400">
              <span>Yes {(prob * 100).toFixed(1)}%</span>
              <span>Total {total}</span>
            </div>
          </div>
          <div className="text-right text-sm">
            <div>
              Status: <span className="font-medium">{event.status}</span>
            </div>
            {event.resolvedOutcome && (
              <div>Outcome: {event.resolvedOutcome}</div>
            )}
          </div>
        </div>
        {user && event.status === "open" && <BetForm eventId={event.id} />}
      </div>
      <div>
        <h2 className="font-semibold mb-3">Recent Bets</h2>
        <div className="space-y-2 text-sm">
          {bets.slice(0, 25).map((b) => (
            <div
              key={b.id}
              className="flex justify-between bg-neutral-900 border border-neutral-800 rounded p-2"
            >
              <span className="capitalize">{b.side}</span>
              <span>{b.stake}</span>
              <span className="text-neutral-500">
                {b.oddsSnapshot ? (b.oddsSnapshot * 100).toFixed(1) + "%" : ""}
              </span>
            </div>
          ))}
          {!bets.length && <div className="text-neutral-500">No bets yet.</div>}
        </div>
      </div>
    </div>
  );
}
