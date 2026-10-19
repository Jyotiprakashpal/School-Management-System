import { useState, type FormEvent, type ReactNode } from "react";
import { Button, Dropdown, Input, TerminateSessionPopup, useToast } from "../../components";
import Header from "../../ui/header";

type TabId = "users" | "activity" | "sessions";
type Role = "Superadmin" | "Admin" | "Operator" | "Accountant";
type User = {
  id: number;
  username: string;
  name: string;
  role: Role;
  status: "Active" | "Suspended";
  lastLogin: string;
};
type LoginSession = {
  active: string;
  device: string;
  id: number;
  location: string;
  user: string;
};
type IconName = "activity" | "calendar" | "check" | "key" | "lock" | "plus" | "settings" | "shield" | "users";

const iconPaths: Record<IconName, ReactNode> = {
  activity: <><path d="M3 12h4l2-6 4 12 2-6h6" /><circle cx="12" cy="12" r="9" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  key: <><circle cx="8" cy="15" r="4" /><path d="m11 12 8-8m-3 3 2 2m-5 1 2 2" /></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A8 8 0 0 0 15 6l-.3-2.6h-4L10.4 6A8 8 0 0 0 8 7.2l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 2.4 1.2l.3 2.6h4l.3-2.6a8 8 0 0 0 2.4-1.2l2.4 1 2-3.4-2-1.5A7 7 0 0 0 19 12Z" /></>,
  shield: <><path d="M12 3 4.5 6v5.5c0 4.6 3.2 7.8 7.5 9.5 4.3-1.7 7.5-4.9 7.5-9.5V6L12 3Z" /><path d="m9 12 2 2 4-4" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
};

function Icon({ name, className = "size-4" }: { name: IconName; className?: string }) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{iconPaths[name]}</svg>;
}

const tabs: { id: TabId; label: string; icon: IconName }[] = [
  { id: "users", label: "Users", icon: "users" },
  { id: "activity", label: "Activity", icon: "activity" },
  { id: "sessions", label: "Sessions", icon: "calendar" },
];

const initialUsers: User[] = [
  { id: 1, username: "superadmin", name: "Super Administrator", role: "Superadmin", status: "Active", lastLogin: "26 Sep 2026, 17:58" },
  { id: 2, username: "admin", name: "Administrator", role: "Admin", status: "Active", lastLogin: "26 Sep 2026, 14:35" },
  { id: 3, username: "RAJKUMAR", name: "Raj Kumar", role: "Operator", status: "Active", lastLogin: "20 Sep 2026, 21:15" },
];

const roleStyles: Record<Role, string> = {
  Superadmin: "bg-gradient-to-r from-violet-600 to-cyan-500 text-white",
  Admin: "bg-rose-50 text-rose-600",
  Operator: "bg-blue-50 text-blue-600",
  Accountant: "bg-amber-50 text-amber-700",
};

function PanelTitle({ title, icon }: { title: string; icon: IconName }) {
  return <div className="panel-title justify-start gap-2"><Icon name={icon} className="size-5 text-teal-600" /><div className="font-display text-base font-bold text-slate-900">{title}</div></div>;
}

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState<TabId>("users");
  const [users, setUsers] = useState(initialUsers);
  const [selectedResetUser, setSelectedResetUser] = useState("1");
  const [sessions, setSessions] = useState([
    { id: 1, user: "Super Administrator", device: "Chrome · Windows", location: "Lucknow, India", active: "Current session" },
    { id: 2, user: "Administrator", device: "Chrome · Android", location: "Lucknow, India", active: "12 minutes ago" },
    { id: 3, user: "Raj Kumar", device: "Edge · Windows", location: "Kanpur, India", active: "2 hours ago" },
  ]);
  const [creatingUser, setCreatingUser] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const { showToast } = useToast();

  const createUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get("fullName"));
    setCreatingUser(true);
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    setUsers((current) => [...current, {
      id: Date.now(),
      username: String(form.get("username")),
      name,
      role: String(form.get("role")) as Role,
      status: "Active",
      lastLogin: "Not signed in yet",
    }]);
    setCreatingUser(false);
    formElement.reset();
    showToast(`${name} can now sign in with the new account.`, { title: "User created" });
  };

  const resetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    setResettingPassword(true);
    await new Promise((resolve) => window.setTimeout(resolve, 600));
    setResettingPassword(false);
    const user = users.find((item) => String(item.id) === selectedResetUser);
    showToast(`A new password has been set for ${user?.name ?? "the selected user"}.`, { title: "Password reset" });
    formElement.reset();
  };

  const notify = (title: string, message: string) => showToast(message, { title });

  return <div className="min-h-screen dashboard-bg pb-20">
    <Header title="User Management" subtitle="Manage staff accounts and permissions" />
    <main className="mx-auto max-w-7xl space-y-4 p-3 sm:space-y-5 sm:p-6 xl:p-8">
      <nav className="panel grid grid-cols-3 gap-1.5 p-2 sm:max-w-xl" aria-label="User management sections">
        {tabs.map((tab) => <Button key={tab.id} variant={activeTab === tab.id ? "primary" : "outline"} className="!inline-flex min-h-11 items-center justify-center gap-2 px-2 sm:px-4" onClick={() => setActiveTab(tab.id)} icon={<Icon name={tab.icon} />}>{tab.label}</Button>)}
      </nav>

      {activeTab === "users" && <UsersAndPermissions
        users={users}
        creatingUser={creatingUser}
        resettingPassword={resettingPassword}
        selectedResetUser={selectedResetUser}
        onCreateUser={createUser}
        onResetPassword={resetPassword}
        onSelectResetUser={setSelectedResetUser}
        onNotify={notify}
      />}
      {activeTab === "activity" && <ActivityLog />}
      {activeTab === "sessions" && <Sessions sessions={sessions} onTerminate={(id) => {
        setSessions((current) => current.filter((session) => session.id !== id));
        notify("Session ended", "The selected user session has been securely terminated.");
      }} />}
    </main>
  </div>;
}

