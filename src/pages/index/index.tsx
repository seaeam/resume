import type { Resume } from './type'
import type { ResumeType } from '@/store/resume/current'
import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getAllOfflineResumes } from '@/lib/offline-resume-manager'
import { getAllResumesFromUser, searchOnlineResumes } from '@/lib/supabase/resume/form'
import { getCurrentUser } from '@/lib/supabase/user'
import Chart from './components/Chart'
import Entry from './components/Entry'
import Header from './components/Header'
import StatisticalCard from './components/statistical-card'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function DashboardPage() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(false)
  const [searchResults, setSearchResults] = useState<Resume[]>([])

  useEffect(() => {
    loadResumes()
  }, [])

  async function loadResumes() {
    try {
      const user = await getCurrentUser()
      setIsOnline(!!user)

      let allResumes: Resume[] = []

      // 加载在线简历
      if (user) {
        const onlineResumes = await getAllResumesFromUser()
        allResumes = onlineResumes.map(r => ({ ...r, isOffline: false }))
      }

      // 加载离线简历
      const localResumes = await getAllOfflineResumes()
      const offlineResumes = localResumes.map(r => ({
        resume_id: r.resume_id,
        created_at: r.created_at,
        type: r.type as ResumeType,
        display_name: r.display_name,
        description: r.description,
        isOffline: true,
      }))
      allResumes = [...allResumes, ...offlineResumes]

      setResumes(allResumes)
    }
    finally {
      setLoading(false)
    }
  }

  const stats = useMemo(() => {
    const total = resumes.length
    const online = resumes.filter(r => !r.isOffline).length
    const offline = resumes.filter(r => r.isOffline).length

    // 最近7天创建的简历数
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentCount = resumes.filter(
      r => new Date(r.created_at) > sevenDaysAgo,
    ).length

    // 最近更新的简历
    const sortedByDate = [...resumes].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    const latestResume = sortedByDate[0]

    return { total, online, offline, recentCount, latestResume }
  }, [resumes])

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-4 md:gap-6 p-4 md:p-8 max-w-7xl mx-auto"
    >
      <motion.div variants={item}>
        <Header />
      </motion.div>

      <motion.div variants={item}>
        <StatisticalCard stats={stats} />
      </motion.div>

      <motion.div variants={item}>
        <Entry isOnline={isOnline} resumes={resumes} />
      </motion.div>

      <motion.div variants={item}>
        <Chart stats={stats} resumes={resumes} />
      </motion.div>
    </motion.div>
  )
}

// 骨架屏
function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {['stat-1', 'stat-2', 'stat-3', 'stat-4'].map(id => (
          <Card key={id}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="mt-1 h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {['chart-1', 'chart-2', 'chart-3'].map(id => (
          <Card key={id}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// 格式化相对时间
