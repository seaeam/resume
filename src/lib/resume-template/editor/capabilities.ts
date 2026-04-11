import type {
  ResolvedTemplateManifest,
  TemplateFamilyEditorCapabilities,
  TemplateManifest,
  TemplateSection,
  TemplateSkeleton,
} from '../schema'
import { DEFAULT_TEMPLATE_FAMILY_ID } from '../defaults'
import { templateFamilies } from '../registry/families'
import { resolveTemplateManifest } from '../runtime'

export interface ResolvedTemplateEditorCapabilities extends TemplateFamilyEditorCapabilities {
  requiredSectionIds: string[]
  lockedSectionIds: string[]
  allowedRegionsBySection: Record<string, TemplateSection['region'][]>
}

const MULTI_REGION_SKELETONS = new Set<TemplateSkeleton>(['sidebar-left', 'sidebar-right', 'stacked'])

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

function buildAllowedRegionsBySection(
  resolved: ResolvedTemplateManifest,
  paletteSectionIds: string[],
) {
  const allowedRegionsBySection = Object.fromEntries(
    Object.entries(resolved.rules.allowedRegions ?? {}).map(([key, regions]) => [key, [...regions]]),
  )
  const dynamicKeys = new Set<string>([
    ...paletteSectionIds,
    ...resolved.sections.flatMap(section => [section.sectionId, section.renderer]),
  ])
  const canUseSidebar = MULTI_REGION_SKELETONS.has(resolved.layout.skeleton)

  for (const key of dynamicKeys) {
    allowedRegionsBySection[key] = key === 'basics'
      ? ['main']
      : canUseSidebar
        ? ['main', 'sidebar']
        : ['main']
  }

  allowedRegionsBySection.basics = ['main']

  return allowedRegionsBySection
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
    allowedRegionsBySection: buildAllowedRegionsBySection(resolved, family.editor.sectionPalette),
  }
}

export function getTemplateSectionAllowedRegions(
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
  return getTemplateSectionAllowedRegions(manifest, section).includes(region)
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
