export {
  addSection,
  canTemplateSectionDelete,
  canTemplateSectionMoveToRegion,
  cloneUserTemplateRecord,
  createTemplateDraftFromFamily,
  createTemplateDraftFromOfficialTemplate,
  getAppearanceOverrideFromTemplateManifest,
  getTemplateEditorCapabilities,
  getTemplateFamilyEditorCapabilities,
  getTemplateSectionVariants,
  isTemplateSectionLocked,
  isTemplateSectionRequired,
  moveSectionRegion,
  removeSection,
  reorderSections,
  toggleSectionVisibility,
  updateLayoutConfig,
  updateSectionVariant,
  updateTemplateMeta,
  updateTokenConfig,
  validateTemplateForPublish,
  validateTemplateForSave,
} from '@/lib/resume-template/editor'
export { builtInTemplateManifests } from '@/lib/resume-template/registry/manifests'
export {
  getOfficialTemplateCatalogItem,
  officialTemplateCatalog,
} from '@/lib/resume-template/registry/official-template-catalog'
export {
  getBuiltInTemplateManifest,
  resolveTemplateManifest,
} from '@/lib/resume-template/runtime'
