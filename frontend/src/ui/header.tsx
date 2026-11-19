import { useEffect, useRef, useState } from "react"
import { Button, ISTClock } from "../components"
import { getAuthUser, onAuthUserChanged, type AuthUser } from "../auth/session"
import { API_BASE, API_ENDPOINTS } from "../api/endpoints"
import { get, put } from "../api/methods"
import {
  onCurrentUserUpdated,
  onNotificationChanged,
  onNotificationCreated,
  type NotificationRealtime,
} from "../api/socket"

type HeaderProps = {
  title: string
  subtitle: string
  action?: string
  onAction?: () => void
}

type NotificationKind = "attendance" | "fee" | "notice" | "system"

type HeaderNotification = {
  id: number
  userId: string | null
  createdBy: string | null
  title: string
  message: string
  time: string
  kind: NotificationKind
  unread: boolean
}

type NotificationsResponse = {
  data: NotificationRealtime[]
  nextCursor: string | null
  hasMore: boolean
}

function notificationKind(notification: NotificationRealtime): NotificationKind {
  if (notification.entityType === "attendance") return "attendance"
  if (["fee", "payment"].includes(notification.entityType)) return "fee"
  if (["notice", "admission", "enquiry"].includes(notification.entityType)) return "notice"
  return "system"
}

function relativeTime(value: string) {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime())
  const minutes = Math.floor(elapsed / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? "Yesterday" : `${days} days ago`
}

function mapNotification(notification: NotificationRealtime): HeaderNotification {
  return {
    id: notification.id,
    userId: notification.userId,
    createdBy: notification.createdBy,
    title: notification.title,
    message: notification.message,
    time: relativeTime(notification.createdAt),
    kind: notificationKind(notification),
    unread: !notification.isRead,
  }
}

function roleLabel(role: string) {
  return role.replace(/([a-z])([A-Z])/g, "$1 $2")
}

