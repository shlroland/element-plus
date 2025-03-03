import { Fragment, Text, Comment, createBlock, openBlock } from 'vue'

import type { VNode, VNodeTypes, VNodeChild } from 'vue'

const TEMPLATE = 'template'

export enum PatchFlags {
  TEXT = 1,
  CLASS = 2,
  STYLE = 4,
  PROPS = 8,
  FULL_PROPS = 16,
  HYDRATE_EVENTS = 32,
  STABLE_FRAGMENT = 64,
  KEYED_FRAGMENT = 128,
  UNKEYED_FRAGMENT = 256,
  NEED_PATCH = 512,
  DYNAMIC_SLOTS = 1024,
  HOISTED = -1,
  BAIL = -2,
}

export const isFragment = (node: VNode) => node.type === Fragment

export const isText = (node: VNode) => node.type === Text

export const isComment = (node: VNode) => node.type === Comment

export const isTemplate = (node: VNode) => node.type === TEMPLATE

/**
 * get a valid child node (not fragment nor comment)
 * @param node {VNode} node to be searched
 * @param depth {number} depth to be searched
 */
function getChildren(node: VNode, depth: number): undefined | VNode {
  if (isComment(node)) return
  if (isFragment(node) || isTemplate(node)) {
    return depth > 0
      ? getFirstValidNode(node.children as VNodeChild, depth - 1)
      : undefined
  }
  return node
}

/**
 * determine if the element is a valid element type rather than fragments and comment e.g. <template> v-if
 * @param node {VNode} node to be tested
 */
export const isValidElementNode = (node: VNode) =>
  !(isFragment(node) || isComment(node))

export const getFirstValidNode = (
  nodes: VNodeChild,
  maxDepth = 3,
): ReturnType<typeof getChildren> => {
  if (Array.isArray(nodes)) {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i] as VNode
      const child = getChildren(node as VNode, maxDepth)
      return child
    }
  } else {
    return getChildren(nodes as VNode, maxDepth)
  }
}

export function renderIf(
  condition: boolean,
  node: VNodeTypes,
  props: any,
  children?: VNode[],
  patchFlag?: number,
  patchProps?: string[],
) {
  return (
    openBlock(),
    condition
      ? createBlock(node, props, children, patchFlag, patchProps)
      : createBlock(Comment, null, null, PatchFlags.TEXT)
  )
}

export function renderBlock(
  node: VNodeTypes,
  props: any,
  children?: VNodeTypes[] | VNodeTypes,
  patchFlag?: number,
  patchProps?: string[],
) {
  return openBlock(), createBlock(node, props, children, patchFlag, patchProps)
}
