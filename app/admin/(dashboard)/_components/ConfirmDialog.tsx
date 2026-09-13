"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type ConfirmOptions = {
  title: string;
  body: string;
  destructiveLabel?: string;
  cancelLabel?: string;
};

type PendingConfirm = ConfirmOptions & {
  resolve(value: boolean): void;
};

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return new Promise<boolean>((resolve) => setPending({ ...options, resolve }));
  }, []);

  const close = useCallback(
    (value: boolean) => {
      pending?.resolve(value);
      setPending(null);
      window.setTimeout(() => previousFocus.current?.focus(), 0);
    },
    [pending]
  );

  const contextValue = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={contextValue}>
      {children}
      {pending ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="w-full max-w-md rounded bg-white p-6 shadow-soft">
            <h2 className="text-xl font-black text-slate-950" id="confirm-title">
              {pending.title}
            </h2>
            <p className="mt-3 leading-7 text-slate-600">{pending.body}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button className="focus-ring rounded border border-slate-200 px-4 py-2 font-bold" onClick={() => close(false)}>
                {pending.cancelLabel ?? "Cancel"}
              </button>
              <button className="focus-ring rounded bg-red-700 px-4 py-2 font-bold text-white" onClick={() => close(true)}>
                {pending.destructiveLabel ?? "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const value = useContext(ConfirmContext);
  if (!value) {
    throw new Error("useConfirm must be used inside ConfirmProvider.");
  }
  return value;
}
