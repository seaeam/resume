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

/**
 * 从 useCurrentUser 派生的便捷 hooks，避免重复创建 auth 订阅。
 * 组件同时需要 user 对象时，直接使用 useCurrentUser() 获取完整 User。
 */

/** 获取当前用户头像 URL */
export function useCurrentUserImage() {
  const user = useCurrentUser()
  return user?.user_metadata?.avatar_url as string | undefined
}

/** 获取当前用户显示名称 */
export function useCurrentUserName() {
  const user = useCurrentUser()
  return user?.user_metadata?.full_name ?? '?'
}
