import type { Suggestion } from '@/pages/optimize/types'
import { set, toPath } from 'lodash'
import { toast } from 'sonner'
import { getResumeById, updateResumeConfig } from '@/lib/supabase/resume'
import { getCurrentUser } from '@/lib/supabase/user'
import { setLeaf } from '@/pages/optimize/utils'
import { DocumentManager } from './manager'

export async function syncAutomergeDocument(
  resumeId: string,
  updates: Suggestion[],
  options: { syncToResumeConfig?: boolean } = {},
) {
  const validSuggestions = updates?.filter(s => s?.locate?.path) || []

  if (validSuggestions.length === 0) {
    return
  }

  const user = await getCurrentUser()

  if (!user) {
    return
  }

  const manager = new DocumentManager(resumeId, user.id)
  const handle = await manager.initialize()

  manager.change((doc) => {
    validSuggestions.forEach((suggestion) => {
      setLeaf(doc, toPath(suggestion.locate.path), suggestion.after)
    })
  })

  await manager.saveToSupabase(handle)

  if (!options.syncToResumeConfig) {
    return
  }

  try {
    const resumeConfig = await getResumeById(resumeId)

    validSuggestions.forEach((suggestion) => {
      set(resumeConfig, suggestion.locate.path, suggestion.after)
    })

    await updateResumeConfig(resumeId, resumeConfig)
  }
  catch (error) {
    toast.error(`Failed to sync to resume_config：${error}`)
  }
}
