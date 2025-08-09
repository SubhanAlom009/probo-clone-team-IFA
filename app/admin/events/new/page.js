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
  if (profile?.role !== "admin") return <div>Admin only.</div>;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Create Event</h1>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Closes At (optional)
          </label>
          <input
            type="datetime-local"
            value={closesAt}
            onChange={(e) => setClosesAt(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm"
          />
        </div>
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <button className="bg-indigo-600 hover:bg-indigo-500 px-5 py-2 rounded-md text-sm font-semibold">
          Create
        </button>
      </form>
    </div>
  );
}
