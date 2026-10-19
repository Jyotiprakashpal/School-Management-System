import type { InputHTMLAttributes, ReactNode } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  startIcon?: ReactNode;
};

export default function Input({ className = "", hint, id, label, startIcon, ...props }: InputProps) {
  const input = <div className={startIcon ? "relative" : ""}>
    {startIcon && <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-slate-400">{startIcon}</span>}
    <input id={id} className={`form-input ${startIcon ? "pl-10" : ""} ${className}`} {...props} />
  </div>;

  if (!label && !hint) return input;

  return <label htmlFor={id} className="block">
    {label && <span className="form-label">{label}</span>}
    {input}
    {hint && <span className="mt-1.5 block text-[0.65rem] text-slate-400">{hint}</span>}
  </label>;
}
