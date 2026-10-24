import type { ReactNode } from "react";

type FooterIconName = "facebook" | "globe" | "instagram" | "phone" | "youtube";

const iconPaths: Record<FooterIconName, ReactNode> = {
  facebook: <path fill="currentColor" stroke="none" d="M14.1 8.2h2.4V4.3c-.4-.1-1.9-.2-3.6-.2-3.5 0-5.9 2.1-5.9 6.1v3.4H3v4.4h4V29h4.9V18h4.1l.7-4.4h-4.8v-3c0-1.3.4-2.4 2.2-2.4Z" transform="translate(2 -4) scale(.8)" />,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
  instagram: <><rect x="3" y="3" width="18" height="18" rx="5" strokeWidth="2.2" /><circle cx="12" cy="12" r="4.2" strokeWidth="2.2" /><circle cx="17.4" cy="6.7" r="1" fill="currentColor" stroke="none" /></>,
  phone: <path d="M6 3h4l1 5-2.5 1.5a15 15 0 0 0 6 6L16 13l5 1v4a3 3 0 0 1-3 3C9.7 20.5 3.5 14.3 3 6a3 3 0 0 1 3-3Z" />,
  youtube: <><path fill="currentColor" stroke="none" d="M21.6 7.1a2.9 2.9 0 0 0-2-2C17.8 4.6 12 4.6 12 4.6s-5.8 0-7.6.5a2.9 2.9 0 0 0-2 2A30 30 0 0 0 2 12a30 30 0 0 0 .4 4.9 2.9 2.9 0 0 0 2 2c1.8.5 7.6.5 7.6.5s5.8 0 7.6-.5a2.9 2.9 0 0 0 2-2A30 30 0 0 0 22 12a30 30 0 0 0-.4-4.9Z" /><path fill="currentColor" stroke="none" d="m10 15.2 5-3.2-5-3.2Z" className="text-red-500" /></>,
};

function FooterIcon({ name }: { name: FooterIconName }) {
  return <svg aria-hidden="true" className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{iconPaths[name]}</svg>;
}

const footerItems: { icon: FooterIconName; label: string }[] = [
  { icon: "phone", label: "9827142339" },
  { icon: "globe", label: "Website" },
  { icon: "youtube", label: "YouTube" },
  { icon: "facebook", label: "Facebook" },
  { icon: "instagram", label: "Instagram" },
];

export default function Footer() {
  return <footer className="contact-footer relative z-20 flex h-14 w-full min-w-0 max-w-full shrink-0 items-center border-t border-white/10 px-2 text-white shadow-2xl shadow-slate-950/20 lg:px-4">
    <div className="mx-auto flex w-full max-w-screen-2xl min-w-0 items-center gap-3">
      <div className="hidden shrink-0 items-center gap-2 xl:flex">
        <span className="grid size-7 place-items-center rounded-lg border border-white/15 bg-white/10 font-display text-xs font-extrabold shadow-inner">P</span>
        <span><span className="block font-display text-xs font-bold">PAL IT HUB</span><span className="block text-xs text-white/55">Connected workspace</span></span>
      </div>

      <div className="nav-scroll flex min-w-0 flex-1 items-center justify-start gap-1.5 overflow-x-auto md:justify-center">
        {footerItems.map((item) => <div key={item.label} className="footer-chip">
          <span className={`grid size-6 shrink-0 place-items-center rounded-lg ${
            item.icon === "youtube" ? "bg-red-500 text-white"
              : item.icon === "facebook" ? "bg-blue-600 text-white"
                : item.icon === "instagram" ? "bg-gradient-to-br from-fuchsia-500 via-rose-500 to-amber-400 text-white"
                  : "bg-white/10 text-white/80"
          }`}><FooterIcon name={item.icon} /></span>
          <span>{item.label}</span>
        </div>)}
      </div>

      <div className="hidden shrink-0 items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 2xl:flex">
        <span className="size-1.5 rounded-full bg-emerald-300 shadow-sm shadow-emerald-300" />
        All systems online
      </div>
    </div>
  </footer>;
}
