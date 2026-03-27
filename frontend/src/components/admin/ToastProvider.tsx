"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

// ─── TYPES ──────────────────────────────────────────────────────
type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "default";
}

interface ToastContextType {
  toast: {
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
  };
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextType | null>(null);
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};

// ─── ICONS ──────────────────────────────────────────────────────
const iconMap: Record<ToastType, { icon: string; color: string; bg: string; ring: string }> = {
  success: { icon: "check_circle", color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20", ring: "ring-green-500/20" },
  error:   { icon: "error",        color: "text-red-500",   bg: "bg-red-50 dark:bg-red-900/20",     ring: "ring-red-500/20" },
  warning: { icon: "warning",      color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20", ring: "ring-amber-500/20" },
  info:    { icon: "info",         color: "text-blue-500",  bg: "bg-blue-50 dark:bg-blue-900/20",   ring: "ring-blue-500/20" },
};

// ─── PROVIDER ───────────────────────────────────────────────────
let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (title: string, message?: string) => addToast("success", title, message),
    error: (title: string, message?: string) => addToast("error", title, message),
    warning: (title: string, message?: string) => addToast("warning", title, message),
    info: (title: string, message?: string) => addToast("info", title, message),
  };

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({ options, resolve });
    });
  }, []);

  const handleConfirm = (result: boolean) => {
    confirmState?.resolve(result);
    setConfirmState(null);
  };

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}

      {/* ─── TOAST CONTAINER ─────────────────────────────── */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none max-w-[420px] w-full">
        {toasts.map((t) => {
          const style = iconMap[t.type];
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl shadow-black/10 ring-1 ${style.ring} animate-slide-in-right`}
            >
              <div className={`shrink-0 p-1 rounded-lg ${style.bg}`}>
                <span className={`material-symbols-outlined text-[20px] ${style.color}`}>{style.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.title}</p>
                {t.message && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{t.message}</p>}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* ─── CONFIRM DIALOG ──────────────────────────────── */}
      {confirmState && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => handleConfirm(false)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-6 animate-scale-in">
            {/* Icon */}
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
              confirmState.options.variant === "danger" ? "bg-red-100 dark:bg-red-900/30" :
              confirmState.options.variant === "warning" ? "bg-amber-100 dark:bg-amber-900/30" :
              "bg-blue-100 dark:bg-blue-900/30"
            }`}>
              <span className={`material-symbols-outlined text-[28px] ${
                confirmState.options.variant === "danger" ? "text-red-500" :
                confirmState.options.variant === "warning" ? "text-amber-500" :
                "text-blue-500"
              }`}>
                {confirmState.options.variant === "danger" ? "warning" : confirmState.options.variant === "warning" ? "help" : "help"}
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center">{confirmState.options.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2 leading-relaxed">{confirmState.options.message}</p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                {confirmState.options.cancelText || "Hủy"}
              </button>
              <button
                onClick={() => handleConfirm(true)}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors shadow-sm ${
                  confirmState.options.variant === "danger"
                    ? "bg-red-500 hover:bg-red-600"
                    : confirmState.options.variant === "warning"
                    ? "bg-amber-500 hover:bg-amber-600"
                    : "bg-orange-500 hover:bg-orange-600"
                }`}
              >
                {confirmState.options.confirmText || "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ANIMATIONS (inline style tag) ───────────────── */}
      <style jsx global>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        .animate-slide-in-right { animation: slideInRight 0.3s ease-out; }
        .animate-fade-in        { animation: fadeIn 0.2s ease-out; }
        .animate-scale-in       { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </ToastContext.Provider>
  );
}
