"use client";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import BetForm from "@/app/components/BetForm";
import MyOrders from "@/app/components/MyOrders";
// Replaced depth (order book) chart with timeline chart
import MarketTimelineChart from "@/app/components/MarketTimelineChart";
import OrderBookDisplay from "@/app/components/OrderBookDisplay";
import EventAnalytics from "@/app/components/EventAnalytics";
// import { computeSmoothedProb } from "@/lib/marketMath"; // no longer used with order-book probability
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { useToast } from "@/app/components/ToastProvider";

export default function EventDetailPage() {
  // Ensure hooks are called unconditionally and in the correct order
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [bets, setBets] = useState([]);
  const [orders, setOrders] = useState([]); // live orders for this event
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  // Order selection lifted state (from order book -> bet form)
  const [selectedOrder, setSelectedOrder] = useState(null); // { side, price }
  const lastFirstBetId = useRef(null);
  const { push } = useToast();
  // Fetch user profile for admin check
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const p = await fetch("/api/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then((r) => r.json());
        setProfile(p);
      } catch {}
    })();
  }, [user]);

  // (Removed old ratio-over-time chart data calculation; now relying on order book visualizations only)

  // Removed line chart animation state

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!id) return;
    const evRef = doc(db, "events", id);
    const unsubEvent = onSnapshot(
      evRef,
      (snap) => {
        if (!snap.exists()) setError("Not found");
        else setEvent({ id: snap.id, ...snap.data() });
      },
      (err) => {
        setError(err.message);
      }
    );
    const betsQ = query(
      collection(db, "bets"),
      where("eventId", "==", id),
      orderBy("createdAt", "desc")
    );
    const unsubBets = onSnapshot(
      betsQ,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Compare with previous first bet id stored in ref
        const currentFirst = list[0]?.id;
        if (currentFirst && currentFirst !== lastFirstBetId.current) {
          if (lastFirstBetId.current !== null) {
            // highlight only after initial load
            lastFirstBetId.current = currentFirst;
          } else {
            // initial assignment without highlight
            lastFirstBetId.current = currentFirst;
          }
        }
        setBets(list);
      },
      (err) => push(err.message, "error")
    );
    // --- ORDERS real-time listener ---
    const ordersQ = query(
      collection(db, "orders"),
      where("eventId", "==", id),
      where("status", "==", "open")
    );
    const unsubOrders = onSnapshot(
      ordersQ,
      (snap) => {
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => push(err.message, "error")
    );
    return () => {
      unsubEvent();
      unsubBets();
      unsubOrders();
    };
  }, [id, push]);

  // Add a callback to force refresh bets after placing a bet
  const handleBetPlaced = useCallback(() => {
    // This will trigger the Firestore listener to update bets
    // Optionally, you could re-fetch bets here if needed
    // For now, just a placeholder in case BetForm emits an event
  }, []);

  // Aggregate live order book from Firestore orders (must be before any early return)
  const { yesOrders, noOrders } = useMemo(() => {
    const yesOrdersMap = new Map();
    const noOrdersMap = new Map();

    for (const o of orders || []) {
      if (!o.price || !o.quantityRemaining || o.quantityRemaining <= 0)
        continue;

      const price = Number(o.price);
      const qty = Number(o.quantityRemaining);
      const orderData = {
        price,
        qty,
        userId: o.userId,
        orderId: o.id,
      };

      if (o.side === "yes") {
        const existing = yesOrdersMap.get(price) || {
          price,
          qty: 0,
          orders: [],
        };
        existing.qty += qty;
        existing.orders.push(orderData);
        yesOrdersMap.set(price, existing);
      } else if (o.side === "no") {
        const existing = noOrdersMap.get(price) || {
          price,
          qty: 0,
          orders: [],
        };
        existing.qty += qty;
        existing.orders.push(orderData);
        noOrdersMap.set(price, existing);
      }
    }

    // Convert to arrays and flatten individual orders for display
    const yesOrders = [];
    const noOrders = [];

    // For YES orders (sorted descending)
    Array.from(yesOrdersMap.values())
      .sort((a, b) => b.price - a.price)
      .forEach((level) => {
        level.orders.forEach((order) => yesOrders.push(order));
      });

    // For NO orders (sorted ascending)
    Array.from(noOrdersMap.values())
      .sort((a, b) => a.price - b.price)
      .forEach((level) => {
        level.orders.forEach((order) => noOrders.push(order));
      });

    return { yesOrders, noOrders };
  }, [orders]);

  // --- OPTION B: LAST TRADE DRIVEN PRICING ---
  // Price only updates when a trade (bet) occurs. Fallback to book only if NO trades yet.
  const { yesPrice, noPrice } = useMemo(() => {
    // bets are stored newest first (query orderBy desc)
    let lastTradeYesPrice = null;
    const lastBet = bets[0];
    if (lastBet && typeof lastBet.price === "number") {
      // Convert any trade to YES price perspective
      lastTradeYesPrice =
        lastBet.side === "yes" ? lastBet.price : 10 - lastBet.price;
    }

    // Helper to get lowest ask for a side
    const lowest = (orders) => {
      if (!orders || !orders.length) return null;
      return Math.min(...orders.map((o) => o.price));
    };
    const bestNoAsk = lowest(noOrders); // sets YES directly
    const bestYesAsk = lowest(yesOrders); // implies NO -> YES = 10 - NO

    if (typeof lastTradeYesPrice === "number") {
      return {
        yesPrice: lastTradeYesPrice,
        noPrice: Number((10 - lastTradeYesPrice).toFixed(2)),
      };
    }
    if (typeof bestNoAsk === "number") {
      return {
        yesPrice: bestNoAsk,
        noPrice: Number((10 - bestNoAsk).toFixed(2)),
      };
    }
    if (typeof bestYesAsk === "number") {
      const impliedYes = Number((10 - bestYesAsk).toFixed(2));
      return { yesPrice: impliedYes, noPrice: bestYesAsk };
    }
    return { yesPrice: 5, noPrice: 5 };
  }, [bets, yesOrders, noOrders]);

  const yesProb = ((yesPrice / 10) * 100).toFixed(1);
  const noProb = ((noPrice / 10) * 100).toFixed(1);

  if (!event)
    return <div className="mt-10">{error ? error : "Loading event..."}</div>;

  return (
    <div className="flex flex-col md:flex-row gap-8 mt-4">
      {/* Left: Event details and chart */}
      <div className="flex-1 min-w-0 space-y-8">
        {/* Admin/Resolve button for admins */}
        {profile?.role === "admin" && !event.resolvedOutcome && (
          <div className="mb-4">
            <Link
              href={`/admin/events/${id}`}
              className="inline-block bg-emerald-700 hover:bg-emerald-600 text-white font-semibold px-4 py-2 rounded transition shadow"
            >
              Resolve Event
            </Link>
          </div>
        )}
        <div>
          <h1 className="text-4xl font-extrabold mb-4 leading-tight tracking-tight text-white">
            {event.title}
          </h1>
          <p className="text-base text-neutral-400 whitespace-pre-line leading-relaxed">
            {event.description}
          </p>
          {/* YES/NO Price Inline Display */}
          <div className="flex gap-2 mt-4">
            <div className="flex-1 flex flex-col items-center border-2 border-cyan-500/70 bg-cyan-500/10 rounded-lg p-2">
              <span className="text-[12px] text-cyan-300 font-semibold">
                YES
              </span>
              <span className="font-mono text-cyan-200 text-base">
                {typeof yesPrice === "number" ? `₹${yesPrice}` : "--"}
              </span>
            </div>
            <div className="flex-1 flex flex-col items-center border-2 border-rose-500/70 bg-rose-500/10 rounded-lg p-2">
              <span className="text-[12px] text-rose-300 font-semibold">
                NO
              </span>
              <span className="font-mono text-rose-200 text-base">
                {typeof noPrice === "number" ? `₹${noPrice}` : "--"}
              </span>
            </div>
          </div>
        </div>
        {/* --- Event Analytics Panel --- */}
        <EventAnalytics eventId={id} yesPrice={yesPrice} noPrice={noPrice} />
        {/* Order Book (levels) */}
        <OrderBookDisplay
          yesOrders={yesOrders}
          noOrders={noOrders}
          onSelectPrice={({ side, price }) => {
            setSelectedOrder({ side, price });
          }}
          userId={user?.uid}
        />
        {/* Market Timeline (price / probability over time) */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-lg">
          <MarketTimelineChart
            data={bets
              .slice()
              .reverse()
              .map((b) => ({
                time: b.createdAt?.toMillis
                  ? b.createdAt.toMillis()
                  : Date.now(),
                yesPrice:
                  b.side === "yes"
                    ? b.price || (b.oddsSnapshot ? b.oddsSnapshot * 10 : null)
                    : b.price
                    ? 10 - b.price
                    : null,
                prob:
                  b.side === "yes"
                    ? b.price
                      ? b.price / 10
                      : b.oddsSnapshot || 0.5
                    : b.price
                    ? 1 - b.price / 10
                    : b.oddsSnapshot
                    ? 1 - b.oddsSnapshot
                    : 0.5,
              }))
              .filter((d) => d.yesPrice !== null)}
          />
        </div>
      </div>
      {/* Right: Bet form and recent bets */}
      <div className="w-full md:w-[380px] flex-shrink-0 space-y-8">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-lg">
          {authLoading ? (
            <div className="text-neutral-500 text-center">
              Checking authentication...
            </div>
          ) : event.resolvedOutcome ? (
            <div className="text-lime-400 text-center font-semibold text-lg">
              Event resolved.
            </div>
          ) : user && event.status === "open" ? (
            <>
              <BetForm
                eventId={event.id}
                onBetPlaced={handleBetPlaced}
                market={{ yesPrice, noPrice, yesProb, noProb }}
                selectedOrder={selectedOrder}
                onClearSelected={() => setSelectedOrder(null)}
                userId={user.uid}
              />
              <MyOrders eventId={event.id} userId={user.uid} />
            </>
          ) : (
            <div className="text-neutral-500 text-center">
              Sign in to place a bet.
            </div>
          )}
        </div>
        {/* <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-lg">
          <h2 className="font-semibold text-lg mb-4 tracking-tight text-white">
            Recent Bets
          </h2>
          <div className="space-y-3 text-sm max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-900 rounded-md">
            {bets.slice(0, 25).length === 0 && (
              <div className="text-neutral-500">No bets yet.</div>
            )}
            {bets.slice(0, 10).map((b) => (
              <div
                key={b.id}
                className={`flex justify-between bg-neutral-900 border border-neutral-800 rounded-lg p-3 transition-shadow ${
                  lastFirstBetId.current === b.id
                    ? "ring-2 ring-cyan-500/40 shadow-lg"
                    : ""
                }`}
              >
                <span
                  className={`capitalize font-medium ${
                    b.outcome && b.outcome === b.side ? "text-lime-400" : ""
                  }`}
                >
                  {b.side}
                </span>
                <span className="font-mono text-cyan-300">{b.stake}</span>
                <span className="text-neutral-500 font-mono">
                  {b.oddsSnapshot
                    ? (b.oddsSnapshot * 100).toFixed(1) + "%"
                    : ""}
                </span>
              </div>
            ))}
          </div>
        </div> */}
      </div>
    </div>
  );
}
