import type { ReactNode } from "react";
import Popup from "../ui/popup";
import { getCurrentDeviceInfo, getLoginTime } from "../utils/device";
import Button from "./Button";

type IconName = "arrow" | "device" | "lock" | "shield" | "user";

const paths: Record<IconName, ReactNode> = {
  arrow: <path d="M9 18 15 12 9 6M15 12H3M15 5h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4" />,
  device: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  shield: <><path d="M12 3 4.5 6v5.5c0 4.6 3.2 7.8 7.5 9.5 4.3-1.7 7.5-4.9 7.5-9.5V6L12 3Z" /><path d="m9 12 2 2 4-4" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
};

function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

type SignOutPopupProps = {
  onCancel: () => void;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
};

export default function SignOutPopup({ onCancel, onClose, onConfirm, open }: SignOutPopupProps) {
  const device = getCurrentDeviceInfo();
  const loginTime = getLoginTime();

  return <Popup
    open={open}
    onClose={onClose}
    title="Sign out?"
    description="End the current administrator session."
    icon={<Icon name="arrow" />}
    footerClassName="!grid grid-cols-2 sm:!flex"
    footer={<>
      <Button variant="outline" className="!inline-flex w-full items-center justify-center sm:w-auto" onClick={onCancel}>Cancel</Button>
      <Button variant="danger" className="!inline-flex w-full items-center justify-center gap-2 sm:w-auto" onClick={onConfirm} icon={<Icon name="arrow" />}>Sign Out</Button>
    </>}
  >
    <div className="space-y-3">
      <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-gradient-to-r from-slate-50 to-white p-4">
        <div className="relative shrink-0">
          <div className="profile-avatar grid size-14 place-items-center rounded-2xl border font-display text-lg font-extrabold shadow-lg">SA</div>
          <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full border-2 border-white bg-emerald-500 text-white"><Icon name="shield" className="size-2.5" /></span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-sm font-bold text-slate-900">Super Administrator</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500"><span className="flex items-center gap-1"><Icon name="user" className="size-3" />superadmin</span><span className="status-info">Super Admin</span></div>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-blue-600 shadow-sm"><Icon name="device" className="size-4" /></span>
        <div className="min-w-0 flex-1"><div className="text-xs font-bold text-blue-800">Current device</div><p className="mt-1 truncate text-xs text-blue-700">{device.label} · {device.deviceType}</p></div>
        <div className="hidden text-right sm:block"><div className="text-xs text-blue-600/70">Signed in</div><div className="mt-0.5 text-xs font-semibold text-blue-800">{loginTime}</div></div>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800"><Icon name="lock" className="size-4 shrink-0" />Sign out on shared or public devices.</div>
    </div>
  </Popup>;
}
