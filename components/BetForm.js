"use client";
import { useState, useMemo } from "react";
import { apiFetch } from "@/lib/clientApi";
import { useToast } from "./ToastProvider";

// Lightweight odds helper (placeholder) – in future pass event stakes for live implied probability
function impliedReturn(stake) {
  const n = Number(stake) || 0;
  return (n * 1.92).toFixed(2); // flat house edge assumption
}

export default function BetForm({ eventId, onPlaced }) {
  const [side, setSide] = useState("yes");
  const [stake, setStake] = useState("10");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { push } = useToast();

  const potential = useMemo(() => impliedReturn(stake), [stake]);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const n = Number(stake);
      if (!Number.isFinite(n) || n <= 0) {
        setError("Stake must be > 0");
        return;
      }
      await apiFetch(`/api/events/${eventId}/bets`, {
        method: "POST",
        body: JSON.stringify({ side, stake: n }),
      });
      setStake("");
      onPlaced?.();
      push(`${side.toUpperCase()} bet placed`, "info");
    } catch (e) {
      setError(e.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 p-4 flex flex-col gap-4 shadow-lg"
    >
      <div className="flex flex-col gap-4">
        <div className="inline-flex self-center p-1 rounded-lg bg-neutral-800 border border-neutral-700 mb-2">
          {["yes", "no"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSide(s)}
              className={`relative px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                side === s
                  ? s === "yes"
                    ? "bg-[#0a3d62] text-white shadow"
                    : "bg-[#7b1113] text-white shadow"
                  : "text-neutral-400 hover:text-white"
              }`}
              style={{ zIndex: 1 }}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <div className="relative">
            <input
              type="number"
              min="1"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              placeholder="Stake"
              className="w-full peer bg-neutral-900 border border-neutral-700 rounded-md px-3 py-3 text-base text-white focus:outline-none focus:border-cyan-500 placeholder:text-neutral-500"
            />
            <span className="pointer-events-none absolute -top-2 left-2 bg-neutral-900 px-1 text-[11px] font-medium text-cyan-500">
              AMOUNT
            </span>
          </div>
          <button
            disabled={loading}
            className="rounded-md px-5 py-3 text-base font-semibold text-white bg-cyan-700 hover:bg-cyan-600 disabled:opacity-60 shadow-md transition"
          >
            {loading ? "Placing..." : "Place Bet"}
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] sm:text-xs font-medium text-neutral-400 mt-2">
        <span className="inline-flex items-center gap-1 uppercase tracking-wide">
          Side:{" "}
          <strong
            className={side === "yes" ? "text-cyan-400" : "text-rose-400"}
          >
            {side}
          </strong>
        </span>
        <span className="inline-flex items-center gap-1">
          Potential Return{" "}
          <strong className="text-cyan-400">{potential}</strong>
        </span>
        {error && <span className="text-red-400">{error}</span>}
      </div>
    </form>
  );
}
