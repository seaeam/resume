import { motion } from 'motion/react'
import { useSearchParams } from 'react-router-dom'
import { Separator } from '@/components/ui/separator'
import { useIsMobile } from '@/hooks/use-mobile'
import { isOfflineResumeId } from '@/lib/offline-resume-manager'
import useCurrentResumeStore from '@/store/resume/current'
import { useHistoryResumeOptions } from '../../hooks/use-history-options'
import HistoryHeaderActions from './actions'
import HistoryResumeSelector from './resume-selector'
import HistoryHeaderSummary from './summary'

export default function HistoryHeader() {
  const isMobile = useIsMobile()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentResumeId = useCurrentResumeStore(state => state.resumeId)

  const queryResumeId = searchParams.get('resumeId')
  const defaultResumeId = currentResumeId && !isOfflineResumeId(currentResumeId) ? currentResumeId : null

  const {
    resumeOptions,
    loading: resumeOptionsLoading,
    error: resumeOptionsError,
  } = useHistoryResumeOptions()

  const validResumeIds = new Set(resumeOptions.map(option => option.resumeId))
  const activeResumeId = queryResumeId && (resumeOptionsLoading || validResumeIds.has(queryResumeId))
    ? queryResumeId
    : !queryResumeId && defaultResumeId && (resumeOptionsLoading || validResumeIds.has(defaultResumeId))
        ? defaultResumeId
        : null

  const handleResumeChange = (resumeId: string) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous)
      next.set('resumeId', resumeId)
      return next
    })
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden rounded-4xl border border-border/70 bg-linear-to-br from-primary/[0.035] via-background to-background shadow-xs"
    >
      <div className="flex flex-col gap-5 p-4 sm:p-6 lg:gap-6 lg:p-7">
        <HistoryHeaderSummary />
        <Separator />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_1px_minmax(280px,320px)] lg:items-start">
          <HistoryResumeSelector
            value={activeResumeId}
            options={resumeOptions}
            loading={resumeOptionsLoading}
            error={resumeOptionsError}
            onChange={handleResumeChange}
          />
          {!isMobile && <Separator orientation="vertical" className="hidden lg:block" />}
          {!isMobile && <HistoryHeaderActions />}
        </div>
      </div>
    </motion.section>
  )
}
