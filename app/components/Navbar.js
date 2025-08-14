"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { apiFetch } from "@/lib/clientApi";
import { Inter } from "next/font/google";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

const font = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const NAV_LINKS_BASE = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/orders", label: "My Orders", auth: true },
  { href: "/messages", label: "Messages", auth: true },
];

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let unsubConv = () => {};
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
        // Listen to conversations for unread count
        try {
          if (unsubConv) unsubConv();
          const q = query(
            collection(db, "conversations"),
            where("participants", "array-contains", u.uid)
          );
          unsubConv = onSnapshot(q, (snap) => {
            let total = 0;
            snap.forEach((doc) => {
              const data = doc.data();
              const c = data?.unreadCount?.[u.uid] || 0;
              total += c;
            });
            setUnread(total);
          });
        } catch {}
      } else setProfile(null);
    });
    return () => {
      unsub();
      if (unsubConv) unsubConv();
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  // Auto close dropdown when hamburger menu opens
  useEffect(() => {
    if (menuOpen) setDropdownOpen(false);
  }, [menuOpen]);

  // Auto close hamburger when dropdown opens
  useEffect(() => {
    if (dropdownOpen) setMenuOpen(false);
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
    "after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-0 after:bg-cyan-500 hover:after:w-full after:transition-all after:duration-300";

  const navLinks = NAV_LINKS_BASE.filter((l) => !l.auth || user);

  return (
    <header
      className={`sticky top-0 z-50 shadow-md shadow-black/30 bg-[#10151f] supports-[backdrop-filter]:bg-[#10151f] ${font.className}`}
    >
      <nav className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="flex h-16 items-center gap-6">
          {/* Brand */}
          <Link
            href="/"
            className="relative font-semibold text-lg tracking-tight text-white hover:text-cyan-400 transition"
          >
            PredictX
          </Link>
          {/* Desktop Nav */}
          <ul className="hidden md:flex flex-1 items-center justify-center gap-10 text-sm font-medium">
            {navLinks.map((l) => (
              <li key={l.href} className="relative">
                <Link
                  href={l.href}
                  className={`relative pb-1 text-neutral-300 hover:text-cyan-400 transition ${accentUnderline} ${
                    active(l.href) ? "after:w-full text-cyan-400" : ""
                  }`}
                >
                  {l.label}
                </Link>
                {l.href === "/messages" && user && unread > 0 && (
                  <span className="absolute -right-3 -top-2 text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-600 text-white shadow">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </li>
            ))}
            {user && (
              <li>
                <Link
                  href="/admin/events/new"
                  className="inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold text-white bg-cyan-700 hover:bg-cyan-800 transition shadow"
                >
                  Add Event
                </Link>
              </li>
            )}
          </ul>
          {/* Right Section */}
          <div className="ml-auto hidden md:flex items-center gap-4">
            {!user && (
              <>
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold text-white bg-[#0a3d62] hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-[#10151f] transition shadow"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold text-white bg-[#7b1113] hover:bg-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:ring-offset-[#10151f] transition shadow"
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
                  className="group flex items-center gap-2 rounded-full pl-1 pr-3 h-9 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-cyan-800 transition"
                >
                  <Avatar user={user} />
                  {profile?.role === "admin" && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-cyan-900/30 text-cyan-300 border border-cyan-800/30">
                      ADM
                    </span>
                  )}
                  <span className="text-xs font-medium text-neutral-300 group-hover:text-cyan-400">
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
                  <div className="absolute right-0 mt-2 w-44 rounded-lg border border-neutral-700 bg-[#10151f] shadow-lg shadow-black/40 overflow-hidden animate-[fadeSlide_.3s_cubic-bezier(.4,0,.2,1)]">
                    <div className="px-4 py-2 text-[10px] uppercase tracking-wide text-neutral-500">
                      Account
                    </div>
                    {/* No admin panel link */}
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-cyan-400 transition"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => signOut(auth)}
                      className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-neutral-800 hover:text-rose-300 transition"
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
            {user && (
              <div className="flex items-center gap-2">
                <Avatar user={user} />
                <span className="text-xs font-medium text-neutral-300">
                  {user.displayName?.split(" ")[0] || "User"}
                </span>
              </div>
            )}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              className="relative h-9 w-9 flex flex-col items-center justify-center gap-1.5 rounded-md border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 transition"
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
          menuOpen ? "max-h-[520px]" : "max-h-0"
        }`}
      >
        <div className="px-4 pb-6 pt-2 border-t border-neutral-800 bg-[#10151f] flex flex-col gap-4">
          <ul className="flex flex-col gap-1 text-sm font-medium">
            {navLinks.map((l) => (
              <li key={l.href} className="relative">
                <Link
                  href={l.href}
                  className={`block px-3 py-2 rounded-md hover:bg-neutral-800 transition ${
                    active(l.href)
                      ? "text-cyan-400 bg-neutral-900"
                      : "text-neutral-300"
                  }`}
                >
                  {l.label}
                </Link>
                {l.href === "/messages" && user && unread > 0 && (
                  <span className="absolute right-2 top-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-600 text-white shadow">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </li>
            ))}
          </ul>
          {!user ? (
            <div className="flex flex-col gap-2 pt-2">
              <Link
                href="/auth/signin"
                className="w-full text-center rounded-full px-4 py-2 text-xs font-semibold text-white bg-[#0a3d62] hover:bg-cyan-700"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="w-full text-center rounded-full px-4 py-2 text-xs font-semibold text-white bg-[#7b1113] hover:bg-rose-800"
              >
                Sign Up
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-1 pt-2 border-t border-neutral-800 mt-2">
              <Link
                href="/profile"
                className="px-3 py-2 rounded-md text-sm text-neutral-300 hover:bg-neutral-800 hover:text-cyan-400 transition"
              >
                Profile
              </Link>
              <button
                onClick={() => signOut(auth)}
                className="text-left px-3 py-2 rounded-md text-sm text-rose-400 hover:text-rose-300 hover:bg-neutral-800 transition"
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
    <div className="h-7 w-7 rounded-full grid place-items-center text-[11px] font-semibold bg-[#0a3d62] text-white border border-cyan-800">
      {letter}
    </div>
  );
}
