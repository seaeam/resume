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
import { ChartsSkeleton, EntrySkeleton, HeaderSkeleton, StatsSkeleton } from './components/Skeleton'
import StatisticalCard from './components/statistical-card'
import { TodoCard } from './components/todo'

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
  const [resumesLoading, setResumesLoading] = useState(true)
  const [userLoading, setUserLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      // 1. 并行启动用户状态检查和离线简历加载
      const userPromise = getCurrentUser()
      const offlinePromise = getAllOfflineResumes()

      // 2. 优先处理用户状态，以便尽快展示 Header
      const user = await userPromise
      setIsOnline(!!user)
      setUserLoading(false)

      // 3. 如果用户已登录，获取在线简历
      let onlineResumes: Resume[] = []
      if (user) {
        try {
          const rawOnlineResumes = await getAllResumesFromUser()
          onlineResumes = rawOnlineResumes.map(r => ({ ...r, isOffline: false }))
        }
        catch (error) {
          console.error('Failed to load online resumes:', error)
        }
      }

      // 4. 等待离线简历加载完成
      const localResumes = await offlinePromise
      const offlineResumes = localResumes.map(r => ({
        resume_id: r.resume_id,
        created_at: r.created_at,
        updated_at: r.updated_at,
        type: r.type as ResumeType,
        display_name: r.display_name,
        description: r.description,
        isOffline: true,
      }))

      // 5. 合并数据并更新状态
      setResumes([...onlineResumes, ...offlineResumes])
    }
    finally {
      setResumesLoading(false)
      // 确保在异常情况下 userLoading 也能被重置
      setUserLoading(false)
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

  return (
    <motion.div
      variants={Container}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-4 md:gap-6 p-4 md:p-8 max-w-7xl mx-auto"
    >
      <motion.div variants={MotionItem}>
        {userLoading ? <HeaderSkeleton /> : <Header />}
      </motion.div>

      <motion.div variants={MotionItem}>
        <TodoCard />
      </motion.div>

      <motion.div variants={MotionItem}>
        {resumesLoading ? <StatsSkeleton /> : <StatisticalCard stats={stats} />}
      </motion.div>

      <motion.div variants={MotionItem}>
        {resumesLoading ? <EntrySkeleton /> : <Entry isOnline={isOnline} resumes={resumes} />}
      </motion.div>

      <motion.div variants={MotionItem}>
        {resumesLoading ? <ChartsSkeleton /> : <Charts stats={stats} resumes={resumes} />}
      </motion.div>
    </motion.div>
  )
}
