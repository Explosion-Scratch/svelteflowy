import { derived } from 'svelte/store'
import { itemStore } from './itemStore.js'

function extractHashtags(text) {
  const regex = /#[\w-]+/g
  const matches = text?.match(regex) || []
  return matches
}

function collectHashtagsFromTree(node, hashtags = new Set()) {
  if (node.text) {
    extractHashtags(node.text).forEach(tag => hashtags.add(tag))
  }
  if (node.description) {
    extractHashtags(node.description).forEach(tag => hashtags.add(tag))
  }
  node.children?.forEach(child => collectHashtagsFromTree(child, hashtags))
  return hashtags
}

export const allHashtags = derived(
  itemStore.items,
  ($items) => {
    const hashtags = collectHashtagsFromTree($items)
    return Array.from(hashtags).sort((a, b) => a.localeCompare(b))
  }
)
