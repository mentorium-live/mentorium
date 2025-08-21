"use client"

import React, { createContext, useContext } from "react"
import { useSession } from "@/hooks/use-session"
import { usePathname, useRouter } from "next/navigation"
import { useRole } from "@/components/role-context"

interface AuthContextValue {
  loading: boolean
  session: ReturnType<typeof useSession>["session"]
  user: ReturnType<typeof useSession>["user"]
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const PUBLIC_ROUTES = ["/login", "/signup", "/forgot-password"]

// Function to determine role based on email
function getRoleFromEmail(email: string): "Coordinator" | "Lecturer" {
  // Coordinator account
  if (email === "tsadjaidoo@knust.edu.gh") {
    return "Coordinator"
  }
  
  // Test lecturer accounts - these specific lecturers get lecturer access
  if (email === "ekeelson@knust.edu.gh" || email === "iacquah@knust.edu.gh") {
    return "Lecturer"
  }
  
  // All other lecturers (any email ending with @knust.edu.gh or @st.knust.edu.gh)
  // get lecturer access, not coordinator access
  if (email && (email.endsWith("@knust.edu.gh") || email.endsWith("@st.knust.edu.gh"))) {
    return "Lecturer"
  }
  
  // Default fallback - you can modify this logic as needed
  return "Coordinator"
}

// Route access control
function hasAccessToRoute(pathname: string, role: "Coordinator" | "Lecturer"): boolean {
  // Public routes are accessible to all authenticated users
  if (PUBLIC_ROUTES.includes(pathname)) {
    return true
  }

  // Coordinator routes
  if (pathname.startsWith("/coordinator/")) {
    return role === "Coordinator"
  }

  // Lecturer routes
  if (pathname.startsWith("/lecturer/")) {
    return role === "Lecturer"
  }

  // Root path - redirect based on role
  if (pathname === "/") {
    return true
  }

  // Default: deny access
  return false
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { session, user, loading } = useSession()
  const { role, setRole } = useRole()
  const pathname = usePathname()
  const router = useRouter()

  // Redirect logic (client side only)
  React.useEffect(() => {
    if (loading) return // wait until session resolved

    if (user?.email) {
      // Determine role based on email
      const emailBasedRole = getRoleFromEmail(user.email)
      
      // Update role if it doesn't match the email-based role
      if (emailBasedRole !== role) {
        setRole(emailBasedRole)
      }
    }

    const isPublic = PUBLIC_ROUTES.includes(pathname)

    if (!session && !isPublic) {
      router.replace("/login")
      return
    }

    if (session && isPublic) {
      // Role-based landing path
      const target = role === "Lecturer" ? "/lecturer/mentees" : "/coordinator/students"
      router.replace(target)
      return
    }

    // Check route access for authenticated users
    if (session && !isPublic) {
      if (!hasAccessToRoute(pathname, role)) {
        // Redirect to appropriate dashboard based on role
        const target = role === "Lecturer" ? "/lecturer/mentees" : "/coordinator/students"
        router.replace(target)
      }
    }
  }, [loading, session, pathname, router, role, setRole, user?.email])

  const value: AuthContextValue = { loading, session, user }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be inside AuthProvider")
  return ctx
} 