"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/clientApi";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function AdminEventManage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [outcome, setOutcome] = useState("yes");
  const [resolved, setResolved] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const p = await apiFetch("/api/users/me");
        setProfile(p);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (id)
      apiFetch(`/api/events/${id}`)
        .then(setEvent)
        .catch((e) => setError(e.message));
  }, [id]);

  if (!user) return <div>Login required.</div>;
  if (profile?.role !== "admin") return <div>Admin only.</div>;
  if (!event) return <div>Loading...</div>;

  async function resolve() {
    try {
      await apiFetch(`/api/admin/events/${id}/resolve`, {
        method: "POST",
        body: JSON.stringify({ outcome }),
      });
      setResolved(true);
      setTimeout(() => {
        setResolved(false);
        router.refresh();
      }, 1200);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="space-y-8 max-w-xl mx-auto mt-10">
      <h1 className="text-3xl font-extrabold text-center mb-2">
        Resolve Event
      </h1>
      <div className="bg-neutral-900 border-2 border-neutral-800 rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex flex-col gap-2">
          <div className="text-lg font-bold text-white">{event.title}</div>
          <div className="flex gap-4 text-sm text-neutral-400">
            <span>
              Status:{" "}
              <span className="font-semibold text-lime-400">
                {event.status}
              </span>
            </span>
            <span>
              Yes Stake: <span className="text-cyan-400">{event.yesStake}</span>
            </span>
            <span>
              No Stake: <span className="text-pink-400">{event.noStake}</span>
            </span>
          </div>
        </div>
        {event.resolvedOutcome && (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-emerald-700 to-cyan-700 text-white text-center font-bold text-lg border-2 border-emerald-500 animate-pulse">
            Resolved Outcome: {event.resolvedOutcome.toUpperCase()}
          </div>
        )}
        {!event.resolvedOutcome && (
          <div className="space-y-4">
            <div className="flex gap-4 justify-center">
              {["yes", "no"].map((o) => (
                <button
                  key={o}
                  onClick={() => setOutcome(o)}
                  className={`px-6 py-2 rounded-lg text-base font-bold border-2 transition-all duration-200 focus:outline-none ${
                    outcome === o
                      ? o === "yes"
                        ? "bg-cyan-700 border-cyan-400 text-white shadow-lg scale-105"
                        : "bg-pink-700 border-pink-400 text-white shadow-lg scale-105"
                      : "bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700"
                  }`}
                >
                  {o.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              onClick={resolve}
              disabled={resolved}
              className={`w-full mt-4 py-3 rounded-xl text-lg font-bold transition-all duration-200 shadow-md focus:outline-none ${
                resolved
                  ? "bg-emerald-700 text-white animate-pulse cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              }`}
            >
              {resolved ? "Resolved!" : "Resolve"}
            </button>
            {error && (
              <div className="text-red-400 text-center mt-2">{error}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
