import { isEmptyValue } from '@/pages/optimize/utils'
import { normalizeMultilineText } from './formatter-helpers'
import { isPlainObject } from './object-helpers'

export function cloneJson<T>(value: T): T {
  if (value === undefined || value === null) {
    return value
  }

  if (typeof value !== 'object') {
    return value
  }

  return JSON.parse(JSON.stringify(value)) as T
}

export function stringifyResumeValue(value: unknown): string {
  if (isEmptyValue(value)) {
    return ''
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  if (typeof value === 'string') {
    return normalizeMultilineText(value)
  }

  if (Array.isArray(value)) {
    return value.map(item => stringifyResumeValue(item)).filter(Boolean).join('\n')
  }

  if (isPlainObject(value)) {
    return Object.values(value).map(item => stringifyResumeValue(item)).filter(Boolean).join('\n')
  }

  return ''
}
