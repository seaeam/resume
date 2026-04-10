import { useTemplateResumeData } from '@/pages/template/context/resume-data-context'
import { RuntimeRichText, RuntimeSection } from './shared'

export default function SelfEvaluationRenderer() {
  const { self_evaluation, getVisibility } = useTemplateResumeData()

  if (!getVisibility('self_evaluation')) {
    return null
  }

  return (
    <RuntimeSection title="自我评价">
      {self_evaluation.content ? <RuntimeRichText html={self_evaluation.content} /> : null}
    </RuntimeSection>
  )
}
