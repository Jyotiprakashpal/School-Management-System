import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Button, Dropdown, Input, TerminateSessionPopup, useToast } from "../../components";
import Header from "../../ui/header";
import { API_BASE, API_ENDPOINTS } from "../../api/endpoints";
import { get, post, put } from "../../api/methods";
import { onRoleCreated, onRoleDeleted, onRoleUpdated } from "../../api/socket";

type TabId = "users" | "activity" | "sessions";
type Role = "Superadmin" | "Admin" | "Operator" | "Accountant" | "Student" | "Teacher";
type RoleRecord = { roleId: string; roleName: string; permissions: Record<string, boolean> };
type User = {
  id: number;
  username: string;
  name: string;
  role: Role;
  status: "Active" | "Suspended";
  lastLogin: string | null;
};
type LoginSession = {
  active: string;
  device: string;
  id: number;
  location: string;
  user: string;
  current?: boolean;
};
type IconName = "activity" | "calendar" | "check" | "close" | "key" | "lock" | "plus" | "settings" | "shield" | "users";

const iconPaths: Record<IconName, ReactNode> = {
  activity: <><path d="M3 12h4l2-6 4 12 2-6h6" /><circle cx="12" cy="12" r="9" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
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

const roleStyles: Record<Role, string> = {
  Superadmin: "bg-gradient-to-r from-violet-600 to-cyan-500 text-white",
  Admin: "bg-rose-50 text-rose-600",
  Operator: "bg-blue-50 text-blue-600",
  Accountant: "bg-amber-50 text-amber-700",
  Student: "bg-cyan-50 text-cyan-700",
  Teacher: "bg-emerald-50 text-emerald-700",
};

function PanelTitle({ title, icon }: { title: string; icon: IconName }) {
  return <div className="panel-title justify-start gap-2"><Icon name={icon} className="size-5 text-teal-600" /><div className="font-display text-base font-bold text-slate-900">{title}</div></div>;
}

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState<TabId>("users");
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [selectedResetUser, setSelectedResetUser] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;
    void get<{ data: RoleRecord[] }>(`${API_BASE}${API_ENDPOINTS.ROLES}?limit=100`, { cache: "no-store" })
      .then((response) => { if (active) setRoles(response.data); })
      .catch((error) => { if (active) showToast(error instanceof Error ? error.message : "Failed to load roles.", { title: "Roles unavailable", tone: "error" }); });
    return () => { active = false; };
  }, [showToast]);

  useEffect(() => {
    if (!selectedResetUser && users[0]) setSelectedResetUser(String(users[0].id));
  }, [selectedResetUser, users]);

  useEffect(() => {
    let active = true;
    void get<{ data: LoginSession[] }>(`${API_BASE}${API_ENDPOINTS.USER}/sessions`, { cache: "no-store" })
      .then((response) => { if (active) setSessions(response.data); })
      .catch((error) => { if (active) showToast(error instanceof Error ? error.message : "Failed to load active sessions.", { title: "Sessions unavailable", tone: "error" }); });
    return () => { active = false; };
  }, [showToast]);

  useEffect(() => {
    const removeCreated = onRoleCreated((role) => {
      setRoles((current) => current.some((item) => item.roleId === role.roleId) ? current : [...current, role]);
    });
    const removeUpdated = onRoleUpdated((role) => {
      setRoles((current) => current.map((item) => item.roleId === role.roleId ? role : item));
    });
    const removeDeleted = onRoleDeleted(({ roleId }) => {
      setRoles((current) => current.filter((item) => item.roleId !== roleId));
    });
    return () => { removeCreated(); removeUpdated(); removeDeleted(); };
  }, []);

  useEffect(() => {
    let active = true;
    void get<{ data: User[] }>(`${API_BASE}${API_ENDPOINTS.USER}?limit=100`, { cache: "no-store" })
      .then((response) => { if (active) setUsers(response.data); })
      .catch((error) => { if (active) showToast(error instanceof Error ? error.message : "Failed to load users.", { title: "Users unavailable", tone: "error" }); });
    return () => { active = false; };
  }, [showToast]);

  const createUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get("fullName"));
    setCreatingUser(true);
    try {
      const user = await post<User>(`${API_BASE}${API_ENDPOINTS.USER}`, {
        username: String(form.get("username")),
        name,
        password: String(form.get("password")),
        role: String(form.get("role")) as Role,
      });
      setUsers((current) => [...current, user]);
      formElement.reset();
      showToast(`${name} can now sign in with the new account.`, { title: "User created" });
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to create the user.", { title: "User creation failed", tone: "error" });
    } finally {
      setCreatingUser(false);
    }
  };

  const changeUserRole = async (userId: number, role: Role) => {
    const updated = await put<User>(`${API_BASE}${API_ENDPOINTS.USER}/${userId}`, { role });
    setUsers((current) => current.map((user) => user.id === updated.id ? updated : user));
    return updated;
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
    <main className="user-management-main mx-auto max-w-7xl space-y-4 p-3 sm:space-y-5 sm:p-6 xl:p-8">
      <nav className="user-management-tabs panel grid grid-cols-3 gap-1.5 p-2 sm:max-w-xl" aria-label="User management sections">
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
        roles={roles}
        onChangeRole={changeUserRole}
      />}
      {activeTab === "activity" && <ActivityLog />}
      {activeTab === "sessions" && <Sessions sessions={sessions} onTerminate={async (id) => {
        try {
          await post(`${API_BASE}${API_ENDPOINTS.USER}/sessions/${id}/terminate`);
          setSessions((current) => current.filter((session) => session.id !== id));
          notify("Session ended", "The selected user session has been securely terminated.");
        } catch (error) {
          notify("Session termination failed", error instanceof Error ? error.message : "Failed to terminate the session.");
        }
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
  roles,
  onChangeRole,
}: {
  users: User[];
  creatingUser: boolean;
  resettingPassword: boolean;
  selectedResetUser: string;
  onCreateUser: (event: FormEvent<HTMLFormElement>) => void;
  onResetPassword: (event: FormEvent<HTMLFormElement>) => void;
  onSelectResetUser: (value: string) => void;
  onNotify: (title: string, message: string) => void;
  roles: RoleRecord[];
  onChangeRole: (userId: number, role: Role) => Promise<User>;
}) {
  const [permissionUser, setPermissionUser] = useState<User | null>(null);
  const [roleUser, setRoleUser] = useState<User | null>(null);
  const [roleValue, setRoleValue] = useState("");
  const [roleSaving, setRoleSaving] = useState(false);
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
  const enabledPermissionCount = Object.values(permissions).filter(Boolean).length;
  const permissionTotal = Object.keys(permissions).length;
  const permissionCoverage = Math.round((enabledPermissionCount / permissionTotal) * 100);

  useEffect(() => {
    if (!permissionUser) return;
    const role = roles.find((item) => item.roleName === permissionUser.role);
    if (role) setPermissions((current) => ({ ...current, ...role.permissions }));
  }, [permissionUser, roles]);

  const savePermissions = async () => {
    if (!permissionUser) return;
    const role = roles.find((item) => item.roleName === permissionUser.role);
    if (!role) {
      onNotify("Permissions unavailable", "The selected role could not be found.");
      return;
    }
    try {
      const response = await put<{ data: RoleRecord }>(`${API_BASE}${API_ENDPOINTS.ROLES}/${role.roleId}`, { permissions });
      setPermissions(response.data.permissions);
      setPermissionUser(null);
      onNotify("Permissions updated", `${permissionUser.name}'s module access has been saved.`);
    } catch (error) {
      onNotify("Permission update failed", error instanceof Error ? error.message : "Failed to save role permissions.");
    }
  };

  const openRoleChange = (user: User) => {
    setRoleUser(user);
    setRoleValue(user.role);
  };

  const saveRole = async () => {
    if (!roleUser || !roleValue) return;
    setRoleSaving(true);
    try {
      const updated = await onChangeRole(roleUser.id, roleValue as Role);
      setRoleUser(null);
      onNotify("Role updated", `${updated.name} is now assigned the ${updated.role} role.`);
    } catch (error) {
      onNotify("Role update failed", error instanceof Error ? error.message : "Failed to change the user role.");
    } finally {
      setRoleSaving(false);
    }
  };

  const setAllPermissions = (enabled: boolean) => {
    setPermissions((current) => Object.fromEntries(Object.keys(current).map((module) => [module, enabled])));
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
            <div className="sm:col-span-2"><Dropdown id="role" name="role" label="Role" defaultValue="" required options={roles.map((role) => ({ label: role.roleName, value: role.roleName }))} /></div>
          </div>
          <div className="user-form-footer border-t border-slate-100 bg-slate-50/60 p-4 sm:flex sm:justify-end sm:px-5"><Button type="submit" className="w-full sm:w-auto" isLoading={creatingUser} loadingText="Creating user..." icon={<Icon name="plus" />}>Create User</Button></div>
        </form>
      </section>

      <section className="panel lg:col-span-2">
        <PanelTitle title="Reset Password" icon="key" />
        <form onSubmit={onResetPassword}>
          <div className="space-y-4 p-5">
            <Dropdown id="reset-user" label="Select user" value={selectedResetUser} onChange={(event) => onSelectResetUser(event.target.value)} options={users.map((user) => ({ label: `${user.name} (${user.username})`, value: String(user.id) }))} />
            <Input id="new-password" type="password" label="New password" placeholder="Minimum 6 characters" minLength={6} required />
          </div>
          <div className="user-form-footer border-t border-slate-100 bg-slate-50/60 p-4 sm:flex sm:justify-end sm:px-5"><Button type="submit" className="w-full sm:w-auto" isLoading={resettingPassword} loadingText="Resetting..." icon={<Icon name="key" />}>Reset Password</Button></div>
        </form>
      </section>
    </div>

    <section className="panel">
      <div className="panel-title">
        <div className="flex items-center gap-2"><Icon name="users" className="size-5 text-teal-600" /><div className="font-display text-base font-bold text-slate-900">Team Accounts</div></div>
        <span className="status-info">{users.length} users</span>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3 sm:p-5">
        {users.map((user) => <article key={user.id} className={`user-account-card relative flex h-full flex-col overflow-hidden rounded-2xl border bg-gradient-to-br from-white via-white to-emerald-50/60 shadow-lg shadow-slate-900/5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:bg-white sm:shadow-none ${user.role === "Superadmin" ? "user-account-owner" : "border-slate-200"}`}>
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
          <div className="user-account-footer border-t border-slate-100 bg-white/80 p-3 sm:bg-slate-50/60">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" fullWidth className="!inline-flex min-h-10 items-center justify-center gap-2" onClick={() => setPermissionUser(user)} icon={<Icon name="shield" className="size-4 text-teal-600" />}>Manage Permissions</Button>
              <Button variant="outline" fullWidth className="!inline-flex min-h-10 items-center justify-center gap-2" onClick={() => openRoleChange(user)} icon={<Icon name="settings" className="size-4 text-teal-600" />}>Change Role</Button>
            </div>
          </div>
        </article>)}
      </div>
    </section>

    {roleUser && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm" role="presentation" onMouseDown={() => !roleSaving && setRoleUser(null)}>
      <section className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div><h2 className="font-display text-lg font-bold text-slate-900">Change user role</h2><p className="mt-1 text-sm text-slate-500">Update the access role for {roleUser.name}.</p></div>
          <Button variant="outline" aria-label="Close" className="!grid !size-9 !min-h-9 !place-items-center !p-0" onClick={() => setRoleUser(null)}><Icon name="close" className="size-4" /></Button>
        </div>
        <div className="mt-5"><Dropdown label="Role" value={roleValue} onChange={(event) => setRoleValue(event.target.value)} options={roles.map((role) => ({ label: role.roleName, value: role.roleName }))} /></div>
        <div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={() => setRoleUser(null)} disabled={roleSaving}>Cancel</Button><Button onClick={() => void saveRole()} isLoading={roleSaving} loadingText="Updating...">Update Role</Button></div>
      </section>
    </div>}

    {permissionUser && <div className="fixed inset-0 z-50 grid items-end bg-slate-950/55 backdrop-blur-sm sm:place-items-center sm:p-5" role="presentation" onMouseDown={() => setPermissionUser(null)}>
      <section className="premium-modal flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white sm:max-h-[92dvh] sm:rounded-3xl" role="dialog" aria-modal="true" aria-labelledby="permission-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="popup-header relative flex shrink-0 items-center justify-between overflow-hidden p-4 text-white sm:p-5">
          <span className="pointer-events-none absolute -right-12 -top-16 size-40 rounded-full border border-white/10 bg-white/10" />
          <div className="relative flex min-w-0 items-center gap-3">
            <div className="relative isolate grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/20 bg-white/20 font-display text-base font-extrabold shadow-lg">{permissionUser.name.charAt(0)}</div>
            <div className="min-w-0">
              <div id="permission-title" className="truncate font-display text-lg font-bold sm:text-xl">Manage Permissions</div>
              <p className="mt-0.5 truncate text-xs text-white/75 sm:text-sm">{permissionUser.name} · {permissionUser.role}</p>
            </div>
          </div>
          <Button variant="outline" aria-label="Close permissions" className="relative !grid !size-10 !min-h-10 shrink-0 !place-items-center !rounded-xl !border-white/15 !bg-white/10 !p-0 text-white !shadow-none hover:!bg-white/20" onClick={() => setPermissionUser(null)}><Icon name="close" className="size-4" /></Button>
        </div>

        <div className="permission-dialog-body min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-slate-50/90 to-white p-3 sm:p-5">
          <div className="permission-overview relative overflow-hidden rounded-2xl p-4 text-white shadow-lg sm:p-5">
            <span className="pointer-events-none absolute -right-10 -top-12 size-32 rounded-full border border-white/10 bg-white/10" />
            <span className="pointer-events-none absolute -bottom-16 left-1/3 size-28 rounded-full bg-white/5" />
            <div className="relative grid grid-cols-[1fr_auto] items-center gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20"><Icon name="shield" className="size-5" /></span>
                <div className="min-w-0">
                  <div className="font-display text-sm font-bold sm:text-base">Access coverage</div>
                  <p className="mt-1 text-[0.68rem] leading-5 text-white/70 sm:text-xs">Changes apply to this user’s sidebar at their next sign in.</p>
                </div>
              </div>
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10 text-center sm:size-16">
                <span><span className="block font-display text-lg font-extrabold sm:text-xl">{permissionCoverage}%</span><span className="block text-[0.55rem] font-bold uppercase tracking-wider text-white/60">Enabled</span></span>
              </div>
            </div>
            <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-white shadow-sm transition-all duration-300" style={{ width: `${permissionCoverage}%` }} /></div>
            <div className="relative mt-2 flex items-center justify-between text-[0.62rem] font-semibold text-white/65"><span>{enabledPermissionCount} modules enabled</span><span>{permissionTotal - enabledPermissionCount} restricted</span></div>
          </div>
          <div className="mb-3 mt-4 flex items-end justify-between gap-3 px-1 sm:mt-5">
            <div className="min-w-0"><div className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-600 sm:text-xs">Module permissions</div><div className="mt-0.5 text-[0.62rem] text-slate-400 sm:text-[0.68rem]">Select the areas this user can access.</div></div>
            <div className="flex shrink-0 gap-1.5">
              <Button variant="outline" className="!min-h-8 !rounded-lg !px-2.5 !py-1 text-[0.62rem] shadow-none" onClick={() => setAllPermissions(false)}>Clear</Button>
              <Button variant="outline" className="!min-h-8 !rounded-lg !px-2.5 !py-1 text-[0.62rem] shadow-none" onClick={() => setAllPermissions(true)}>Enable all</Button>
            </div>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
            {Object.entries(permissions).map(([module, enabled]) => <Button key={module} variant="outline" aria-pressed={enabled} onClick={() => setPermissions((current) => ({ ...current, [module]: !enabled }))} className={`permission-module-card group !grid min-h-16 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 !rounded-2xl !p-3 text-left sm:min-h-20 sm:!p-4 ${enabled ? "permission-module-enabled" : ""}`}>
              <span className="flex min-w-0 items-center gap-3">
                <span className={`permission-module-icon grid size-9 shrink-0 place-items-center rounded-xl sm:size-10 ${enabled ? "permission-module-icon-enabled" : ""}`}><Icon name={enabled ? "check" : "lock"} className="size-4" /></span>
              </span>
              <span className="min-w-0"><span className="block truncate text-xs font-bold text-slate-800 sm:text-sm">{module}</span><span className={`mt-0.5 block text-[0.62rem] font-medium ${enabled ? "permission-module-status" : "text-slate-400"}`}>{enabled ? "Full module access" : "Access restricted"}</span></span>
              <span className={`permission-switch relative h-6 w-11 shrink-0 rounded-full ${enabled ? "permission-switch-on" : "bg-slate-200"}`}><span className={`absolute top-1 size-4 rounded-full bg-white shadow-sm transition-all duration-200 ${enabled ? "left-6" : "left-1"}`} /></span>
            </Button>)}
          </div>
        </div>

        <div className="permission-dialog-footer grid shrink-0 grid-cols-2 items-center gap-2 border-t border-slate-100 bg-white p-3.5 sm:grid-cols-[1fr_auto_auto] sm:p-4 sm:px-5">
          <div className="hidden text-xs text-slate-400 sm:block"><span className="font-bold text-slate-700">{enabledPermissionCount}</span> of {permissionTotal} modules will be available</div>
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => setPermissionUser(null)}>Cancel</Button>
          <Button className="w-full sm:w-auto" onClick={savePermissions} icon={<Icon name="shield" />}>Save Access</Button>
        </div>
      </section>
    </div>}
  </div>;
}

function ActivityLog() {
  const [activities, setActivities] = useState<{ user: string; action: string; target: string; date: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;
    void get<{ data: { user: string; action: string; target: string; date: string }[] }>(`${API_BASE}${API_ENDPOINTS.USER}/activity?limit=50`, { cache: "no-store" })
      .then((response) => { if (active) setActivities(response.data); })
      .catch((error) => { if (active) showToast(error instanceof Error ? error.message : "Failed to load activity.", { title: "Activity unavailable", tone: "error" }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [showToast]);

  return <section className="user-activity-panel panel">
    <PanelTitle title="Account Activity Log" icon="activity" />
    <div className="divide-y divide-slate-100">{loading ? <div className="p-6 text-center text-sm text-slate-400">Loading activity...</div> : activities.length === 0 ? <div className="p-6 text-center text-sm text-slate-400">No activity found.</div> : activities.map(({ user, action, target, date }) => <div key={`${user}-${date}-${action}`} className="user-activity-row relative m-3 flex flex-col gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-emerald-50/60 p-4 shadow-lg shadow-slate-900/5 sm:m-0 sm:flex-row sm:items-center sm:rounded-none sm:border-0 sm:bg-white sm:p-5 sm:shadow-none">
      <span className="absolute inset-y-0 left-0 w-1 bg-(--app-accent) sm:hidden" />
      <div className="flex items-center gap-3 sm:contents">
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--app-accent),var(--app-accent-dark))] font-display text-sm font-extrabold text-white shadow-md shadow-slate-900/10 ring-2 ring-white sm:size-10 sm:rounded-xl sm:shadow-sm sm:ring-0">{user.charAt(0)}</div>
        <div className="min-w-0 flex-1"><div className="truncate font-display text-sm font-bold text-slate-900 sm:font-semibold sm:text-slate-800">{user}</div><div className="mt-0.5 inline-flex items-center gap-1.5 text-[0.65rem] font-semibold text-(--app-accent-dark) sm:hidden"><Icon name="activity" className="size-3.5" />Account activity</div><p className="mt-1 hidden text-xs text-slate-500 sm:block">{action} · <span className="font-medium">{target}</span></p></div>
      </div>
      <div className="rounded-xl border border-slate-100 bg-white/80 p-3 shadow-sm sm:hidden"><div className="text-[0.62rem] font-bold uppercase tracking-wider text-slate-400">{action}</div><div className="mt-1.5 text-xs font-semibold text-slate-700">{target}</div></div>
      <span className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-500 sm:block sm:bg-transparent sm:p-0 sm:text-slate-400"><span className="sm:hidden">Activity time</span><span className="font-semibold sm:font-normal">{new Date(date).toLocaleString()}</span></span>
    </div>)}</div>
  </section>;
}

function Sessions({ sessions, onTerminate }: { sessions: LoginSession[]; onTerminate: (id: number) => void | Promise<void> }) {
  const [sessionToTerminate, setSessionToTerminate] = useState<LoginSession | null>(null);
  const confirmTerminate = () => {
    if (!sessionToTerminate) return;
    void onTerminate(sessionToTerminate.id);
    setSessionToTerminate(null);
  };

  return <>
  <section className="user-sessions-panel panel">
    <PanelTitle title={`Active Sessions (${sessions.length})`} icon="calendar" />
    <div className="divide-y divide-slate-100">{sessions.map((session, index) => <div key={session.id} className="user-session-row relative m-3 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-emerald-50/60 p-4 shadow-lg shadow-slate-900/5 sm:m-0 sm:grid sm:grid-cols-4 sm:items-center sm:gap-4 sm:rounded-none sm:border-0 sm:bg-white sm:p-5 sm:shadow-none">
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
        {session.current ? <div className="mt-3 flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 text-xs font-bold text-emerald-700"><Icon name="check" />Current Session</div> : <Button variant="danger" className="mt-3 w-full" onClick={() => setSessionToTerminate(session)} icon={<Icon name="lock" />}>Terminate Session</Button>}
      </div>
      <div className="hidden sm:block"><div className="font-semibold text-slate-900">{session.user}</div><div className="mt-1 text-xs text-slate-400">{index === 0 ? "This device" : "Authenticated user"}</div></div>
      <div className="hidden text-sm text-slate-600 sm:block">{session.device}</div>
      <div className="hidden sm:block"><div className="text-sm text-slate-600">{session.location}</div><div className="mt-1 text-xs text-emerald-600">{session.active}</div></div>
      <div className="hidden sm:block sm:text-right">{session.current ? <span className="status-success">Current</span> : <Button variant="danger" onClick={() => setSessionToTerminate(session)}>Terminate</Button>}</div>
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
