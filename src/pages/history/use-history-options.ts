import type { HistoryResumeOption } from './types'
import { useCallback, useEffect, useState } from 'react'
import { listResumeHistoryOptions } from '@/lib/supabase/resume'
import { buildHistoryResumeOption } from './utils'

interface UseHistoryResumeOptionsResult {
  resumeOptions: HistoryResumeOption[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

export function useHistoryResumeOptions(): UseHistoryResumeOptionsResult {
  const [resumeOptions, setResumeOptions] = useState<HistoryResumeOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadResumeOptions = useCallback(async () => {
    setLoading(true)

    try {
      const options = await listResumeHistoryOptions()
      setResumeOptions(options.map(buildHistoryResumeOption))
      setError(null)
    }
    catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : '简历列表加载失败'
      setResumeOptions([])
      setError(message)
    }
    finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadResumeOptions()
  }, [loadResumeOptions])

  return {
    resumeOptions,
    loading,
    error,
    reload: loadResumeOptions,
  }
}
