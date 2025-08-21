"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

export type Role = "Coordinator" | "Lecturer"

interface RoleContextValue {
  role: Role
  setRole: (role: Role) => void
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined)

const STORAGE_KEY = "mentorium_role"

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>("Coordinator")

  // Load saved role on mount (client side only)
  useEffect(() => {
    if (typeof window === "undefined") return
    const saved = window.localStorage.getItem(STORAGE_KEY) as Role | null
    if (saved) {
      setRoleState(saved)
    }
  }, [])

  const setRole = (newRole: Role) => {
    setRoleState(newRole)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, newRole)
    }
  }

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const context = useContext(RoleContext)
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider")
  }
  return context
} 