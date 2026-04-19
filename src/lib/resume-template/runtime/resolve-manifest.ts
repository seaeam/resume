import type { ResolvedTemplateManifest, TemplateManifest, TemplateSection, TemplateSkeleton } from '../schema'
import { cloneTemplateSection, cloneTemplateSections, DEFAULT_TEMPLATE_FAMILY_ID, KNOWN_COLOR_PRESETS, KNOWN_FONT_PRESETS, KNOWN_RADIUS_PRESETS, KNOWN_SPACING_PRESETS, SUPPORTED_SECTION_RENDERERS } from '../defaults'
import { templateFamilies } from '../registry/families'
import { templateManifestSchema, templateSkeletonEnum } from '../schema'

function getFallbackFamily(familyId: string) {
  return templateFamilies[familyId as keyof typeof templateFamilies]
    ?? templateFamilies[DEFAULT_TEMPLATE_FAMILY_ID]
}

function resolveTokens(
  input: TemplateManifest['tokens'],
  fallback: TemplateManifest['tokens'],
): TemplateManifest['tokens'] {
  return {
    colorPreset: KNOWN_COLOR_PRESETS.has(input.colorPreset) ? input.colorPreset : fallback.colorPreset,
    fontPreset: KNOWN_FONT_PRESETS.has(input.fontPreset) ? input.fontPreset : fallback.fontPreset,
    spacingPreset: KNOWN_SPACING_PRESETS.has(input.spacingPreset) ? input.spacingPreset : fallback.spacingPreset,
    radiusPreset: input.radiusPreset && KNOWN_RADIUS_PRESETS.has(input.radiusPreset)
      ? input.radiusPreset
      : fallback.radiusPreset,
  }
}

function resolveSections(
  inputSections: TemplateSection[],
  fallbackSections: TemplateSection[],
  requiredSections: string[],
): TemplateSection[] {
  const sectionMap = new Map<string, TemplateSection>()

  const baseSections = inputSections.length > 0 ? inputSections : fallbackSections

  for (const section of cloneTemplateSections(baseSections)) {
    if (SUPPORTED_SECTION_RENDERERS.has(section.renderer))
      sectionMap.set(section.sectionId, section)
  }

  for (const sectionId of requiredSections) {
    if (sectionMap.has(sectionId))
      continue

    const fallbackSection = fallbackSections.find(section => section.sectionId === sectionId)
    if (fallbackSection && SUPPORTED_SECTION_RENDERERS.has(fallbackSection.renderer)) {
      sectionMap.set(sectionId, cloneTemplateSection(fallbackSection))
    }
  }

  return [...sectionMap.values()].sort((left, right) => left.order - right.order)
}

export function resolveTemplateManifest(input: TemplateManifest): ResolvedTemplateManifest {
  const parsed = templateManifestSchema.parse(input)
  const family = getFallbackFamily(parsed.familyId)
  const requiredSections = [
    ...(family.defaultRules.requiredSections ?? []),
    ...(parsed.rules.requiredSections ?? []),
  ]
  const fallbackLayout = family.defaultLayout

  const parsedSkeleton = templateSkeletonEnum.safeParse(parsed.layout.skeleton)
  const skeleton: TemplateSkeleton = parsedSkeleton.success
    ? parsedSkeleton.data
    : fallbackLayout.skeleton

  return {
    ...parsed,
    familyId: family.id,
    layout: {
      ...fallbackLayout,
      ...parsed.layout,
      skeleton,
      page: {
        ...fallbackLayout.page,
        ...parsed.layout.page,
      },
    },
    sections: resolveSections(parsed.sections, family.defaultSections, requiredSections),
    tokens: resolveTokens(parsed.tokens, family.defaultTokens),
    rules: {
      ...family.defaultRules,
      ...parsed.rules,
      requiredSections,
      lockedSections: parsed.rules.lockedSections ?? family.defaultRules.lockedSections,
      allowedRegions: {
        ...family.defaultRules.allowedRegions,
        ...parsed.rules.allowedRegions,
      },
    },
  }
}
