import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

interface NavChromeValue {
  /** True while a screen wants the navigation out of the way (the interview room). */
  immersive: boolean
  setImmersive: (value: boolean) => void
}

const NavChromeContext = createContext<NavChromeValue>({ immersive: false, setImmersive: () => {} })

export function NavChromeProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0)
  // Counted rather than boolean so two immersive screens cannot cancel each other out.
  const setImmersive = useCallback((value: boolean) => setCount((n) => Math.max(0, n + (value ? 1 : -1))), [])
  const value = useMemo(() => ({ immersive: count > 0, setImmersive }), [count, setImmersive])
  return <NavChromeContext.Provider value={value}>{children}</NavChromeContext.Provider>
}

export const useNavChrome = () => useContext(NavChromeContext)

/** Collapses the sidebar and hides the mobile bar while the calling screen is mounted. */
export function useImmersiveNav(active = true) {
  const { setImmersive } = useNavChrome()
  useEffect(() => {
    if (!active) return
    setImmersive(true)
    return () => setImmersive(false)
  }, [active, setImmersive])
}
