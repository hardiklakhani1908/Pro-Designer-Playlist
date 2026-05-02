import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, AlertCircle, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastState {
  message: string;
  variant?: ToastVariant;
  action?: ToastAction;
}

interface ToastProps {
  toast: ToastState | null;
  onClose: () => void;
  durationMs?: number;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose, durationMs }) => {
  useEffect(() => {
    if (!toast) return;
    // Toasts with an action stay longer so the user can tap it.
    const fallback = toast.action ? 6000 : 3000;
    const ms = durationMs ?? fallback;
    const id = setTimeout(onClose, ms);
    return () => clearTimeout(id);
  }, [toast, durationMs, onClose]);

  return (
    <div
      className="fixed bottom-6 right-6 z-[100] pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg bg-[#0f0f0f] border border-[#1f1f1f] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)] min-w-[260px] max-w-sm"
          >
            <div
              className={
                toast.variant === 'error'
                  ? 'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-red-500/15 text-red-400'
                  : toast.variant === 'info'
                  ? 'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-sky-500/15 text-sky-400'
                  : 'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-emerald-500/15 text-emerald-400'
              }
            >
              {toast.variant === 'error' ? (
                <AlertCircle size={14} strokeWidth={2.25} />
              ) : toast.variant === 'info' ? (
                <AlertCircle size={14} strokeWidth={2.25} />
              ) : (
                <Check size={14} strokeWidth={2.5} />
              )}
            </div>
            <p className="flex-1 text-[13px] text-[#e7e8ea] leading-snug">{toast.message}</p>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action!.onClick();
                  onClose();
                }}
                className="flex-shrink-0 px-3 py-1.5 rounded-md bg-white text-black text-[12px] font-semibold hover:bg-gray-200 transition-colors active:scale-[0.97]"
              >
                {toast.action.label}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-[#5a5f68] hover:text-white transition-colors flex-shrink-0 p-1 -m-1 min-w-[28px] min-h-[28px] flex items-center justify-center"
              aria-label="Dismiss"
            >
              <X size={14} strokeWidth={2} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
