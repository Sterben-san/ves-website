"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastVariant = "success" | "error" | "info";
type ToastInput = { title: string; body?: string; variant?: ToastVariant; actionHref?: string; actionLabel?: string };
type ToastMessage = ToastInput & { id: string; variant: ToastVariant };

const ToastContext = createContext<{ toast(input: ToastInput): void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const toast = useCallback((input: ToastInput) => {
    const id = crypto.randomUUID();
    const message = { ...input, id, variant: input.variant ?? "info" };
    setMessages((current) => [message, ...current].slice(0, 4));
    window.setTimeout(() => {
      setMessages((current) => current.filter((item) => item.id !== id));
    }, 4000);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[80] grid w-[min(360px,calc(100vw-2rem))] gap-3" aria-live="polite">
        {messages.map((message) => (
          <div
            className={`rounded border p-4 shadow-soft ${
              message.variant === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                : message.variant === "error"
                  ? "border-red-200 bg-red-50 text-red-950"
                  : "border-slate-200 bg-white text-slate-950"
            }`}
            key={message.id}
          >
            <p className="font-black">{message.title}</p>
            {message.body ? <p className="mt-1 text-sm font-medium opacity-75">{message.body}</p> : null}
            {message.actionHref ? (
              <a className="focus-ring mt-3 inline-block rounded border border-current px-3 py-1.5 text-xs font-black" href={message.actionHref} rel="noreferrer" target="_blank">
                {message.actionLabel ?? "View live"}
              </a>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error("useToast must be used inside ToastProvider.");
  }
  return value.toast;
}
