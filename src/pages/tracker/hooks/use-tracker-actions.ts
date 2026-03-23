import type { ApplicationStatus, JobApplication } from '../types'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { createCompany, deleteCompany, getCompanies, updateCompany } from '@/lib/supabase/resume'
import useTrackerStore from '../store'
import { autoCompleteStages, getTrackerErrorMessage, getTrackerLoadErrorMeta } from '../utils'

type CreateJobInput = Omit<JobApplication, 'id' | 'created_at' | 'updated_at' | 'user_id'>

function syncJob(job: JobApplication) {
  useTrackerStore.setState(state => ({
    jobs: state.jobs.map(current => current.id === job.id ? job : current),
    selectedJob: state.selectedJob?.id === job.id ? job : state.selectedJob,
  }))
}

function replaceJobsAndSelection(jobs: JobApplication[], selectedJob: JobApplication | null) {
  useTrackerStore.setState({ jobs, selectedJob })
}

export function useTrackerActions() {
  const init = useCallback(async () => {
    const { isInitialized, loading } = useTrackerStore.getState()
    if (isInitialized || loading) {
      return
    }

    useTrackerStore.setState({ loading: true, error: null })

    try {
      const jobs = await getCompanies()
      useTrackerStore.setState({ jobs, loading: false, error: null, isInitialized: true })
    }
    catch (error) {
      const { message, description } = getTrackerLoadErrorMeta(error)
      useTrackerStore.setState({ loading: false, error: message })
      toast.error(message, { description })
    }
  }, [])

  const updateJob = useCallback(async (job: JobApplication) => {
    const { jobs, selectedJob } = useTrackerStore.getState()

    syncJob(job)

    try {
      const updated = await updateCompany(job.id, job)
      syncJob(updated)
    }
    catch (error) {
      replaceJobsAndSelection(jobs, selectedJob)
      console.error('Failed to update job:', error)
      toast.error('更新失败', { description: getTrackerErrorMessage(error) })
    }
  }, [])

  const changeJobStatus = useCallback(async (jobId: string, newStatus: ApplicationStatus) => {
    const { jobs, selectedJob } = useTrackerStore.getState()
    const job = jobs.find(current => current.id === jobId)

    if (!job) {
      return
    }

    const updatedStageDetails = autoCompleteStages(job.status, newStatus, job.stage_details, true)
    const updatedJob = { ...job, status: newStatus, stage_details: updatedStageDetails }

    syncJob(updatedJob)

    try {
      await updateCompany(jobId, updatedJob)

      if (newStatus === 'offer') {
        toast.success('Offer🎉')
      }
      else if (newStatus === 'rejected') {
        toast.error('终止流程')
      }
    }
    catch (error) {
      replaceJobsAndSelection(jobs, selectedJob)
      toast.error('更新状态失败', { description: getTrackerErrorMessage(error) })
    }
  }, [])

  const addJob = useCallback(async (jobData: CreateJobInput) => {
    try {
      const newJob = await createCompany(jobData)
      useTrackerStore.setState(state => ({ jobs: [newJob, ...state.jobs] }))
      toast.success('添加成功')
    }
    catch (error) {
      console.error('Failed to add job:', error)
      toast.error('添加失败', { description: getTrackerErrorMessage(error) })
    }
  }, [])

  const deleteSelectedJobs = useCallback(async () => {
    const { selectedIds } = useTrackerStore.getState()
    if (selectedIds.size === 0) {
      return
    }

    const ids = new Set(selectedIds)

    try {
      await Promise.all(Array.from(ids).map(id => deleteCompany(id)))

      useTrackerStore.setState(state => {
        const deletingSelectedJob = state.selectedJob ? ids.has(state.selectedJob.id) : false

        return {
          jobs: state.jobs.filter(job => !ids.has(job.id)),
          selectedIds: new Set(),
          isSelectMode: false,
          selectedJob: deletingSelectedJob ? null : state.selectedJob,
          drawerOpen: deletingSelectedJob ? false : state.drawerOpen,
        }
      })

      toast.success(`已删除 ${ids.size} 个职位`)
    }
    catch (error) {
      console.error('Failed to delete jobs:', error)
      toast.error('删除失败', { description: getTrackerErrorMessage(error) })
    }
  }, [])

  return {
    init,
    updateJob,
    changeJobStatus,
    addJob,
    deleteSelectedJobs,
  }
}
