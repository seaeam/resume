import type { AtsEvaluationResult } from './types'
import { toast } from 'sonner'
import { create } from 'zustand'
import { getAtsFromUserId, updateFixChecklist } from '@/lib/supabase/resume'
import { DEFAULT_ATS } from './const'

interface AtsStore extends AtsEvaluationResult {
  history: AtsEvaluationResult[] | []
  loading: boolean

  setAtsEvaluation: (atsEvaluation: AtsEvaluationResult | null) => void
  revertFixChecklist: (id: string) => Promise<void>
  setHistory: (history: AtsEvaluationResult[]) => void
  init: () => void
}

const useAtsStore = create<AtsStore>()(
  (set, get) => {
    const setAtsEvaluation = (atsEvaluation: AtsEvaluationResult | null) => set({ ...atsEvaluation })

    const setHistory = (history: AtsEvaluationResult[]) => set({ history })

    const init = async () => {
      try {
        set({ loading: true })

        const { history, ...rest } = await getAtsFromUserId()

        setAtsEvaluation(rest)
        setHistory(history)
      }
      catch (error: any) {
        toast.error(error.message)
        setAtsEvaluation(null)
        setHistory([])
      }
      finally {
        set({ loading: false })
      }
    }

    const revertFixChecklist = async (id: string) => {
      const { fixChecklist } = get()
      const updatedFixCheckList = fixChecklist.map(item => item.id === id ? { ...item, isDone: !item.isDone } : item)

      try {
        set(() => ({ fixChecklist: updatedFixCheckList }))
        await updateFixChecklist(updatedFixCheckList)
      }
      catch (error: any) {
        toast.error(error.message)
        set(() => ({ fixChecklist }))
      }
    }

    return {
      ...DEFAULT_ATS,
      history: [] as AtsEvaluationResult[] | [],
      loading: false,

      setAtsEvaluation,
      setHistory,
      init,
      revertFixChecklist,
    }
  },
)

export default useAtsStore
