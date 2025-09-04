// src/components/ToastProvider.tsx
import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";

type ToastType = "info" | "success" | "error";
type ToastItem = { id: number; message: string; type: ToastType };

type Ctx = { push: (message: string, type?: ToastType) => void };

const ToastCtx = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  // ← ここで 401 系のイベントにフック（E2E でこの文言を探します）
  useEffect(() => {
    const onAuthExpired = () => push("セッションが切れました。再ログインしてください", "error");
    const onAuthLogout  = () => push("セッションが切れました。再ログインしてください", "error");
    window.addEventListener("auth:expired", onAuthExpired);
    window.addEventListener("auth:logout", onAuthLogout);
    return () => {
      window.removeEventListener("auth:expired", onAuthExpired);
      window.removeEventListener("auth:logout", onAuthLogout);
    };
  }, [push]);

  const value = useMemo<Ctx>(() => ({ push }), [push]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed right-4 top-4 z-[2000] space-y-2">
          {items.map((t) => (
            <div
              key={t.id}
              role="status"
              className={[
                "pointer-events-auto rounded-md px-3 py-2 text-sm shadow-lg",
                t.type === "error" ? "bg-red-600 text-white" :
                t.type === "success" ? "bg-emerald-600 text-white" :
                "bg-gray-900 text-white",
              ].join(" ")}
            >
              {t.message}
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastCtx.Provider>
  );
}

export function useToast(): Ctx {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
