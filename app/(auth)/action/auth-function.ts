import { supabase } from "@/lib/supabase-client"

async function signUpNewUser(email: string, password: string) {
    try{
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: 'https://example.com/welcome',
            },
          })
    }catch(error){
        console.error(error)
        return { error: error }
    }
  }