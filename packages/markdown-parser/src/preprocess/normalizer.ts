import type { NormalizerOptions } from '@/types.ts'

const DEFAULT_TAB_WIDTH = 4
const DEFAULT_MAX_CONSECUTIVE_BLANK_LINES = 1

export function normalizeMarkdown(markdown: string, options?: NormalizerOptions): string {
  let normalized = markdown

  if (normalized.charCodeAt(0) === 0xfeff) {
    normalized = normalized.slice(1)
  }

  normalized = normalized.replace(/\u0000/g, '')

  if (options?.lineEndings !== false) {
    normalized = normalized.replace(/\r\n?/g, '\n')
  }

  if (options?.tabWidth !== false) {
    const tabWidth = Math.max(0, Math.floor(options?.tabWidth ?? DEFAULT_TAB_WIDTH))
    normalized = normalized.replace(/\t/g, ' '.repeat(tabWidth))
  }

  if (options?.trimTrailingWhitespace !== false) {
    normalized = normalized.replace(/[ \t]+$/gm, '')
  }

  if (options?.maxConsecutiveBlankLines !== false) {
    const maxBlankLines = Math.max(
      0,
      Math.floor(options?.maxConsecutiveBlankLines ?? DEFAULT_MAX_CONSECUTIVE_BLANK_LINES),
    )
    const maxNewlines = maxBlankLines + 1
    normalized = normalized.replace(/\n{2,}/g, (match) => {
      if (match.length <= maxNewlines) {
        return match
      }

      return '\n'.repeat(maxNewlines)
    })
  }

  return normalized
}
