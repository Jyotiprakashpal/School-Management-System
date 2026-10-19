import { useState, type ReactNode } from "react";
import { Button, Dropdown, Input, useToast } from "../../components";
import Header from "../../ui/header";
import { useTheme, type ThemeName } from "../../ui/theme";

type SectionId = "general" | "academic" | "notifications" | "appearance" | "security";
type IconName = "bell" | "book" | "building" | "check" | "clock" | "globe" | "lock" | "mail" | "palette" | "phone" | "save" | "settings" | "shield";

const paths: Record<IconName, ReactNode> = {
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
  book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" /><path d="M8 8h8M8 12h6" /></>,
  building: <><path d="M4 21V5l8-3 8 3v16M9 21v-4h6v4" /><path d="M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  palette: <><path d="M12 3a9 9 0 0 0 0 18h1.5a2 2 0 0 0 0-4H12a2 2 0 0 1 0-4h4a5 5 0 0 0 5-5c0-3-4-5-9-5Z" /><path d="M7.5 10h.01M9 6.5h.01M14 6h.01M17 8.5h.01" /></>,
  phone: <path d="M6 3h4l1 5-2.5 1.5a15 15 0 0 0 6 6L16 13l5 1v4a3 3 0 0 1-3 3C9.7 20.5 3.5 14.3 3 6a3 3 0 0 1 3-3Z" />,
  save: <><path d="M5 3h12l3 3v15H4V3Z" /><path d="M8 3v6h8V3M8 21v-7h8v7" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A8 8 0 0 0 15 6l-.3-2.6h-4L10.4 6A8 8 0 0 0 8 7.2l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 2.4 1.2l.3 2.6h4l.3-2.6a8 8 0 0 0 2.4-1.2l2.4 1 2-3.4-2-1.5A7 7 0 0 0 19 12Z" /></>,
  shield: <><path d="M12 3 4.5 6v5.5c0 4.6 3.2 7.8 7.5 9.5 4.3-1.7 7.5-4.9 7.5-9.5V6L12 3Z" /><path d="m9 12 2 2 4-4" /></>,
};

function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

const sections: { id: SectionId; label: string; description: string; icon: IconName }[] = [
  { id: "general", label: "School Profile", description: "Identity and contact details", icon: "building" },
  { id: "academic", label: "Academic Setup", description: "Year, classes and localization", icon: "book" },
  { id: "notifications", label: "Notifications", description: "Email, SMS and reminders", icon: "bell" },
  { id: "appearance", label: "Appearance", description: "Theme and display preferences", icon: "palette" },
  { id: "security", label: "Security", description: "Sessions and account protection", icon: "shield" },
];

function SectionHeader({ icon, title, copy }: { icon: IconName; title: string; copy: string }) {
  return <div className="flex items-start gap-3 border-b border-slate-100 p-4 sm:p-6">
    <span className="settings-icon grid size-9 shrink-0 place-items-center rounded-xl sm:size-10"><Icon name={icon} /></span>
    <div><div className="font-display text-base font-bold text-slate-900">{title}</div><p className="mt-1 text-xs leading-5 text-slate-500">{copy}</p></div>
  </div>;
}

