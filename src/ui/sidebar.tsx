import type { ReactNode } from "react";
import { navigation, type NavigationIconName } from "../models/navigation";
import { ThemePicker } from "./theme";

const iconPaths: Record<NavigationIconName, ReactNode> = {
  admission: <><path d="M12 3v18M3 12h18" /><circle cx="12" cy="12" r="9" /></>,
  arrow: <path d="m9 18 6-6-6-6" />,
  attendance: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18m-13 5 2 2 5-5" /></>,
  book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" /><path d="M8 8h8M8 12h6" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
  chart: <path d="M4 19V9M10 19V5M16 19v-7M22 19V3" />,
  checklist: <><path d="m4 6 1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17" /><path d="M11 6h9M11 12h9M11 18h9" /></>,
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  expense: <><path d="M7 3h10v18H7z" /><path d="M9.5 7h5M9.5 11h5M9.5 15h3" /></>,
  fee: <><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M3 10h18M7 3v6M17 3v6" /></>,
  notice: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  people: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9" /></>,
  person: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  report: <><path d="M5 3h14v18H5z" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A8 8 0 0 0 15 6l-.3-2.6h-4L10.4 6A8 8 0 0 0 8 7.2l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 2.4 1.2l.3 2.6h4l.3-2.6a8 8 0 0 0 2.4-1.2l2.4 1 2-3.4-2-1.5a7 7 0 0 0 .2-1.1Z" /></>,
  wallet: <><path d="M4 6h14a2 2 0 0 1 2 2v11H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h13" /><path d="M16 11h6v5h-6a2.5 2.5 0 0 1 0-5Z" /></>,
  whatsapp: <><path d="M21 11.5a9 9 0 0 1-13.3 7.9L3 21l1.6-4.5A9 9 0 1 1 21 11.5Z" /><path d="M8 8c1 4 3 6 7 7" /></>,
  zap: <path d="m13 2-9 12h8l-1 8 9-13h-8l1-7Z" />,
};

function MenuIcon({ name, className = "size-5" }: { name: NavigationIconName; className?: string }) {
  return <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{iconPaths[name]}</svg>;
}

type SidebarProps = {
  active: string;
  onClose: () => void;
  onSelect: (item: string) => void;
  open: boolean;
};

export default function Sidebar({ active, onClose, onSelect, open }: SidebarProps) {
  return <>
    {open && <button className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden" aria-label="Close navigation overlay" onClick={onClose} />}
    <aside className={`sidebar fixed inset-y-0 left-0 z-40 flex w-72 flex-col text-white transition-transform duration-300 lg:w-64 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
        <div className="grid size-11 place-items-center rounded-2xl bg-white text-emerald-700 shadow-xl shadow-black/10 ring-1 ring-white/60"><MenuIcon name="book" /></div>
        <div className="min-w-0 flex-1"><div className="font-display truncate text-sm font-extrabold tracking-tight">PAL IT HUB</div><div className="mt-0.5 text-[0.65rem] font-medium truncate text-emerald-100/70">School Management System</div></div>
        <button onClick={onClose} aria-label="Close navigation" className="grid size-9 place-items-center rounded-lg bg-white/10 text-white lg:hidden"><MenuIcon name="arrow" className="size-4 rotate-180" /></button>
      </div>
      <nav className="nav-scroll mt-2 flex-1 overflow-y-auto pb-2">
        {navigation.map((section) => <section key={section.title}>
          <div className="px-5 pb-1 pt-4 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-emerald-100/55">{section.title}</div>
          {section.items.map((item) => <button
            key={item.label}
            onClick={() => { onSelect(item.label); onClose(); }}
            className={`side-link ${active === item.label ? "side-link-active" : ""} ${item.accent ? `side-link-${item.accent}` : ""}`}
          ><MenuIcon name={item.icon} className="size-[1.05rem] shrink-0" /><span>{item.label}</span></button>)}
        </section>)}
        <div className="mx-3 mb-3 mt-2 border-t border-white/10 pt-3">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/10 px-3 py-2.5">
            <div>
              <div className="text-xs font-semibold text-white">Appearance</div>
              <div className="mt-0.5 text-xs text-emerald-100/65">Theme color</div>
            </div>
            <ThemePicker />
          </div>
        </div>
      </nav>
    </aside>
  </>;
}
