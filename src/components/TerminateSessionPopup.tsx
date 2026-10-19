import type { ReactNode } from "react";
import Popup from "../ui/popup";
import Button from "./Button";

type IconName = "device" | "shield";

const paths: Record<IconName, ReactNode> = {
  device: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></>,
  shield: <><path d="M12 3 4.5 6v5.5c0 4.6 3.2 7.8 7.5 9.5 4.3-1.7 7.5-4.9 7.5-9.5V6L12 3Z" /><path d="M12 8v5M12 17h.01" /></>,
};

function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

type TerminateSessionPopupProps = {
  device?: string;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  user?: string;
};

export default function TerminateSessionPopup({ device, onCancel, onConfirm, open, user }: TerminateSessionPopupProps) {
  return <Popup
    open={open}
    onClose={onCancel}
    title="Terminate session?"
    description="This user will be signed out from the selected device."
    icon={<Icon name="shield" />}
    footerClassName="!grid grid-cols-2 sm:!flex"
    footer={<>
      <Button variant="outline" className="!inline-flex w-full items-center justify-center sm:w-auto" onClick={onCancel}>Cancel</Button>
      <Button variant="danger" className="!inline-flex w-full items-center justify-center gap-2 sm:w-auto" onClick={onConfirm} icon={<Icon name="shield" />}>Yes, Terminate</Button>
    </>}
  >
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <span className="metric-icon-teal grid size-11 shrink-0 place-items-center rounded-xl"><Icon name="device" /></span>
        <div className="min-w-0">
          <div className="font-display text-sm font-bold text-slate-900">{user}</div>
          <div className="mt-1 text-xs text-slate-500">{device}</div>
        </div>
      </div>
      <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
        <Icon name="shield" className="mt-0.5 size-4 shrink-0" />
        Unsaved work on this device may be lost. The user can sign in again.
      </div>
    </div>
  </Popup>;
}
