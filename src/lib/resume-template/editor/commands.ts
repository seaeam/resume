import type { TemplateManifest, TemplateSection } from '../schema'
import { cloneTemplateManifest, cloneTemplateSection, SUPPORTED_SECTION_RENDERERS } from '../defaults'
import {
  canTemplateSectionDelete,
  canTemplateSectionMoveToRegion,
  getTemplateSectionAllowedRegions,
  getTemplateSectionVariants,
  isTemplateSectionLocked,
  isTemplateSectionRequired,
} from './capabilities'

function sortSections(sections: TemplateSection[]) {
  return [...sections].sort((left, right) => left.order - right.order)
}

function normalizeSectionOrder(sections: TemplateSection[]) {
  return sections.map((section, index) => ({
    ...section,
    order: index + 1,
  }))
}

function updateManifestSections(manifest: TemplateManifest, sections: TemplateSection[]) {
  return {
    ...manifest,
    sections: normalizeSectionOrder(sections),
  }
}

function findSection(manifest: TemplateManifest, sectionId: string) {
  return manifest.sections.find(section => section.sectionId === sectionId)
}

export function reorderSections(
  manifest: TemplateManifest,
  region: TemplateSection['region'],
  orderedSectionIds: string[],
) {
  const clonedManifest = cloneTemplateManifest(manifest)
  const regionSections = sortSections(clonedManifest.sections).filter(section => section.region === region)
  const regionSectionMap = new Map(regionSections.map(section => [section.sectionId, section]))
  const nextRegionSections: TemplateSection[] = []

  for (const sectionId of orderedSectionIds) {
    const section = regionSectionMap.get(sectionId)
    if (section) {
      nextRegionSections.push(cloneTemplateSection(section))
      regionSectionMap.delete(sectionId)
    }
  }

  for (const section of regionSections) {
    if (regionSectionMap.has(section.sectionId)) {
      nextRegionSections.push(cloneTemplateSection(section))
    }
  }

  let nextRegionIndex = 0
  const nextSections = sortSections(clonedManifest.sections).map((section) => {
    if (section.region !== region) {
      return cloneTemplateSection(section)
    }

    const nextSection = nextRegionSections[nextRegionIndex]
    nextRegionIndex += 1
    return nextSection
  })

  return updateManifestSections(clonedManifest, nextSections)
}

export function toggleSectionVisibility(manifest: TemplateManifest, sectionId: string) {
  const clonedManifest = cloneTemplateManifest(manifest)
  const nextSections = clonedManifest.sections.map((section) => {
    if (section.sectionId !== sectionId) {
      return section
    }

    if (isTemplateSectionRequired(clonedManifest, sectionId) || isTemplateSectionLocked(clonedManifest, sectionId)) {
      return { ...section, visible: true }
    }

    return { ...section, visible: !section.visible }
  })

  return updateManifestSections(clonedManifest, nextSections)
}

export function moveSectionRegion(
  manifest: TemplateManifest,
  sectionId: string,
  region: TemplateSection['region'],
  targetIndex?: number,
) {
  const clonedManifest = cloneTemplateManifest(manifest)
  const section = findSection(clonedManifest, sectionId)

  if (!section || !canTemplateSectionMoveToRegion(clonedManifest, section, region)) {
    return clonedManifest
  }

  const updatedSections = clonedManifest.sections.map(current =>
    current.sectionId === sectionId
      ? { ...current, region }
      : current,
  )

  if (targetIndex == null) {
    return updateManifestSections(clonedManifest, updatedSections)
  }

  const currentRegionIds = sortSections(updatedSections)
    .filter(current => current.region === region)
    .map(current => current.sectionId)
    .filter(id => id !== sectionId)

  currentRegionIds.splice(targetIndex, 0, sectionId)

  return reorderSections(
    {
      ...clonedManifest,
      sections: updatedSections,
    },
    region,
    currentRegionIds,
  )
}

export function updateSectionVariant(
  manifest: TemplateManifest,
  sectionId: string,
  variant: string | undefined,
) {
  const clonedManifest = cloneTemplateManifest(manifest)
  const section = findSection(clonedManifest, sectionId)

  if (!section) {
    return clonedManifest
  }

  const allowedVariants = getTemplateSectionVariants(clonedManifest, section)
  const nextVariant = variant && allowedVariants.includes(variant) ? variant : undefined

  return updateManifestSections(
    clonedManifest,
    clonedManifest.sections.map(current =>
      current.sectionId === sectionId
        ? { ...current, variant: nextVariant }
        : current,
    ),
  )
}

export function updateLayoutConfig(
  manifest: TemplateManifest,
  patch: Partial<TemplateManifest['layout']>,
) {
  const clonedManifest = cloneTemplateManifest(manifest)
  const nextManifest = {
    ...clonedManifest,
    layout: {
      ...clonedManifest.layout,
      ...patch,
      page: {
        ...clonedManifest.layout.page,
        ...patch.page,
      },
    },
  }

  const normalizedSections = sortSections(nextManifest.sections).map((section) => {
    if (canTemplateSectionMoveToRegion(nextManifest, section, section.region)) {
      return cloneTemplateSection(section)
    }

    const [fallbackRegion = 'main'] = getTemplateSectionAllowedRegions(nextManifest, section)
    return {
      ...cloneTemplateSection(section),
      region: fallbackRegion,
    }
  })

  return updateManifestSections(nextManifest, normalizedSections)
}

export function updateTokenConfig(
  manifest: TemplateManifest,
  patch: Partial<TemplateManifest['tokens']>,
) {
  const clonedManifest = cloneTemplateManifest(manifest)

  return {
    ...clonedManifest,
    tokens: {
      ...clonedManifest.tokens,
      ...patch,
    },
  }
}

export function updateTemplateMeta(
  manifest: TemplateManifest,
  patch: Partial<TemplateManifest['meta']>,
) {
  const clonedManifest = cloneTemplateManifest(manifest)

  return {
    ...clonedManifest,
    meta: {
      ...clonedManifest.meta,
      ...patch,
    },
  }
}

export function addSection(
  manifest: TemplateManifest,
  section: Omit<TemplateSection, 'order'> & { order?: number },
) {
  if (!SUPPORTED_SECTION_RENDERERS.has(section.renderer) || findSection(manifest, section.sectionId)) {
    return cloneTemplateManifest(manifest)
  }

  const clonedManifest = cloneTemplateManifest(manifest)
  const nextSection: TemplateSection = {
    ...section,
    order: section.order ?? clonedManifest.sections.length + 1,
    visible: section.visible ?? true,
  }

  if (!canTemplateSectionMoveToRegion(clonedManifest, nextSection, nextSection.region)) {
    return clonedManifest
  }

  return updateManifestSections(clonedManifest, [...clonedManifest.sections, nextSection])
}

export function removeSection(manifest: TemplateManifest, sectionId: string) {
  if (!canTemplateSectionDelete(manifest, sectionId)) {
    return cloneTemplateManifest(manifest)
  }

  const clonedManifest = cloneTemplateManifest(manifest)
  return updateManifestSections(
    clonedManifest,
    clonedManifest.sections.filter(section => section.sectionId !== sectionId),
  )
}
