"use client";

interface ToastProps {
  show: boolean;
  type: "success" | "error" | "submitting" | "info";
  message: string;
  onClose?: () => void;
}

const accentStyles: Record<string, { bar: string; icon: string; spinner: string }> = {
  success: { bar: "bg-success", icon: "text-success", spinner: "border-success" },
  error: { bar: "bg-error", icon: "text-error", spinner: "border-error" },
  submitting: { bar: "bg-primary", icon: "text-primary", spinner: "border-primary" },
  info: { bar: "bg-warning", icon: "text-warning", spinner: "border-warning" },
};

export default function Toast({ show, type, message, onClose }: ToastProps) {
  if (!show) return null;

  const accent = accentStyles[type] || accentStyles.info;

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-scale-in">
      <div className="flex items-start gap-0 max-w-md bg-white border border-outline-variant rounded-xl shadow-elevated overflow-hidden">
        {/* Accent bar */}
        <div className={`w-1.5 self-stretch shrink-0 ${accent.bar}`} />

        <div className="flex items-center gap-3 p-4 pl-3.5 flex-1 min-w-0">
          {type === "submitting" ? (
            <div className={`w-5 h-5 border-2 ${accent.spinner} border-t-transparent rounded-full animate-spin shrink-0`} />
          ) : (
            <span
              className={`material-symbols-outlined text-xl shrink-0 ${accent.icon}`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {type === "success" ? "check_circle" : type === "error" ? "error" : "info"}
            </span>
          )}
          <p className="text-sm text-on-surface leading-relaxed">{message}</p>
          {onClose && (
            <button onClick={onClose} className="ml-auto p-0.5 text-on-surface-variant hover:text-on-surface transition-colors shrink-0">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