function UsersAndPermissions({
  users,
  creatingUser,
  resettingPassword,
  selectedResetUser,
  onCreateUser,
  onResetPassword,
  onSelectResetUser,
  onNotify,
}: {
  users: User[];
  creatingUser: boolean;
  resettingPassword: boolean;
  selectedResetUser: string;
  onCreateUser: (event: FormEvent<HTMLFormElement>) => void;
  onResetPassword: (event: FormEvent<HTMLFormElement>) => void;
  onSelectResetUser: (value: string) => void;
  onNotify: (title: string, message: string) => void;
}) {
  const [permissionUser, setPermissionUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    "Student Management": true,
    "Fee Collection": true,
    "Attendance": true,
    "Examinations": false,
    "Reports": false,
    "Staff & Payroll": false,
    "Notices": true,
    "System Settings": false,
  });

  const savePermissions = () => {
    if (!permissionUser) return;
    setPermissionUser(null);
    onNotify("Permissions updated", `${permissionUser.name}'s module access has been saved.`);
  };

  return <div className="space-y-5">
    <div className="grid gap-5 lg:grid-cols-5 lg:items-start">
      <section className="panel lg:col-span-3">
        <PanelTitle title="Create User" icon="users" />
        <form onSubmit={onCreateUser}>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2"><Input id="full-name" name="fullName" label="Full name" placeholder="Full name" required /></div>
            <Input id="username" name="username" label="Username" placeholder="Used for login" required />
            <Input id="user-password" name="password" type="password" label="Password" placeholder="Minimum 6 characters" minLength={6} required />
            <div className="sm:col-span-2"><Dropdown id="role" name="role" label="Role" defaultValue="Operator" options={[
                { label: "Superadmin — full system access", value: "Superadmin" },
                { label: "Admin — all management features", value: "Admin" },
                { label: "Operator — granted permissions only", value: "Operator" },
                { label: "Accountant — finance permissions", value: "Accountant" },
              ]} /></div>
          </div>
          <div className="border-t border-slate-100 bg-slate-50/60 p-4 sm:flex sm:justify-end sm:px-5"><Button type="submit" className="w-full sm:w-auto" isLoading={creatingUser} loadingText="Creating user..." icon={<Icon name="plus" />}>Create User</Button></div>
        </form>
      </section>

      <section className="panel lg:col-span-2">
        <PanelTitle title="Reset Password" icon="key" />
        <form onSubmit={onResetPassword}>
          <div className="space-y-4 p-5">
            <Dropdown id="reset-user" label="Select user" value={selectedResetUser} onChange={(event) => onSelectResetUser(event.target.value)} options={users.map((user) => ({ label: `${user.name} (${user.username})`, value: String(user.id) }))} />
            <Input id="new-password" type="password" label="New password" placeholder="Minimum 6 characters" minLength={6} required />
          </div>
          <div className="border-t border-slate-100 bg-slate-50/60 p-4 sm:flex sm:justify-end sm:px-5"><Button type="submit" className="w-full sm:w-auto" isLoading={resettingPassword} loadingText="Resetting..." icon={<Icon name="key" />}>Reset Password</Button></div>
        </form>
      </section>
    </div>

    <section className="panel">
      <div className="panel-title">
        <div className="flex items-center gap-2"><Icon name="users" className="size-5 text-teal-600" /><div className="font-display text-base font-bold text-slate-900">Team Accounts</div></div>
        <span className="status-info">{users.length} users</span>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3 sm:p-5">
        {users.map((user) => <article key={user.id} className={`relative flex h-full flex-col overflow-hidden rounded-2xl border bg-gradient-to-br from-white via-white to-emerald-50/60 shadow-lg shadow-slate-900/5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:bg-white sm:shadow-none ${user.role === "Superadmin" ? "user-account-owner" : "border-slate-200"}`}>
          <span className="absolute inset-y-0 left-0 w-1 bg-(--app-accent) sm:hidden" />
          <div className="flex-1 p-3.5 pl-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="metric-icon-teal grid size-11 shrink-0 place-items-center rounded-2xl font-display text-sm font-extrabold shadow-sm ring-2 ring-white sm:size-12 sm:rounded-xl">{user.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span>
              <div className="min-w-0 flex-1">
                <div className="font-display text-sm font-bold leading-5 text-slate-900">{user.name}</div>
                <div className="mt-1 truncate text-xs font-medium text-teal-600">@{user.username}</div>
              </div>
              <span className="status-success items-center gap-1.5 sm:hidden"><span className="size-1.5 rounded-full bg-emerald-500" />{user.status}</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${roleStyles[user.role]}`}><Icon name={user.role === "Superadmin" ? "shield" : user.role === "Admin" ? "settings" : "users"} className="size-3.5" />{user.role}</span>
              <span className="status-success hidden items-center gap-1.5 sm:inline-flex"><span className="size-1.5 rounded-full bg-emerald-500" />{user.status}</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white/80 px-3 py-2.5 shadow-sm sm:mt-4 sm:block sm:rounded-none sm:border-x-0 sm:border-b-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-3 sm:shadow-none">
              <div className="text-[0.62rem] font-bold uppercase tracking-wider text-slate-400 sm:text-xs sm:font-normal sm:normal-case sm:tracking-normal">Last sign in</div>
              <div className="text-right text-xs font-semibold text-slate-600 sm:mt-1 sm:text-left">{user.lastLogin}</div>
            </div>
          </div>
          <div className="border-t border-slate-100 bg-white/80 p-3 sm:bg-slate-50/60">
            {user.role === "Superadmin"
              ? <div className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-500"><Icon name="shield" className="size-4 text-teal-600" />Full system access</div>
              : <Button variant="outline" fullWidth className="!inline-flex min-h-10 items-center justify-center gap-2" onClick={() => setPermissionUser(user)} icon={<Icon name="shield" className="size-4 text-teal-600" />}>Manage Permissions</Button>}
          </div>
        </article>)}
      </div>
    </section>

    {permissionUser && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm" role="presentation" onMouseDown={() => setPermissionUser(null)}>
      <section className="premium-modal w-full max-w-2xl overflow-hidden rounded-3xl bg-white" role="dialog" aria-modal="true" aria-labelledby="permission-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="popup-header flex items-start justify-between p-6 text-white">
          <div className="flex items-start gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15"><Icon name="shield" className="size-5" /></div>
            <div>
              <div id="permission-title" className="font-display text-xl font-bold">Manage Permissions</div>
              <p className="mt-1 text-sm text-white/75">{permissionUser.name} · {permissionUser.role}</p>
            </div>
          </div>
          <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={() => setPermissionUser(null)}>Close</Button>
        </div>

        <div className="bg-gradient-to-b from-slate-50/80 to-white p-3 sm:p-6">
          <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,var(--app-sidebar-start),var(--app-accent-dark)_65%,var(--app-accent))] p-3.5 text-white shadow-lg sm:p-5">
            <span className="pointer-events-none absolute -right-8 -top-10 size-28 rounded-full bg-white/10" />
            <div className="relative flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20 sm:size-10"><Icon name="shield" className="size-4 sm:size-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3"><div className="font-display text-sm font-bold">Module access</div><span className="shrink-0 whitespace-nowrap rounded-full bg-white/15 px-2.5 py-1 text-[0.62rem] font-bold ring-1 ring-white/20 sm:text-[0.65rem]">{Object.values(permissions).filter(Boolean).length} of {Object.keys(permissions).length} enabled</span></div>
                <p className="mt-2 text-[0.68rem] leading-5 text-white/75 sm:mt-1.5 sm:text-xs">Enabled modules appear in this user's sidebar after their next sign in.</p>
              </div>
            </div>
            <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-white/15 sm:mt-4"><div className="h-full rounded-full bg-white transition-all duration-300" style={{ width: `${(Object.values(permissions).filter(Boolean).length / Object.keys(permissions).length) * 100}%` }} /></div>
          </div>
          <div className="mb-2 mt-4 flex items-center justify-between gap-3 px-1 sm:mt-5"><div className="min-w-0"><div className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-500 sm:text-xs">Available modules</div><div className="mt-0.5 truncate text-[0.62rem] text-slate-400 sm:text-[0.68rem]">Tap a module to grant or revoke access</div></div><span className="settings-icon grid size-8 shrink-0 place-items-center rounded-lg sm:size-9 sm:rounded-xl"><Icon name="settings" className="size-3.5 sm:size-4" /></span></div>
          <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
            {Object.entries(permissions).map(([module, enabled]) => <Button key={module} variant="outline" aria-pressed={enabled} onClick={() => setPermissions((current) => ({ ...current, [module]: !enabled }))} className={`group flex min-h-14 w-full items-center justify-between gap-2.5 rounded-xl p-2.5 text-left shadow-sm transition duration-200 hover:-translate-y-px hover:shadow-md sm:min-h-16 sm:gap-3 sm:rounded-2xl sm:p-4 ${enabled ? "border-(--app-accent)/30 bg-(--app-accent-faint) hover:bg-(--app-accent-faint)" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
              <span className="flex min-w-0 items-center gap-3">
                <span className={`grid size-8 shrink-0 place-items-center rounded-lg transition duration-200 sm:size-9 sm:rounded-xl ${enabled ? "bg-(--app-accent) text-white shadow-md shadow-slate-900/10" : "bg-slate-100 text-slate-400"}`}><Icon name={enabled ? "check" : "lock"} className="size-3.5 sm:size-4" /></span>
                <span className="min-w-0"><span className="block truncate text-xs font-bold text-slate-800 sm:text-sm">{module}</span><span className={`mt-0.5 block text-[0.62rem] font-medium ${enabled ? "text-(--app-accent-dark)" : "text-slate-400"}`}>{enabled ? "Access enabled" : "No access"}</span></span>
              </span>
              <span className={`relative h-5 w-9 shrink-0 rounded-full ring-1 transition sm:h-6 sm:w-11 ${enabled ? "bg-(--app-accent) ring-(--app-accent)/30" : "bg-slate-200 ring-slate-300"}`}><span className={`absolute top-1 size-3 rounded-full bg-white shadow-sm transition sm:size-4 ${enabled ? "left-5 sm:left-6" : "left-1"}`} /></span>
            </Button>)}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 p-5 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setPermissionUser(null)}>Cancel</Button>
          <Button onClick={savePermissions} icon={<Icon name="shield" />}>Save Permissions</Button>
        </div>
      </section>
    </div>}
  </div>;
}

