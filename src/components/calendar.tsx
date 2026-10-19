import { useMemo, useState } from "react";

type CalendarProps = {
  className?: string;
  onSelect: (date: Date) => void;
  selected?: Date;
};

const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function sameDay(first: Date, second: Date) {
  return first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth() && first.getDate() === second.getDate();
}

export function Calendar({ className = "", onSelect, selected }: CalendarProps) {
  const initialDate = selected ?? new Date();
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));

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

  return <div className={`calendar-card ${className}`}>
    <div className="calendar-caption flex items-center justify-between rounded-xl px-2 py-2">
      <button type="button" onClick={() => moveMonth(-1)} className="calendar-nav" aria-label="Previous month">
        <svg className="size-4" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
      </button>
      <div className="text-center"><div className="font-display text-sm font-extrabold tracking-tight text-slate-900">{monthNames[visibleMonth.getMonth()]}</div><div className="mt-0.5 text-[0.62rem] font-bold tracking-widest text-slate-400">{visibleMonth.getFullYear()}</div></div>
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
      <button type="button" className="text-xs font-bold text-slate-400 transition hover:text-slate-700" onClick={() => onSelect(new Date())}>Today</button>
      {selected && <div className="text-xs font-semibold text-teal-600">{selected.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>}
    </div>
  </div>;
}
