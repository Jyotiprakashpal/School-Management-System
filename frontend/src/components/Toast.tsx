import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

type ToastTone = "success" | "error" | "info" | "warning";
type ToastItem = {
  id: number;
  message: string;
  title: string;
  tone: ToastTone;
  duration: number;
};
type ToastOptions = {
  title?: string;
  tone?: ToastTone;
  duration?: number;
};

const ToastContext = createContext<{
  showToast: (message: string, options?: ToastOptions) => void;
} | null>(null);

function ToastIcon({ tone }: { tone: ToastTone }) {
  if (tone === "success") {
    return (
      <svg className="size-5" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 12 4 4L19 6" />
      </svg>
    );
  }

  if (tone === "error") {
    return (
      <svg className="size-5" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    );
  }

  if (tone === "warning") {
    return (
      <svg className="size-5" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3 9 17H3L12 3Z" />
        <path d="M12 9v5M12 17h.01" />
      </svg>
    );
  }

  return (
    <svg className="size-5" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}

function ToastCard({
  item,
  onClose,
}: {
  item: ToastItem;
  onClose: (id: number) => void;
}) {
  const [leaving, setLeaving] = useState(false);

  const dismiss = useCallback(() => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(() => onClose(item.id), 180);
  }, [item.id, leaving, onClose]);

  useEffect(() => {
    const timeout = window.setTimeout(dismiss, item.duration);
    return () => window.clearTimeout(timeout);
  }, [dismiss, item.duration]);

  const progressStyle = {
    "--toast-duration": `${item.duration}ms`,
  } as CSSProperties;

  return (
    <div
      className={`premium-toast premium-toast-${item.tone}${leaving ? " premium-toast-leaving" : ""}`}
      role={item.tone === "error" ? "alert" : "status"}
      aria-live={item.tone === "error" ? "assertive" : "polite"}
    >
      <div className="toast-icon">
        <ToastIcon tone={item.tone} />
      </div>
      <div className="relative z-10 min-w-0 flex-1">
        <div className="font-display text-sm font-extrabold tracking-tight text-white">
          {item.title}
        </div>
        <div className="mt-0.5 text-xs leading-5 text-white/80">
          {item.message}
        </div>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="toast-close"
        aria-label="Dismiss notification"
      >
        <svg className="size-4" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
      <span className="toast-progress-track">
        <span className="toast-progress" style={progressStyle} />
      </span>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((message: string, options: ToastOptions = {}) => {
    const tone = options.tone ?? "success";
    const defaultTitle =
      tone === "success"
        ? "Saved successfully"
        : tone === "error"
          ? "Something went wrong"
          : tone === "warning"
            ? "Please review"
            : "Information";
    const toast = {
      id: ++nextId.current,
      message,
      title: options.title ?? defaultTitle,
      tone,
      duration: options.duration ?? 4800,
    };

    setToasts((current) => [...current.slice(-3), toast]);
  }, []);

  const remove = useCallback(
    (id: number) =>
      setToasts((current) => current.filter((toast) => toast.id !== id)),
    [],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-viewport" aria-label="Notifications">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} item={toast} onClose={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
