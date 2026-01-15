import { writable, derived, get } from 'svelte/store'
import { generateId } from '../utils/id.js'
import { findItem, findParent, findItemIndex, filterTree, cloneTree } from '../utils/tree.js'
import { copyToClipboard, pasteFromClipboard } from '../utils/clipboard.js'
import { flattenVisibleTree } from '../utils/tree.js'
import { removeIdsFromTree, extractIdsFromTree, updateIdsInTree, collectIdsFromTree } from '../utils/tree-mutations.js'

const STORAGE_KEY = 'svelteflowy-items'

function createDefaultItem() {
  return {
    id: generateId(),
    text: 'Welcome to SvelteFlowy',
    description: '',
    completed: false,
    open: true,
    children: [
      {
        id: generateId(),
        text: 'Click on any item to edit it',
        description: '',
        completed: false,
        open: true,
        children: []
      },
      {
        id: generateId(),
        text: 'Press Enter to create a new item',
        description: '',
        completed: false,
        open: true,
        children: []
      },
      {
        id: generateId(),
        text: 'Press Tab to indent, Shift+Tab to outdent',
        description: '',
        completed: false,
        open: true,
        children: []
      }
    ]
  }
}

function loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      if (data?.id && data?.children) return data
    }
  } catch (e) {
    console.warn('Failed to load from storage:', e)
  }
  return createDefaultItem()
}

function saveToStorage(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (e) {
    console.warn('Failed to save to storage:', e)
  }
}

