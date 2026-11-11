import React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { ToastMessage } from "../models/types";

interface ToastViewProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastView: React.FC<ToastViewProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-cyan-400/50 shadow-[0_15px_35px_rgba(8,145,178,0.25)] flex items-start gap-3 animate-in slide-in-from-top-4 duration-300 text-left"
        >
          <div className="mt-0.5 text-cyan-600 shrink-0">
            {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            {toast.type === "warning" && <AlertCircle className="w-5 h-5 text-amber-500" />}
            {toast.type === "info" && <Info className="w-5 h-5 text-cyan-600" />}
            {toast.type === "error" && <AlertCircle className="w-5 h-5 text-rose-500" />}
          </div>

          <div className="flex-1 min-w-0">
            <h5 className="font-display font-bold text-sm text-[#082836]">{toast.title}</h5>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{toast.message}</p>
            {toast.actionLabel && toast.onAction && (
              <button
                onClick={() => {
                  toast.onAction!();
                  onDismiss(toast.id);
                }}
                className="mt-2 text-xs font-bold text-cyan-700 hover:text-cyan-900 underline cursor-pointer"
              >
                {toast.actionLabel}
              </button>
            )}
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
