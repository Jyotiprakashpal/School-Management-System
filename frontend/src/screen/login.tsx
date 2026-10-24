import { useState, type FormEvent, type ReactNode } from "react"
import { Button, Input, useToast } from "../components"

type LoginIconName = "arrow" | "book" | "check" | "eye" | "eyeOff" | "key" | "lock" | "people" | "person" | "shield" | "spark"

const iconPaths: Record<LoginIconName, ReactNode> = {
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" />
      <path d="M8 8h8m-8 4h6" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  eye: (
    <>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="m3 3 18 18M10.6 10.6A2 2 0 0 0 13.4 13.4M9.9 5.2A11 11 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-2.1 3M6.6 6.6C3.5 8.4 2 12 2 12s3.5 7 10 7a10 10 0 0 0 4.1-.8" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 8-8m-3 3 2 2m-5 1 2 2" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  people: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.6 3.2 7.8 7.5 9.5 4.3-1.7 7.5-4.9 7.5-9.5V6L12 3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  spark: (
    <path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3ZM5 16l.8 2.2L8 19l-2.2.8L5 22l-.8-2.2L2 19l2.2-.8L5 16ZM19 14l.7 1.8 1.8.7-1.8.7L19 19l-.7-1.8-1.8-.7 1.8-.7L19 14Z" />
  ),
}

function LoginIcon({
  name,
  className = "size-5",
}: {
  name: LoginIconName
  className?: string
}) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[name]}
    </svg>
  )
}

