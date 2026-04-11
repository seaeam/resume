import type { TemplateManifest, TemplateRecord } from '../schema'
import { cloneTemplateManifest, cloneTemplateSections } from '../defaults'
import { templateFamilies } from '../registry/families'
import { getOfficialTemplateCatalogItem } from '../registry/official-template-catalog'

function createDraftId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function buildDraftMeta(
  name: string,
  description?: string,
): TemplateManifest['meta'] {
  return {
    name,
    description,
    ownerType: 'user',
    visibility: 'private',
    status: 'active',
  }
}

export function createTemplateDraftFromFamily(familyId: string): TemplateManifest {
  const family = templateFamilies[familyId as keyof typeof templateFamilies]

  if (!family) {
    throw new Error(`Unknown template family: ${familyId}`)
  }

  return {
    id: createDraftId(familyId),
    version: 1,
    familyId: family.id,
    meta: buildDraftMeta(`${family.id} 副本`),
    layout: {
      ...family.defaultLayout,
      page: { ...family.defaultLayout.page },
    },
    sections: cloneTemplateSections(family.defaultSections),
    tokens: { ...family.defaultTokens },
    rules: {
      ...family.defaultRules,
      requiredSections: [...(family.defaultRules.requiredSections ?? [])],
      lockedSections: [...(family.defaultRules.lockedSections ?? [])],
      allowedRegions: family.defaultRules.allowedRegions
        ? Object.fromEntries(
            Object.entries(family.defaultRules.allowedRegions).map(([key, regions]) => [key, [...regions]]),
          )
        : undefined,
    },
  }
}

export function createTemplateDraftFromOfficialTemplate(templateId: string): TemplateManifest {
  const template = getOfficialTemplateCatalogItem(templateId)

  if (!template) {
    throw new Error(`Unknown official template: ${templateId}`)
  }

  const manifest = cloneTemplateManifest(template.manifest)

  return {
    ...manifest,
    id: createDraftId(template.id),
    meta: buildDraftMeta(`${template.title} 副本`, manifest.meta.description),
  }
}

export function cloneUserTemplateRecord(record: TemplateRecord): TemplateRecord {
  const timestamp = new Date().toISOString()

  return {
    ...record,
    id: '',
    manifest: {
      ...cloneTemplateManifest(record.manifest),
      id: createDraftId(record.manifest.familyId),
      meta: buildDraftMeta(`${record.meta.name} 副本`, record.meta.description),
    },
    source: {
      kind: 'user',
      familyId: record.source.familyId,
      basedOnTemplateId: record.source.basedOnTemplateId ?? record.id,
    },
    meta: {
      ...record.meta,
      name: `${record.meta.name} 副本`,
      visibility: 'private',
      status: 'active',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  }
}
