import type { Config as DomPurifyConfig } from 'dompurify'
import type { HTMLReactParserOptions } from 'html-react-parser'
import DOMPurify from 'dompurify'
import parse from 'html-react-parser'

const DEFAULT_SANITIZE_OPTIONS: DomPurifyConfig = {
  USE_PROFILES: { html: true },
}

export function sanitizeHtml(html: string, config?: DomPurifyConfig) {
  return DOMPurify.sanitize(html, {
    ...DEFAULT_SANITIZE_OPTIONS,
    ...config,
  })
}

export function parseSanitizedHtml(
  html: string,
  config?: DomPurifyConfig,
  parserOptions?: HTMLReactParserOptions,
) {
  return parse(sanitizeHtml(html, config), parserOptions)
}
