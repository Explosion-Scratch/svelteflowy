import { derived } from 'svelte/store'
import { itemStore } from './itemStore.js'

function flattenAllItems(node, result = []) {
  if (node.id && node.text) {
    result.push({ id: node.id, text: node.text })
  }
  if (node.children?.length) {
    for (const child of node.children) {
      flattenAllItems(child, result)
    }
  }
  return result
}

export const allItems = derived(
  itemStore.items,
  ($items) => flattenAllItems($items)
)
