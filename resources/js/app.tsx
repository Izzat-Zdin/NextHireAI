import "./index.css"
import { StrictMode, type ReactNode } from "react"
import { createInertiaApp } from "@inertiajs/react"
import { createRoot } from "react-dom/client"
import AppShell from "@/components/AppShell"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/shadcn/tooltip"
import { AuthProvider } from "@/modules/user-management/context/AuthContext"
import { setTestAccounts } from "@/modules/user-management/services/authService"

// Pages live in resources/js/modules/** with the same folder layout as the original app.
// A controller renders e.g. Inertia::render('dashboard/DashboardPage').
const pages = import.meta.glob("./modules/**/*.tsx")

/** Pages outside the signed-in shell (auth screens). Everything else gets the sidebar layout. */
const BARE_PAGES = new Set([
  "user-management/pages/LoginPage",
  "user-management/pages/RegisterPage",
  "user-management/pages/ForgotPasswordPage",
  "user-management/pages/ResetPasswordPage",
  "user-management/pages/VerifyEmailPage",
])

type PageModule = { default: React.ComponentType & { layout?: (page: ReactNode) => ReactNode } }

/** Providers must sit inside Inertia's <App> (usePage needs it), so they wrap every page through its layout. */
function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={300}>
        <AuthProvider>{children}</AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  )
}

createInertiaApp({
  title: (title) => (title ? `${title} · NextHire AI` : "NextHire AI"),
  resolve: async (name) => {
    const loader = pages[`./modules/${name}.tsx`]
    if (!loader) throw new Error(`Page not found: ${name}`)
    const module = (await loader()) as PageModule
    const page = module.default
    if (!page.layout) {
      page.layout = BARE_PAGES.has(name)
        ? (content: ReactNode) => <Providers>{content}</Providers>
        : (content: ReactNode) => (
            <Providers>
              <AppShell>{content}</AppShell>
            </Providers>
          )
    }
    return module
  },
  setup({ el, App, props }) {
    setTestAccounts((props.initialPage.props as { testAccounts?: { id: "user" | "admin"; name: string; email: string }[] }).testAccounts)
    createRoot(el).render(
      <StrictMode>
        <App {...props} />
      </StrictMode>,
    )
  },
  progress: { color: "#737373" },
})
