"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";

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

  const push = useCallback((msg, type = "info", ttl = 4200) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, type, ttl, created: Date.now() }]);
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
