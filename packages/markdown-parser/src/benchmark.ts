import type { Element, Root } from 'hast';
import { createCorePlugin, createProcessor, parse } from './index.ts';

declare const Bun: {
    env: Record<string, string | undefined>;
};

function buildBenchmarkMarkdown(sectionCount: number): string {
    return Array.from({ length: sectionCount }, (_, index) => {
        const row = index + 1;

        return [
            `## Section ${row}`,
            `Paragraph with **bold ${row} and unfinished emphasis`,
            '',
            '| left | right |',
            '| --- | --- |',
            `| ${row} | value ${row} |`,
            '',
            `<b>safe ${row}</b> <script>alert("xss-${row}")</script>`,
            '',
            '- [x] done',
            '- [ ] pending',
            '',
            '```ts',
            `const value${row} = ${row};`,
            '```',
        ].join('\n');
    }).join('\n\n');
}

function findNode(root: Root, tagName: string): Element | undefined {
    const queue: (Root | Element)[] = [root];

    while (queue.length > 0) {
        const node = queue.shift()!;

        if (node.type === 'element' && node.tagName === tagName) {
            return node;
        }

        if ('children' in node) {
            for (const child of node.children) {
                if (child.type === 'element') {
                    queue.push(child as Element);
                }
            }
        }
    }

    return undefined;
}

function allNodes(root: Root, tagName: string): Element[] {
    const result: Element[] = [];
    const queue: (Root | Element)[] = [root];

    while (queue.length > 0) {
        const node = queue.shift()!;

        if (node.type === 'element' && node.tagName === tagName) {
            result.push(node);
        }

        if ('children' in node) {
            for (const child of node.children) {
                if (child.type === 'element') {
                    queue.push(child as Element);
                }
            }
        }
    }

    return result;
}

function assertBenchmarkResult(root: Root): void {
    if (root.type !== 'root') {
        throw new Error('Benchmark parse did not return a HAST root.');
    }

    if (!findNode(root, 'table')) {
        throw new Error('Benchmark input did not produce a GFM table.');
    }

    if (findNode(root, 'script')) {
        throw new Error('Benchmark output still contains script nodes.');
    }

    if (allNodes(root, 'input').length === 0) {
        throw new Error('Benchmark input did not produce GFM task list checkboxes.');
    }
}

function formatMs(value: number): string {
    return `${value.toFixed(2)} ms`;
}

function runBenchmark(): void {
    const sections = Number.parseInt(Bun.env.BENCHMARK_SECTIONS ?? '120', 10);
    const warmupIterations = Number.parseInt(Bun.env.BENCHMARK_WARMUP ?? '3', 10);
    const iterations = Number.parseInt(Bun.env.BENCHMARK_ITERATIONS ?? '10', 10);
    const markdown = buildBenchmarkMarkdown(sections);
    const processor = createProcessor({
        plugins: [createCorePlugin()],
    });

    for (let index = 0; index < warmupIterations; index += 1) {
        parse(processor, markdown);
    }

    const samples: number[] = [];
    let lastResult: Root | undefined;

    for (let index = 0; index < iterations; index += 1) {
        const startedAt = globalThis.performance.now();
        lastResult = parse(processor, markdown);
        samples.push(globalThis.performance.now() - startedAt);
    }

    if (!lastResult) {
        throw new Error('Benchmark did not execute any iterations.');
    }

    assertBenchmarkResult(lastResult);

    const totalMs = samples.reduce((sum, sample) => sum + sample, 0);
    const averageMs = totalMs / samples.length;
    const minMs = Math.min(...samples);
    const maxMs = Math.max(...samples);

    console.log('markdown-parser benchmark');
    console.log(`sections: ${sections}`);
    console.log(`warmup iterations: ${warmupIterations}`);
    console.log(`measured iterations: ${iterations}`);
    console.log('processor reused: yes');
    console.log(`total: ${formatMs(totalMs)}`);
    console.log(`average: ${formatMs(averageMs)}`);
    console.log(`min: ${formatMs(minMs)}`);
    console.log(`max: ${formatMs(maxMs)}`);
}

runBenchmark();