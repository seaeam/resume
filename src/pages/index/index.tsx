import type { Resume } from './type'
import type { ResumeType } from '@/store/resume/current'
import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { getAllOfflineResumes } from '@/lib/offline-resume-manager'
import { getAllResumesFromUser } from '@/lib/supabase/resume/form'
import { getCurrentUser } from '@/lib/supabase/user'
import { diffDates } from '@/utils/date'
import Charts from './components/charts'
import Entry from './components/Entry'
import Header from './components/Header'
import DashboardSkeleton from './components/Skeleton'
import StatisticalCard from './components/statistical-card'

const Container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}
const MotionItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function DashboardPage() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(false)

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
        updated_at: r.updated_at,
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
      (a, b) => diffDates(b.updated_at, a.updated_at),
    )
    const latestResume = sortedByDate[0]

    return { total, online, offline, recentCount, latestResume }
  }, [resumes])

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <motion.div
      variants={Container}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-4 md:gap-6 p-4 md:p-8 max-w-7xl mx-auto"
    >
      <motion.div variants={MotionItem}>
        <Header />
      </motion.div>

      <motion.div variants={MotionItem}>
        <StatisticalCard stats={stats} />
      </motion.div>

      <motion.div variants={MotionItem}>
        <Entry isOnline={isOnline} resumes={resumes} />
      </motion.div>

      <motion.div variants={MotionItem}>
        <Charts stats={stats} resumes={resumes} />
      </motion.div>
    </motion.div>
  )
}
