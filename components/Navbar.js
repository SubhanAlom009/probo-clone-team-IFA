"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { apiFetch } from "@/lib/clientApi";
import { Inter } from "next/font/google";

const font = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const NAV_LINKS_BASE = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const p = await apiFetch("/api/users/me");
          setProfile(p);
        } catch {}
        // DEV: Log Firebase ID token for API use
        u.getIdToken().then((token) => {
          console.log("[Firebase ID Token]", token);
        });
      } else setProfile(null);
    });
    return () => unsub();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    }
    if (dropdownOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  // Auto close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function active(href) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const accentUnderline =
    "after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-0 after:bg-gradient-to-r after:from-[#3b82f6] after:to-[#ef4444] hover:after:w-full after:transition-all after:duration-300";

  const navLinks =
    profile?.role === "admin"
      ? [...NAV_LINKS_BASE, { href: "/admin/users", label: "Admin" }]
      : NAV_LINKS_BASE;

  return (
    <header
      className={`sticky top-0 z-50 shadow-md shadow-black/30 bg-[#0f172a]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0f172a]/80 ${font.className}`}
    >
      <nav className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="flex h-16 items-center gap-6">
          {/* Brand */}
          <Link
            href="/"
            className="relative font-semibold text-lg tracking-tight group"
          >
            <span className="bg-gradient-to-r from-[#3b82f6] via-[#6366f1] to-[#ef4444] bg-clip-text text-transparent">
              PredictX
            </span>
            <span className="absolute -inset-x-2 -inset-y-1 scale-95 opacity-0 rounded-lg bg-gradient-to-r from-[#3b82f6]/10 via-transparent to-[#ef4444]/10 blur-lg transition group-hover:opacity-100" />
          </Link>
          {/* Desktop Nav */}
          <ul className="hidden md:flex flex-1 items-center justify-center gap-10 text-sm font-medium">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`relative pb-1 text-slate-300 hover:text-white transition ${accentUnderline} ${
                    active(l.href) ? "after:w-full text-white" : ""
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          {/* Right Section */}
          <div className="ml-auto hidden md:flex items-center gap-4">
            {!user && (
              <>
                <Link
                  href="/auth/signin"
                  className="relative inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#3b82f6] to-[#6366f1] hover:from-[#2563eb] hover:to-[#4f46e5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3b82f6] focus:ring-offset-[#0f172a] transition shadow"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="relative inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#ef4444] to-[#f97316] hover:from-[#dc2626] hover:to-[#ea580c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ef4444] focus:ring-offset-[#0f172a] transition shadow"
                >
                  Sign Up
                </Link>
              </>
            )}
            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={dropdownOpen}
                  className="group flex items-center gap-2 rounded-full pl-1 pr-3 h-9 bg-slate-800/70 hover:bg-slate-700/70 border border-slate-700/60 hover:border-slate-600 transition"
                >
                  <Avatar user={user} />
                  {profile?.role === "admin" && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-600/30 text-indigo-300 border border-indigo-500/30">
                      ADM
                    </span>
                  )}
                  <span className="text-xs font-medium text-slate-300 group-hover:text-white">
                    {user.displayName?.split(" ")[0] || "User"}
                  </span>
                  <svg
                    className={`w-3 h-3 text-slate-400 transition-transform ${
                      dropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 9l6 6 6-6"
                    />
                  </svg>
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-lg border border-slate-700/70 bg-[#0f172a] shadow-lg shadow-black/40 overflow-hidden animate-[fadeSlide_.3s_cubic-bezier(.4,0,.2,1)]">
                    <div className="px-4 py-2 text-[10px] uppercase tracking-wide text-slate-500">
                      Account
                    </div>
                    {profile?.role === "admin" && (
                      <Link
                        href="/admin/users"
                        className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800/80 hover:text-white transition"
                      >
                        Admin
                      </Link>
                    )}
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800/80 hover:text-white transition"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => signOut(auth)}
                      className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-slate-800/80 hover:text-rose-300 transition"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Mobile Controls */}
          <div className="md:hidden ml-auto flex items-center gap-3">
            {user ? (
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="relative rounded-full h-9 w-9 bg-slate-800/70 border border-slate-700/70 flex items-center justify-center overflow-hidden"
                aria-label="User menu"
                aria-expanded={dropdownOpen}
              >
                <Avatar user={user} />
              </button>
            ) : (
              <Link
                href="/auth/signin"
                className="text-xs font-medium px-3 py-1.5 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#6366f1] text-white"
              >
                Sign In
              </Link>
            )}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              className="relative h-9 w-9 flex flex-col items-center justify-center gap-1.5 rounded-md border border-slate-700/70 bg-slate-800/60 hover:bg-slate-700/60 transition"
            >
              <span
                className={`h-0.5 w-5 rounded-full bg-slate-300 transition ${
                  menuOpen ? "translate-y-2 rotate-45" : ""
                }`}
              ></span>
              <span
                className={`h-0.5 w-5 rounded-full bg-slate-300 transition ${
                  menuOpen ? "opacity-0" : ""
                }`}
              ></span>
              <span
                className={`h-0.5 w-5 rounded-full bg-slate-300 transition ${
                  menuOpen ? "-translate-y-2 -rotate-45" : ""
                }`}
              ></span>
            </button>
          </div>
        </div>
      </nav>
      {/* Mobile Menu Panel */}
      <div
        className={`md:hidden overflow-hidden transition-[max-height] duration-500 ${
          menuOpen ? "max-h-[420px]" : "max-h-0"
        }`}
      >
        <div className="px-4 pb-6 pt-2 border-t border-slate-800/70 bg-[#0f172a]/95 backdrop-blur flex flex-col gap-4">
          <ul className="flex flex-col gap-1 text-sm font-medium">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`block px-3 py-2 rounded-md hover:bg-slate-800/60 transition ${
                    active(l.href)
                      ? "text-white bg-slate-800/70"
                      : "text-slate-300"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          {!user && (
            <div className="flex gap-2 pt-2">
              <Link
                href="/auth/signin"
                className="flex-1 text-center rounded-full px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#3b82f6] to-[#6366f1]"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="flex-1 text-center rounded-full px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#ef4444] to-[#f97316]"
              >
                Sign Up
              </Link>
            </div>
          )}
          {user && dropdownOpen && (
            <div className="flex flex-col gap-1 pt-2 border-t border-slate-800/70 mt-2">
              {profile?.role === "admin" && (
                <Link
                  href="/admin/users"
                  className="px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-slate-800/60 hover:text-white transition"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/profile"
                className="px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-slate-800/60 hover:text-white transition"
              >
                Profile
              </Link>
              <button
                onClick={() => signOut(auth)}
                className="text-left px-3 py-2 rounded-md text-sm text-rose-400 hover:text-rose-300 hover:bg-slate-800/60 transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
      <style jsx global>{`
        @keyframes fadeSlide {
          0% {
            opacity: 0;
            transform: translateY(6px) scale(0.97);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </header>
  );
}

function Avatar({ user }) {
  const src = user?.photoURL;
  if (src)
    return (
      <Image
        src={src}
        alt="avatar"
        width={28}
        height={28}
        className="h-7 w-7 rounded-full object-cover"
      />
    );
  const letter = (user?.displayName?.[0] || "U").toUpperCase();
  return (
    <div className="h-7 w-7 rounded-full grid place-items-center text-[11px] font-semibold bg-gradient-to-br from-[#3b82f6] to-[#ef4444] text-white">
      {letter}
    </div>
  );
}
