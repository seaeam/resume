import type { ResumeItem } from './types'
import { useEffect, useState } from 'react'
import { getAllOfflineResumes } from '@/lib/offline-resume-manager'
import { getAllResumesFromUser } from '@/lib/supabase/resume/form'
import { getCurrentUser } from '@/lib/supabase/user'
import { AdvancedTools } from './components/advanced-tools'
import { IssueAnalysis } from './components/issue-analysis'
import { OptimizeDashboard } from './components/optimize-dashboard'
import { OptimizeHeader } from './components/optimize-header'
import { ProTips } from './components/pro-tips'
import { RepairChecklist } from './components/repair-checklist'
import { ResumeManager } from './components/resume-manager'
import { MOCK_CHECKLIST, MOCK_ISSUES, MOCK_RESUMES } from './const'

function Optimize() {
  const [resumes, setResumes] = useState<ResumeItem[]>(MOCK_RESUMES)
  const [selectedResume, setSelectedResume] = useState(MOCK_RESUMES[0].id)
  const [checklist, setChecklist] = useState(MOCK_CHECKLIST)

  useEffect(() => {
    async function loadResumes() {
      try {
        const user = await getCurrentUser()
        let allResumes: any[] = []

        if (user) {
          try {
            const online = await getAllResumesFromUser()
            allResumes = [...online]
          }
          catch (e) {
            console.error('Failed to load online resumes', e)
          }
        }

        try {
          const offline = await getAllOfflineResumes()
          allResumes = [...allResumes, ...offline]
        }
        catch (e) {
          console.error('Failed to load offline resumes', e)
        }

        if (allResumes.length > 0) {
          const formattedResumes: ResumeItem[] = allResumes.map(r => ({
            id: r.resume_id,
            name: r.display_name || '未命名简历',
            date: new Date(r.created_at).toLocaleDateString(),
            score: Math.floor(Math.random() * 30) + 60, // Mock score 60-90
          }))
          setResumes(formattedResumes)
          // 如果当前选中的不在列表中，默认选中第一个
          if (!formattedResumes.find(r => r.id === selectedResume)) {
            setSelectedResume(formattedResumes[0].id)
          }
        }
      }
      catch (e) {
        console.error('Error loading resumes', e)
      }
    }

    loadResumes()
  }, [])

  const toggleChecklist = (id: string) => {
    setChecklist(prev => prev.map(item =>
      item.id === id ? { ...item, done: !item.done } : item,
    ))
  }

  const completedTasks = checklist.filter(i => i.done).length
  const progress = Math.round((completedTasks / checklist.length) * 100)

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6 overflow-x-hidden">
      {/* Header */}
      <OptimizeHeader />

      {/* Dashboard Area */}
      <OptimizeDashboard
        progress={progress}
        completedTasks={completedTasks}
        totalTasks={checklist.length}
      />

      <div className="grid gap-6 md:grid-cols-12">
        {/* Left Column */}
        <div className="md:col-span-8 space-y-6">

          {/* Resume Selection & Upload Zone */}
          <ResumeManager
            resumes={resumes}
            selectedResume={selectedResume}
            onSelectResume={setSelectedResume}
          />

          {/* Issues Analysis */}
          <IssueAnalysis issues={MOCK_ISSUES} />
        </div>

        {/* Right Column */}
        <div className="md:col-span-4 space-y-6">

          {/* Repair Checklist */}
          <RepairChecklist
            checklist={checklist}
            onToggle={toggleChecklist}
          />

          {/* Market-Aligned Features */}
          <AdvancedTools />

          {/* Tips Card */}
          <ProTips />

        </div>
      </div>
    </div>
  )
}

export default Optimize
