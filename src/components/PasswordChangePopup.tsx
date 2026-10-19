import { useState, type FormEvent, type ReactNode } from "react";
import Popup from "../ui/popup";
import Button from "./Button";
import Input from "./Input";
import { useToast } from "./Toast";

type IconName = "check" | "eye" | "eyeOff" | "key" | "lock" | "shield";

const paths: Record<IconName, ReactNode> = {
  check: <path d="m5 12 4 4L19 6" />,
  eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
  eyeOff: <><path d="m3 3 18 18M10.6 6.2A9.8 9.8 0 0 1 12 6c6.5 0 10 6 10 6a16 16 0 0 1-2.1 2.8M6.2 6.2C3.5 8 2 12 2 12s3.5 6 10 6a9.7 9.7 0 0 0 3.8-.8" /><path d="M10.5 10.5a2.1 2.1 0 0 0 3 3" /></>,
  key: <><circle cx="8" cy="15" r="4" /><path d="m11 12 8-8m-3 3 2 2m-5 1 2 2" /></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  shield: <><path d="M12 3 4.5 6v5.5c0 4.6 3.2 7.8 7.5 9.5 4.3-1.7 7.5-4.9 7.5-9.5V6L12 3Z" /><path d="m9 12 2 2 4-4" /></>,
};

function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function PasswordField({
  autoComplete,
  icon,
  id,
  label,
  onChange,
  placeholder,
  value,
}: {
  autoComplete: "current-password" | "new-password";
  icon: "key" | "lock";
  id: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  const [visible, setVisible] = useState(false);

  return <div className="relative w-full self-start">
    <Input
      id={id}
      type={visible ? "text" : "password"}
      autoComplete={autoComplete}
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      startIcon={<Icon name={icon} className="size-4 text-teal-600" />}
      className="pr-12"
      required
    />
    <Button
      type="button"
      variant="outline"
      onClick={() => setVisible((current) => !current)}
      className="!absolute !bottom-1 !right-1 !grid !size-9 !min-h-9 !place-items-center !rounded-lg !border-0 !bg-transparent !p-0 text-teal-600 !shadow-none hover:!bg-teal-50"
      aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
    >
      <Icon name={visible ? "eyeOff" : "eye"} className="size-5" />
    </Button>
  </div>;
}

type PasswordChangePopupProps = {
  onClose: () => void;
  open: boolean;
};

export default function PasswordChangePopup({ onClose, open }: PasswordChangePopupProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const rules = [
    { label: "8 or more characters", met: newPassword.length >= 8 },
    { label: "Uppercase letter", met: /[A-Z]/.test(newPassword) },
    { label: "Number", met: /\d/.test(newPassword) },
    { label: "Special character", met: /[^A-Za-z0-9]/.test(newPassword) },
  ];
  const strength = rules.filter((rule) => rule.met).length;
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const reusesCurrentPassword = newPassword.length > 0 && newPassword === currentPassword;
  const canSubmit = currentPassword.length > 0 && strength === rules.length && passwordsMatch && !reusesCurrentPassword;

  const clearAndClose = () => {
    if (saving) return;
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    onClose();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    setSaving(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    onClose();
    showToast("Your password has been updated successfully.", { title: "Password changed" });
  };

  return <Popup
    open={open}
    onClose={clearAndClose}
    title="Change password"
    description="Create a strong, unique password for your administrator account."
    icon={<Icon name="shield" />}
    footerClassName="!grid grid-cols-2 sm:!flex"
    footer={<>
      <Button variant="outline" className="!inline-flex w-full items-center justify-center sm:w-auto" onClick={clearAndClose} disabled={saving}>Cancel</Button>
      <Button type="submit" form="change-password-form" className="w-full sm:w-auto" disabled={!canSubmit} isLoading={saving} loadingText="Updating..." icon={<Icon name="key" />}>Update Password</Button>
    </>}
  >
    <form id="change-password-form" onSubmit={submit} className="space-y-5">
      <PasswordField id="current-account-password" autoComplete="current-password" label="Current password" placeholder="Enter your current password" value={currentPassword} onChange={setCurrentPassword} icon="lock" />

      <div className="grid gap-5 sm:grid-cols-2">
        <PasswordField id="new-account-password" autoComplete="new-password" label="New password" placeholder="Create a strong password" value={newPassword} onChange={setNewPassword} icon="key" />
        <div>
          <PasswordField id="confirm-account-password" autoComplete="new-password" label="Confirm password" placeholder="Enter it again" value={confirmPassword} onChange={setConfirmPassword} icon="lock" />
          <div className="mt-1.5 min-h-4 text-xs font-medium" aria-live="polite">
            {confirmPassword && !reusesCurrentPassword && <span className={passwordsMatch ? "text-emerald-600" : "text-rose-600"}>{passwordsMatch ? "Passwords match" : "Passwords do not match"}</span>}
            {reusesCurrentPassword && <span className="text-rose-600">Choose a different password.</span>}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-bold text-slate-700">Password strength</div>
          <span className={`text-xs font-bold ${strength === rules.length ? "text-emerald-600" : newPassword ? "text-amber-600" : "text-slate-400"}`}>
            {strength === rules.length ? "Strong" : `${strength} of ${rules.length} met`}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2" aria-hidden="true">
          {rules.map((rule, index) => <span key={rule.label} className={`h-1.5 rounded-full ${index < strength ? strength === rules.length ? "bg-emerald-500" : "bg-amber-400" : "bg-slate-200"}`} />)}
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {rules.map((rule) => <div key={rule.label} className={`flex items-center gap-2 text-xs ${rule.met ? "font-medium text-emerald-700" : "text-slate-500"}`}>
            <span className={`grid size-4 shrink-0 place-items-center rounded-full ${rule.met ? "bg-emerald-100 text-emerald-600" : "border border-slate-300 bg-white text-transparent"}`}><Icon name="check" className="size-2.5" /></span>
            {rule.label}
          </div>)}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Icon name="shield" className="size-4 text-teal-600" />
        You will remain signed in on this device.
      </div>
    </form>
  </Popup>;
}