function initials(user: AuthUser | null) {
  return (user?.name || user?.username || "U")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

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

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4L19 6" />
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
      className={`notification-kind-icon grid size-11 shrink-0 place-items-center rounded-2xl ring-1 ring-inset ${tones[kind]}`}
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
  const [user, setUser] = useState<AuthUser | null>(() => getAuthUser())
  const [notifications, setNotifications] = useState<HeaderNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notificationFilter, setNotificationFilter] =
    useState<"unread" | "all">("all")
  const [profileOpen, setProfileOpen] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const notificationCursorRef = useRef<string | null>(null)
  const notificationLoadingRef = useRef(false)
  const notificationHasMoreRef = useRef(true)
  const [notificationLoading, setNotificationLoading] = useState(false)
  const [notificationHasMore, setNotificationHasMore] = useState(true)

  useEffect(() => onAuthUserChanged(() => setUser(getAuthUser())), [])
  useEffect(() => onCurrentUserUpdated(setUser), [])
  useEffect(() => {
    let cancelled = false
    const loadUnreadCount = async () => {
      try {
        const response = await get<{ total: number }>(
          `${API_BASE}${API_ENDPOINTS.NOTIFICATIONS}?page=1&limit=1&isRead=false`,
        )
        if (!cancelled) setUnreadCount(response.total)
      } catch (error) {
        console.error("Failed to load unread notification count", error)
      }
    }
    const loadNotifications = async (reset = false) => {
      if (notificationLoadingRef.current || (!reset && !notificationHasMoreRef.current)) return
      notificationLoadingRef.current = true
      setNotificationLoading(true)
      try {
        const cursor = reset ? null : notificationCursorRef.current
        const cursorQuery = cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""
        const response = await get<NotificationsResponse>(
          `${API_BASE}${API_ENDPOINTS.NOTIFICATIONS}?page=1&limit=20${cursorQuery}`,
        )
        if (!cancelled) {
          const next = response.data.map(mapNotification)
          setNotifications((current) =>
            reset ? next : [...current, ...next.filter((item) => !current.some((existing) => existing.id === item.id))],
          )
          notificationCursorRef.current = response.nextCursor
          notificationHasMoreRef.current = response.hasMore
          setNotificationHasMore(response.hasMore)
        }
      } catch (error) {
        console.error("Failed to load notifications", error)
        if (!cancelled) setNotifications([])
      } finally {
        notificationLoadingRef.current = false
        if (!cancelled) setNotificationLoading(false)
      }
    }

    notificationCursorRef.current = null
    notificationHasMoreRef.current = true
    setNotificationHasMore(true)
    void loadUnreadCount()
    void loadNotifications(true)
    const refresh = () => {
      void loadUnreadCount()
      void loadNotifications(true)
    }
    const removeCreated = onNotificationCreated((notification) => {
      setNotifications((current) =>
        [mapNotification(notification), ...current.filter((item) => item.id !== notification.id)].slice(0, 50),
      )
    })
    const removeChanged = onNotificationChanged(refresh)
    return () => {
      cancelled = true
      // Allow a new auth-user effect to start a fresh request if this request
      // was cancelled during the initial session hydration.
      notificationLoadingRef.current = false
      removeCreated()
      removeChanged()
    }
  }, [user?.id, notificationsOpen])

  const loadMoreNotifications = () => {
    if (!notificationLoadingRef.current && notificationHasMoreRef.current) {
      const cursor = notificationCursorRef.current
      if (!cursor) return
      notificationLoadingRef.current = true
      setNotificationLoading(true)
      void get<NotificationsResponse>(
        `${API_BASE}${API_ENDPOINTS.NOTIFICATIONS}?page=1&limit=20&cursor=${encodeURIComponent(cursor)}`,
      ).then((response) => {
        const next = response.data.map(mapNotification)
        setNotifications((current) => [
          ...current,
          ...next.filter((item) => !current.some((existing) => existing.id === item.id)),
        ])
        notificationCursorRef.current = response.nextCursor
        notificationHasMoreRef.current = response.hasMore
        setNotificationHasMore(response.hasMore)
      }).catch((error) => console.error("Failed to load more notifications", error))
        .finally(() => {
          notificationLoadingRef.current = false
          setNotificationLoading(false)
        })
    }
  }
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
    const notification = notifications.find((item) => item.id === id)
    setNotifications((current) =>
      current.map((item) =>
        item.id === id ? { ...item, unread: false } : item,
      ),
    )
    if (notification?.unread) setUnreadCount((current) => Math.max(0, current - 1))
    if (user) {
      const readerId = notification?.userId || String(user.id)
      void put(`${API_BASE}${API_ENDPOINTS.NOTIFICATIONS}/${id}/read/${readerId}`)
    }
  }

  const readAllNotifications = () => {
    setNotifications((current) =>
      current.map((item) => ({ ...item, unread: false })),
    )
    setUnreadCount(0)
    if (user) void put(`${API_BASE}${API_ENDPOINTS.NOTIFICATIONS}/read-all/${user.id}`)
  }

  return (
    <header
      className={`app-header sticky top-0 z-20 flex min-h-16 w-full min-w-0 max-w-full border-b border-slate-200 bg-white py-2.5 pl-20 pr-3 sm:min-h-20 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pb-4 sm:pl-20 sm:pr-5 sm:pt-4 lg:px-6 ${
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
            className={`group relative size-11 min-h-11 rounded-2xl !p-0 !shadow-none hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 ${
              notificationsOpen
                ? "border-teal-200 bg-teal-50 text-teal-700"
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
              className="notification-center absolute right-0 top-full z-50 mt-3 flex w-[27rem] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white max-sm:left-3 max-sm:right-3 max-sm:w-auto max-sm:max-w-none"
              role="region"
              aria-label="Notification center"
            >
              <div className="notification-center-header relative overflow-hidden px-4 pb-4 pt-5 text-white sm:px-5">
                <span className="notification-header-orb notification-header-orb-one" />
                <span className="notification-header-orb notification-header-orb-two" />
                <div className="relative flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/10 shadow-sm backdrop-blur-sm">
                        <BellIcon />
                      </span>
                      <div className="font-display text-base font-bold tracking-tight sm:text-lg">
                      Notifications
                      </div>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-white/70">
                      {unreadCount
                        ? `${unreadCount} update${
                            unreadCount === 1 ? "" : "s"
                          } waiting for your attention`
                        : "You're all caught up for now"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="size-9 min-h-9 shrink-0 rounded-xl border-white/15 bg-white/10 !p-0 text-white shadow-none backdrop-blur-sm hover:border-white/30 hover:bg-white/20 sm:hidden"
                    onClick={() => setNotificationsOpen(false)}
                    aria-label="Close notifications"
                  >
                    <CloseIcon />
                  </Button>
                </div>
                <div className="relative mt-4 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[0.65rem] font-semibold text-white/85 backdrop-blur-sm">
                    <span className="size-1.5 rounded-full bg-emerald-300 shadow-[0_0_0_3px_rgb(110_231_183_/_0.14)]" />
                    Live updates
                  </span>
                  <span className="text-[0.65rem] font-medium text-white/55">
                    PAL IT HUB
                  </span>
                </div>
              </div>

              <div className="border-b border-slate-100 bg-white/90 px-3 py-3 sm:px-4">
                <div className="flex items-center gap-2">
                  <div className="grid min-w-0 flex-1 grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
                  {(["unread", "all"] as const).map((filter) => (
                    <Button
                      key={filter}
                      variant="outline"
                        className={`min-h-9 rounded-lg border-0 px-3 py-1.5 capitalize shadow-none ${
                        notificationFilter === filter
                            ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/70"
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
                  {unreadCount > 0 && (
                    <Button
                      variant="outline"
                      className="min-h-9 shrink-0 rounded-xl border-slate-200 bg-white px-2.5 text-teal-700 shadow-sm hover:border-teal-200 hover:bg-teal-50 sm:px-3"
                      onClick={readAllNotifications}
                      icon={<CheckIcon />}
                    >
                      <span className="hidden sm:inline">Mark all read</span>
                      <span className="sm:hidden">Read all</span>
                    </Button>
                  )}
                </div>
              </div>

              <div
                className="notification-history max-h-[min(24rem,calc(100dvh-16rem))] min-h-48 overflow-y-auto overscroll-contain bg-slate-50/70 p-2 sm:p-3"
                onScroll={(event) => {
                  const element = event.currentTarget
                  if (element.scrollHeight - element.scrollTop - element.clientHeight < 96) {
                    loadMoreNotifications()
                  }
                }}
              >
                {visibleNotifications.map((notification) => (
                  <Button
                    key={notification.id}
                    variant="outline"
                    className={`notification-item group relative mb-2 min-h-0 w-full justify-start rounded-2xl border p-3 text-left last:mb-0 sm:p-3.5 ${
                      notification.unread
                        ? "border-teal-100 bg-white shadow-sm shadow-teal-900/5"
                        : "border-slate-200/70 bg-white/75 shadow-none"
                    }`}
                    onClick={() => readNotification(notification.id)}
                  >
                    <NotificationIcon kind={notification.kind} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[0.68rem] font-bold tracking-wider text-slate-400">
                          {notification.createdBy || "System"}
                        </span>
                        <span className="size-1 rounded-full bg-slate-300" />
                        <span className="shrink-0 text-[0.65rem] font-medium text-slate-400">
                          {notification.time}
                        </span>
                      </span>
                      <span className="mt-1 flex items-start justify-between gap-3">
                        <span className="truncate text-sm font-bold text-slate-800">
                          {notification.title}
                        </span>
                        {notification.unread && (
                          <span className="mt-1 size-2 shrink-0 rounded-full bg-teal-500 ring-4 ring-teal-50" />
                        )}
                      </span>
                      <span className="mt-1 block text-xs font-normal leading-5 text-slate-500 sm:pr-2">
                        {notification.message}
                      </span>
                    </span>
                  </Button>
                ))}
                {notificationLoading && (
                  <div className="px-3 py-3 text-center text-xs font-medium text-slate-400">
                    Loading older notifications…
                  </div>
                )}
                {!notificationLoading && notificationHasMore && visibleNotifications.length > 0 && (
                  <div className="px-3 py-2 text-center text-[0.65rem] font-medium text-slate-400">
                    Scroll for older notifications
                  </div>
                )}
                {!visibleNotifications.length && (
                  <div className="grid min-h-56 place-items-center p-6 text-center">
                    <div>
                      <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600 shadow-sm">
                        <CheckIcon />
                      </span>
                      <div className="mt-4 font-display text-sm font-bold text-slate-800">
                        You’re all caught up
                      </div>
                      <p className="mx-auto mt-1 max-w-52 text-xs leading-5 text-slate-400">
                        Important school activity and account updates will appear here.
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
              {initials(user)}
            </span>
            <span className="hidden min-w-0 text-left xl:block">
              <span className="block truncate text-xs font-bold text-slate-800">
                {user?.name || user?.username || "User"}
              </span>
              <span className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                {user ? roleLabel(user.role) : "Account"}
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
                    {initials(user)}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-display text-sm font-bold text-slate-900">
                      {user?.name || user?.username || "User"}
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
                  <dd className="font-bold text-slate-700">{user?.username || "—"}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Role</dt>
                  <dd className="font-bold text-slate-700">{user ? roleLabel(user.role) : "—"}</dd>
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
