import { useEffect, useRef, useState } from "react"
import { Button, ISTClock } from "../components"

type HeaderProps = {
  title: string
  subtitle: string
  action?: string
  onAction?: () => void
}

type NotificationKind = "attendance" | "fee" | "notice" | "system"

const initialNotifications = [
  {
    id: 1,
    title: "Attendance pending",
    message: "Four classes have not submitted today's attendance.",
    time: "5 min ago",
    kind: "attendance" as NotificationKind,
    unread: true,
  },
  {
    id: 2,
    title: "Fee payment received",
    message: "₹12,500 was collected from Ananya Sharma.",
    time: "12 min ago",
    kind: "fee" as NotificationKind,
    unread: true,
  },
  {
    id: 3,
    title: "New admission enquiry",
    message: "A new enquiry was received for Class 6.",
    time: "28 min ago",
    kind: "notice" as NotificationKind,
    unread: true,
  },
  {
    id: 4,
    title: "Notice published",
    message: "The parent–teacher meeting notice is now live.",
    time: "2 hr ago",
    kind: "notice" as NotificationKind,
    unread: false,
  },
  {
    id: 5,
    title: "Backup completed",
    message: "The scheduled system backup completed successfully.",
    time: "Yesterday",
    kind: "system" as NotificationKind,
    unread: false,
  },
]

function AddIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  )
}

function NotificationIcon({ kind }: { kind: NotificationKind }) {
  const paths = {
    attendance: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18m-13 5 2 2 5-5" />
      </>
    ),
    fee: (
      <>
        <path d="M6 5h12M6 9h12" />
        <path d="M7 5c7 0 7 8 0 8l8 7" />
      </>
    ),
    notice: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    system: (
      <>
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
        <circle cx="12" cy="12" r="4" />
      </>
    ),
  }
  const tones = {
    attendance: "bg-blue-50 text-blue-600",
    fee: "bg-emerald-50 text-emerald-600",
    notice: "bg-violet-50 text-violet-600",
    system: "bg-amber-50 text-amber-600",
  }

  return (
    <span
      className={`grid size-10 shrink-0 place-items-center rounded-xl ${tones[kind]}`}
    >
      <svg
        aria-hidden="true"
        className="size-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {paths[kind]}
      </svg>
    </span>
  )
}

