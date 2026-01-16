import type { AtsEvaluationResult } from './types'
import { toast } from 'sonner'
import { create } from 'zustand'
import { getAtsFromUserId, getAtsResumeFromResumeId, updateFixChecklist } from '@/lib/supabase/resume'
import { DEFAULT_ATS } from './const'

interface AtsStore extends AtsEvaluationResult {
  history: AtsEvaluationResult[]
  loading: boolean
  selectedResumeId: string | null

  setAtsEvaluation: (atsEvaluation: AtsEvaluationResult | null) => void
  revertFixChecklist: (id: string) => Promise<void>
  setHistory: (history: AtsEvaluationResult[]) => void
  getAtsResumes: () => ReturnType<typeof getAtsResumeFromResumeId>
  setSelectedResumeId: (id: string | null) => void
  init: () => void
}

const useAtsStore = create<AtsStore>()(
  (set, get) => {
    const setAtsEvaluation = (atsEvaluation: AtsEvaluationResult | null) => set({ ...atsEvaluation })

    const setHistory = (history: AtsEvaluationResult[]) => set({ history })

    const init = async () => {
      try {
        set({ loading: true })

        const data = await getAtsFromUserId()

        setAtsEvaluation(data)
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

    const getAtsResumes = async () => await getAtsResumeFromResumeId()

    const setSelectedResumeId = (id: string | null) => set({ selectedResumeId: id })

    return {
      ...DEFAULT_ATS,
      history: [] as AtsEvaluationResult[],
      loading: false,
      selectedResumeId: null,

      setAtsEvaluation,
      setHistory,
      init,
      revertFixChecklist,
      getAtsResumes,
      setSelectedResumeId,
    }
  },
)

export default useAtsStore
