import { describe, expect, it } from 'vitest'

import type { ParseMemory } from '@/index.ts'

import { createMemory, createProcessor, parse } from '@/index.ts'

import { findNode, textContent } from './helpers.ts'

describe('streaming memory', () => {
  it('returns the full tree built so far while the stream grows', async () => {
    const processor = createProcessor({
      preprocess: true,
    })
    const memory = createMemory()

    const block1 = await parse(processor, '**hola', memory)
    expect(findNode(block1, 'strong')).toBeDefined()
    expect(textContent(block1)).toContain('hola')

    const block2 = await parse(processor, '**hola que tal**\nhoy', memory)
    expect(findNode(block2, 'strong')).toBeDefined()
    expect(textContent(block2)).toContain('hola que tal')
    expect(textContent(block2)).toContain('hoy')

    const block3 = await parse(processor, '**hola que tal**\nhoy estas muy\nbirn', memory)
    expect(findNode(block3, 'strong')).toBeDefined()
    expect(textContent(block3)).toContain('hoy estas muy')
    expect(textContent(block3)).toContain('birn')

    const block4 = await parse(processor, 'buenas', memory)
    expect(findNode(block4, 'strong')).toBeUndefined()
    expect(textContent(block4)).toContain('buenas')
    expect(textContent(block4)).not.toContain('hola que tal')
  })

  it('keeps confirmed blocks cached while remend still applies to the pending block', async () => {
    const processor = createProcessor({
      preprocess: true,
    })
    const memory: ParseMemory = createMemory()

    const first = await parse(processor, '# Titulo\n\n**hola', memory)
    expect(findNode(first, 'h1')).toBeDefined()
    expect(findNode(first, 'strong')).toBeDefined()
    expect(memory.confirmedMarkdown).toBe('# Titulo')
    expect(memory.pendingMarkdown).toBe('\n\n**hola')

    const second = await parse(processor, '# Titulo\n\n**hola\n\n- item', memory)
    expect(findNode(second, 'h1')).toBeDefined()
    expect(findNode(second, 'strong')).toBeDefined()
    expect(findNode(second, 'ul')).toBeDefined()
    expect(memory.confirmedMarkdown).toBe('# Titulo\n\n**hola')
    expect(memory.pendingMarkdown).toBe('\n\n- item')
  })

  it('supports flush to promote the pending block into the confirmed prefix', async () => {
    const processor = createProcessor({
      preprocess: true,
    })
    const memory = createMemory()

    await parse(processor, '**hola', memory)
    expect(memory.pendingMarkdown).toBe('**hola')

    memory.flush = true
    const flushed = await parse(processor, '**hola', memory)

    expect(findNode(flushed, 'strong')).toBeDefined()
    expect(memory.confirmedMarkdown).toBe('**hola')
    expect(memory.pendingMarkdown).toBe('')
  })
})
