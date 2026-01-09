import type { Resume, ResumeStats } from '../../type'
import { ChartsSkeleton } from '../Skeleton'
import CreateTrend from './create-trend'
import ResumeStorage from './resume-storage'
import ResumeType from './resume-type'

interface Props {
  stats: ResumeStats
  resumes: Resume[]
  loading?: boolean
}

function Charts({ stats, resumes, loading }: Props) {
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
