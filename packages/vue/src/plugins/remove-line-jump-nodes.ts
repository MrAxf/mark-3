import type { ParserPlugin } from "@mark-sorcery/markdown-parser";
import type { Root } from "hast";
import type { Plugin } from "unified";
import { remove } from "unist-util-remove";

const rehypeRemoveLineJumpNodes: Plugin<[string[]], Root> =
    () => (tree: Root) => {
        remove(tree, {
            type: "text",
            value: "\n",
        })
    };

export const removeLineJumpNodesPlugin = (): ParserPlugin => ({
    rehype: [[rehypeRemoveLineJumpNodes]],
});