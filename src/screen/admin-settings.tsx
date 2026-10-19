import { useState, type ReactNode } from "react";
import { Button, Dropdown, FileUpload, Input, useToast } from "../components";
import Header from "../ui/header";

type IconName = "backup" | "calendar" | "check" | "cloud" | "database" | "download" | "key" | "mail" | "refresh" | "settings" | "shield" | "upload";

const paths: Record<IconName, ReactNode> = {
  backup: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  cloud: <path d="M17.5 19H7a5 5 0 1 1 1.7-9.7A6.5 6.5 0 0 1 21 12.5 3.5 3.5 0 0 1 17.5 19Z" />,
  database: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></>,
  download: <><path d="M12 3v13M7 11l5 5 5-5M4 21h16" /></>,
  key: <><circle cx="8" cy="15" r="4" /><path d="m11 12 8-8m-3 3 2 2m-5 1 2 2" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  refresh: <><path d="M20 11a8 8 0 0 0-14.8-4L3 10" /><path d="M3 4v6h6M4 13a8 8 0 0 0 14.8 4L21 14M21 20v-6h-6" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A8 8 0 0 0 15 6l-.3-2.6h-4L10.4 6A8 8 0 0 0 8 7.2l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 2.4 1.2l.3 2.6h4l.3-2.6a8 8 0 0 0 2.4-1.2l2.4 1 2-3.4-2-1.5A7 7 0 0 0 19 12Z" /></>,
  shield: <><path d="M12 3 4.5 6v5.5c0 4.6 3.2 7.8 7.5 9.5 4.3-1.7 7.5-4.9 7.5-9.5V6L12 3Z" /><path d="m9 12 2 2 4-4" /></>,
  upload: <><path d="M12 16V3M7 8l5-5 5 5M4 21h16" /></>,
};

function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

const savedBackups = [
  { id: 1, name: "school_full_2026-09-28.zip", date: "28 Sep 2026, 06:25", size: "22.1 MB" },
  { id: 2, name: "school_full_2026-09-27.zip", date: "27 Sep 2026, 09:45", size: "22.0 MB" },
  { id: 3, name: "school_full_2026-09-26.zip", date: "26 Sep 2026, 02:05", size: "21.8 MB" },
];

