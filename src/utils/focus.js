import { writable, get } from 'svelte/store'
import { itemStore } from '../stores/itemStore.js'

export const focusedItemId = writable(null)

export function focusItem(id) {
  if (!id) return

  focusedItemId.set(id)
  itemStore.setSelectionHead(id)

  requestAnimationFrame(() => {
    let el = document.querySelector(`#item_${id} .title-editor [contenteditable]`)
    
    if (!el) {
      el = document.querySelector(`#item_${id}[contenteditable]`)
    }
    if (!el) {
      el = document.querySelector(`#item_${id} [contenteditable]`)
    }
    
    if (el) {
      el.focus()
      const range = document.createRange()
      const sel = window.getSelection()
      range.selectNodeContents(el)
      range.collapse(false)
      sel.removeAllRanges()
      sel.addRange(range)
    }
  })
}

export function focusItemStart(id) {
  if (!id) return

  focusedItemId.set(id)
  itemStore.setSelectionHead(id)

  requestAnimationFrame(() => {
    let el = document.querySelector(`#item_${id} .title-editor [contenteditable]`)
    
    if (!el) {
      el = document.querySelector(`#item_${id}[contenteditable]`)
    }
    if (!el) {
      el = document.querySelector(`#item_${id} [contenteditable]`)
    }
    
    if (el) {
      el.focus()
      const range = document.createRange()
      const sel = window.getSelection()
      range.selectNodeContents(el)
      range.collapse(true)
      sel.removeAllRanges()
      sel.addRange(range)
    }
  })
}

export function focusDescription(id) {
  if (!id) return

  requestAnimationFrame(() => {
    const el = document.querySelector(`#item_${id} .description-editor [contenteditable]`)
    if (el) {
      el.focus()
    }
  })
}

export function getItemAbove(rootOrZoomed, currentId) {
  const zoomedItem = get(itemStore.zoomedItem)
  const root = zoomedItem || rootOrZoomed
  const flat = flattenVisible(root)
  const idx = flat.findIndex(item => item.id === currentId)
  if (idx > 0) {
    return flat[idx - 1]
  }
  return null
}

export function getItemBelow(rootOrZoomed, currentId) {
  const zoomedItem = get(itemStore.zoomedItem)
  const root = zoomedItem || rootOrZoomed
  const flat = flattenVisible(root)
  const idx = flat.findIndex(item => item.id === currentId)
  if (idx >= 0 && idx < flat.length - 1) {
    return flat[idx + 1]
  }
  return null
}

export function flattenVisible(item, result = []) {
  if (item.children) {
    for (const child of item.children) {
      result.push(child)
      if (child.children?.length && child.open !== false) {
        flattenVisible(child, result)
      }
    }
  }
  return result
}

export function findParentItem(items, targetId) {
  function search(node) {
    if (node.children) {
      for (const child of node.children) {
        if (child.id === targetId) {
          return node
        }
        const found = search(child)
        if (found) return found
      }
    }
    return null
  }
  return search(items)
}
