export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]'
}

export function isStructurallyEmpty(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true
  }

  if (typeof value === 'string') {
    return value.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim() === ''
  }

  if (typeof value === 'number') {
    return value === 0
  }

  if (Array.isArray(value)) {
    return value.length === 0 || value.every(item => isStructurallyEmpty(item))
  }

  if (isPlainObject(value)) {
    return Object.values(value).every(item => isStructurallyEmpty(item))
  }

  return false
}
