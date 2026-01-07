import { writable } from 'svelte/store'

/**
 * Creates a context menu state manager for use with components
 * @returns {Object} Context menu state and methods
 */
export function createContextMenu() {
  const isOpen = writable(false)
  const position = writable({ x: 0, y: 0 })
  
  function show(pos) {
    position.set(pos)
    isOpen.set(true)
  }
  
  function hide() {
    isOpen.set(false)
  }
  
  function toggle(pos) {
    isOpen.update(open => {
      if (open) {
        return false
      } else {
        position.set(pos)
        return true
      }
    })
  }

  return {
    isOpen,
    position,
    show,
    hide,
    toggle
  }
}

/**
 * Calculates menu position relative to an element
 * @param {HTMLElement} element - The target element
 * @param {Object} options - Options for positioning
 * @returns {{ x: number, y: number }}
 */
export function calculateMenuPosition(element, options = {}) {
  if (!element) return { x: 0, y: 0 }
  
  const {
    anchorSelector = null,
    bottomSelector = null,
    offsetX = 0,
    offsetY = 4
  } = options
  
  let x = 0
  let y = 0
  
  if (anchorSelector) {
    const anchorEl = element.querySelector(anchorSelector)
    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect()
      x = rect.left
    } else {
      x = element.getBoundingClientRect().left
    }
  } else {
    x = element.getBoundingClientRect().left
  }
  
  if (bottomSelector) {
    const bottomEl = element.querySelector(bottomSelector)
    if (bottomEl) {
      const rect = bottomEl.getBoundingClientRect()
      y = rect.bottom
    } else {
      y = element.getBoundingClientRect().bottom
    }
  } else {
    y = element.getBoundingClientRect().bottom
  }
  
  return {
    x: x + offsetX,
    y: y + offsetY
  }
}

/**
 * Svelte action for context menu behavior
 * @param {HTMLElement} node - The element to attach to
 * @param {Object} options - Configuration options
 */
export function contextMenuAction(node, options = {}) {
  let {
    onShow,
    anchorSelector = null,
    bottomSelector = null,
    enabled = true
  } = options
  
  function handleContextMenu(event) {
    if (!enabled) return
    
    event.preventDefault()
    event.stopPropagation()
    
    const pos = calculateMenuPosition(node, {
      anchorSelector,
      bottomSelector
    })
    
    if (onShow) {
      onShow(pos)
    }
  }
  
  node.addEventListener('contextmenu', handleContextMenu)
  
  return {
    update(newOptions) {
      onShow = newOptions.onShow
      anchorSelector = newOptions.anchorSelector ?? null
      bottomSelector = newOptions.bottomSelector ?? null
      enabled = newOptions.enabled ?? true
    },
    destroy() {
      node.removeEventListener('contextmenu', handleContextMenu)
    }
  }
}
