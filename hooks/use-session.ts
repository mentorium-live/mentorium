"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import type { Session, User } from "@supabase/supabase-js"

interface UseSessionResult {
  session: Session | null
  user: User | null
  loading: boolean
}

export function useSession(): UseSessionResult {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial fetch
    const currentSession = supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    // Listen for changes
    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  return { session, user: session?.user ?? null, loading }
} 