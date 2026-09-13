"use client";

import { useTranslations } from "next-intl";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { Toast } from "./toast";

const DISMISS_AFTER_MS = 5000;

type ToastOptions = {
  icon: ReactNode;
  message: ReactNode;
};

type ActiveToast = ToastOptions & { id: number };

type ToastContextValue = {
  show: (options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

/**
 * Owns the confirmation toast for the protected app. Mounted in the layout so a
 * toast outlives the component that triggered it (e.g. the empty-state CTA that
 * unmounts once the first ritual exists). One toast at a time: a new one
 * replaces the current one and restarts the auto-dismiss timer.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("common");
  const [toast, setToast] = useState<ActiveToast | null>(null);
  const nextId = useRef(0);

  const show = useCallback((options: ToastOptions) => {
    nextId.current += 1;
    setToast({ ...options, id: nextId.current });
  }, []);

  const toastId = toast?.id;
  useEffect(() => {
    if (toastId === undefined) return;
    const timer = setTimeout(() => setToast(null), DISMISS_AFTER_MS);
    return () => clearTimeout(timer);
  }, [toastId]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast ? (
        <Toast
          // Remount on replace so the slide-in replays.
          key={toast.id}
          icon={toast.icon}
          onDismiss={() => setToast(null)}
          dismissLabel={t("close")}
        >
          {toast.message}
        </Toast>
      ) : null}
    </ToastContext.Provider>
  );
}