export default function AdminSettings() {
  const [automaticBackup, setAutomaticBackup] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoreFile, setRestoreFile] = useState("");
  const [recoveryKey, setRecoveryKey] = useState("");
  const [restoreConfirmation, setRestoreConfirmation] = useState("");
  const [cloudConnected, setCloudConnected] = useState(true);
  const [savingEmail, setSavingEmail] = useState(false);
  const { showToast } = useToast();

  const createBackup = async () => {
    setCreating(true);
    await new Promise((resolve) => window.setTimeout(resolve, 1600));
    setCreating(false);
    showToast("A verified system backup is ready to download.", { title: "Backup created" });
  };

  const restore = () => {
    if (!restoreFile || restoreConfirmation !== "RESTORE") return;
    showToast(`${restoreFile} passed validation and is ready for restoration.`, { title: "Backup validated", tone: "info" });
    setRestoreConfirmation("");
  };

  const saveEmail = async () => {
    setSavingEmail(true);
    await new Promise((resolve) => window.setTimeout(resolve, 600));
    setSavingEmail(false);
    showToast("Email backup settings have been updated.", { title: "Settings saved" });
  };

  return <div className="min-h-screen dashboard-bg pb-20">
    <Header title="Admin Settings" subtitle="Backup, restore, and recovery" />
    <main className="mx-auto max-w-7xl space-y-4 p-3 sm:space-y-5 sm:p-6 xl:p-8">
      <section className="panel overflow-hidden">
        <div className="admin-backup-hero grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-start gap-4">
            <span className="settings-icon-solid grid size-12 shrink-0 place-items-center rounded-2xl"><Icon name="refresh" className="size-6" /></span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-display text-lg font-bold text-slate-950">Automatic Backup</div>
                <span className={automaticBackup ? "status-success items-center gap-1.5" : "status-neutral"}><span className={`size-1.5 rounded-full ${automaticBackup ? "bg-emerald-500" : "bg-slate-400"}`} />{automaticBackup ? "On · every day" : "Off"}</span>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-500">Last completed today at 06:25. Five recent recovery points are retained.</p>
              <div className="mt-4 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                <span className="flex items-center gap-2"><Icon name="database" className="size-4 text-teal-600" /><strong>Local backup:</strong> Healthy</span>
                <span className="flex items-center gap-2"><Icon name="cloud" className="size-4 text-teal-600" /><strong>Google Drive:</strong> Connected</span>
                <span className="flex items-center gap-2"><Icon name="mail" className="size-4 text-teal-600" /><strong>Email:</strong> Configured</span>
                <span className="flex items-center gap-2"><Icon name="shield" className="size-4 text-teal-600" /><strong>Encryption:</strong> Enabled</span>
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-64 lg:grid-cols-1">
            <Dropdown id="backup-frequency" label="Schedule" defaultValue="Daily" options={[{ label: "Every day", value: "Daily" }, { label: "Every week", value: "Weekly" }, { label: "Every month", value: "Monthly" }]} />
            <Button variant="outline" className={`!inline-flex w-full items-center justify-between gap-3 ${automaticBackup ? "settings-selected" : ""}`} onClick={() => setAutomaticBackup((enabled) => !enabled)}>
              <span>{automaticBackup ? "Automatic backup on" : "Automatic backup off"}</span>
              <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${automaticBackup ? "settings-switch-on" : "bg-slate-200"}`}><span className={`absolute top-1 size-4 rounded-full bg-white shadow-sm transition ${automaticBackup ? "left-6" : "left-1"}`} /></span>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="flex flex-col rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-500 text-white shadow-sm"><Icon name="download" /></span>
            <div className="min-w-0"><div className="font-display text-base font-bold text-slate-900">Download Full Backup</div><p className="mt-1 text-xs leading-5 text-slate-500">Download the database, documents, users, and configuration.</p></div>
          </div>
          <Button className="mt-5 w-full sm:w-fit" onClick={() => showToast("Your encrypted backup download has started.", { title: "Download started" })} icon={<Icon name="download" />}>Download Full Backup</Button>
        </section>
        <section className="flex flex-col rounded-2xl border border-amber-100 bg-amber-50/70 p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <span className={`grid size-11 shrink-0 place-items-center rounded-xl bg-amber-500 text-white shadow-sm ${creating ? "animate-pulse" : ""}`}><Icon name="backup" /></span>
            <div className="min-w-0"><div className="font-display text-base font-bold text-slate-900">Create Manual Backup</div><p className="mt-1 text-xs leading-5 text-slate-500">Create a restore point before making important changes.</p></div>
          </div>
          {creating && <div className="mt-4 rounded-xl border border-amber-200 bg-white/70 p-3" role="status" aria-live="polite">
            <div className="flex items-center justify-between gap-3 text-xs"><span className="font-semibold text-amber-800">Encrypting system data...</span><span className="text-amber-600">Please wait</span></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-amber-100"><span className="admin-backup-progress block h-full rounded-full bg-amber-500" /></div>
          </div>}
          <Button variant="warning" className="mt-5 w-full sm:w-fit" onClick={createBackup} isLoading={creating} loadingText="Creating secure backup..." icon={<Icon name="backup" />}>Create Backup Now</Button>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-red-100 bg-red-50/60 shadow-sm">
        <div className="flex items-start gap-4 border-b border-red-100 p-5 sm:p-6">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-red-500 text-white"><Icon name="refresh" /></span>
          <div className="flex-1"><div className="flex flex-wrap items-center gap-2"><div className="font-display text-base font-bold text-slate-900">Restore Backup</div><span className="status-danger">Replaces current data</span></div><p className="mt-1 text-xs leading-5 text-slate-500">Upload a trusted backup archive. A safety backup is created before restoration begins.</p></div>
        </div>
        <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-2">
          <FileUpload id="restore-backup-file" accept=".zip,.sql" title="Choose backup file" hint="Drop a ZIP or SQL backup here, or browse your device." fileName={restoreFile} onFileSelect={(file) => setRestoreFile(file?.name ?? "")} />
          <FileUpload id="restore-recovery-key" accept=".key" title="Choose recovery key" hint="Optional: select the KEY file used to encrypt this backup." fileName={recoveryKey} onFileSelect={(file) => setRecoveryKey(file?.name ?? "")} />
          <div className="lg:col-span-2">
            <Input id="restore-confirmation" label='Type "RESTORE" to confirm' placeholder="RESTORE" value={restoreConfirmation} onChange={(event) => setRestoreConfirmation(event.target.value)} />
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-red-100 bg-white/40 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-red-700">Only restore backups from a trusted source.</p>
          <Button variant="danger" className="w-full sm:w-auto" disabled={!restoreFile || restoreConfirmation !== "RESTORE"} onClick={restore} icon={<Icon name="refresh" />}>Restore Now</Button>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-400 text-amber-950"><Icon name="key" /></span>
          <div className="flex-1"><div className="font-display text-base font-bold text-slate-900">Backup Recovery Key</div><p className="mt-1 text-xs leading-5 text-slate-500">Keep an offline copy. Encrypted backups cannot be restored on another device without this key.</p></div>
          <Button variant="warning" className="w-full sm:w-auto" onClick={() => showToast("Your recovery key download has started.", { title: "Recovery key" })} icon={<Icon name="key" />}>Download Recovery Key</Button>
        </div>
      </section>

      <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-600 text-white"><Icon name="cloud" /></span>
          <div className="flex-1"><div className="flex flex-wrap items-center gap-2"><div className="font-display text-base font-bold text-slate-900">Google Drive Cloud Backup</div><span className={cloudConnected ? "status-success" : "status-neutral"}>{cloudConnected ? "Connected" : "Not connected"}</span></div><p className="mt-1 text-xs leading-5 text-slate-500">Store an additional encrypted copy securely in Google Drive.</p></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {cloudConnected && <Button className="w-full sm:w-auto" onClick={() => showToast("The latest backup is uploading to Google Drive.", { title: "Cloud upload started" })} icon={<Icon name="upload" />}>Upload to Drive</Button>}
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setCloudConnected((connected) => !connected)}>{cloudConnected ? "Disconnect" : "Connect Drive"}</Button>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-title justify-start gap-3"><span className="settings-icon grid size-9 place-items-center rounded-xl"><Icon name="mail" /></span><div><div className="font-display text-sm font-bold text-slate-900">Email Backup</div><p className="mt-0.5 text-xs text-slate-400">Send encrypted backups to trusted administrators</p></div></div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
          <Input id="sender-email" type="email" label="Sender email" defaultValue="school@gmail.com" />
          <Input id="app-password" type="password" label="App password" placeholder="16-character password" />
          <div className="sm:col-span-2"><Input id="backup-recipients" type="email" label="Backup recipients" defaultValue="owner@gmail.com, principal@gmail.com" /></div>
          <Input id="mail-server" label="Mail server" defaultValue="smtp.gmail.com" />
          <Input id="mail-port" label="Port" defaultValue="587" />
          <div className="flex items-end sm:col-span-2">
            <Button className="w-full" onClick={saveEmail} isLoading={savingEmail} loadingText="Saving settings..." icon={<Icon name="settings" />}>Save Email Settings</Button>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <div className="flex items-center gap-2"><Icon name="backup" className="size-5 text-teal-600" /><div className="font-display text-sm font-bold text-slate-900">Saved Backups</div></div>
          <span className="status-info">{savedBackups.length} available</span>
        </div>
        <div className="overflow-hidden sm:overflow-x-auto">
          <table className="module-table">
            <thead><tr><th>File name</th><th>Date</th><th>Size</th><th>Security</th><th>Action</th></tr></thead>
            <tbody>{savedBackups.map((backup) => <tr key={backup.id}>
              <td data-label="File name"><div className="min-w-0"><div className="break-all font-semibold text-slate-800">{backup.name}</div><div className="mt-1 text-xs text-slate-400">Full system backup</div></div></td>
              <td data-label="Date">{backup.date}</td>
              <td data-label="Size">{backup.size}</td>
              <td data-label="Security"><span className="status-success inline-flex items-center gap-1"><Icon name="check" className="size-3" />Verified</span></td>
              <td data-label="Action"><Button variant="outline" className="w-full sm:w-auto" onClick={() => showToast(`${backup.name} is downloading.`, { title: "Download started" })} icon={<Icon name="download" className="size-4 text-teal-600" />}>Download</Button></td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>
    </main>
  </div>;
}
