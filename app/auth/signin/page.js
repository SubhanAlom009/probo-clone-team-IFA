"use client";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { push: pushToast } = useToast();

  async function handleGoogle() {
    setError("");
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      pushToast("Signed in!", "success");
      router.push("/profile");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  async function handleEmail(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      pushToast("Signed in!", "success");
      router.push("/profile");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 relative overflow-hidden">
      {/* Left Form Panel */}
      <div className="relative flex items-center justify-center px-6 py-12 md:py-0 bg-[var(--c-base-900)]">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[var(--c-accent-blue)] to-[var(--c-accent-pink)] bg-clip-text text-transparent">
            Welcome back
          </h1>
          <p className="text-sm text-[var(--c-text-secondary)] mb-8">
            Sign in to continue predicting markets.
          </p>
          {error && (
            <div className="text-[var(--c-error)] text-xs mb-4 bg-[var(--c-base-800)] border border-[var(--c-error)]/30 rounded px-3 py-2">
              {error}
            </div>
          )}
          <form onSubmit={handleEmail} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium tracking-wide text-[var(--c-text-secondary)]">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
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
                  autoComplete="current-password"
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
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <div className="mt-6 mb-4 flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--c-border)]" />
            <span className="text-[10px] uppercase tracking-wider text-[var(--c-text-faint)]">
              or
            </span>
            <div className="flex-1 h-px bg-[var(--c-border)]" />
          </div>
          <button
            onClick={handleGoogle}
            className="ui-btn outline w-full justify-center text-[var(--c-accent-blue)]"
          >
            Google Sign In
          </button>
          <p className="mt-6 text-xs text-[var(--c-text-secondary)]">
            No account?{" "}
            <Link
              href="/auth/signup"
              className="text-[var(--c-accent-blue)] hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
      {/* Right Visual Panel */}
      <SignupSigninShowcase mode="signin" />
    </div>
  );
}

function SignupSigninShowcase({ mode }) {
  // Mode can adapt copy if needed
  return (
    <div className="hidden md:block relative overflow-hidden bg-[#0f1422]">
      {/* Animated gradient mesh */}
      <div className="absolute inset-0 opacity-70 mix-blend-screen" aria-hidden>
        <div className="absolute inset-0 animate-[pulseMesh_14s_ease-in-out_infinite] bg-[radial-gradient(circle_at_20%_30%,#6366f166,transparent_60%),radial-gradient(circle_at_80%_65%,#ec489966,transparent_55%),radial-gradient(circle_at_50%_80%,#8b5cf64d,transparent_60%)]" />
      </div>
      {/* Subtle grain */}
      <div
        className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg,rgba(255,255,255,0.15)_0_2px,transparent_2px_6px)",
        }}
        aria-hidden
      />
      {/* Glow rings */}
      <div
        className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-br from-[#3b82f6]/25 to-transparent blur-3xl"
        aria-hidden
      />
      <div
        className="absolute bottom-[-120px] right-[-120px] w-[420px] h-[420px] rounded-full bg-gradient-to-tr from-[#ec4899]/25 to-transparent blur-3xl"
        aria-hidden
      />
      {/* Content */}
      <div className="relative h-full w-full flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-4xl font-bold mb-6 leading-tight">
          <span className="bg-gradient-to-r from-[#3b82f6] via-[#6366f1] to-[#ec4899] bg-clip-text text-transparent">
            Predict • Learn • Win
          </span>
        </h2>
        <RotatingLines />
        <FeatureBullets />
      </div>
      <style jsx>{`
        @keyframes pulseMesh {
          0%,
          100% {
            filter: hue-rotate(0deg) brightness(1);
          }
          50% {
            filter: hue-rotate(40deg) brightness(1.15);
          }
        }
      `}</style>
    </div>
  );
}

function RotatingLines() {
  const messages = [
    "Markets update in real time as sentiment shifts.",
    "Transparent odds — see aggregated YES/NO stakes.",
    "Sharpen your forecasting skill through feedback.",
    "A sandbox to practice probabilistic thinking.",
  ];
  const [idx, setIdx] = useState(0);
  // cycle
  React.useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % messages.length), 3800);
    return () => clearInterval(t);
  }, [messages.length]);
  return (
    <div className="relative h-14 w-full max-w-md mb-6">
      {messages.map((m, i) => (
        <div
          key={i}
          className={`absolute inset-0 px-4 flex items-center justify-center text-sm leading-relaxed text-slate-300 transition-all duration-700 ${
            i === idx ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {m}
        </div>
      ))}
    </div>
  );
}

function FeatureBullets() {
  const feats = [
    {
      title: "Virtual Economy",
      desc: "Start with free coins — manage risk & compounding returns.",
    },
    {
      title: "Frictionless Bets",
      desc: "Place a position in under two seconds with keyboard nav.",
    },
    {
      title: "Outcome Resolution",
      desc: "Admins resolve events quickly & transparently.",
    },
  ];
  return (
    <ul className="mt-2 space-y-3 w-full max-w-sm text-left">
      {feats.map((f) => (
        <li key={f.title} className="group relative pl-4">
          <span className="absolute left-0 top-2 h-2 w-2 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#ec4899] group-hover:scale-125 transition" />
          <div className="text-[13px] font-semibold text-slate-200">
            {f.title}
          </div>
          <div className="text-[11px] text-slate-400 leading-relaxed">
            {f.desc}
          </div>
        </li>
      ))}
    </ul>
  );
}
