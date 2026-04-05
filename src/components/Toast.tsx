"use client";

import { useState, useEffect } from "react";

interface ToastMessage {
  id: number;
  text: string;
  emoji?: string;
}

let toastId = 0;
const listeners = new Set<(msg: ToastMessage) => void>();

export function showToast(text: string, emoji?: string) {
  const msg = { id: ++toastId, text, emoji };
  listeners.forEach((fn) => fn(msg));
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler = (msg: ToastMessage) => {
      setToasts((prev) => [...prev, msg]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== msg.id));
      }, 2000);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-[var(--accent)] text-[#0a0a1a] px-4 py-2 rounded-full text-sm font-semibold shadow-lg animate-[slideDown_0.3s_ease-out]"
        >
          {t.emoji && <span className="mr-1">{t.emoji}</span>}
          {t.text}
        </div>
      ))}
    </div>
  );
}
