import type { User } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import supabase from '@/lib/supabase/client'
/**
 * 获取当前登录用户, 并监听登录状态变化
 *
 * **如不需要监听用户变化，建议使用 getCurrentUser**
 * @returns 当前登录用户
 */
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
