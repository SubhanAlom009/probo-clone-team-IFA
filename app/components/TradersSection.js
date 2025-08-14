"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  Users,
  MessageCircle,
  User,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function TradersSection({ eventId }) {
  const router = useRouter();
  const [traders, setTraders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [hoveredTrader, setHoveredTrader] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const hasLoadedRef = useRef(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const fetchTraders = useCallback(async () => {
    if (!user) {
      setError("Authentication required");
      setLoading(false);
      return;
    }
    try {
      // Don't show loading spinner if we already have data (for real-time updates)
      if (!hasLoadedRef.current) {
        setLoading(true);
      } else {
        setUpdating(true);
      }
      setError(null);
      const token = await user.getIdToken();
      const response = await fetch(`/api/events/${eventId}/traders`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Failed to fetch traders");
      const data = await response.json();
      setTraders(data);
      hasLoadedRef.current = true;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setUpdating(false);
    }
  }, [eventId, user]);

  useEffect(() => {
    if (eventId && user && !authLoading) fetchTraders();
  }, [eventId, user, authLoading, fetchTraders]);

  // Optional: react to localStorage flag set by BetForm on successful bet to refresh immediately
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "betPlacedEventId" && e.newValue === eventId) {
        fetchTraders();
        localStorage.removeItem("betPlacedEventId");
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [eventId, fetchTraders]);

  // Realtime updates: listen to matched bets for this event and refresh list
  useEffect(() => {
    if (!eventId || !user || authLoading) return;

    const q = query(collection(db, "bets"), where("eventId", "==", eventId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Refresh traders on changes - debounce by short timeout to avoid rapid re-fetches
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          fetchTraders();
        }, 150);
      },
      (error) => {
        console.error("Error listening to bets:", error);
      }
    );

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      unsubscribe();
    };
    // intentionally omitting 'traders' from deps to avoid fetch loops
  }, [eventId, user, authLoading, fetchTraders]);

  // Backup: periodic refresh every 30 seconds
  useEffect(() => {
    if (!eventId || !user || authLoading) return;

    const interval = setInterval(fetchTraders, 30000);

    return () => clearInterval(interval);
  }, [eventId, user, authLoading, fetchTraders]);

  const handleMessageTrader = async (trader) => {
    try {
      if (!user) {
        router.push("/auth/signin");
        return;
      }
      if (user?.uid === trader?.id) {
        router.push("/messages");
        return;
      }
      // Optimistically create or bump the conversation before navigating
      const token = await user.getIdToken();
      await fetch("/api/messages/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          otherUserId: trader.id,
          initialMessage: "👋 Hi!",
        }),
      }).catch(() => {});
      router.push(`/messages?u=${encodeURIComponent(trader.id)}`);
    } catch (e) {
      // Fallback hard navigation if soft navigation fails
      window.location.href = `/messages?u=${encodeURIComponent(trader.id)}`;
    }
  };

  const handleViewProfile = (trader) => {
    console.log("View profile:", trader);
  };

  if (authLoading || loading) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Users className="w-5 h-5 text-cyan-400 mr-2" />
          <h3 className="text-lg font-semibold text-white">Active Traders</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          <span className="ml-3 text-neutral-400">
            {authLoading
              ? "Checking auth..."
              : updating
              ? "Updating..."
              : "Loading traders..."}
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Users className="w-5 h-5 text-red-400 mr-2" />
          <h3 className="text-lg font-semibold text-white">Active Traders</h3>
        </div>
        <div className="text-center py-4">
          <p className="text-red-400 mb-2">Failed to load traders</p>
          <button
            onClick={fetchTraders}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!traders || !traders.summary || traders.summary.totalTraders === 0) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Users className="w-5 h-5 text-cyan-400 mr-2" />
          <h3 className="text-lg font-semibold text-white">Active Traders</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-neutral-400">No traders have placed bets yet</p>
        </div>
      </div>
    );
  }

  const getDisplayTraders = () => {
    if (!traders?.traders) return [];
    switch (activeTab) {
      case "yes":
        return traders.traders.yes || [];
      case "no":
        return traders.traders.no || [];
      default:
        return traders.traders.all || [];
    }
  };

  const TraderCard = ({ trader }) => {
    const isMe = user?.uid && trader?.id === user.uid;
    return (
      <div
        className={`relative rounded-lg p-4 transition-colors ${
          isMe
            ? "bg-neutral-800/90 border border-cyan-700"
            : "bg-neutral-800 hover:bg-neutral-750"
        }`}
        onMouseEnter={() => setHoveredTrader(trader.id)}
        onMouseLeave={() => setHoveredTrader(null)}
      >
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-neutral-700">
            {trader.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={trader.avatar}
                alt={trader.displayName || "Trader"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-cyan-600 flex items-center justify-center">
                <span className="text-white font-semibold">
                  {trader.displayName?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
            )}
          </div>

          {/* Trader Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-white truncate flex items-center gap-2">
                {trader.displayName}
                {isMe && (
                  <span className="px-1.5 py-0.5 text-[10px] rounded bg-cyan-900 text-cyan-300 border border-cyan-700">
                    You
                  </span>
                )}
              </h4>
              {trader.isOnline && (
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              )}
            </div>
            <div className="text-xs text-neutral-400 space-y-1">
              <div className="flex items-center space-x-3">
                <span>{trader.totalTrades ?? 0} trades</span>
                <span>{Math.round((trader.winRate ?? 0) * 100)}% win rate</span>
              </div>
              <div className="flex items-center space-x-1">
                {trader?.eventPosition?.position === "YES" ? (
                  <TrendingUp className="w-3 h-3 text-green-400" />
                ) : trader?.eventPosition?.position === "NO" ? (
                  <TrendingDown className="w-3 h-3 text-red-400" />
                ) : null}
                <span
                  className={`font-medium ${
                    trader?.eventPosition?.position === "YES"
                      ? "text-green-400"
                      : trader?.eventPosition?.position === "NO"
                      ? "text-red-400"
                      : "text-neutral-400"
                  }`}
                >
                  {trader?.eventPosition?.position ?? "-"}
                </span>
                <span className="text-neutral-500">
                  ₹{Number(trader?.eventPosition?.totalStake ?? 0).toFixed(0)}
                </span>
              </div>
            </div>
          </div>

          {/* Position Badge */}
          <div
            className={`px-2 py-1 rounded text-xs font-medium ${
              trader?.eventPosition?.position === "YES"
                ? "bg-green-900 text-green-400"
                : trader?.eventPosition?.position === "NO"
                ? "bg-red-900 text-red-400"
                : "bg-neutral-700 text-neutral-400"
            }`}
          >
            ₹{Number(trader?.eventPosition?.totalStake ?? 0).toFixed(0)}
          </div>
        </div>

        {/* Hover Actions */}
        {hoveredTrader === trader.id && (
          <div className="absolute inset-0 bg-neutral-900/80 rounded-lg flex items-center justify-center space-x-3">
            <button
              onClick={() => handleViewProfile(trader)}
              className="flex items-center space-x-1 px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded text-sm transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </button>
            <button
              onClick={() =>
                isMe ? router.push("/messages") : handleMessageTrader(trader)
              }
              disabled={isMe}
              title={isMe ? "You can't message yourself" : "Send a message"}
              className={`flex items-center space-x-1 px-3 py-2 rounded text-sm transition-colors ${
                isMe
                  ? "bg-neutral-700 text-neutral-300 cursor-not-allowed"
                  : "bg-cyan-600 hover:bg-cyan-700 text-white"
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>{isMe ? "Messages" : "Message"}</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Users className="w-5 h-5 text-cyan-400 mr-2" />
          <h3 className="text-lg font-semibold text-white">Active Traders</h3>
        </div>
        <div className="text-sm text-neutral-400">
          {traders.summary.totalTraders} traders • ₹
          {traders.summary.totalVolume.toFixed(0)} volume
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-neutral-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-400">
            {traders.summary.yesTraders}
          </div>
          <div className="text-xs text-neutral-400">YES Traders</div>
        </div>
        <div className="bg-neutral-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-400">
            {traders.summary.noTraders}
          </div>
          <div className="text-xs text-neutral-400">NO Traders</div>
        </div>
        <div className="bg-neutral-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-neutral-400">
            {traders.summary.neutralTraders}
          </div>
          <div className="text-xs text-neutral-400">Neutral</div>
        </div>
      </div>
      <div className="flex space-x-1 mb-4">
        {[
          { id: "all", label: `All (${traders.summary.totalTraders})` },
          { id: "yes", label: `YES (${traders.summary.yesTraders})` },
          { id: "no", label: `NO (${traders.summary.noTraders})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-sm rounded transition-colors ${
              activeTab === tab.id
                ? "bg-cyan-600 text-white"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {getDisplayTraders().map((trader) => (
          <TraderCard key={trader.id} trader={trader} />
        ))}
      </div>
      {getDisplayTraders().length === 0 && (
        <div className="text-center py-8">
          <p className="text-neutral-400">No traders in this category</p>
        </div>
      )}
    </div>
  );
}
