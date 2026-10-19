type LoaderProps = {
  className?: string;
  label?: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "size-4 border-2",
  md: "size-6 border-2",
  lg: "size-10 border-[3px]",
};

export default function Loader({ className = "", label = "Loading", size = "md" }: LoaderProps) {
  return <span className={`inline-flex items-center justify-center ${className}`} role="status" aria-label={label}>
    <span className={`${sizes[size]} animate-spin rounded-full border-current border-r-transparent`} />
    <span className="sr-only">{label}</span>
  </span>;
}
