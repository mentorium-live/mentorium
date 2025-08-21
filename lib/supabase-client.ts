import { createClient } from '@supabase/supabase-js'

// Singleton Supabase client for browser & server components
// Usage: import { supabase } from '@/lib/supabase-client'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  },
) 