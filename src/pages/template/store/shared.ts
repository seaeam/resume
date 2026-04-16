import type { TemplateRecord } from '@/lib/resume-template/schema'
import { updateTemplateMeta } from '../utils'

export type TemplateWorkbenchMode = 'library' | 'editor'
export type TemplateWorkbenchSource = 'official' | 'community' | 'user' | null
export type TemplateWorkbenchTab = 'official' | 'community' | 'mine'

export interface LoadTemplateOptions {
  silent?: boolean
}

export interface TemplateUiPatch {
  manifest?: TemplateRecord['manifest']
  name?: string
  description?: string
  visibility?: TemplateRecord['meta']['visibility']
  status?: TemplateRecord['meta']['status']
}

export function upsertTemplate(templates: TemplateRecord[], template: TemplateRecord) {
  const nextTemplates = [template, ...templates.filter(item => item.id !== template.id)]
  return nextTemplates.sort((left: TemplateRecord, right: TemplateRecord) =>
    new Date(right.meta.updatedAt).getTime() - new Date(left.meta.updatedAt).getTime(),
  )
}

export function isCommunityVisibleTemplate(template: TemplateRecord) {
  return template.meta.visibility === 'published' && template.meta.status === 'active'
}

export function mergeCommunityTemplates(communityTemplates: TemplateRecord[], userTemplates: TemplateRecord[]) {
  const userTemplateIds = new Set(userTemplates.map(template => template.id))
  const nextTemplates = [
    ...communityTemplates.filter(template => !userTemplateIds.has(template.id) && isCommunityVisibleTemplate(template)),
    ...userTemplates.filter(isCommunityVisibleTemplate),
  ]

  const templateMap = new Map<string, TemplateRecord>()

  for (const template of nextTemplates) {
    const currentTemplate = templateMap.get(template.id)

    if (!currentTemplate || new Date(template.meta.updatedAt).getTime() >= new Date(currentTemplate.meta.updatedAt).getTime()) {
      templateMap.set(template.id, template)
    }
  }

  return [...templateMap.values()].sort((left, right) =>
    new Date(right.meta.updatedAt).getTime() - new Date(left.meta.updatedAt).getTime(),
  )
}

export function mergeUserTemplates(remoteTemplates: TemplateRecord[], localTemplates: TemplateRecord[]) {
  const localTemplateMap = new Map(localTemplates.map(template => [template.id, template]))
  const mergedTemplates = remoteTemplates.map((template) => {
    const localTemplate = localTemplateMap.get(template.id)

    if (!localTemplate) {
      return template
    }

    return new Date(localTemplate.meta.updatedAt).getTime() > new Date(template.meta.updatedAt).getTime()
      ? localTemplate
      : template
  })

  for (const template of localTemplates) {
    if (!remoteTemplates.some(item => item.id === template.id)) {
      mergedTemplates.push(template)
    }
  }

  return mergedTemplates.sort((left, right) =>
    new Date(right.meta.updatedAt).getTime() - new Date(left.meta.updatedAt).getTime(),
  )
}

export function reconcileLastOpenedUserTemplateId(templates: TemplateRecord[], templateId: string | null) {
  if (!templateId) {
    return null
  }

  return templates.some(template => template.id === templateId) ? templateId : null
}

export function reconcileTemplateForUi(template: TemplateRecord, patch: TemplateUiPatch) {
  const nextManifest = patch.manifest ?? updateTemplateMeta(template.manifest, {
    name: patch.name ?? template.meta.name,
    description: patch.description ?? template.meta.description,
    visibility: patch.visibility ?? template.meta.visibility,
    status: patch.status ?? template.meta.status,
  })
  const updatedAt = new Date().toISOString()

  return {
    ...template,
    manifest: nextManifest,
    meta: {
      ...template.meta,
      name: patch.name ?? nextManifest.meta.name,
      description: patch.description ?? nextManifest.meta.description,
      visibility: patch.visibility ?? nextManifest.meta.visibility,
      status: patch.status ?? nextManifest.meta.status,
      updatedAt,
    },
  }
}
