import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";

type CalendarProps = {
  className?: string;
  onSelect: (date: Date) => void;
  selected?: Date;
};

type DatePickerProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

function parseDateValue(value: string) {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function formatDateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function DatePicker({ id, label, value, onChange, required, disabled, className = "" }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [draftDate, setDraftDate] = useState<Date | undefined>(() => parseDateValue(value));
  const selectedDate = parseDateValue(value);
  const displayValue = selectedDate?.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  useEffect(() => {
    setDraftDate(selectedDate);
  }, [value]);

  return <div className={className}>
    {label && <label htmlFor={id} className="form-label">{label}{required ? " *" : ""}</label>}
    <button
      id={id}
      type="button"
      disabled={disabled}
      onClick={() => { setDraftDate(selectedDate ?? new Date()); setOpen(true); }}
      className="form-input flex items-center text-left disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className={displayValue ? "text-slate-700" : "text-slate-300"}>{displayValue || "Select date"}</span>
      <svg className="ml-auto size-4 text-slate-400" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>
    </button>
    {open && createPortal(<div className="fixed inset-0 z-[120] grid items-end sm:place-items-center sm:p-5" role="dialog" aria-modal="true" aria-label={`Select ${label || "date"}`}>
      <button type="button" className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={() => setOpen(false)} aria-label="Close date picker" />
      <section style={{ width: "calc(100vw - 2rem)", maxWidth: "24rem" }} className="date-picker-dialog relative z-10 box-border overflow-hidden rounded-3xl border border-white/80 bg-white p-3 sm:p-4">
        <Calendar selected={draftDate} onSelect={setDraftDate} />
        <div className="calendar-actions mt-3 grid w-full min-w-0 grid-cols-2 gap-2 rounded-b-3xl border-t border-slate-200 bg-slate-50/90 px-1 pb-1 pt-3">
          <button type="button" className="form-input h-10 flex-1 text-center font-semibold sm:flex-none sm:px-5" onClick={() => setOpen(false)}>Cancel</button>
          <button type="button" className="module-primary h-10 flex-1 sm:flex-none" onClick={() => { if (draftDate) onChange(formatDateValue(draftDate)); setOpen(false); }}>Use this date</button>
        </div>
      </section>
    </div>, document.body)}
  </div>;
}

const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function sameDay(first: Date, second: Date) {
  return first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth() && first.getDate() === second.getDate();
}

export function Calendar({ className = "", onSelect, selected }: CalendarProps) {
  const initialDate = selected ?? new Date();
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const [openPicker, setOpenPicker] = useState<"month" | "year" | null>(null);

  useEffect(() => {
    if (!selected) return;
    setVisibleMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
  }, [selected]);

  const days = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const previousMonthDays = new Date(year, month, 0).getDate();
    return Array.from({ length: 42 }, (_, index) => {
      const dayOffset = index - firstDay + 1;
      if (dayOffset < 1) return { date: new Date(year, month - 1, previousMonthDays + dayOffset), outside: true };
      if (dayOffset > daysInMonth) return { date: new Date(year, month + 1, dayOffset - daysInMonth), outside: true };
      return { date: new Date(year, month, dayOffset), outside: false };
    });
  }, [visibleMonth]);

  const moveMonth = (offset: number) => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 111 }, (_, index) => currentYear + 10 - index);

  return <div className={`calendar-card ${className}`}>
    <div className="calendar-caption flex items-center justify-between rounded-xl px-2 py-2">
      <button type="button" onClick={() => moveMonth(-1)} className="calendar-nav" aria-label="Previous month">
        <svg className="size-4" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
      </button>
      <div className="flex items-center gap-1.5">
        <div className="relative">
          <button type="button" aria-label="Select month" aria-expanded={openPicker === "month"} onClick={() => setOpenPicker(openPicker === "month" ? null : "month")} className="calendar-picker-button">
            {monthNames[visibleMonth.getMonth()]}
            <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
          </button>
          {openPicker === "month" && <div className="calendar-picker-menu left-0 w-36" role="listbox">
            {monthNames.map((month, index) => <button key={month} type="button" className={index === visibleMonth.getMonth() ? "calendar-picker-option calendar-picker-option-active" : "calendar-picker-option"} onClick={() => { setVisibleMonth(new Date(visibleMonth.getFullYear(), index, 1)); setOpenPicker(null); }}>{month}</button>)}
          </div>}
        </div>
        <div className="relative">
          <button type="button" aria-label="Select year" aria-expanded={openPicker === "year"} onClick={() => setOpenPicker(openPicker === "year" ? null : "year")} className="calendar-picker-button">
            {visibleMonth.getFullYear()}
            <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
          </button>
          {openPicker === "year" && <div className="calendar-picker-menu right-0 max-h-52 w-24 overflow-y-auto" role="listbox">
            {years.map((year) => <button key={year} type="button" className={year === visibleMonth.getFullYear() ? "calendar-picker-option calendar-picker-option-active" : "calendar-picker-option"} onClick={() => { setVisibleMonth(new Date(year, visibleMonth.getMonth(), 1)); setOpenPicker(null); }}>{year}</button>)}
          </div>}
        </div>
      </div>
      <button type="button" onClick={() => moveMonth(1)} className="calendar-nav" aria-label="Next month">
        <svg className="size-4" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>
      </button>
    </div>
    <div className="mt-3 grid grid-cols-7 gap-1">
      {weekDays.map((day) => <div key={day} className="grid h-7 place-items-center text-[0.62rem] font-bold uppercase text-slate-400">{day}</div>)}
      {days.map(({ date, outside }) => {
        const isSelected = selected ? sameDay(date, selected) : false;
        const isToday = sameDay(date, new Date());
        return <button
          key={date.toISOString()}
          type="button"
          onClick={() => { onSelect(date); setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1)); }}
          className={`calendar-day ${outside ? "calendar-day-outside" : ""} ${isToday ? "calendar-day-today" : ""} ${isSelected ? "calendar-day-selected" : ""}`}
          aria-pressed={isSelected}
        >{date.getDate()}</button>;
      })}
    </div>
    <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
      <button type="button" className="text-xs font-bold text-slate-400 transition hover:text-slate-700" onClick={() => { const today = new Date(); onSelect(today); setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1)); }}>Today</button>
      {selected && <div className="text-xs font-semibold text-teal-600">{selected.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>}
    </div>
  </div>;
}
