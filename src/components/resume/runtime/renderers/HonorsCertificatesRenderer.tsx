import { useTemplateResumeData } from '@/pages/template/components/resume-data-context'
import { RuntimeRichText, RuntimeSection } from './shared'
import { useRuntimeStyles } from './utils'

export default function HonorsCertificatesRenderer() {
  const { honors_certificates, getVisibility } = useTemplateResumeData()
  const { font, theme } = useRuntimeStyles()

  if (!getVisibility('honors_certificates')) {
    return null
  }

  return (
    <RuntimeSection title="荣誉证书">
      {honors_certificates.description ? <RuntimeRichText html={honors_certificates.description} /> : null}
      {honors_certificates.certificates.length > 0
        ? (
            <div className="flex flex-wrap gap-2">
              {honors_certificates.certificates.map(item => (
                <span
                  key={item.name}
                  className="rounded-full border px-2 py-1"
                  style={{
                    fontSize: font.smallSize,
                    color: theme.textPrimary,
                    borderColor: theme.primaryColor,
                  }}
                >
                  {item.name}
                </span>
              ))}
            </div>
          )
        : null}
    </RuntimeSection>
  )
}
