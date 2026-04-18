import { Loader2, RefreshCcw, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import useAtsStore from '../../../store'

interface AnalysisActionsProps {
  hasAnalysis: boolean
  isProcessing: boolean
  onViewAnalysis: () => void
  onStartAnalysis: () => void
}

export function AnalysisActions({ hasAnalysis, isProcessing, onViewAnalysis, onStartAnalysis }: AnalysisActionsProps) {
  const selectedResumeId = useAtsStore(s => s.selectedResumeId)

  return (
    <>
      {hasAnalysis && (
        <Button
          variant="secondary"
          size="sm"
          className="h-9 px-4"
          onClick={onViewAnalysis}
        >
          <Search className="mr-2 h-4 w-4" />
          查看分析
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={onStartAnalysis}
        disabled={isProcessing || !selectedResumeId}
      >
        {isProcessing
          ? <Loader2 className="animate-spin" />
          : <RefreshCcw />}
        {hasAnalysis ? '重新检测' : '开始检测'}
      </Button>
    </>
  )
}
