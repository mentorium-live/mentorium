"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useRole } from "@/components/role-context"
import { useAuth } from "@/components/auth-provider"

export default function Page() {
  const router = useRouter()
  const { role } = useRole()
  const { session, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    if (session) {
      // Redirect based on role
      const target = role === "Lecturer" ? "/lecturer/mentees" : "/coordinator/students"
      router.replace(target)
    } else {
      // Not authenticated, redirect to login
      router.replace("/login")
    }
  }, [session, loading, role, router])

  // Show loading state
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
