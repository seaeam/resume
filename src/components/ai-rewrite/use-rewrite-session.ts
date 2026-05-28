import type { RewriteAction, RewriteCandidate, RewriteSessionState } from './types'
import { useCallback, useState } from 'react'

const INITIAL: RewriteSessionState = {
  status: 'idle',
  action: null,
  candidates: [],
  errorMessage: null,
  jdDraft: '',
}

export function useRewriteSession() {
  const [state, setState] = useState<RewriteSessionState>(INITIAL)

  const startStreaming = useCallback((action: RewriteAction) => {
    setState(prev => ({
      ...prev,
      status: 'streaming',
      action,
      candidates: [],
      errorMessage: null,
    }))
  }, [])

  const succeed = useCallback((candidates: RewriteCandidate[]) => {
    setState(prev => ({ ...prev, status: 'success', candidates, errorMessage: null }))
  }, [])

  const fail = useCallback((message: string) => {
    setState(prev => ({ ...prev, status: 'error', errorMessage: message }))
  }, [])

  const reset = useCallback(() => {
    setState(INITIAL)
  }, [])

  const setJdDraft = useCallback((jdDraft: string) => {
    setState(prev => ({ ...prev, jdDraft }))
  }, [])

  const openWaitingJd = useCallback((action: RewriteAction) => {
    setState(prev => ({
      ...prev,
      status: 'success',
      action,
      candidates: [],
      errorMessage: null,
    }))
  }, [])

  return { state, startStreaming, succeed, fail, reset, setJdDraft, openWaitingJd }
}
