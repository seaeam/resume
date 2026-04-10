import type { TemplateManifest } from '../schema'
import type { ResumeTemplateBinding, ResumeType } from '@/lib/schema'
import type { TemplateSourceKind } from '@/lib/supabase/template'
import {
  getPublishedCommunityTemplateById,
  getUserTemplateById,
} from '@/lib/supabase/template'
import { cloneTemplateManifest } from '../defaults'
import { getOfficialTemplateCatalogItem } from '../registry/official-template-catalog'

function resolveLegacyResumeTypeFromOfficialTemplateId(templateId?: string | null) {
  if (!templateId) {
    return 'default'
  }

  return getOfficialTemplateCatalogItem(templateId)?.source.legacyResumeType ?? 'default'
}

async function getUserSourceManifest(source: 'community' | 'user', templateId: string) {
  const template = source === 'community'
    ? await getPublishedCommunityTemplateById(templateId)
    : await getUserTemplateById(templateId)

  return {
    manifest: cloneTemplateManifest(template.manifest),
    resumeType: resolveLegacyResumeTypeFromOfficialTemplateId(
      template.source.basedOnTemplateId ?? template.manifest.id,
    ),
  }
}

export async function getManifestFromTemplateBinding(
  binding?: ResumeTemplateBinding | null,
): Promise<TemplateManifest | null> {
  if (!binding) {
    return null
  }

  if (binding.source === 'official') {
    const officialTemplate = getOfficialTemplateCatalogItem(binding.templateId)
    return officialTemplate ? cloneTemplateManifest(officialTemplate.manifest) : null
  }

  const { manifest } = await getUserSourceManifest(binding.source, binding.templateId)
  return manifest
}

export async function getResumeTypeFromTemplateSource(
  source: TemplateSourceKind,
  templateId: string,
): Promise<ResumeType> {
  if (source === 'official') {
    return resolveLegacyResumeTypeFromOfficialTemplateId(templateId)
  }

  const { resumeType } = await getUserSourceManifest(source, templateId)
  return resumeType
}
