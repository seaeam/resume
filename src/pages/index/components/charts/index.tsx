import { useShallow } from 'zustand/react/shallow'
import useIndexStore, { selectStats } from '../../store'
import { ChartsSkeleton } from '../skeleton'
import CreateTrend from './create-trend'
import ResumeStorage from './resume-storage'
import ResumeType from './resume-type'

function Charts() {
  const resumes = useIndexStore(s => s.resumes)
  const loading = useIndexStore(s => s.loading)
  const stats = useIndexStore(useShallow(selectStats))

  if (loading) {
    return <ChartsSkeleton />
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
      <ResumeType resumes={resumes} stats={stats} />
      <CreateTrend resumes={resumes} />
      <ResumeStorage stats={stats} />
    </div>
  )
}

export default Charts
