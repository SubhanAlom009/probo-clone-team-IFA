"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/clientApi";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function NewEventPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const p = await apiFetch("/api/users/me");
          setProfile(p);
        } catch (e) {
          setError(e.message);
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    try {
      const body = {
        title,
        description,
        closesAt: closesAt ? new Date(closesAt).toISOString() : null,
      };
      const res = await apiFetch("/api/events", {
        method: "POST",
        body: JSON.stringify(body),
      });
      router.push(`/events/${res.id}`);
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Login required.</div>;

  return (
    <div className="max-w-xl mx-auto mt-10 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-lg p-8">
      <h1 className="text-3xl font-extrabold mb-8 text-white tracking-tight">
        Create New Event
      </h1>
      <form onSubmit={submit} className="space-y-6">
        <div>
          <label className="block text-xs font-semibold mb-2 text-neutral-400 uppercase tracking-wider">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full bg-neutral-950 border border-cyan-800 rounded-lg px-4 py-3 text-base text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-800/30 transition"
            placeholder="e.g. Will Bitcoin close above $70k this week?"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-2 text-neutral-400 uppercase tracking-wider">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full bg-neutral-950 border border-cyan-800 rounded-lg px-4 py-3 text-base text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-800/30 transition"
            placeholder="Describe the event, context, and resolution criteria."
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-2 text-neutral-400 uppercase tracking-wider">
            Closes At{" "}
            <span className="text-neutral-500 font-normal">(optional)</span>
          </label>
          <input
            type="datetime-local"
            value={closesAt}
            onChange={(e) => setClosesAt(e.target.value)}
            className="w-full bg-neutral-950 border border-cyan-800 rounded-lg px-4 py-3 text-base text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-800/30 transition"
          />
        </div>
        {error && (
          <div className="text-red-400 text-sm font-medium">{error}</div>
        )}
        <button className="w-full bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-3 rounded-lg text-base transition shadow-md">
          Create Event
        </button>
      </form>
    </div>
  );
}