type LoginProps = {
  onLogin: () => void
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("admin")
  const [password, setPassword] = useState("admin123")
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    await new Promise((resolve) => window.setTimeout(resolve, 700))
    onLogin()
  }

  return (
    <div className="login-screen h-dvh overflow-hidden">
      <main className="grid h-dvh grid-rows-[5.5rem_minmax(0,1fr)] overflow-hidden lg:grid-rows-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(28rem,.9fr)]">
        <section className="login-visual relative flex h-full min-h-0 flex-col justify-center overflow-hidden lg:justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-teal-950/65 to-cyan-900/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20" />

          <div className="relative z-10 flex items-center gap-3 p-4 lg:p-8 xl:p-10">
            <div className="grid size-10 place-items-center rounded-2xl border border-white/20 bg-white/15 text-white shadow-xl backdrop-blur-md lg:size-12">
              <LoginIcon name="book" className="size-6" />
            </div>
            <div>
              <div className="font-display text-lg font-extrabold text-white">
                PAL IT HUB
              </div>
              <div className="mt-0.5 text-xs font-medium text-cyan-100/80">
                School Management System
              </div>
            </div>
          </div>

          <div className="login-story relative z-10 hidden max-w-2xl p-6 xl:p-8 lg:block">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-cyan-50 backdrop-blur-md">
              <LoginIcon name="spark" className="size-3.5 text-cyan-300" />A
              smarter way to manage education
            </div>
            <div className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-white xl:text-4xl">
              Everything your school needs, in one secure place.
            </div>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200/85">
              Bring students, attendance, fees, examinations, staff, and
              communication together in a focused digital workspace.
            </p>

            <div className="login-features mt-5 grid max-w-xl grid-cols-3 gap-3">
              {[
                {
                  value: "24/7",
                  label: "Secure access",
                  icon: "shield" as LoginIconName,
                },
                {
                  value: "All-in-one",
                  label: "School operations",
                  icon: "book" as LoginIconName,
                },
                {
                  value: "Real-time",
                  label: "Useful insights",
                  icon: "people" as LoginIconName,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="login-feature-card rounded-2xl border border-white/15 bg-white/10 p-3 text-white shadow-xl backdrop-blur-md"
                >
                  <LoginIcon
                    name={item.icon}
                    className="size-4 text-cyan-300"
                  />
                  <div className="mt-2 font-display text-sm font-bold">
                    {item.value}
                  </div>
                  <div className="mt-1 text-xs text-slate-300">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="login-photo-credit mt-3 text-xs text-slate-300/70">
              Created By JyotiPrakash Pal
            </div>
          </div>
        </section>

        <section className="login-form-panel relative flex h-full min-h-0 flex-col overflow-hidden lg:h-dvh">
          <div className="login-accent-bar absolute inset-x-0 top-0 z-20 h-1" />
          <span className="login-theme-orb absolute -right-16 top-24 size-44 rounded-full" />
          <span className="login-theme-orb absolute -left-20 bottom-20 size-52 rounded-full opacity-60" />
          <span className="login-theme-orb absolute bottom-6 right-16 size-20 rounded-full opacity-45" />

          <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-4 py-3 sm:px-8 sm:py-4 lg:px-10 xl:px-14">
            <div className="login-form-card w-full max-w-md rounded-3xl border p-5 backdrop-blur-2xl sm:p-6">
              <div className="login-shield-tile grid size-10 place-items-center rounded-xl text-white shadow-lg">
                <LoginIcon name="shield" className="size-5" />
              </div>
              <div className="mt-3 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Welcome back
              </div>
              <p className="mt-1 text-xs leading-5 text-white/65 sm:text-sm">
                Sign in to continue to your PAL IT HUB administration workspace.
              </p>

              <form onSubmit={submit} className="mt-5 space-y-3">
                <Input
                  id="login-username"
                  label="Username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  startIcon={<LoginIcon name="person" className="size-4" />}
                  className="login-theme-input h-11"
                  required
                />

                <div>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      label="Password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      startIcon={<LoginIcon name="lock" className="size-4" />}
                      className="login-theme-input h-11 pr-11"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="login-input-action absolute bottom-1 right-1 !grid !size-9 !min-h-9 !place-items-center !rounded-lg !border-0 !bg-transparent !p-0 text-white/60 !shadow-none"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      <LoginIcon
                        name={showPassword ? "eyeOff" : "eye"}
                        className="size-4"
                      />
                    </Button>
                  </div>
                </div>

                <div className="flex min-h-7 items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    aria-pressed={rememberMe}
                    onClick={() => setRememberMe((remember) => !remember)}
                    className="!flex !min-h-0 shrink-0 items-center gap-2 !border-0 !bg-transparent !p-0 text-xs font-medium text-white/75 !shadow-none hover:!bg-transparent hover:text-white"
                  >
                    <span
                      className={`grid size-4 place-items-center rounded border transition ${
                        rememberMe
                          ? "login-check-active text-white"
                          : "border-white/30 bg-white/10 text-transparent"
                      }`}
                    >
                      <LoginIcon name="check" className="size-3" />
                    </span>
                    Remember this device
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      showToast(
                        "Contact your administrator to reset your account password.",
                        { title: "Password help", tone: "info" },
                      )
                    }
                    className="login-link !min-h-0 shrink-0 whitespace-nowrap !border-0 !bg-transparent !p-0 text-xs font-semibold !shadow-none hover:!bg-transparent"
                  >
                    Forgot password?
                  </Button>
                </div>

                <Button
                  type="submit"
                  fullWidth
                  className="min-h-11 text-sm"
                  isLoading={submitting}
                  loadingText="Signing in..."
                  icon={<LoginIcon name="arrow" className="size-4" />}
                >
                  Sign In Securely
                </Button>
              </form>

              <div className="login-demo-card mt-4 rounded-xl border border-white/10 bg-white/10 p-3">
                <div className="flex items-start gap-3">
                  <span className="login-demo-icon grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 shadow-sm">
                    <LoginIcon name="key" className="size-4" />
                  </span>
                  <div>
                    <div className="text-xs font-bold text-white">
                      Demo administrator access
                    </div>
                    <p className="mt-1 text-xs leading-5 text-white/60">
                      Username: <strong className="text-white/90">admin</strong>{" "}
                      · Password:{" "}
                      <strong className="text-white/90">admin123</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="login-secure-note mt-3 hidden items-center justify-center gap-2 text-xs text-white/45 sm:flex">
                <LoginIcon name="lock" className="size-3.5" />
                Your connection is encrypted and secure
              </div>
            </div>
          </div>

          <footer className="relative z-10 flex shrink-0 flex-wrap items-center justify-center gap-x-5 gap-y-1 border-t border-white/10 bg-white/5 px-5 py-2.5 text-xs text-white/45 backdrop-blur-md">
            <span>© 2027 PAL IT HUB</span>
            <span>Privacy</span>
            <span>Support</span>
          </footer>
        </section>
      </main>
    </div>
  )
}
