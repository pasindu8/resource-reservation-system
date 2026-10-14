'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (params: { type: ToastType; message: string; title?: string; duration?: number }) => string;
  success: (message: string, title?: string, duration?: number) => string;
  error: (message: string, title?: string, duration?: number) => string;
  info: (message: string, title?: string, duration?: number) => string;
  warning: (message: string, title?: string, duration?: number) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({
      type,
      message,
      title,
      duration = 4000,
    }: {
      type: ToastType;
      message: string;
      title?: string;
      duration?: number;
    }) => {
      const id = Math.random().toString(36).substring(2, 9);
      const defaultTitle =
        title ||
        (type === 'success'
          ? 'Success!'
          : type === 'error'
          ? 'Error!'
          : type === 'info'
          ? 'Info'
          : 'Warning!');

      const newToast: ToastItem = {
        id,
        type,
        title: defaultTitle,
        message,
        duration,
      };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string, duration?: number) =>
      showToast({ type: 'success', message, title, duration }),
    [showToast]
  );

  const error = useCallback(
    (message: string, title?: string, duration?: number) =>
      showToast({ type: 'error', message, title, duration }),
    [showToast]
  );

  const info = useCallback(
    (message: string, title?: string, duration?: number) =>
      showToast({ type: 'info', message, title, duration }),
    [showToast]
  );

  const warning = useCallback(
    (message: string, title?: string, duration?: number) =>
      showToast({ type: 'warning', message, title, duration }),
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, showToast, success, error, info, warning, removeToast }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: () => void;
}) {
  const configs = {
    success: {
      titleColor: 'text-[#22c55e]',
      bgColor: 'bg-[#22c55e]',
      icon: (
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ),
    },
    error: {
      titleColor: 'text-[#ef4444]',
      bgColor: 'bg-[#ef4444]',
      icon: (
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
    info: {
      titleColor: 'text-[#3b82f6]',
      bgColor: 'bg-[#3b82f6]',
      icon: (
        <svg
          className="w-5 h-5 text-white fill-current"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="6.5" r="2" />
          <path
            d="M10.25 10.5a1 1 0 011-1h1.5a1 1 0 011 1v6.5h1a1 1 0 110 2h-4.5a1 1 0 110-2h1V11.5h-1a1 1 0 01-1-1z"
          />
        </svg>
      ),
    },
    warning: {
      titleColor: 'text-[#f59e0b]',
      bgColor: 'bg-[#f59e0b]',
      icon: (
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
        </svg>
      ),
    },
  };

  const current = configs[toast.type] || configs.info;

  return (
    <div
      role="alert"
      className="pointer-events-auto flex items-center gap-4 bg-white text-slate-800 pl-4 pr-5 py-3.5 sm:pl-5 sm:pr-6 sm:py-4 rounded-full shadow-[0_12px_36px_rgba(0,0,0,0.18),0_4px_12px_rgba(0,0,0,0.08)] border border-slate-100/80 transition-all duration-300 animate-[toastSlideIn_0.35s_cubic-bezier(0.16,1,0.3,1)] select-none hover:shadow-[0_16px_42px_rgba(0,0,0,0.22)]"
    >
      {/* Icon Badge */}
      <div
        className={`w-11 h-11 rounded-full ${current.bgColor} flex items-center justify-center shrink-0 shadow-sm`}
      >
        {current.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-1">
        <h4 className={`text-[17px] font-semibold tracking-tight leading-tight ${current.titleColor}`}>
          {toast.title}
        </h4>
        <p className="text-[13px] sm:text-[14px] text-slate-600 leading-snug mt-0.5 break-words font-normal">
          {toast.message}
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={onDismiss}
        aria-label="Close notification"
        className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer ml-1"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
