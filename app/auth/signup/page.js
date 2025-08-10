"use client";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { push: pushToast } = useToast();

  async function handleSignup(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      pushToast("Account created!", "success");
      router.push("/profile");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 relative overflow-hidden">
      <div className="relative flex items-center justify-center px-6 py-12 md:py-0 bg-[var(--c-base-900)]">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[var(--c-accent-pink)] to-[var(--c-accent-blue)] bg-clip-text text-transparent">
            Create account
          </h1>
          <p className="text-sm text-[var(--c-text-secondary)] mb-8">
            Join the prediction markets and get 1,000 starter coins.
          </p>
          {error && (
            <div className="text-[var(--c-error)] text-xs mb-4 bg-[var(--c-base-800)] border border-[var(--c-error)]/30 rounded px-3 py-2">
              {error}
            </div>
          )}
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium tracking-wide text-[var(--c-text-secondary)]">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[var(--c-base-800)] border border-[var(--c-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--c-accent-purple)] focus:ring-2 focus:ring-[var(--c-accent-purple)]/40 transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium tracking-wide text-[var(--c-text-secondary)]">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[var(--c-base-800)] border border-[var(--c-border)] rounded-md px-3 py-2 pr-12 text-sm focus:outline-none focus:border-[var(--c-accent-purple)] focus:ring-2 focus:ring-[var(--c-accent-purple)]/40 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute top-0 right-0 h-full px-3 text-[10px] tracking-wide text-[var(--c-text-faint)] hover:text-[var(--c-text-secondary)]"
                >
                  {showPass ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>
            <button
              disabled={loading}
              type="submit"
              className="ui-btn w-full justify-center disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>
          <p className="mt-6 text-xs text-[var(--c-text-secondary)]">
            Already have an account?{" "}
            <Link
              href="/auth/signin"
              className="text-[var(--c-accent-blue)] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
      <SignupShowcase />
    </div>
  );
}

function SignupShowcase() {
  return (
    <div className="hidden md:block relative overflow-hidden bg-[#101727]">
      <div className="absolute inset-0 opacity-70 mix-blend-screen" aria-hidden>
        <div className="absolute inset-0 animate-[pulseMesh_16s_ease-in-out_infinite] bg-[radial-gradient(circle_at_25%_25%,#ec489980,transparent_60%),radial-gradient(circle_at_80%_55%,#6366f180,transparent_55%),radial-gradient(circle_at_55%_80%,#2563eb66,transparent_60%)]" />
      </div>
      <div
        className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(60deg,rgba(255,255,255,0.18)_0_2px,transparent_2px_6px)",
        }}
        aria-hidden
      />
      <div
        className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-[#ec4899]/30 to-transparent blur-3xl"
        aria-hidden
      />
      <div
        className="absolute bottom-[-120px] left-[-120px] w-[420px] h-[420px] rounded-full bg-gradient-to-tr from-[#6366f1]/25 to-transparent blur-3xl"
        aria-hidden
      />
      <div className="relative h-full w-full flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-4xl font-bold mb-6 leading-tight">
          <span className="bg-gradient-to-r from-[#ec4899] via-[#f97316] to-[#3b82f6] bg-clip-text text-transparent">
            Shape the Odds
          </span>
        </h2>
        <RotatingLinesSignup />
        <ul className="mt-4 space-y-3 w-full max-w-sm text-left">
          <li className="group relative pl-4">
            <span className="absolute left-0 top-2 h-2 w-2 rounded-full bg-gradient-to-r from-[#ec4899] to-[#3b82f6] group-hover:scale-125 transition" />
            <div className="text-[13px] font-semibold text-slate-200">
              Level Up
            </div>
            <div className="text-[11px] text-slate-400 leading-relaxed">
              Earn reputation as your predictions trend accurate over time.
            </div>
          </li>
          <li className="group relative pl-4">
            <span className="absolute left-0 top-2 h-2 w-2 rounded-full bg-gradient-to-r from-[#ec4899] to-[#3b82f6] group-hover:scale-125 transition" />
            <div className="text-[13px] font-semibold text-slate-200">
              Diverse Categories
            </div>
            <div className="text-[11px] text-slate-400 leading-relaxed">
              Tech launches, macro moves, sports outcomes & cultural moments.
            </div>
          </li>
          <li className="group relative pl-4">
            <span className="absolute left-0 top-2 h-2 w-2 rounded-full bg-gradient-to-r from-[#ec4899] to-[#3b82f6] group-hover:scale-125 transition" />
            <div className="text-[13px] font-semibold text-slate-200">
              Fast Resolution
            </div>
            <div className="text-[11px] text-slate-400 leading-relaxed">
              Clear criteria & admin tools mean quick settlement cycles.
            </div>
          </li>
        </ul>
      </div>
      <style jsx>{`
        @keyframes pulseMesh {
          0%,
          100% {
            filter: hue-rotate(0deg) brightness(1);
          }
          50% {
            filter: hue-rotate(-35deg) brightness(1.18);
          }
        }
      `}</style>
    </div>
  );
}

function RotatingLinesSignup() {
  const lines = [
    "Launch with 1,000 starter coins — risk wisely.",
    "Refine intuition by tracking your performance.",
    "Crowd wisdom surfaces probabilistic signals.",
    "Explore & bet in under two clicks.",
  ];
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % lines.length), 3600);
    return () => clearInterval(t);
  }, [lines.length]);
  return (
    <div className="relative h-14 w-full max-w-md mb-4">
      {lines.map((l, i) => (
        <div
          key={i}
          className={`absolute inset-0 px-4 flex items-center justify-center text-sm leading-relaxed text-slate-300 transition-all duration-700 ${
            i === idx ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {l}
        </div>
      ))}
    </div>
  );
}
