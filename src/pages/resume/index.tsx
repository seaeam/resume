import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import useResumeListStore from '@/pages/resume/store'
import CreateResumeCard from './components/create-resume-card'
import HeadBars from './components/head-bars'
import ResumeCard from './components/resume-card'
import SyncResumesDialog from './components/sync-resumes-dialog'

export default function ResumePage() {
  const { resumes, loading, isOnline, syncingIds, loadResumes, setupRealtimeSubscription } = useResumeListStore()

  useEffect(() => {
    loadResumes()
  }, [loadResumes])

  useEffect(() => {
    if (!isOnline)
      return

    return setupRealtimeSubscription()
  }, [isOnline, setupRealtimeSubscription])

  if (loading)
    return <ResumePageSkeleton />

  return (
    <div className="container mx-auto p-8">
      <HeadBars />

      <motion.div
        className="grid grid-cols-1 items-center md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <AnimatePresence mode="popLayout">
          {resumes.map((resume, index) => {
            const isSyncingThis = syncingIds.has(resume.resume_id)
            return (
              <motion.div
                key={resume.resume_id}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{
                  opacity: isSyncingThis ? 0.5 : 1,
                  scale: isSyncingThis ? 0.95 : 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.8,
                  y: -20,
                  transition: { duration: 0.2 },
                }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.05,
                  layout: { duration: 0.3 },
                }}
              >
                <ResumeCard resume={resume} />
              </motion.div>
            )
          })}

          <motion.div
            key="create-card"
            layout
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: resumes.length * 0.05,
              layout: { duration: 0.3 },
            }}
          >
            <CreateResumeCard />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <SyncResumesDialog />
    </div>
  )
}

function ResumePageSkeleton() {
  return (
    <div className="container mx-auto p-8">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-64" />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }, (_, idx) => idx).map(i => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
