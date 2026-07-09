"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react"

interface AdminContextValue {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (open: boolean) => void
  toggleSidebarCollapsed: () => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  toggleMobileMenu: () => void
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
}

const AdminContext = createContext<AdminContextValue | null>(null)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const previousBodyOverflow = useRef<string | null>(null)

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), [])
  const toggleSidebarCollapsed = useCallback(() => setSidebarCollapsed((v) => !v), [])
  const toggleMobileMenu = useCallback(() => setMobileMenuOpen((v) => !v), [])

  useEffect(() => {
    if (mobileMenuOpen) {
      if (previousBodyOverflow.current === null) {
        previousBodyOverflow.current = document.body.style.overflow
      }
      document.body.style.overflow = "hidden"
    } else if (previousBodyOverflow.current !== null) {
      document.body.style.overflow = previousBodyOverflow.current
      previousBodyOverflow.current = null
    }

    return () => {
      if (previousBodyOverflow.current !== null) {
        document.body.style.overflow = previousBodyOverflow.current
        previousBodyOverflow.current = null
      }
    }
  }, [mobileMenuOpen])

  return (
    <AdminContext.Provider
      value={{
        sidebarOpen,
        setSidebarOpen,
        toggleSidebar,
        sidebarCollapsed,
        setSidebarCollapsed,
        toggleSidebarCollapsed,
        mobileMenuOpen,
        setMobileMenuOpen,
        toggleMobileMenu,
        searchOpen,
        setSearchOpen,
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error("useAdmin must be used within <AdminProvider>")
  return ctx
}
