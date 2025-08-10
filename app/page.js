"use client";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { apiFetch } from "@/lib/clientApi";
import { Montserrat } from "next/font/google";

const displayFont = Montserrat({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

export default function Home() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await apiFetch("/api/events");
        if (mounted) setEvents(data.slice(0, 6));
      } catch {
      } finally {
        if (mounted) setLoadingEvents(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-neutral-950 text-white">
      <Hero user={user} />
      <FeaturedSection events={events} loading={loadingEvents} />
      <HowItWorks />
      <SiteFooter />
    </div>
  );
}

function Hero({ user }) {
  return (
    <section className="flex flex-col justify-center pt-24 md:pt-32 pb-20 bg-neutral-950 border-b border-neutral-900">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <h1
          className={`${displayFont.className} text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-white mb-4`}
        >
          Predict the Future.{" "}
          <span className="inline-block text-cyan-400">Win Big.</span>
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-neutral-300 leading-relaxed font-medium">
          Stake virtual coins on real outcomes and learn from collective
          intelligence in live markets.
        </p>
        <div className="mt-8 flex flex-wrap gap-4 justify-center items-center">
          <Link
            href="/events"
            className="inline-flex items-center rounded-full px-8 py-3 text-sm font-semibold text-white bg-[#0a3d62] hover:bg-[#0891b2] focus:outline-none focus:ring-2 focus:ring-cyan-500 transition shadow-md"
          >
            Get Started
            <svg
              className="ml-2 w-4 h-4"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 12h14M13 5l7 7-7 7"
              />
            </svg>
          </Link>
          {!user && (
            <Link
              href="/auth/signup"
              className="inline-flex items-center rounded-full px-7 py-3 text-sm font-semibold border border-neutral-700 text-white hover:bg-neutral-900 transition"
            >
              Join Now
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function FeaturedSection({ events, loading }) {
  return (
    <section className="relative z-10 px-4 pb-20 -mt-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Featured Events
          </h2>
          <Link
            href="/events"
            className="text-xs font-semibold text-cyan-400 hover:underline"
          >
            View All →
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-40 rounded-xl bg-neutral-800 border border-neutral-700 animate-pulse"
              />
            ))}
          {!loading && events.map((ev) => <EventCard key={ev.id} ev={ev} />)}
          {!loading && events.length === 0 && (
            <div className="col-span-full text-sm text-neutral-500">
              No events yet. Seed some markets to get started.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function EventCard({ ev }) {
  const yes = ev.yesStake || 0;
  const no = ev.noStake || 0;
  const total = yes + no;
  const yesProb = total > 0 ? yes / total : 0.5;
  const noProb = 1 - yesProb;
  // Calculate dynamic prices based on probabilities (match events page)
  const yesPrice = (yesProb * 10).toFixed(0);
  const noPrice = (noProb * 10).toFixed(0);

  return (
    <Link href={`/events/${ev.id}`}>
      <div className="bg-[#1c1c1c] rounded-lg shadow-md p-5 flex flex-col justify-between cursor-pointer hover:shadow-lg transition-shadow">
        {/* Main Section */}
        <div className="flex flex-col mb-4">
          <h2 className="font-bold text-lg mb-2 text-white">{ev.title}</h2>
          <p
            className="text-[#a0a0a0] text-sm truncate"
            title={ev.description || "No description available."}
          >
            {ev.description && ev.description.length > 80
              ? ev.description.slice(0, 80) + "..."
              : ev.description || "No description available."}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button className="flex-1 bg-[#0a3d62] text-white font-bold py-2 rounded hover:brightness-110">
            Yes ₹{yesPrice}
          </button>
          <button className="flex-1 bg-[#7b1113] text-white font-bold py-2 rounded hover:brightness-110">
            No ₹{noPrice}
          </button>
        </div>
      </div>
    </Link>
  );
}

function Dot({ color }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full"
      style={{ background: color }}
    />
  );
}

function HowItWorks() {
  const steps = useMemo(
    () => [
      {
        icon: GearIcon,
        title: "Create or Join",
        desc: "Browse live events and pick a side — YES or NO.",
      },
      {
        icon: PulseIcon,
        title: "Shift Probabilities",
        desc: "Your stake instantly moves the market odds live.",
      },
      {
        icon: TrophyIcon,
        title: "Outcomes Resolve",
        desc: "When an event settles, winners receive proportional rewards.",
      },
    ],
    []
  );
  return (
    <section className="relative z-10 px-4 pb-28 pt-10">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold mb-10 text-white tracking-tight">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <StepCard key={s.title} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({ icon: Icon, title, desc }) {
  return (
    <div className="relative group rounded-2xl p-6 bg-neutral-900 border border-neutral-800 hover:border-cyan-800 transition">
      <div className="relative flex flex-col gap-4">
        <div className="h-12 w-12 rounded-xl bg-neutral-800 border border-cyan-900 grid place-items-center shadow-lg">
          <Icon className="w-6 h-6 text-cyan-400" />
        </div>
        <h3 className="text-sm font-semibold text-white tracking-wide">
          {title}
        </h3>
        <p className="text-xs leading-relaxed text-neutral-400">{desc}</p>
      </div>
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-slate-800/60 bg-[#0b0f19]/70 backdrop-blur px-4 py-12 text-slate-400 text-xs">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-10 md:gap-16">
        <div className="flex-1">
          <div className="text-sm font-semibold text-white mb-3">PredictX</div>
          <p className="max-w-xs leading-relaxed">
            Futuristic virtual prediction exchange. Sharpen your forecasting
            skill and learn from collective intelligence.
          </p>
          <div className="mt-4 flex gap-3">
            <SocialIcon
              href="https://twitter.com"
              label="Twitter"
              svg={
                <path d="M19.633 7.997c.013.18.013.36.013.54 0 5.49-4.18 11.82-11.82 11.82-2.35 0-4.53-.69-6.37-1.88.33.04.65.05.99.05 1.94 0 3.72-.66 5.14-1.78a4.17 4.17 0 01-3.89-2.89c.25.04.5.07.77.07.37 0 .73-.05 1.07-.14a4.16 4.16 0 01-3.34-4.08v-.05c.56.31 1.21.5 1.9.52a4.15 4.15 0 01-1.85-3.45c0-.76.2-1.47.56-2.08a11.8 11.8 0 008.57 4.35 4.69 4.69 0 01-.1-.95 4.16 4.16 0 014.16-4.16c1.2 0 2.29.5 3.05 1.3a8.18 8.18 0 002.64-1.01 4.13 4.13 0 01-1.83 2.3 8.3 8.3 0 002.39-.64 8.94 8.94 0 01-2.08 2.14z" />
              }
            />
            <SocialIcon
              href="https://github.com"
              label="GitHub"
              svg={
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.48 2 2 6.58 2 12.26c0 4.5 2.87 8.32 6.84 9.67.5.1.68-.22.68-.48 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.9 1.57 2.36 1.12 2.94.85.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.09 0-1.13.39-2.06 1.02-2.78-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.06A9.18 9.18 0 0112 6.84c.85.01 1.71.12 2.51.34 1.9-1.34 2.74-1.06 2.74-1.06.55 1.41.2 2.45.1 2.71.63.72 1.01 1.65 1.01 2.78 0 3.96-2.34 4.82-4.57 5.07.36.32.67.94.67 1.9 0 1.38-.01 2.49-.01 2.83 0 .26.18.58.69.48A10.05 10.05 0 0022 12.26C22 6.58 17.52 2 12 2z"
                />
              }
            />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-[11px]">
          <div>
            <div className="mb-3 font-semibold text-white text-xs">Product</div>
            <ul className="space-y-2">
              <li>
                <Link href="/events" className="hover:text-white transition">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-white transition">
                  Profile
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="mb-3 font-semibold text-white text-xs">Company</div>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:text-white transition">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Careers
                </a>
              </li>
            </ul>
          </div>
          <div>
            <div className="mb-3 font-semibold text-white text-xs">Legal</div>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:text-white transition">
                  Terms
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Privacy
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mt-12 text-[10px] text-slate-500 tracking-wide">
        © {new Date().getFullYear()} PredictX. All rights reserved.
      </div>
    </footer>
  );
}

function SocialIcon({ href, label, svg }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="h-8 w-8 grid place-items-center rounded-full bg-slate-800/70 border border-slate-600/40 hover:border-slate-400/70 text-slate-300 hover:text-white transition"
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
        {svg}
      </svg>
    </a>
  );
}

function AnimatedBackground() {
  return null;
}

function BaseBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 bg-[#0b1018] [background:radial-gradient(circle_at_25%_30%,#0d273233,transparent_60%),radial-gradient(circle_at_80%_70%,#152c4333,transparent_55%)]" />
  );
}

function NoiseLayer() {
  return null;
}

// Inline SVG Icon Components
function GearIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09c.7 0 1.31-.4 1.51-1a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06c.46.46 1.12.6 1.82.33.61-.25 1-.83 1-1.51V3a2 2 0 014 0v.09c0 .7.39 1.26 1 1.51.7.27 1.36.13 1.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06c-.46.46-.6 1.12-.33 1.82.25.6.83 1 1.51 1H21a2 2 0 010 4h-.09c-.7 0-1.26.39-1.51 1z"
      />
    </svg>
  );
}
function PulseIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12h3l2.5 6L13 6l2.5 6H21"
      />
    </svg>
  );
}
function TrophyIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 6H5a2 2 0 00-2 2v1a4 4 0 004 4M17 6h2a2 2 0 012 2v1a4 4 0 01-4 4"
      />
    </svg>
  );
}
