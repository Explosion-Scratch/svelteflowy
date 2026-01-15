import { 
  serializeItems, 
  parseText, 
  itemsToPlainMarkdown,
  isSvelteFlowyFormat 
} from './serializer.js'

export { 
  serializeItems, 
  parseText as markdownToItems,
  itemsToPlainMarkdown as itemsToMarkdown,
  isSvelteFlowyFormat 
}

/**
 * Copy items to clipboard
 * Uses plain markdown format for external compatibility
 * @param {Array|Object} items - Items to copy
 * @returns {Promise<string>} The copied markdown text
 */
export async function copyToClipboard(items) {
  const itemsArray = Array.isArray(items) ? items : [items]
  const markdown = itemsToPlainMarkdown(itemsArray)
  await navigator.clipboard.writeText(markdown)
  return markdown
}

/**
 * Paste from clipboard
 * Automatically detects format (SvelteFlowy or plain markdown)
 * @returns {Promise<Array>} Parsed items
 */
export async function pasteFromClipboard() {
  const text = await navigator.clipboard.readText()
  return parseText(text)
}
