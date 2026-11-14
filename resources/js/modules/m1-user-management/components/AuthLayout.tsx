import { useId, useState, type ComponentProps, type ReactNode } from "react"
import { AlertCircle, CheckCircle2, Eye, EyeOff, LockKeyhole } from "lucide-react"
import { FloatingPaths } from "@/components/floating-paths"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/shadcn/input-group"
import { cn } from "@/lib/utils"

export { AuthDivider } from "@/components/auth-divider"
export { GoogleIcon } from "@/components/google-icon"

/** NextHire wordmark (text placeholder logo, no invented brand mark). */
function Brand({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        aria-hidden="true"
        className="grid size-8 place-items-center rounded-lg bg-primary font-heading text-base font-extrabold text-primary-foreground"
      >
        N
      </span>
      <span className="font-heading text-base font-bold tracking-tight">NextHire AI</span>
    </div>
  )
}

const FEATURES = [
  "Check your resume against the role you are applying for.",
  "Practise mock interviews by voice or text and get a score for every answer.",
  "See your career readiness score and the skills holding it back.",
  "Follow a learning plan built from those gaps.",
]

/**
 * Auth page layout based on the efferd auth-5 block: a decorative side panel with
 * flowing lines on large screens, and a centred form column on every screen.
 */
export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="auth-theme relative min-h-screen lg:grid lg:h-screen lg:grid-cols-2 lg:overflow-hidden">
      <aside className="relative hidden h-full flex-col border-r bg-secondary p-10 lg:flex">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" />
        <Brand className="relative z-10 mr-auto" />
        <div className="relative z-10 -mx-6 mt-auto max-w-md space-y-5 rounded-2xl bg-secondary/90 p-6 backdrop-blur-[2px]">
          <h2 className="font-heading text-2xl font-bold leading-snug tracking-tight">
            Practise your interview answers before the real one.
          </h2>
          <ul className="space-y-3 text-[15px] leading-relaxed text-muted-foreground">
            {FEATURES.map((item) => (
              <li key={item} className="flex gap-3">
                <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-foreground/60" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} NextHire AI</p>
        </div>
        <div className="absolute inset-0 opacity-70" aria-hidden="true">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </aside>

      <main className="relative flex min-h-screen flex-col justify-center px-5 py-10 sm:px-8 lg:overflow-y-auto">
        {/* Soft top shading from the auth-5 block (decorative). */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 isolate -z-0 overflow-hidden opacity-60">
          <div className="absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)]" />
          <div className="absolute top-0 right-0 h-320 w-60 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] [translate:5%_-50%]" />
        </div>

        <div className="relative mx-auto w-full max-w-sm space-y-5">
          <Brand className="lg:hidden" />
          <div className="flex flex-col space-y-1.5">
            <h1 className="font-heading text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-base text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}

/** Inline status message for the auth forms. */
export function AuthAlert({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  const Icon = tone === "error" ? AlertCircle : CheckCircle2
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-md border px-3.5 py-3 text-sm leading-relaxed",
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
          : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 [overflow-wrap:anywhere]">{children}</div>
    </div>
  )
}

/** Labelled input with an icon, built on the shadcn InputGroup used by auth-5. */
export function AuthField({
  label,
  icon,
  value,
  onChange,
  hint,
  ...inputProps
}: Omit<ComponentProps<"input">, "onChange" | "value"> & {
  label: string
  icon: ReactNode
  value: string
  onChange: (value: string) => void
  hint?: string
}) {
  const id = useId()
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <InputGroup className="h-11 bg-background">
        <InputGroupInput id={id} className="h-full" value={value} onChange={(event) => onChange(event.target.value)} {...inputProps} />
        <InputGroupAddon align="inline-start" aria-hidden="true">
          {icon}
        </InputGroupAddon>
      </InputGroup>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: string
  placeholder?: string
}) {
  const [visible, setVisible] = useState(false)
  const id = useId()
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <InputGroup className="h-11 bg-background">
        <InputGroupInput
          id={id}
          className="h-full"
          type={visible ? "text" : "password"}
          value={value}
          required
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
        <InputGroupAddon align="inline-start" aria-hidden="true">
          <LockKeyhole />
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-sm"
            className="h-11 w-11 rounded-none rounded-r-md"
            onClick={() => setVisible(!visible)}
            aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
            aria-pressed={visible}
          >
            {visible ? <EyeOff /> : <Eye />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
