import { motion } from 'motion/react'
import { useEffect } from 'react'
import Charts from './components/charts'
import Entry from './components/entry'
import Header from './components/header'
import StatisticalCard from './components/statistical-card'
import { TodoCard } from './components/todo'
import useIndexStore from './store'

const Container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
}
const MotionItem = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
}

export default function DashboardPage() {
  const loadData = useIndexStore(s => s.loadData)

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <motion.div
      variants={Container}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-5 md:gap-6 p-4 pb-8 md:p-6 lg:p-8 max-w-7xl mx-auto"
    >
      <motion.div variants={MotionItem}>
        <Header />
      </motion.div>

      <motion.div variants={MotionItem}>
        <TodoCard />
      </motion.div>

      <motion.div variants={MotionItem}>
        <StatisticalCard />
      </motion.div>

      <motion.div variants={MotionItem}>
        <Entry />
      </motion.div>

      <motion.div variants={MotionItem}>
        <Charts />
      </motion.div>
    </motion.div>
  )
}
