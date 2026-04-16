import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { DAYJS_FULL_DATE_FORMATS, DAYJS_YEAR_MONTH_FORMATS, NORMALIZED_PRESENT_TOKENS } from './const'

dayjs.extend(customParseFormat)

export function normalizeInlineText(value: string | null | undefined) {
  return (value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

export function normalizeMultilineText(value: string | null | undefined) {
  const lines = (value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => normalizeInlineText(line))

  const compacted: string[] = []

  lines.forEach((line) => {
    if (!line) {
      if (compacted.length > 0 && compacted[compacted.length - 1] !== '') {
        compacted.push('')
      }
      return
    }

    compacted.push(line)
  })

  while (compacted.length > 0 && compacted[compacted.length - 1] === '') {
    compacted.pop()
  }

  return compacted.join('\n')
}

export function normalizeDateToken(value: string | null | undefined) {
  const normalized = normalizeInlineText(value)

  if (!normalized) {
    return ''
  }

  if (NORMALIZED_PRESENT_TOKENS.has(normalized.toLowerCase())) {
    return '至今'
  }

  const fullDate = dayjs(normalized, [...DAYJS_FULL_DATE_FORMATS], true)
  if (fullDate.isValid()) {
    return fullDate.format('YYYY.MM.DD')
  }

  const yearMonth = dayjs(normalized, [...DAYJS_YEAR_MONTH_FORMATS], true)
  if (yearMonth.isValid()) {
    return yearMonth.format('YYYY.MM')
  }

  const fallback = dayjs(normalized)
  return fallback.isValid() ? fallback.format('YYYY.MM.DD') : normalized
}

export function normalizeDateRange(value: string[] | null | undefined) {
  const range = Array.isArray(value) ? value.slice(0, 2) : ['', '']
  while (range.length < 2) {
    range.push('')
  }

  return [normalizeDateToken(range[0]), normalizeDateToken(range[1])]
}
