import type { User } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import supabase from '@/lib/supabase/client'

export default function useCurrentUser() {
  const [auth, setAuth] = useState<User>()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuth(session?.user)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuth(session?.user)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return auth
}