function ActivityLog() {
  const activities = [
    ["Super Administrator", "Created a new user account", "Meera Joshi", "Today, 11:42"],
    ["Administrator", "Updated fee collection permissions", "Raj Kumar", "Today, 10:16"],
    ["Super Administrator", "Changed an administrator role", "Meera Joshi", "Yesterday, 18:30"],
    ["Raj Kumar", "Signed in from a new device", "Chrome · Windows", "20 Sep 2026, 21:15"],
  ];
  return <section className="panel">
    <PanelTitle title="Account Activity Log" icon="activity" />
    <div className="divide-y divide-slate-100">{activities.map(([user, action, target, date]) => <div key={`${user}-${date}`} className="relative m-3 flex flex-col gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-emerald-50/60 p-4 shadow-lg shadow-slate-900/5 sm:m-0 sm:flex-row sm:items-center sm:rounded-none sm:border-0 sm:bg-white sm:p-5 sm:shadow-none">
      <span className="absolute inset-y-0 left-0 w-1 bg-(--app-accent) sm:hidden" />
      <div className="flex items-center gap-3 sm:contents">
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--app-accent),var(--app-accent-dark))] font-display text-sm font-bold text-white shadow-md shadow-slate-900/10 ring-2 ring-white sm:size-10 sm:rounded-xl sm:bg-teal-50 sm:text-teal-700 sm:shadow-none sm:ring-0">{user.charAt(0)}</div>
        <div className="min-w-0 flex-1"><div className="truncate font-display text-sm font-bold text-slate-900 sm:font-semibold sm:text-slate-800">{user}</div><div className="mt-0.5 inline-flex items-center gap-1.5 text-[0.65rem] font-semibold text-(--app-accent-dark) sm:hidden"><Icon name="activity" className="size-3.5" />Account activity</div><p className="mt-1 hidden text-xs text-slate-500 sm:block">{action} · <span className="font-medium">{target}</span></p></div>
      </div>
      <div className="rounded-xl border border-slate-100 bg-white/80 p-3 shadow-sm sm:hidden"><div className="text-[0.62rem] font-bold uppercase tracking-wider text-slate-400">{action}</div><div className="mt-1.5 text-xs font-semibold text-slate-700">{target}</div></div>
      <span className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-500 sm:block sm:bg-transparent sm:p-0 sm:text-slate-400"><span className="sm:hidden">Activity time</span><span className="font-semibold sm:font-normal">{date}</span></span>
    </div>)}</div>
  </section>;
}

