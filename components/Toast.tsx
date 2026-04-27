"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { Check, AlertCircle } from "lucide-react";

type ToastType = "default" | "success" | "error";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  leaving?: boolean;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = "default") => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Start leave animation
    setTimeout(() => {
      setToasts((prev) => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
    }, 2000);
    
    // Remove
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2300);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type} ${toast.leaving ? "leaving" : ""}`}>
            {toast.type === "success" && <Check size={16} />}
            {toast.type === "error" && <AlertCircle size={16} />}
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
