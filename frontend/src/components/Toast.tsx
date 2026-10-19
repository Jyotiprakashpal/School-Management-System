import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type ToastTone = "success" | "error" | "info";
type ToastItem = { id: number; message: string; title: string; tone: ToastTone };
type ToastOptions = { title?: string; tone?: ToastTone };

const ToastContext = createContext<{ showToast: (message: string, options?: ToastOptions) => void } | null>(null);

function ToastIcon({ tone }: { tone: ToastTone }) {
  if (tone === "success") return <svg className="size-5" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg>;
  if (tone === "error") return <svg className="size-5" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>;
  return <svg className="size-5" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>;
}

function ToastCard({ item, onClose }: { item: ToastItem; onClose: (id: number) => void }) {
  useEffect(() => {
    const timeout = window.setTimeout(() => onClose(item.id), 4000);
    return () => window.clearTimeout(timeout);
  }, [item.id, onClose]);

  return <div className={`premium-toast premium-toast-${item.tone}`} role="status" aria-live="polite">
    <div className="toast-icon"><ToastIcon tone={item.tone} /></div>
    <div className="min-w-0 flex-1"><div className="font-display text-sm font-bold text-slate-950">{item.title}</div><div className="mt-0.5 text-xs leading-5 text-slate-500">{item.message}</div></div>
    <button type="button" onClick={() => onClose(item.id)} className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Close notification"><svg className="size-4" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
    <span className="toast-progress" />
  </div>;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const showToast = useCallback((message: string, options: ToastOptions = {}) => {
    const tone = options.tone ?? "success";
    setToasts((current) => [...current, { id: Date.now(), message, title: options.title ?? (tone === "success" ? "Saved successfully" : tone === "error" ? "Something went wrong" : "Information"), tone }]);
  }, []);
  const remove = useCallback((id: number) => setToasts((current) => current.filter((toast) => toast.id !== id)), []);

  return <ToastContext.Provider value={{ showToast }}>
    {children}
    <div className="fixed inset-x-3 top-3 z-[100] flex flex-col items-end gap-3 sm:inset-x-auto sm:right-5 sm:top-5 sm:w-[24rem]">
      {toasts.map((toast) => <ToastCard key={toast.id} item={toast} onClose={remove} />)}
    </div>
  </ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
