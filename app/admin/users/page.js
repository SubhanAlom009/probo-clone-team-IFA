"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/clientApi";

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState([]);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setLoading(true);
      const list = await apiFetch("/api/admin/users");
      setPending(list);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id) {
    try {
      await apiFetch("/api/role/approve", {
        method: "POST",
        body: JSON.stringify({ userId: id }),
      });
      setPending((p) => p.filter((u) => u.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pending Upgrades</h1>
        <p className="text-neutral-500 text-sm">
          Approve user requests to grant admin role.
        </p>
      </div>
      {loading && <div className="text-sm text-neutral-500">Loading...</div>}
      {error && <div className="text-sm text-red-400">{error}</div>}
      {!loading && !pending.length && (
        <div className="text-sm text-neutral-500">No pending requests.</div>
      )}
      <div className="space-y-3">
        {pending.map((u) => (
          <div
            key={u.id}
            className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded px-4 py-3"
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {u.displayName || u.id}
              </span>
              <span className="text-[11px] text-neutral-500">{u.id}</span>
            </div>
            <button
              onClick={() => approve(u.id)}
              className="ui-btn text-xs px-3 py-1"
            >
              Approve
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
