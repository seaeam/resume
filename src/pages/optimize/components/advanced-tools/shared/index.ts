export { dedupeBy } from './array-helpers'
// ATS preview
export { extractKeywords } from './ats-helpers'
// Benchmark
export { getMetricStatusClassName } from './benchmark-helpers'

// Text formatting
export {
  normalizeDateRange,
  normalizeDateToken,
  normalizeInlineText,
  normalizeMultilineText,
} from './formatter-helpers'

// Job description comparison
export {
  getSectionScoreClassName,
  pickSuggestionKind,
  toSuggestionLocate,
  toSuggestionValueType,
} from './job-desc-helpers'

export { isPlainObject, isStructurallyEmpty } from './object-helpers'

// Resume processing
export {
  countFilledSections,
  countQuantifiedEntries,
  getAdvancedToolResumeSummary,
  getResumeSections,
} from './resume-helpers'

// General utilities
export { cloneJson, stringifyResumeValue } from './utils-helpers'
