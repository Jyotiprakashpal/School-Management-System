import { useEffect, useRef, useState, type ReactNode } from "react";
import Button from "./Button";
import Input from "./Input";

export interface PremiumPaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  wideLayout?: boolean;
  tabletSingleRow?: boolean;
}

type PaginationIconName = "check" | "chevronDown" | "first" | "last" | "next" | "previous";

const iconPaths: Record<PaginationIconName, ReactNode> = {
  check: <path d="m5 12 4 4L19 6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  first: <><path d="m13 17-5-5 5-5M19 17l-5-5 5-5" /></>,
  last: <><path d="m11 7 5 5-5 5M5 7l5 5-5 5" /></>,
  next: <path d="m9 18 6-6-6-6" />,
  previous: <path d="m15 18-6-6 6-6" />,
};

function PaginationIcon({ name, className = "size-4" }: { name: PaginationIconName; className?: string }) {
  return <svg aria-hidden="true" className={`block ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{iconPaths[name]}</svg>;
}

function PageSizeDropdown({
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  onPageChange,
}: {
  pageSize: number;
  pageSizeOptions: number[];
  onPageSizeChange: (size: number) => void;
  onPageChange: (page: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return <div className="relative ml-0.5 inline-flex items-center" ref={ref}>
    <Button
      variant="outline"
      onClick={() => setOpen((current) => !current)}
      aria-expanded={open}
      className={`max-sm:hidden! flex min-h-8 shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs shadow-sm ${open ? "pagination-control-active" : ""}`}
    >
      <span className="whitespace-nowrap">{pageSize} / page</span>
      <PaginationIcon name="chevronDown" className={`size-3 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
    </Button>

    {open && <div className="absolute bottom-full left-0 z-50 mb-2 min-w-28 rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
      {pageSizeOptions.map((option) => {
        const selected = option === pageSize;
        return <Button
          key={option}
          variant="outline"
          onClick={() => {
            onPageSizeChange(option);
            onPageChange(1);
            setOpen(false);
          }}
          className={`flex w-full items-center justify-between rounded-lg border-0 px-3 py-2 text-left shadow-none ${selected ? "pagination-option-active" : "bg-white text-slate-600 hover:bg-slate-50"}`}
        >
          <span>{option} / page</span>
          {selected && <PaginationIcon name="check" className="size-3" />}
        </Button>;
      })}
    </div>}
  </div>;
}

function pageItems(currentPage: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 6) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (currentPage <= 3) return [1, 2, 3, "...", totalPages];
  if (currentPage >= totalPages - 2) return [1, "...", totalPages - 2, totalPages - 1, totalPages];
  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
}

export default function PremiumPagination({
  currentPage,
  totalPages,
  totalRecords,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 7, 10, 20, 50],
  wideLayout = false,
  tabletSingleRow = true,
}: PremiumPaginationProps) {
  const [goToInput, setGoToInput] = useState("");
  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, currentPage), safeTotalPages);
  const startRecord = totalRecords === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endRecord = Math.min(safePage * pageSize, totalRecords);

  const goToPage = () => {
    if (!goToInput) return;
    const parsed = Number.parseInt(goToInput, 10);
    if (!Number.isNaN(parsed)) onPageChange(Math.max(1, Math.min(parsed, safeTotalPages)));
    setGoToInput("");
  };

  const iconButtonClass = "!grid !size-8 !min-h-8 shrink-0 !place-items-center !rounded-full border-0 bg-transparent !p-0 leading-none text-slate-400 shadow-none hover:bg-slate-100 hover:text-slate-700 active:scale-90";

  return <div className={`flex w-full min-w-0 flex-col items-start justify-between gap-2.5 ${wideLayout ? "sm:rounded-2xl sm:border sm:border-slate-100 sm:bg-slate-50/70 sm:p-4 lg:flex-row lg:items-center" : "2xl:flex-row 2xl:items-center"} ${tabletSingleRow ? "sm:max-lg:flex-row sm:max-lg:items-center sm:max-lg:gap-2 sm:max-lg:border-0 sm:max-lg:bg-transparent sm:max-lg:p-0" : ""}`}>
    <p className="flex items-center gap-2 whitespace-nowrap text-xs font-medium text-slate-500">
      {wideLayout && <span className="hidden size-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-300 sm:block" />}
      <span className="hidden sm:inline">Showing <strong className="font-semibold text-slate-800">{startRecord}–{endRecord}</strong> of <strong className="font-semibold text-slate-800">{totalRecords}</strong> records</span>
    </p>

    <div className={`flex w-full min-w-0 max-w-full flex-col items-center justify-center gap-2 sm:flex-row sm:flex-wrap ${wideLayout ? "lg:w-auto lg:flex-nowrap lg:justify-end" : "2xl:w-auto 2xl:flex-nowrap"} ${tabletSingleRow ? "sm:max-lg:w-auto sm:max-lg:flex-nowrap sm:max-lg:justify-end" : ""}`}>
      <div className="flex w-full max-w-full items-center justify-between gap-1 rounded-full border border-slate-200 bg-white px-2 py-1.5 shadow-sm sm:w-auto sm:shrink-0 sm:justify-center sm:gap-1.5">
        <Button variant="outline" className={`${iconButtonClass} hidden sm:grid`} onClick={() => onPageChange(1)} disabled={safePage <= 1} title="First page" aria-label="First page"><PaginationIcon name="first" /></Button>
        <Button variant="outline" className={iconButtonClass} onClick={() => onPageChange(safePage - 1)} disabled={safePage <= 1} title="Previous page" aria-label="Previous page"><PaginationIcon name="previous" /></Button>

        <div className="hidden items-center gap-1 sm:flex">
          {pageItems(safePage, safeTotalPages).map((item, index) => item === "..."
            ? <span key={`ellipsis-${index}`} className="grid size-8 place-items-center text-xs font-bold text-slate-400">...</span>
            : <Button
              key={item}
              variant="outline"
              onClick={() => onPageChange(item)}
              aria-current={item === safePage ? "page" : undefined}
              className={`!grid !size-8 !min-h-8 !place-items-center !rounded-full border-0 !p-0 text-center text-xs font-bold leading-none shadow-none active:scale-95 ${item === safePage ? "pagination-active" : "bg-transparent text-slate-600 hover:bg-slate-100"}`}
            >{item}</Button>)}
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 sm:hidden">
          Page <strong className="text-slate-900">{safePage}</strong> of <strong className="text-slate-900">{safeTotalPages}</strong>
        </span>

        <Button variant="outline" className={iconButtonClass} onClick={() => onPageChange(safePage + 1)} disabled={safePage >= safeTotalPages} title="Next page" aria-label="Next page"><PaginationIcon name="next" /></Button>
        <Button variant="outline" className={`${iconButtonClass} hidden sm:grid`} onClick={() => onPageChange(safeTotalPages)} disabled={safePage >= safeTotalPages} title="Last page" aria-label="Last page"><PaginationIcon name="last" /></Button>

        <PageSizeDropdown pageSize={pageSize} pageSizeOptions={pageSizeOptions} onPageSizeChange={onPageSizeChange} onPageChange={onPageChange} />
      </div>

      <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 md:flex">
        <span className="whitespace-nowrap">Go to page</span>
        <Input
          value={goToInput}
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder={String(safePage)}
          aria-label="Go to page"
          onChange={(event) => setGoToInput(event.target.value.replace(/\D/g, ""))}
          onKeyDown={(event) => event.key === "Enter" && goToPage()}
          onBlur={goToPage}
          className="h-7 w-10 rounded-full px-1 text-center text-xs font-bold"
        />
      </div>
    </div>
  </div>;
}
