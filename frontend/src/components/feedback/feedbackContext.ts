import { createContext, useContext } from "react";

export type FeedbackVariant = "success" | "error" | "warning" | "info";

export interface FeedbackOptions {
  variant?: FeedbackVariant;
  title: string;
  message?: string;
  confirmLabel?: string;
}

export interface ConfirmOptions extends FeedbackOptions {
  cancelLabel?: string;
}

export interface FeedbackContextValue {
  notify: (options: FeedbackOptions) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

export interface FeedbackState extends ConfirmOptions {
  mode: "notify" | "confirm";
}

export const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error("useFeedback deve ser usado dentro de FeedbackProvider");
  }
  return context;
}
