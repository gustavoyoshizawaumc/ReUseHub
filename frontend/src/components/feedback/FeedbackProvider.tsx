import React, { useCallback, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import {
  type ConfirmOptions,
  FeedbackContext,
  type FeedbackOptions,
  type FeedbackState,
  type FeedbackVariant,
} from "./feedbackContext";

const variantStyles: Record<FeedbackVariant, {
  icon: React.ElementType;
  iconClass: string;
  buttonClass: string;
}> = {
  success: {
    icon: CheckCircle2,
    iconClass: "bg-emerald-50 text-emerald-600",
    buttonClass: "bg-blue-600 text-white hover:bg-blue-700",
  },
  error: {
    icon: XCircle,
    iconClass: "bg-red-50 text-red-600",
    buttonClass: "bg-red-600 text-white hover:bg-red-700",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "bg-orange-50 text-orange-600",
    buttonClass: "bg-orange-600 text-white hover:bg-orange-700",
  },
  info: {
    icon: Info,
    iconClass: "bg-blue-50 text-blue-600",
    buttonClass: "bg-blue-600 text-white hover:bg-blue-700",
  },
};

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const close = useCallback((value = false) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setFeedback(null);
  }, []);

  const notify = useCallback((options: FeedbackOptions) => {
    resolverRef.current = null;
    setFeedback({
      variant: "info",
      confirmLabel: "Entendi",
      ...options,
      mode: "notify",
    });
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    setFeedback({
      variant: "warning",
      confirmLabel: "Confirmar",
      cancelLabel: "Cancelar",
      ...options,
      mode: "confirm",
    });

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const variant = feedback?.variant ?? "info";
  const style = variantStyles[variant];
  const Icon = style.icon;

  return (
    <FeedbackContext.Provider value={{ notify, confirm }}>
      {children}

      {feedback && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 px-4 py-6 font-plus-jakarta-sans">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 text-left shadow-xl shadow-slate-950/20 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${style.iconClass}`}>
                <Icon size={22} />
              </div>

              <button
                type="button"
                onClick={() => close(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4">
              <h2 className="text-lg font-extrabold text-slate-950">
                {feedback.title}
              </h2>
              {feedback.message && (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                  {feedback.message}
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              {feedback.mode === "confirm" && (
                <button
                  type="button"
                  onClick={() => close(false)}
                  className="rounded-md border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  {feedback.cancelLabel}
                </button>
              )}

              <button
                type="button"
                onClick={() => close(true)}
                className={`rounded-md px-5 py-2.5 text-sm font-bold transition-colors ${style.buttonClass}`}
              >
                {feedback.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
};
