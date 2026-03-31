import type { TextProps } from '../../types.ts'

export default function Text({ element }: TextProps) {
    return <span data-mark-sorcery="text">{element.value}</span>
}
