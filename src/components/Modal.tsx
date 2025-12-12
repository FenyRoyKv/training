"use client";

import { useRouter } from "next/navigation";
import { useEffect, useCallback } from "react";

// Reusable Modal Component
// Used with intercepting routes to show content in overlay

type ModalProps = {
  children: React.ReactNode;
  title?: string;
};

export default function Modal({ children, title }: ModalProps) {
  const router = useRouter();

  const onDismiss = useCallback(() => {
    router.back();
  }, [router]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    },
    [onDismiss]
  );

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [onKeyDown]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg mx-4 bg-slate-800 rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        {title && (
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <button
              onClick={onDismiss}
              className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