function createItemStore() {
  const items = writable(loadFromStorage())
  const searchQuery = writable('')
  const selection = writable(new Set())
  const selectionAnchor = writable(null)
  const selectionDirection = writable(null)
  const selectionHead = writable(null)
  const zoomedItemId = writable(null)
  const clipboardItems = writable([])

  const MAX_HISTORY = 50
  let undoStack = []
  let redoStack = []
  let isUndoRedo = false

  items.subscribe(saveToStorage)
  
  items.subscribe(val => {
    console.log('[itemStore] Tree updated:', val)
  })

  function pushToUndo(state) {
    if (isUndoRedo) return
    undoStack.push(cloneTree(state))
    if (undoStack.length > MAX_HISTORY) {
      undoStack.shift()
    }
    redoStack = []
  }

  function updateItems(fn) {
    items.update(root => {
      pushToUndo(root)
      const newRoot = cloneTree(root)
      fn(newRoot)
      return newRoot
    })
  }

  function undo() {
    if (undoStack.length === 0) return
    const current = get(items)
    const prev = undoStack.pop()
    redoStack.push(cloneTree(current))
    isUndoRedo = true
    items.set(prev)
    isUndoRedo = false
  }

  function redo() {
    if (redoStack.length === 0) return
    const current = get(items)
    const next = redoStack.pop()
    undoStack.push(cloneTree(current))
    isUndoRedo = true
    items.set(next)
    isUndoRedo = false
  }

  function addItem(parentId, afterId = null) {
    const newId = generateId()
    updateItems(root => {
      const parent = parentId ? findItem(root, parentId) : root
      if (!parent) return
      if (!parent.children) parent.children = []
      
      const newItem = {
        id: newId,
        text: '',
        description: '',
        completed: false,
        open: true,
        children: []
      }
      
      if (afterId) {
        const idx = findItemIndex(parent, afterId)
        if (idx >= 0) {
          parent.children.splice(idx + 1, 0, newItem)
        } else {
          parent.children.push(newItem)
        }
      } else {
        parent.children.push(newItem)
      }
    })
    return newId
  }

  function deleteItem(id) {
    updateItems(root => {
      const parent = findParent(root, id)
      if (!parent?.children) return
      parent.children = parent.children.filter(c => c.id !== id)
    })
  }

  function deleteSelected() {
    const sel = get(selection)
    if (sel.size === 0) return
    
    updateItems(root => {
      removeIdsFromTree(root, sel)
    })
    selection.set(new Set())
  }

  function deleteSelectedWithFocus() {
    const sel = get(selection)
    if (sel.size === 0) return null

    const rootItems = get(items)
    const zoomId = get(zoomedItemId)
    const root = zoomId ? findItem(rootItems, zoomId) || rootItems : rootItems
    const flat = flattenVisibleTree(root)

    const selectedIndices = flat
      .map((item, idx) => sel.has(item.id) ? idx : -1)
      .filter(idx => idx !== -1)
      .sort((a, b) => a - b)

    if (selectedIndices.length === 0) return null

    const firstSelectedIdx = selectedIndices[0]
    const lastSelectedIdx = selectedIndices[selectedIndices.length - 1]

    let focusTargetId = null
    if (firstSelectedIdx > 0) {
      focusTargetId = flat[firstSelectedIdx - 1].id
    } else if (lastSelectedIdx < flat.length - 1) {
      for (let i = lastSelectedIdx + 1; i < flat.length; i++) {
        if (!sel.has(flat[i].id)) {
          focusTargetId = flat[i].id
          break
        }
      }
    }

    deleteSelected()
    return focusTargetId
  }

  function moveItems(itemIds, targetParentId, insertBeforeId) {
    if (itemIds.length === 0) return

    updateItems(root => {
      const itemsToMove = extractIdsFromTree(root, itemIds)

      const targetParent = targetParentId ? findItem(root, targetParentId) : root
      if (!targetParent) return
      if (!targetParent.children) targetParent.children = []

      if (insertBeforeId) {
        const insertIdx = targetParent.children.findIndex(c => c.id === insertBeforeId)
        if (insertIdx >= 0) {
          targetParent.children.splice(insertIdx, 0, ...itemsToMove)
        } else {
          targetParent.children.push(...itemsToMove)
        }
      } else {
        targetParent.children.push(...itemsToMove)
      }
    })

    selection.set(new Set())
  }

  function completeSelected() {
    const sel = get(selection)
    if (sel.size === 0) return
    
    updateItems(root => {
      updateIdsInTree(root, sel, (node) => {
        node.completed = !node.completed
      })
    })
    selection.set(new Set())
  }

  function updateItem(id, updates) {
    updateItems(root => {
      const item = findItem(root, id)
      if (item) Object.assign(item, updates)
    })
  }

  function toggleComplete(id) {
    updateItems(root => {
      const item = findItem(root, id)
      if (item) item.completed = !item.completed
    })
  }

  function toggleOpen(id) {
    updateItems(root => {
      const item = findItem(root, id)
      if (item) item.open = !item.open
    })
  }

  function indentItem(id) {
    updateItems(root => {
      const parent = findParent(root, id)
      if (!parent?.children) return
      
      const idx = findItemIndex(parent, id)
      if (idx <= 0) return
      
      const item = parent.children[idx]
      const prevSibling = parent.children[idx - 1]
      
      parent.children.splice(idx, 1)
      if (!prevSibling.children) prevSibling.children = []
      prevSibling.children.push(item)
      prevSibling.open = true
    })
  }

  function outdentItem(id) {
    updateItems(root => {
      const parent = findParent(root, id)
      if (!parent) return
      
      const grandparent = findParent(root, parent.id)
      if (!grandparent?.children) return
      
      const idx = findItemIndex(parent, id)
      const item = parent.children[idx]
      
      const siblingsAfter = parent.children.slice(idx + 1)
      parent.children = parent.children.slice(0, idx)
      
      if (siblingsAfter.length > 0) {
        if (!item.children) item.children = []
        item.children.push(...siblingsAfter)
      }
      
      const parentIdx = findItemIndex(grandparent, parent.id)
      grandparent.children.splice(parentIdx + 1, 0, item)
    })
  }

  function indentSelected() {
    const sel = get(selection)
    if (sel.size === 0) return
    
    const rootItems = get(items)
    const zoomId = get(zoomedItemId)
    const root = zoomId ? findItem(rootItems, zoomId) || rootItems : rootItems
    const flat = flattenVisibleTree(root)
    
    const idsInOrder = flat.filter(item => sel.has(item.id)).map(item => item.id)
    
    for (const id of idsInOrder) {
      indentItem(id)
    }
  }

  function outdentSelected() {
    const sel = get(selection)
    if (sel.size === 0) return
    
    const rootItems = get(items)
    const zoomId = get(zoomedItemId)
    const root = zoomId ? findItem(rootItems, zoomId) || rootItems : rootItems
    const flat = flattenVisibleTree(root)
    
    const idsInOrder = flat.filter(item => sel.has(item.id)).map(item => item.id)
    
    for (const id of [...idsInOrder].reverse()) {
      outdentItem(id)
    }
  }

  function moveItemUp(id) {
    updateItems(root => {
      const parent = findParent(root, id)
      if (!parent?.children) return
      
      const idx = findItemIndex(parent, id)
      if (idx <= 0) return
      
      const temp = parent.children[idx]
      parent.children[idx] = parent.children[idx - 1]
      parent.children[idx - 1] = temp
    })
  }

  function moveItemDown(id) {
    updateItems(root => {
      const parent = findParent(root, id)
      if (!parent?.children) return
      
      const idx = findItemIndex(parent, id)
      if (idx < 0 || idx >= parent.children.length - 1) return
      
      const temp = parent.children[idx]
      parent.children[idx] = parent.children[idx + 1]
      parent.children[idx + 1] = temp
    })
  }

  function moveSelectedUp() {
    const sel = get(selection)
    if (sel.size === 0) return
    
    const rootItems = get(items)
    const zoomId = get(zoomedItemId)
    const root = zoomId ? findItem(rootItems, zoomId) || rootItems : rootItems
    const flat = flattenVisibleTree(root)
    
    const idsInOrder = flat.filter(item => sel.has(item.id)).map(item => item.id)
    
    for (const id of idsInOrder) {
      moveItemUp(id)
    }
  }

  function moveSelectedDown() {
    const sel = get(selection)
    if (sel.size === 0) return
    
    const rootItems = get(items)
    const zoomId = get(zoomedItemId)
    const root = zoomId ? findItem(rootItems, zoomId) || rootItems : rootItems
    const flat = flattenVisibleTree(root)
    
    const idsInOrder = flat.filter(item => sel.has(item.id)).map(item => item.id)
    
    for (const id of [...idsInOrder].reverse()) {
      moveItemDown(id)
    }
  }

  function setSearch(query) {
    searchQuery.set(query)
  }

  function clearSearch() {
    searchQuery.set('')
  }

  function select(id, additive = false) {
    selection.update(sel => {
      if (additive) {
        const newSel = new Set(sel)
        if (newSel.has(id)) {
          newSel.delete(id)
        } else {
          newSel.add(id)
        }
        return newSel
      } else {
        return new Set([id])
      }
    })
  }

  function selectRange(ids) {
    selection.set(new Set(ids))
  }

  function addToSelection(id) {
    selection.update(sel => {
      const newSel = new Set(sel)
      newSel.add(id)
      return newSel
    })
  }

  function removeFromSelection(id) {
    selection.update(sel => {
      const newSel = new Set(sel)
      newSel.delete(id)
      return newSel
    })
  }

  function setSelectionAnchor(id) {
    selectionAnchor.set(id)
  }

  function clearSelection() {
    selection.set(new Set())
    selectionAnchor.set(null)
    selectionHead.set(null)
    selectionDirection.set(null)
  }

  function extendSelection(direction) {
    let currentHead = get(selectionHead)
    console.log('[extendSelection] direction:', direction, 'currentHead:', currentHead)
    
    if (!currentHead) {
      const activeEl = document.activeElement
      const itemEl = activeEl?.closest?.('.item')
      if (itemEl) {
        currentHead = itemEl.id.replace('item_', '')
        console.log('[extendSelection] Detected head from DOM:', currentHead)
        selectionHead.set(currentHead)
      }
    }
    
    if (!currentHead) {
      const sel = get(selection)
      if (sel.size > 0) {
        const rootItems = get(items)
        const zoomId = get(zoomedItemId)
        const root = zoomId ? findItem(rootItems, zoomId) || rootItems : rootItems
        const flat = flattenVisibleTree(root)
        const selectedInOrder = flat.filter(item => sel.has(item.id))
        if (selectedInOrder.length > 0) {
          currentHead = direction === 'up' 
            ? selectedInOrder[0].id 
            : selectedInOrder[selectedInOrder.length - 1].id
          console.log('[extendSelection] Derived head from selection:', currentHead)
          selectionHead.set(currentHead)
          selectionAnchor.set(direction === 'up' 
            ? selectedInOrder[selectedInOrder.length - 1].id 
            : selectedInOrder[0].id)
          selectionDirection.set(direction)
        }
      }
    }
    
    if (!currentHead) {
      console.log('[extendSelection] No currentHead, returning early')
      return
    }

    const rootItems = get(items)
    const zoomId = get(zoomedItemId)
    const root = zoomId ? findItem(rootItems, zoomId) || rootItems : rootItems
    const flat = flattenVisibleTree(root)
    const idx = flat.findIndex(item => item.id === currentHead)
    console.log('[extendSelection] flat items:', flat.map(i => i.id), 'idx:', idx)
    if (idx === -1) {
      console.log('[extendSelection] currentHead not found in flat list')
      return
    }

    let nextItem
    if (direction === 'up' && idx > 0) {
      nextItem = flat[idx - 1]
    } else if (direction === 'down' && idx < flat.length - 1) {
      nextItem = flat[idx + 1]
    }
    console.log('[extendSelection] nextItem:', nextItem?.id)
    if (!nextItem) {
      console.log('[extendSelection] No nextItem, returning')
      return
    }

    const anchor = get(selectionAnchor)
    const currentDirection = get(selectionDirection)

    if (currentDirection && direction !== currentDirection && currentHead !== anchor) {
      selection.update(s => {
        const newSel = new Set(s)
        newSel.delete(currentHead)
        return newSel
      })
      if (get(selection).size <= 1) {
        selectionDirection.set(null)
      }
    } else {
      if (!anchor) {
        selectionAnchor.set(currentHead)
        selection.update(s => {
          const newSel = new Set(s)
          newSel.add(currentHead)
          newSel.add(nextItem.id)
          return newSel
        })
        selectionDirection.set(direction)
      } else {
        selection.update(s => {
          const newSel = new Set(s)
          newSel.add(nextItem.id)
          return newSel
        })
        if (!currentDirection) {
          selectionDirection.set(direction)
        }
      }
    }

    selectionHead.set(nextItem.id)
  }

  function setSelectionHead(id) {
    console.log('[setSelectionHead] setting to:', id)
    selectionHead.set(id)
  }

  function setSelectionDirection(direction) {
    selectionDirection.set(direction)
  }

  async function copySelected() {
    const sel = get(selection)
    if (sel.size === 0) return
    
    const root = get(items)
    const collected = collectIdsFromTree(root, sel)
    const itemsToCopy = collected.map(node => cloneTree(node))
    
    clipboardItems.set(itemsToCopy)
    await copyToClipboard(itemsToCopy)
  }

  async function paste(parentId) {
    const pastedItems = await pasteFromClipboard()
    if (!pastedItems?.length) return
    
    updateItems(root => {
      const parent = parentId ? findItem(root, parentId) : root
      if (!parent) return
      if (!parent.children) parent.children = []
      parent.children.push(...pastedItems)
    })
  }

  function zoom(id) {
    zoomedItemId.set(id)
  }

  function zoomOut() {
    const current = get(zoomedItemId)
    if (!current) return
    
    const root = get(items)
    const parent = findParent(root, current)
    
    if (!parent || parent.id === root.id) {
      zoomedItemId.set(null)
    } else {
      zoomedItemId.set(parent.id)
    }
  }

  async function navigateToItem(id) {
    zoomedItemId.set(null)
    
    await new Promise(r => setTimeout(r, 50))
    
    const el = document.getElementById(`item_${id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('highlight-pulse')
      setTimeout(() => el.classList.remove('highlight-pulse'), 1500)
    }
  }

  const zoomedItem = derived(
    [items, zoomedItemId],
    ([$items, $zoomedId]) => {
      if (!$zoomedId) return $items
      return findItem($items, $zoomedId) || $items
    }
  )

  const filteredItems = derived(
    [zoomedItem, searchQuery],
    ([$zoomedItem, $query]) => {
      const { tree, matches } = filterTree($zoomedItem, $query)
      return { tree, matches, hasSearch: !!$query?.trim() }
    }
  )

  const highlightPhrase = derived(searchQuery, $q => $q?.trim() || null)

  return {
    items,
    searchQuery,
    selection,
    selectionAnchor,
    selectionDirection,
    zoomedItemId,
    zoomedItem,
    filteredItems,
    highlightPhrase,
    selectionHead,
    
    addItem,
    deleteItem,
    deleteSelected,
    deleteSelectedWithFocus,
    moveItems,
    completeSelected,
    updateItem,
    toggleComplete,
    toggleOpen,
    indentItem,
    outdentItem,
    indentSelected,
    outdentSelected,
    moveItemUp,
    moveItemDown,
    moveSelectedUp,
    moveSelectedDown,
    setSearch,
    clearSearch,
    select,
    selectRange,
    addToSelection,
    removeFromSelection,
    setSelectionAnchor,
    setSelectionDirection,
    setSelectionHead,
    extendSelection,
    clearSelection,
    copySelected,
    paste,
    zoom,
    zoomOut,
    navigateToItem,
    undo,
    redo
  }
}

export const itemStore = createItemStore()
