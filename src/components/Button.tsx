import type { ButtonHTMLAttributes, ReactNode } from "react";
import Loader from "./Loader";

export type ButtonVariant = "primary" | "secondary" | "success" | "warning" | "danger" | "outline";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  icon?: ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingText?: string;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "module-primary",
  secondary: "module-secondary",
  success: "rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-600",
  warning: "rounded-lg bg-amber-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-amber-600",
  danger: "module-danger",
  outline: "rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50",
};

export default function Button({ children, className = "", disabled, fullWidth = false, icon, isLoading = false, loadingText = "Saving...", type = "button", variant = "primary", ...props }: ButtonProps) {
  return <button type={type} disabled={disabled || isLoading} className={`inline-flex min-h-10 items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${fullWidth ? "w-full" : ""} ${isLoading ? "cursor-wait opacity-90" : ""} ${className}`} {...props}>
    {isLoading ? <><Loader size="sm" label={loadingText} />{loadingText}</> : <>{icon}{children}</>}
  </button>;
}
