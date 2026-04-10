import type { RefObject } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { ResumeTemplateRuntime } from '@/components/resume/runtime/ResumeTemplateRuntime'
import { getBuiltInTemplateManifest } from '@/lib/resume-template/runtime/get-built-in-manifest'
import { getManifestFromTemplateBinding } from '@/lib/resume-template/runtime/get-manifest-from-binding'
import { buildTemplateResumeData } from '@/pages/template/context/resume-data-context'
import useResumeStore from '@/store/resume/form'
import ResumeWrapper from './ResumeWrapper'

interface ResumePreviewProps {
  resumeRef: RefObject<HTMLDivElement | null>
  scrollContainerRef?: RefObject<HTMLDivElement | null>
}

export function ResumePreview({ resumeRef, scrollContainerRef }: ResumePreviewProps) {
  const type = useResumeStore(state => state.type)
  const templateBinding = useResumeStore(state => state.templateBinding)
  const basics = useResumeStore(state => state.basics)
  const jobIntent = useResumeStore(state => state.job_intent)
  const applicationInfo = useResumeStore(state => state.application_info)
  const eduBackground = useResumeStore(state => state.edu_background)
  const workExperience = useResumeStore(state => state.work_experience)
  const internshipExperience = useResumeStore(state => state.internship_experience)
  const campusExperience = useResumeStore(state => state.campus_experience)
  const projectExperience = useResumeStore(state => state.project_experience)
  const skillSpecialty = useResumeStore(state => state.skill_specialty)
  const honorsCertificates = useResumeStore(state => state.honors_certificates)
  const selfEvaluation = useResumeStore(state => state.self_evaluation)
  const hobbies = useResumeStore(state => state.hobbies)
  const order = useResumeStore(state => state.order)
  const visibility = useResumeStore(state => state.visibility)
  const previewData = useMemo(() => buildTemplateResumeData({
    basics,
    job_intent: jobIntent,
    application_info: applicationInfo,
    edu_background: eduBackground,
    work_experience: workExperience,
    internship_experience: internshipExperience,
    campus_experience: campusExperience,
    project_experience: projectExperience,
    skill_specialty: skillSpecialty,
    honors_certificates: honorsCertificates,
    self_evaluation: selfEvaluation,
    hobbies,
    order,
    type,
    templateBinding,
    visibility,
  }), [
    applicationInfo,
    basics,
    campusExperience,
    eduBackground,
    hobbies,
    honorsCertificates,
    internshipExperience,
    jobIntent,
    order,
    projectExperience,
    selfEvaluation,
    skillSpecialty,
    templateBinding,
    type,
    visibility,
    workExperience,
  ])
  const [manifest, setManifest] = useState(() => getBuiltInTemplateManifest(type))

  useEffect(() => {
    let cancelled = false

    async function loadManifest() {
      const fallbackManifest = getBuiltInTemplateManifest(templateBinding?.basedOnResumeType ?? type)

      if (!templateBinding) {
        setManifest(fallbackManifest)
        return
      }

      try {
        const resolvedManifest = await getManifestFromTemplateBinding(templateBinding)
        if (!cancelled) {
          setManifest(resolvedManifest ?? fallbackManifest)
        }
      }
      catch {
        if (!cancelled) {
          setManifest(fallbackManifest)
        }
      }
    }

    loadManifest()

    return () => {
      cancelled = true
    }
  }, [templateBinding, type])

  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-auto p-3 md:p-8">
      <div className="flex min-w-fit justify-center">
        <div className="w-fit">
          <ResumeWrapper ref={resumeRef}>
            <ResumeTemplateRuntime data={previewData} manifest={manifest} />
          </ResumeWrapper>
        </div>
      </div>
    </div>
  )
}
