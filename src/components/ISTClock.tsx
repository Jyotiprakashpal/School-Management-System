import { useEffect, useState } from "react";

const timeFormatter = new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
  timeZone: "Asia/Kolkata",
});

function getISTTime() {
  return timeFormatter.format(new Date());
}

function ClockIcon() {
  return <svg aria-hidden="true" className="size-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
}

export default function ISTClock({ className = "" }: { className?: string }) {
  const [time, setTime] = useState(getISTTime);

  useEffect(() => {
    const interval = window.setInterval(() => setTime(getISTTime()), 1_000);
    return () => window.clearInterval(interval);
  }, []);

  return <div className={`relative items-center gap-3 overflow-hidden rounded-xl border border-teal-100 bg-gradient-to-r from-white via-teal-50 to-cyan-50 px-3 py-2 shadow-sm shadow-teal-900/5 ${className}`} title="Indian Standard Time">
    <span className="pointer-events-none absolute -right-4 -top-5 size-14 rounded-full bg-cyan-300/25 blur-xl" />
    <span className="ist-clock-icon relative grid size-8 shrink-0 place-items-center rounded-lg shadow-md">
      <ClockIcon />
      <span className="absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
    </span>
    <time className="relative block whitespace-nowrap font-display text-sm font-bold tabular-nums tracking-wide text-slate-800">{time}</time>
  </div>;
}
