import type { Nodes } from 'hast'
import { Fragment } from 'react'

import type { NodeListProps } from '../types.ts'

function getNodeKey(node: Nodes, idx: number, prefix = '') {
    if (node.type === 'text') {
        return `${prefix}${node.type}-${idx}`
    }

    if (node.type === 'element') {
        return `${prefix}${node.type}-${node.tagName}-${idx}`
    }

    return `${prefix}${node.type}-${idx}`
}

export default function NodeList({
    nodes,
    nodeKey,
    deep = 0,
    parentNode,
    components,
    transition: _transition,
}: NodeListProps) {
    const nodeKeyPrefix = nodeKey ? `${nodeKey}.` : ''

    return nodes.map((node, idx) => {
        const key = getNodeKey(node, idx, nodeKeyPrefix)
        const commonProps = {
            nodeIdx: idx,
            deep: deep + 1,
            nodeKey: key,
            parentNode,
        }

        if (node.type === 'text') {
            const TextComponent = (components.text ?? components.default)!
            return (
                <Fragment key={key}>
                    <TextComponent element={node} {...commonProps} />
                </Fragment>
            )
        }

        if (node.type === 'element') {
            const ElementComponent = (components[node.tagName] ?? components.default)!
            return (
                <Fragment key={key}>
                    <ElementComponent element={node} {...commonProps} />
                </Fragment>
            )
        }

        const FallbackComponent = components.default!
        return (
            <Fragment key={key}>
                <FallbackComponent element={{ type: 'element', tagName: 'span', properties: {}, children: [] }} {...commonProps} />
            </Fragment>
        )
    })
}
