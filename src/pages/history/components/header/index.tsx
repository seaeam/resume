import type { HistoryResumeOption } from '../../types'
import { motion } from 'motion/react'
import { Separator } from '@/components/ui/separator'
import { useIsMobile } from '@/hooks/use-mobile'
import HistoryHeaderActions from './actions'
import HistoryResumeSelector from './resume-selector'
import HistoryHeaderSummary from './summary'

interface HistoryHeaderProps {
  activeResumeId: string | null
  resumeOptions: HistoryResumeOption[]
  resumeOptionsLoading: boolean
  resumeOptionsError: string | null
  onResumeChange: (resumeId: string) => void
}

export default function HistoryHeader(props: HistoryHeaderProps) {
  const isMobile = useIsMobile()

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden rounded-4xl border bg-background shadow-xs"
    >
      <div className="flex flex-col gap-5 p-4 sm:p-6 lg:gap-6 lg:p-7">
        <HistoryHeaderSummary />
        <Separator />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_1px_minmax(280px,320px)] lg:items-start">
          <HistoryResumeSelector
            value={props.activeResumeId}
            options={props.resumeOptions}
            loading={props.resumeOptionsLoading}
            error={props.resumeOptionsError}
            onChange={props.onResumeChange}
          />
          {!isMobile && <Separator orientation="vertical" className="hidden lg:block" />}
          {!isMobile && <HistoryHeaderActions />}
        </div>
      </div>
    </motion.section>
  )
}
