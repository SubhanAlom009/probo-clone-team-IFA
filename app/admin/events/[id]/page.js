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
      router.refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold">Admin Manage</h1>
      <div className="bg-neutral-900 border border-neutral-800 rounded p-4 space-y-2 text-sm">
        <div>
          <span className="font-medium">Title:</span> {event.title}
        </div>
        <div>Status: {event.status}</div>
        <div>
          Yes Stake: {event.yesStake} | No Stake: {event.noStake}
        </div>
        {event.resolvedOutcome && (
          <div>Resolved Outcome: {event.resolvedOutcome}</div>
        )}
      </div>
      {!event.resolvedOutcome && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {["yes", "no"].map((o) => (
              <button
                key={o}
                onClick={() => setOutcome(o)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium ${
                  outcome === o
                    ? "bg-indigo-600"
                    : "bg-neutral-800 hover:bg-neutral-700"
                }`}
              >
                {o.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            onClick={resolve}
            className="bg-emerald-600 hover:bg-emerald-500 px-5 py-2 rounded-md text-sm font-semibold"
          >
            Resolve
          </button>
        </div>
      )}
      {error && <div className="text-red-400 text-sm">{error}</div>}
    </div>
  );
}
