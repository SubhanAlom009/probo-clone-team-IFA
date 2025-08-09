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
      className="group relative overflow-hidden rounded-xl border border-[var(--c-border)] bg-gradient-to-br from-[var(--c-base-800)] via-[var(--c-base-900)] to-[#0c1018] p-4 flex flex-col gap-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4)]"
    >
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.06),transparent_60%)]" />
      <div className="flex items-center gap-3">
        <div className="inline-flex p-1 rounded-lg bg-[var(--c-base-700)] border border-[var(--c-border)]">
          {["yes", "no"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSide(s)}
              className={`relative px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
                side === s
                  ? "text-white"
                  : "text-[var(--c-text-secondary)] hover:text-[var(--c-text-primary)]"
              }`}
            >
              <span className="relative z-10">{s.toUpperCase()}</span>
              {side === s && (
                <span className="absolute inset-0 rounded-md bg-gradient-to-r from-[var(--accent-primary,#2563EB)] to-[var(--accent-secondary,#EC4899)] shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset]" />
              )}
            </button>
          ))}
        </div>
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="number"
              min="1"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              placeholder="Stake"
              className="w-full peer bg-[var(--c-base-900)]/70 border border-[var(--c-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent-primary)] placeholder:text-[var(--c-text-tertiary)]"
            />
            <span className="pointer-events-none absolute -top-2 left-2 bg-[var(--c-base-900)] px-1 text-[10px] font-medium text-[var(--accent-primary)]">
              AMOUNT
            </span>
          </div>
          <button
            disabled={loading}
            className="relative overflow-hidden rounded-md px-5 py-2 text-sm font-semibold text-white bg-gradient-to-br from-[var(--accent-primary,#2563EB)] via-[var(--accent-secondary,#EC4899)] to-[var(--accent-primary,#2563EB)] bg-[length:200%_200%] animate-[gradientMove_6s_linear_infinite] disabled:opacity-60"
          >
            <span className="relative z-10">
              {loading ? "Placing..." : "Place Bet"}
            </span>
            <span className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition" />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] sm:text-xs font-medium text-[var(--c-text-tertiary)]">
        <span className="inline-flex items-center gap-1 uppercase tracking-wide">
          Side:{" "}
          <strong className="text-[var(--accent-secondary)] font-semibold">
            {side}
          </strong>
        </span>
        <span className="inline-flex items-center gap-1">
          Potential Return{" "}
          <strong className="text-[var(--accent-primary)]">{potential}</strong>
        </span>
        {error && <span className="text-red-400">{error}</span>}
      </div>
      <style jsx>{`
        @keyframes gradientMove {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </form>
  );
}