export default function Header({
  title,
  subtitle,
  action,
  onAction,
}: HeaderProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notificationFilter, setNotificationFilter] =
    useState<"unread" | "all">("unread")
  const [profileOpen, setProfileOpen] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const unreadCount = notifications.filter((item) => item.unread).length
  const visibleNotifications =
    notificationFilter === "unread"
      ? notifications.filter((item) => item.unread)
      : notifications

  useEffect(() => {
    if (!notificationsOpen && !profileOpen) return
    const dismiss = (event: MouseEvent) => {
      const target = event.target as Node
      if (!notificationRef.current?.contains(target))
        setNotificationsOpen(false)
      if (!profileRef.current?.contains(target)) setProfileOpen(false)
    }
    const dismissWithKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNotificationsOpen(false)
        setProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", dismiss)
    document.addEventListener("keydown", dismissWithKeyboard)
    return () => {
      document.removeEventListener("mousedown", dismiss)
      document.removeEventListener("keydown", dismissWithKeyboard)
    }
  }, [notificationsOpen, profileOpen])

  const readNotification = (id: number) => {
    setNotifications((current) =>
      current.map((item) =>
        item.id === id ? { ...item, unread: false } : item,
      ),
    )
  }

  const readAllNotifications = () => {
    setNotifications((current) =>
      current.map((item) => ({ ...item, unread: false })),
    )
  }

  return (
    <header
      className={`app-header sticky top-0 z-20 flex min-h-16 w-full min-w-0 max-w-full border-b border-slate-200/70 bg-white/90 py-2.5 pl-20 pr-3 backdrop-blur-xl sm:min-h-20 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pb-4 sm:pl-20 sm:pr-5 sm:pt-4 lg:px-6 ${
        action ? "flex-row items-start gap-2" : "flex-row items-start gap-2"
      }`}
    >
      <div className={`min-w-0 flex-1 ${action ? "max-sm:h-10" : ""}`}>
        <h1
          className={`font-display truncate text-xl font-bold tracking-tight text-slate-950 max-sm:absolute max-sm:left-16 max-sm:top-3 max-sm:flex max-sm:h-10 max-sm:items-center sm:text-2xl ${action ? "max-sm:max-w-[calc(100%-13.5rem)]" : "max-sm:max-w-[calc(100%-8rem)]"}`}
        >
          {title}
        </h1>
        <p className="mt-0.5 hidden max-w-xl text-xs leading-4 text-slate-500 sm:block">
          {subtitle}
        </p>
      </div>
      <div
        className={`flex flex-nowrap items-center gap-2 sm:w-auto ${
          "w-auto shrink-0 max-sm:ml-auto"
        }`}
      >
        <ISTClock className="hidden sm:flex" />
        {action && (
          <Button
            className="min-w-0 whitespace-nowrap max-sm:size-11 max-sm:min-h-11 max-sm:rounded-2xl max-sm:!p-0 max-sm:[&_.btn-label]:hidden sm:flex-none"
            onClick={onAction}
            icon={<AddIcon />}
            aria-label={action}
          >
            <span className="btn-label max-sm:hidden">{action}</span>
          </Button>
        )}
        <div
          ref={notificationRef}
          className="relative shrink-0 max-sm:static"
        >
          <Button
            variant="outline"
            className={`group relative size-11 min-h-11 rounded-2xl !p-0 shadow-sm hover:-translate-y-0.5 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 hover:shadow-md ${
              notificationsOpen
                ? "border-teal-200 bg-teal-50 text-teal-700 ring-4 ring-teal-50"
                : "border-slate-200/80 bg-white text-slate-600"
            }`}
            aria-label={`${unreadCount} unread notifications`}
            title="Notifications"
            aria-expanded={notificationsOpen}
            aria-controls="notification-center"
            onClick={() => {
              setProfileOpen(false)
              setNotificationsOpen((current) => !current)
            }}
          >
            <span className="grid size-8 place-items-center rounded-xl bg-slate-50 ring-1 ring-inset ring-slate-100 transition group-hover:bg-white group-hover:ring-teal-100">
              <BellIcon />
            </span>
            {unreadCount > 0 && (
              <span className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-rose-500 text-[0.55rem] font-extrabold leading-none text-white ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </Button>

          {notificationsOpen && (
            <div
              id="notification-center"
              className="absolute right-0 top-full z-50 mt-3 w-80 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/15 max-sm:left-3 max-sm:right-3 max-sm:w-auto max-sm:max-w-none sm:w-96"
              role="region"
              aria-label="Notification center"
            >
              <div className="border-b border-slate-100 bg-gradient-to-br from-teal-50 to-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-display text-base font-bold text-slate-900">
                      Notifications
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {unreadCount
                        ? `${unreadCount} unread message${
                            unreadCount === 1 ? "" : "s"
                          }`
                        : "You're all caught up"}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <Button
                      variant="outline"
                      className="min-h-8 border-0 bg-white/80 px-2.5 py-1.5 text-teal-700 shadow-sm hover:bg-white"
                      onClick={readAllNotifications}
                    >
                      Mark all read
                    </Button>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-slate-100/80 p-1">
                  {(["unread", "all"] as const).map((filter) => (
                    <Button
                      key={filter}
                      variant="outline"
                      className={`min-h-8 rounded-lg border-0 px-3 py-1.5 capitalize shadow-none ${
                        notificationFilter === filter
                          ? "bg-white text-slate-900 shadow-sm"
                          : "bg-transparent text-slate-500 hover:bg-white/60"
                      }`}
                      onClick={() => setNotificationFilter(filter)}
                    >
                      {filter}
                      {filter === "unread" && unreadCount > 0 && (
                        <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[0.6rem] font-bold text-rose-600">
                          {unreadCount}
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="notification-history h-80 overflow-y-auto overscroll-contain">
                {visibleNotifications.map((notification) => (
                  <Button
                    key={notification.id}
                    variant="outline"
                    className={`relative min-h-0 w-full justify-start rounded-none border-0 border-b border-slate-100 p-4 text-left shadow-none last:border-b-0 hover:bg-slate-50 ${
                      notification.unread ? "bg-teal-50/40" : "bg-white"
                    }`}
                    onClick={() => readNotification(notification.id)}
                  >
                    <NotificationIcon kind={notification.kind} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <span className="truncate text-xs font-bold text-slate-800">
                          {notification.title}
                        </span>
                        <span className="shrink-0 text-[0.65rem] font-medium text-slate-400">
                          {notification.time}
                        </span>
                      </span>
                      <span className="mt-1 block text-xs font-normal leading-5 text-slate-500">
                        {notification.message}
                      </span>
                    </span>
                    {notification.unread && (
                      <span className="absolute right-3 top-1/2 size-2 -translate-y-1/2 rounded-full bg-teal-500 ring-4 ring-teal-50" />
                    )}
                  </Button>
                ))}
                {!visibleNotifications.length && (
                  <div className="grid min-h-48 place-items-center p-6 text-center">
                    <div>
                      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                        <BellIcon />
                      </span>
                      <div className="mt-3 text-sm font-bold text-slate-800">
                        No unread notifications
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        New school updates will appear here.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div ref={profileRef} className="relative shrink-0 max-sm:static">
          <Button
            variant="outline"
            className="ml-auto flex min-h-0 shrink-0 items-center gap-2 rounded-xl border-slate-200/80 bg-slate-50 !p-1.5 shadow-sm hover:border-teal-200 hover:bg-teal-50 max-sm:size-11 sm:ml-0 sm:gap-3 sm:!px-2"
            aria-label="Show profile details"
            aria-expanded={profileOpen}
            aria-controls="profile-details"
            onClick={() => {
              setNotificationsOpen(false)
              setProfileOpen((current) => !current)
            }}
          >
            <span className="profile-avatar grid size-8 place-items-center rounded-full border font-display text-xs font-bold shadow-sm sm:size-9">
              S
            </span>
            <span className="hidden min-w-0 text-left xl:block">
              <span className="block truncate text-xs font-bold text-slate-800">
                Super Administrator
              </span>
              <span className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Super Admin
              </span>
            </span>
          </Button>

          {profileOpen && (
            <div
              id="profile-details"
              className="absolute right-0 top-full z-50 mt-3 w-72 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/15 max-sm:left-3 max-sm:right-3 max-sm:w-auto"
              role="region"
              aria-label="Profile details"
            >
              <div className="bg-gradient-to-br from-teal-50 to-white p-4">
                <div className="flex items-center gap-3">
                  <span className="profile-avatar grid size-12 shrink-0 place-items-center rounded-2xl border font-display text-base font-extrabold shadow-md">
                    SA
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-display text-sm font-bold text-slate-900">
                      Super Administrator
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      Active account
                    </div>
                  </div>
                </div>
              </div>
              <dl className="grid gap-3 border-t border-slate-100 p-4 text-xs">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Username</dt>
                  <dd className="font-bold text-slate-700">superadmin</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Role</dt>
                  <dd className="font-bold text-slate-700">Super Admin</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Academic session</dt>
                  <dd className="font-bold text-slate-700">2027–28</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
