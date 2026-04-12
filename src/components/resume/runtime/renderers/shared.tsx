import type React from 'react'
import { parseSanitizedHtml } from '@/lib/safe-html'
import { useRuntimeStyles } from './utils'

export function RuntimeSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const { font, spacing, theme } = useRuntimeStyles()

  return (
    <section>
      <h2
        className="m-0 border-b-2"
        style={{
          fontSize: font.sectionTitleSize,
          fontWeight: font.boldWeight,
          color: theme.primaryColor,
          marginBottom: spacing.sectionTitleMargin,
          paddingBottom: `calc(${spacing.itemSpacing} / 2)`,
          borderColor: theme.primaryColor,
        }}
      >
        {title}
      </h2>
      <div className="flex flex-col" style={{ gap: spacing.entrySpacing }}>
        {children}
      </div>
    </section>
  )
}

export function RuntimeEntry({
  title,
  subtitle,
  duration,
  content,
}: {
  title: string
  subtitle?: string
  duration?: string
  content?: string
}) {
  const { font, theme, spacing } = useRuntimeStyles()

  return (
    <div
      className="flex flex-col"
      style={{
        gap: spacing.paragraphSpacing,
        lineHeight: spacing.lineHeight,
      }}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex flex-wrap items-baseline gap-2 flex-1">
          <h3
            className="m-0"
            style={{
              fontSize: font.contentSize,
              fontWeight: font.boldWeight,
              color: theme.textPrimary,
            }}
          >
            {title}
          </h3>
          {subtitle
            ? (
                <span
                  style={{
                    fontSize: font.contentSize,
                    fontWeight: font.mediumWeight,
                    color: theme.textSecondary,
                  }}
                >
                  {subtitle}
                </span>
              )
            : null}
        </div>
        {duration
          ? (
              <span
                className="whitespace-nowrap"
                style={{
                  fontSize: font.smallSize,
                  color: theme.textMuted,
                }}
              >
                {duration}
              </span>
            )
          : null}
      </div>
      {content ? <RuntimeRichText html={content} /> : null}
    </div>
  )
}

export function RuntimeRichText({ html }: { html: string }) {
  const { font, spacing, theme } = useRuntimeStyles()

  return (
    <div
      className="max-w-none wrap-break-word [&_blockquote]:m-0 [&_li]:my-0 [&_li>p]:m-0 [&_ol]:m-0 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:m-0 [&_ul]:m-0 [&_ul]:list-disc [&_ul]:pl-5"
      style={{
        fontSize: font.contentSize,
        lineHeight: spacing.proseLineHeight,
        color: theme.textPrimary,
      }}
    >
      {parseSanitizedHtml(html)}
    </div>
  )
}
