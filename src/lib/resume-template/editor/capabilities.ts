import type {
  ResolvedTemplateManifest,
  TemplateFamilyEditorCapabilities,
  TemplateManifest,
  TemplateSection,
} from '../schema'
import { DEFAULT_TEMPLATE_FAMILY_ID } from '../defaults'
import { templateFamilies } from '../registry/families'
import { resolveTemplateManifest } from '../runtime'

export interface ResolvedTemplateEditorCapabilities extends TemplateFamilyEditorCapabilities {
  requiredSectionIds: string[]
  lockedSectionIds: string[]
  allowedRegionsBySection: Record<string, TemplateSection['region'][]>
}

function getTemplateFamily(familyId: string) {
  return templateFamilies[familyId as keyof typeof templateFamilies]
    ?? templateFamilies[DEFAULT_TEMPLATE_FAMILY_ID]
}

function getResolvedManifest(manifest: TemplateManifest | ResolvedTemplateManifest) {
  if ('layout' in manifest && typeof manifest.layout.skeleton === 'string' && manifest.familyId) {
    return resolveTemplateManifest(manifest)
  }

  return resolveTemplateManifest(manifest)
}

export function getTemplateFamilyEditorCapabilities(familyId: string): TemplateFamilyEditorCapabilities {
  return getTemplateFamily(familyId).editor
}

export function getTemplateEditorCapabilities(
  manifest: TemplateManifest | ResolvedTemplateManifest,
): ResolvedTemplateEditorCapabilities {
  const resolved = getResolvedManifest(manifest)
  const family = getTemplateFamily(resolved.familyId)

  return {
    ...family.editor,
    allowedSkeletons: [...family.editor.allowedSkeletons],
    allowedHeaderVariants: [...family.editor.allowedHeaderVariants],
    allowedDensity: [...family.editor.allowedDensity],
    allowedTokenPresets: {
      color: [...family.editor.allowedTokenPresets.color],
      font: [...family.editor.allowedTokenPresets.font],
      spacing: [...family.editor.allowedTokenPresets.spacing],
      radius: [...family.editor.allowedTokenPresets.radius],
    },
    sectionPalette: [...family.editor.sectionPalette],
    sectionVariants: Object.fromEntries(
      Object.entries(family.editor.sectionVariants).map(([key, variants]) => [key, [...variants]]),
    ),
    requiredSectionIds: [...(resolved.rules.requiredSections ?? [])],
    lockedSectionIds: [...(resolved.rules.lockedSections ?? [])],
    allowedRegionsBySection: Object.fromEntries(
      Object.entries(resolved.rules.allowedRegions ?? {}).map(([key, regions]) => [key, [...regions]]),
    ),
  }
}

function getAllowedRegionsBySectionId(
  manifest: TemplateManifest | ResolvedTemplateManifest,
  section: Pick<TemplateSection, 'sectionId' | 'renderer'>,
) {
  const capabilities = getTemplateEditorCapabilities(manifest)
  return capabilities.allowedRegionsBySection[section.sectionId]
    ?? capabilities.allowedRegionsBySection[section.renderer]
    ?? ['main']
}

export function isTemplateSectionRequired(
  manifest: TemplateManifest | ResolvedTemplateManifest,
  sectionId: string,
) {
  const capabilities = getTemplateEditorCapabilities(manifest)
  return capabilities.requiredSectionIds.includes(sectionId)
}

export function isTemplateSectionLocked(
  manifest: TemplateManifest | ResolvedTemplateManifest,
  sectionId: string,
) {
  const capabilities = getTemplateEditorCapabilities(manifest)
  return capabilities.lockedSectionIds.includes(sectionId)
}

export function canTemplateSectionMoveToRegion(
  manifest: TemplateManifest | ResolvedTemplateManifest,
  section: Pick<TemplateSection, 'sectionId' | 'renderer'>,
  region: TemplateSection['region'],
) {
  return getAllowedRegionsBySectionId(manifest, section).includes(region)
}

export function canTemplateSectionDelete(
  manifest: TemplateManifest | ResolvedTemplateManifest,
  sectionId: string,
) {
  return !isTemplateSectionLocked(manifest, sectionId) && !isTemplateSectionRequired(manifest, sectionId)
}

export function getTemplateSectionVariants(
  manifest: TemplateManifest | ResolvedTemplateManifest,
  section: Pick<TemplateSection, 'sectionId' | 'renderer'>,
) {
  const capabilities = getTemplateEditorCapabilities(manifest)
  return capabilities.sectionVariants[section.sectionId]
    ?? capabilities.sectionVariants[section.renderer]
    ?? ['default']
}