function ToggleRow({ checked, copy, icon, label, onChange }: { checked: boolean; copy: string; icon: IconName; label: string; onChange: () => void }) {
  return <Button variant="outline" aria-pressed={checked} onClick={onChange} className={`flex min-h-16 w-full items-center justify-between gap-2 p-3 text-left sm:min-h-20 sm:gap-4 sm:p-4 ${checked ? "settings-selected" : ""}`}>
    <span className="flex min-w-0 items-center gap-2.5 sm:gap-3">
      <span className={`grid size-9 shrink-0 place-items-center rounded-xl sm:size-10 ${checked ? "settings-icon-solid" : "settings-icon"}`}><Icon name={icon} /></span>
      <span className="min-w-0"><span className="block text-xs font-semibold text-slate-800 sm:text-sm">{label}</span><span className="mt-1 hidden text-xs font-normal leading-5 text-slate-500 sm:block">{copy}</span></span>
    </span>
    <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "settings-switch-on" : "bg-slate-200"}`}><span className={`absolute top-1 size-4 rounded-full bg-white shadow-sm transition ${checked ? "left-6" : "left-1"}`} /></span>
  </Button>;
}

export default function Settings() {
  const [activeSection, setActiveSection] = useState<SectionId>("general");
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    fee: true,
    attendance: false,
    reports: true,
    product: false,
  });
  const [security, setSecurity] = useState({ twoFactor: true, loginAlerts: true });
  const { density, setDensity, theme, setTheme } = useTheme();
  const { showToast } = useToast();

  const save = async () => {
    setSaving(true);
    await new Promise((resolve) => window.setTimeout(resolve, 650));
    setSaving(false);
    showToast(`${sections.find((section) => section.id === activeSection)?.label} preferences have been updated.`, { title: "Settings saved" });
  };

  const toggleNotification = (key: keyof typeof notifications) => setNotifications((current) => ({ ...current, [key]: !current[key] }));

  return <div className="min-h-screen dashboard-bg pb-20">
    <Header title="Settings" subtitle="Personalize your institution and application preferences" />
    <main className="mx-auto max-w-7xl p-3 sm:p-6 xl:p-8">
      <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start lg:gap-6">
        <aside className="panel p-2 lg:sticky lg:top-28 lg:p-3">
          <div className="hidden px-3 pb-3 pt-2 text-xs font-bold uppercase tracking-wider text-slate-400 lg:block">Settings menu</div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:block lg:space-y-1">
            {sections.map((section) => <Button key={section.id} variant="outline" onClick={() => setActiveSection(section.id)} className={`flex min-h-12 w-full items-center justify-start gap-2 border-transparent px-2.5 text-left shadow-none sm:px-3 lg:min-h-16 lg:gap-3 ${activeSection === section.id ? "settings-selected" : "bg-transparent hover:bg-slate-50"}`}>
              <span className={`grid size-8 shrink-0 place-items-center rounded-lg lg:size-9 lg:rounded-xl ${activeSection === section.id ? "settings-icon-solid" : "settings-icon"}`}><Icon name={section.icon} className="size-4" /></span>
              <span><span className="block whitespace-nowrap text-xs font-bold">{section.label}</span><span className="mt-0.5 hidden text-xs font-normal text-slate-400 lg:block">{section.description}</span></span>
            </Button>)}
          </div>
          <div className="mt-3 hidden rounded-xl bg-slate-50 p-4 lg:block">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700"><Icon name="check" className="size-4 text-teal-600" />All changes synced</div>
            <p className="mt-2 text-xs leading-5 text-slate-400">Last saved today at 18:04</p>
          </div>
        </aside>

        <div className="space-y-5">
          {activeSection === "general" && <section className="panel">
            <SectionHeader icon="building" title="School Profile" copy="This information appears on receipts, reports, certificates, and official communication." />
            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:gap-5 sm:p-6">
              <div className="sm:col-span-2">
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 sm:flex-row sm:items-center">
                  <div className="settings-icon-solid grid size-14 shrink-0 place-items-center rounded-2xl font-display text-lg font-extrabold sm:size-16 sm:text-xl">PH</div>
                  <div className="flex-1"><div className="text-sm font-bold text-slate-900">Institution logo</div><p className="mt-1 text-xs leading-5 text-slate-500">Use a square PNG or JPG for the best result on documents.</p></div>
                  <Button variant="outline" className="w-full sm:w-auto" onClick={() => showToast("Logo upload is ready.", { title: "Choose school logo", tone: "info" })}>Change logo</Button>
                </div>
              </div>
              <Input id="school-name" label="Institution name" defaultValue="PAL IT HUB" />
              <Input id="school-code" label="School code" defaultValue="PAL-EDU-2026" />
              <Input id="school-email" type="email" label="Official email" defaultValue="admin@palithub.edu" startIcon={<Icon name="mail" className="size-4" />} />
              <Input id="school-phone" type="tel" label="Phone number" defaultValue="+91 77555 67890" startIcon={<Icon name="phone" className="size-4" />} />
              <div className="sm:col-span-2"><Input id="school-address" label="School address" defaultValue="12 Knowledge Park, Lucknow, Uttar Pradesh 226010" /></div>
              <Input id="school-website" label="Website" defaultValue="www.pal.education" startIcon={<Icon name="globe" className="size-4" />} />
              <Input id="school-principal" label="Principal / Director" defaultValue="Dr. Amit Verma" />
            </div>
          </section>}

          {activeSection === "academic" && <section className="panel">
            <SectionHeader icon="book" title="Academic & Regional Setup" copy="Choose defaults used across attendance, fees, examinations, and reports." />
            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:gap-5 sm:p-6">
              <Dropdown id="academic-year" label="Current academic year" defaultValue="2027–28" options={[{ label: "2026–27", value: "2026–27" }, { label: "2027–28", value: "2027–28" }, { label: "2028–29", value: "2028–29" }]} />
              <Dropdown id="week-start" label="Week starts on" defaultValue="Monday" options={[{ label: "Monday", value: "Monday" }, { label: "Sunday", value: "Sunday" }]} />
              <Dropdown id="language" label="Application language" defaultValue="English" options={[{ label: "English", value: "English" }, { label: "Hindi", value: "Hindi" }]} />
              <Dropdown id="timezone" label="Timezone" defaultValue="Asia/Kolkata" options={[{ label: "India Standard Time (UTC+05:30)", value: "Asia/Kolkata" }, { label: "UTC", value: "UTC" }]} />
              <Dropdown id="date-format" label="Date format" defaultValue="DD MMM YYYY" options={[{ label: "26 Sep 2026", value: "DD MMM YYYY" }, { label: "26/09/2026", value: "DD/MM/YYYY" }, { label: "09/26/2026", value: "MM/DD/YYYY" }]} />
              <Dropdown id="currency" label="Currency" defaultValue="INR" options={[{ label: "Indian Rupee (₹)", value: "INR" }, { label: "US Dollar ($)", value: "USD" }]} />
              <div className="settings-callout sm:col-span-2 flex items-start gap-3 rounded-xl border p-4 text-xs leading-5"><Icon name="clock" className="mt-0.5 size-4 shrink-0" /><p>Changing the academic year updates the default selection across modules but does not alter historical records.</p></div>
            </div>
          </section>}

          {activeSection === "notifications" && <section className="panel">
            <SectionHeader icon="bell" title="Notification Preferences" copy="Control which updates administrators receive and how they are delivered." />
            <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
              <ToggleRow checked={notifications.email} onChange={() => toggleNotification("email")} icon="mail" label="Email notifications" copy="Deliver important updates to the official email." />
              <ToggleRow checked={notifications.sms} onChange={() => toggleNotification("sms")} icon="phone" label="SMS notifications" copy="Send urgent alerts to the registered mobile number." />
              <ToggleRow checked={notifications.fee} onChange={() => toggleNotification("fee")} icon="bell" label="Fee collection summary" copy="Receive a daily collection and dues overview." />
              <ToggleRow checked={notifications.attendance} onChange={() => toggleNotification("attendance")} icon="book" label="Attendance alerts" copy="Notify when class attendance is not submitted." />
              <ToggleRow checked={notifications.reports} onChange={() => toggleNotification("reports")} icon="clock" label="Scheduled reports" copy="Confirm when recurring reports are ready." />
              <ToggleRow checked={notifications.product} onChange={() => toggleNotification("product")} icon="settings" label="Product updates" copy="Learn about new features and improvements." />
            </div>
          </section>}

          {activeSection === "appearance" && <section className="panel">
            <SectionHeader icon="palette" title="Appearance" copy="Select an accent theme that is applied instantly throughout the application." />
            <div className="p-4 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
                {([
                  { id: "teal", label: "Teal", copy: "Calm and professional", preview: "from-teal-700 via-teal-600 to-cyan-400", soft: "bg-teal-50", accent: "text-teal-600" },
                  { id: "violet", label: "Violet", copy: "Modern and expressive", preview: "from-violet-700 via-violet-600 to-fuchsia-400", soft: "bg-violet-50", accent: "text-violet-600" },
                  { id: "blue", label: "Blue", copy: "Classic and focused", preview: "from-blue-800 via-blue-700 to-sky-400", soft: "bg-blue-50", accent: "text-blue-600" },
                ] as { id: ThemeName; label: string; copy: string; preview: string; soft: string; accent: string }[]).map((item) => <Button key={item.id} variant="outline" aria-pressed={theme === item.id} onClick={() => setTheme(item.id)} className={`group relative min-h-44 w-full flex-col items-stretch justify-start overflow-hidden rounded-2xl border-slate-200 bg-white !p-2 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg ${theme === item.id ? "settings-theme-selected" : ""}`}>
                  <span className={`relative block h-24 overflow-hidden rounded-xl bg-gradient-to-br ${item.preview}`}>
                    <span className="absolute -right-5 -top-7 size-20 rounded-full bg-white/15" />
                    <span className="absolute -bottom-8 right-7 size-16 rounded-full bg-white/10" />
                    <span className="absolute inset-3 flex overflow-hidden rounded-lg border border-white/25 bg-white/95 shadow-lg">
                      <span className={`w-6 shrink-0 bg-gradient-to-b ${item.preview}`}>
                        <span className="mx-auto mt-2 block size-2 rounded-full bg-white/90" />
                        <span className="mx-auto mt-3 block h-1 w-3 rounded-full bg-white/45" />
                        <span className="mx-auto mt-2 block h-1 w-3 rounded-full bg-white/45" />
                      </span>
                      <span className="min-w-0 flex-1 p-2">
                        <span className="block h-1.5 w-1/2 rounded-full bg-slate-200" />
                        <span className="mt-2 grid grid-cols-3 gap-1">
                          <span className={`h-5 rounded ${item.soft}`} />
                          <span className={`h-5 rounded ${item.soft}`} />
                          <span className={`h-5 rounded ${item.soft}`} />
                        </span>
                        <span className="mt-2 block h-1.5 w-full rounded-full bg-slate-100" />
                        <span className="mt-1 block h-1.5 w-4/5 rounded-full bg-slate-100" />
                      </span>
                    </span>
                    {theme === item.id && <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full border border-white/30 bg-white text-slate-900 shadow-md"><Icon name="check" className="size-4" /></span>}
                  </span>
                  <span className="flex w-full min-w-0 items-center gap-3 px-2 pb-2 pt-3">
                    <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${item.soft} ${item.accent}`}><Icon name="palette" className="size-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-slate-900">{item.label}</span>
                      <span className="mt-0.5 block truncate text-xs font-normal text-slate-400">{item.copy}</span>
                    </span>
                    <span className={`size-2.5 shrink-0 rounded-full bg-gradient-to-br ${item.preview} ring-4 ring-slate-50`} />
                  </span>
                </Button>)}
              </div>
              <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="settings-icon grid size-10 shrink-0 place-items-center rounded-xl"><Icon name="settings" className="size-4" /></span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-slate-800">Display density</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">{density === "compact" ? "Compact spacing shows more information with tighter controls." : "Comfortable spacing provides more room between controls and content."}</span>
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
                  {([
                    { id: "comfortable", label: "Comfortable", bars: ["w-8", "w-6", "w-7"] },
                    { id: "compact", label: "Compact", bars: ["w-8", "w-7", "w-8"] },
                  ] as const).map((item) => <Button key={item.id} variant="outline" aria-pressed={density === item.id} onClick={() => setDensity(item.id)} className={`min-h-12 w-full justify-between gap-2 border-transparent px-3 shadow-none ${density === item.id ? "settings-selected" : "bg-transparent hover:bg-slate-50"}`}>
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className={`flex shrink-0 flex-col rounded-lg border p-1.5 ${density === item.id ? "border-current/20 bg-white/70" : "border-slate-200 bg-white"}`}>
                        {item.bars.map((width, index) => <span key={`${item.id}-${index}`} className={`${index ? "mt-1" : ""} block h-1 rounded-full ${width} ${density === item.id ? "bg-current/55" : "bg-slate-300"}`} />)}
                      </span>
                      <span className="truncate text-xs font-bold">{item.label}</span>
                    </span>
                    {density === item.id && <span className="settings-icon-solid grid size-5 shrink-0 place-items-center rounded-full"><Icon name="check" className="size-3" /></span>}
                  </Button>)}
                </div>
              </div>
            </div>
          </section>}

          {activeSection === "security" && <section className="panel">
            <SectionHeader icon="shield" title="Security Preferences" copy="Strengthen administrator access and control inactive sessions." />
            <div className="space-y-4 p-4 sm:p-6">
              <ToggleRow checked={security.twoFactor} onChange={() => setSecurity((current) => ({ ...current, twoFactor: !current.twoFactor }))} icon="shield" label="Two-factor authentication" copy="Require a verification code when an administrator signs in." />
              <ToggleRow checked={security.loginAlerts} onChange={() => setSecurity((current) => ({ ...current, loginAlerts: !current.loginAlerts }))} icon="bell" label="New login alerts" copy="Notify administrators when a new browser or device signs in." />
              <div className="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-5 sm:grid-cols-[1fr_auto] sm:items-end">
                <Dropdown id="session-timeout" label="Automatic session timeout" defaultValue="30" options={[{ label: "15 minutes", value: "15" }, { label: "30 minutes", value: "30" }, { label: "1 hour", value: "60" }, { label: "4 hours", value: "240" }]} />
                <Button variant="outline" className="!inline-flex w-full items-center justify-center gap-2 sm:w-auto" onClick={() => showToast("All other sessions have been ended.", { title: "Sessions secured" })} icon={<Icon name="lock" />}>Sign out other sessions</Button>
              </div>
              <div className="settings-callout flex items-start gap-3 rounded-xl border p-4 text-xs leading-5"><Icon name="shield" className="mt-0.5 size-4 shrink-0" /><p><strong>Security status:</strong> Your administrator account has strong protection enabled. Last security review was completed today.</p></div>
            </div>
          </section>}

          <div className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div><div className="text-sm font-bold text-slate-800">Ready to apply your changes?</div><p className="mt-1 text-xs text-slate-400">Settings are applied immediately after saving.</p></div>
            <Button className="w-full sm:w-auto" onClick={save} isLoading={saving} loadingText="Saving changes..." icon={<Icon name="save" />}>Save Changes</Button>
          </div>
        </div>
      </div>
    </main>
  </div>;
}
