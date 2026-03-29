import remendFn from 'remend'

import type {
  MarkdownPreprocessor,
  NormalizerOptions,
  ParseOptions,
  PreprocessOptions,
  RemendOptions,
} from '@/types.ts'

import { normalizeMarkdown } from './normalizer.ts'

function normalizePreprocessOptions(
  preprocess: ParseOptions['preprocess'],
): PreprocessOptions | false {
  if (preprocess === false || preprocess === undefined) {
    return false
  }

  if (preprocess === true) {
    return {}
  }

  return preprocess
}

export function getPreprocessors(options?: ParseOptions): MarkdownPreprocessor[] {
  const preprocessOptions = normalizePreprocessOptions(options?.preprocess)

  if (preprocessOptions === false) {
    return []
  }

  const preprocessors: MarkdownPreprocessor[] = []
  const normalizerOption = preprocessOptions.normalizer
  const remendOption = preprocessOptions.remend

  if (normalizerOption !== false) {
    preprocessors.push((markdown: string) => {
      const normalizerOptions: NormalizerOptions | undefined =
        typeof normalizerOption === 'object' ? normalizerOption : undefined
      return normalizeMarkdown(markdown, normalizerOptions)
    })
  }

  if (remendOption !== false) {
    preprocessors.push((markdown: string) => {
      const remendOptions: RemendOptions | undefined =
        typeof remendOption === 'object' ? remendOption : undefined
      return remendFn(markdown, remendOptions)
    })
  }

  return preprocessors
}
