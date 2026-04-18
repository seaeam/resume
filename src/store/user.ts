import type { getCurrentUser } from '@/lib/supabase/user'
import { create } from 'zustand'

export type SupabaseUser = Awaited<ReturnType<typeof getCurrentUser>> | null

interface UserStore {
  currentUser: SupabaseUser
  setCurrentUser: (user: SupabaseUser) => void
}

const useUserStore = create<UserStore>()(set => ({
  currentUser: null,
  setCurrentUser: user => set({ currentUser: user }),
}))

export default useUserStore