function Sessions({ sessions, onTerminate }: { sessions: LoginSession[]; onTerminate: (id: number) => void }) {
  const [sessionToTerminate, setSessionToTerminate] = useState<LoginSession | null>(null);
  const confirmTerminate = () => {
    if (!sessionToTerminate) return;
    onTerminate(sessionToTerminate.id);
    setSessionToTerminate(null);
  };

  return <>
  <section className="panel">
    <PanelTitle title={`Active Sessions (${sessions.length})`} icon="calendar" />
    <div className="divide-y divide-slate-100">{sessions.map((session, index) => <div key={session.id} className="relative m-3 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-emerald-50/60 p-4 shadow-lg shadow-slate-900/5 sm:m-0 sm:grid sm:grid-cols-4 sm:items-center sm:gap-4 sm:rounded-none sm:border-0 sm:bg-white sm:p-5 sm:shadow-none">
      <span className="absolute inset-y-0 left-0 w-1 bg-(--app-accent) sm:hidden" />
      <div className="sm:hidden">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--app-accent),var(--app-accent-dark))] text-white shadow-md shadow-slate-900/10"><Icon name="users" className="size-5" /></span>
          <div className="min-w-0 flex-1"><div className="truncate font-display text-sm font-bold text-slate-900">{session.user}</div><div className="mt-0.5 text-[0.68rem] font-medium text-slate-400">{index === 0 ? "This device" : "Authenticated user"}</div></div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[0.65rem] font-bold text-emerald-600 ring-1 ring-emerald-100"><span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />Active</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-slate-100 bg-white/80 p-3 shadow-sm"><div className="flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-wider text-slate-400"><Icon name="settings" className="size-3.5" />Device</div><div className="mt-1.5 truncate text-xs font-semibold text-slate-700">{session.device}</div></div>
          <div className="rounded-xl border border-slate-100 bg-white/80 p-3 shadow-sm"><div className="flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-wider text-slate-400"><Icon name="calendar" className="size-3.5" />Location</div><div className="mt-1.5 truncate text-xs font-semibold text-slate-700">{session.location}</div></div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5"><div><div className="text-[0.6rem] font-bold uppercase tracking-wider text-slate-400">Last activity</div><div className="mt-0.5 text-xs font-semibold text-emerald-600">{session.active}</div></div><Icon name="activity" className="size-5 text-(--app-accent)" /></div>
        {index === 0 ? <div className="mt-3 flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 text-xs font-bold text-emerald-700"><Icon name="check" />Current Session</div> : <Button variant="danger" className="mt-3 w-full" onClick={() => setSessionToTerminate(session)} icon={<Icon name="lock" />}>Terminate Session</Button>}
      </div>
      <div className="hidden sm:block"><div className="font-semibold text-slate-900">{session.user}</div><div className="mt-1 text-xs text-slate-400">{index === 0 ? "This device" : "Authenticated user"}</div></div>
      <div className="hidden text-sm text-slate-600 sm:block">{session.device}</div>
      <div className="hidden sm:block"><div className="text-sm text-slate-600">{session.location}</div><div className="mt-1 text-xs text-emerald-600">{session.active}</div></div>
      <div className="hidden sm:block sm:text-right">{index === 0 ? <span className="status-success">Current</span> : <Button variant="danger" onClick={() => setSessionToTerminate(session)}>Terminate</Button>}</div>
    </div>)}</div>
  </section>
  <TerminateSessionPopup
    open={Boolean(sessionToTerminate)}
    user={sessionToTerminate?.user}
    device={sessionToTerminate?.device}
    onCancel={() => setSessionToTerminate(null)}
    onConfirm={confirmTerminate}
  />
  </>;
}
