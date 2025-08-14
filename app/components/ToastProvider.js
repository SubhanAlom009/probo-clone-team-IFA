"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  limit,
} from "firebase/firestore";

const ToastCtx = createContext(null);

const palette = {
  info: {
    from: "var(--accent-primary,#2563EB)",
    to: "var(--accent-secondary,#EC4899)",
  },
  success: { from: "#059669", to: "#10b981" },
  error: { from: "#dc2626", to: "#f87171" },
  warn: { from: "#f59e0b", to: "#fbbf24" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // Flexible push: supports push("Message", "success") or push({ message: "Message", type: "success" })
  const push = useCallback((msgOrObj, type = "info", ttl = 4200) => {
    let message = msgOrObj;
    let toastType = type;
    let customTtl = ttl;
    if (msgOrObj && typeof msgOrObj === "object" && !Array.isArray(msgOrObj)) {
      message = msgOrObj.message || msgOrObj.msg || "";
      toastType = msgOrObj.type || type;
      customTtl = msgOrObj.ttl || ttl;
    }
    if (typeof message !== "string") {
      try {
        message = JSON.stringify(message);
      } catch {
        message = String(message);
      }
    }
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [
      ...t,
      {
        id,
        msg: message,
        type: toastType,
        ttl: customTtl,
        created: Date.now(),
      },
    ]);
  }, []);

  const dismiss = useCallback(
    (id) => setToasts((t) => t.filter((x) => x.id !== id)),
    []
  );

  // GC loop
  useEffect(() => {
    const i = setInterval(() => {
      const now = Date.now();
      setToasts((t) => t.filter((x) => now - x.created < x.ttl));
    }, 1000);
    return () => clearInterval(i);
  }, []);

  // Realtime: notify on new messages directed to current user
  useEffect(() => {
    let unsubAuth = () => {};
    let unsubConvos = () => {};
    const msgUnsubs = new Map();

    unsubAuth = onAuthStateChanged(auth, (u) => {
      // Clean old listeners
      if (unsubConvos) unsubConvos();
      for (const unsub of msgUnsubs.values()) {
        try {
          unsub();
        } catch {}
      }
      msgUnsubs.clear();

      if (!u) return;
      const me = u;

      // Listen to conversations where user participates
      const convQ = query(
        collection(db, "conversations"),
        where("participants", "array-contains", me.uid)
      );
      unsubConvos = onSnapshot(
        convQ,
        (snap) => {
          snap.docChanges().forEach((change) => {
            const cid = change.doc.id;
            if (change.type === "removed") {
              const u = msgUnsubs.get(cid);
              if (u) {
                try {
                  u();
                } catch {}
                msgUnsubs.delete(cid);
              }
              return;
            }
            if (msgUnsubs.has(cid)) return; // already listening
            const msgsQ = query(
              collection(db, "conversations", cid, "messages"),
              orderBy("timestamp", "desc"),
              limit(1)
            );
            const unsub = onSnapshot(
              msgsQ,
              (msnap) => {
                const latestDoc = msnap.docs[0];
                if (!latestDoc) return;
                const latest = latestDoc.data();
                if (latest.isDeleted) return;
                if (
                  latest.receiverId === me.uid &&
                  latest.senderId !== me.uid
                ) {
                  const text = latest.text?.slice(0, 120) || "New message";
                  push({
                    message: `New message: ${text}`,
                    type: "info",
                    ttl: 5000,
                  });
                }
              },
              () => {
                /* ignore errors */
              }
            );
            msgUnsubs.set(cid, unsub);
          });
        },
        () => {
          /* ignore errors */
        }
      );
    });

    return () => {
      if (unsubAuth) unsubAuth();
      if (unsubConvos) unsubConvos();
      for (const unsub of msgUnsubs.values()) {
        try {
          unsub();
        } catch {}
      }
    };
  }, [push]);

  return (
    <ToastCtx.Provider value={{ push, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 flex flex-col gap-3 w-72 sm:w-80 z-50">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

function Toast({ toast, onDismiss }) {
  const { id, msg, type, ttl, created } = toast;
  const ref = useRef(null);
  const prog = Math.min(1, (Date.now() - created) / ttl);
  const colors = palette[type] || palette.info;
  const [pct, setPct] = useState(prog);
  useEffect(() => {
    const r = () => setPct(Math.min(1, (Date.now() - created) / ttl));
    const i = setInterval(r, 80);
    return () => clearInterval(i);
  }, [created, ttl]);
  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      className="group relative overflow-hidden rounded-lg border border-[var(--c-border)] bg-[var(--c-base-900)]/90 backdrop-blur px-4 py-3 shadow-[0_6px_24px_-8px_rgba(0,0,0,0.6)] animate-[toastIn_.5s_cubic-bezier(.4,0,.2,1)]"
    >
      <div className="pr-6 text-xs font-medium leading-relaxed text-[var(--c-text-secondary)] group-hover:text-[var(--c-text-primary)] transition">
        {msg}
      </div>
      <button
        aria-label="Dismiss"
        onClick={onDismiss}
        className="absolute top-1.5 right-1.5 h-6 w-6 inline-flex items-center justify-center rounded-md text-[var(--c-text-tertiary)] hover:text-white hover:bg-[var(--c-base-700)]/60 text-xs"
      >
        ×
      </button>
      <div className="absolute left-0 bottom-0 h-0.5 w-full bg-[var(--c-base-700)]/40">
        <div
          style={{
            width: `${(1 - pct) * 100}%`,
            background: `linear-gradient(90deg, ${colors.from}, ${colors.to})`,
          }}
          className="h-full transition-[width] duration-100 ease-linear"
        />
      </div>
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/5 rounded-lg" />
      <style jsx>{`
        @keyframes toastIn {
          0% {
            transform: translateY(8px) scale(0.96);
            opacity: 0;
          }
          60% {
            transform: translateY(-2px);
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}
