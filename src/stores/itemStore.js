import { writable, derived, get } from 'svelte/store'
import { generateId } from '../utils/id.js'
import { findItem, findParent, findItemIndex, filterTree, cloneTree } from '../utils/tree.js'
import { copyToClipboard, pasteFromClipboard } from '../utils/clipboard.js'

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
  const zoomedItemId = writable(null)
  const clipboardItems = writable([])

  items.subscribe(saveToStorage)

  function updateItems(fn) {
    items.update(root => {
      const newRoot = cloneTree(root)
      fn(newRoot)
      return newRoot
    })
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
      function removeFromChildren(node) {
        if (!node.children) return
        node.children = node.children.filter(c => !sel.has(c.id))
        node.children.forEach(removeFromChildren)
      }
      removeFromChildren(root)
    })
    selection.set(new Set())
  }

  function completeSelected() {
    const sel = get(selection)
    if (sel.size === 0) return
    
    updateItems(root => {
      function toggleInChildren(node) {
        if (sel.has(node.id)) {
          node.completed = !node.completed
        }
        node.children?.forEach(toggleInChildren)
      }
      toggleInChildren(root)
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

  function clearSelection() {
    selection.set(new Set())
  }

  async function copySelected() {
    const sel = get(selection)
    if (sel.size === 0) return
    
    const root = get(items)
    const itemsToCopy = []
    
    function collectItems(node) {
      if (sel.has(node.id)) {
        itemsToCopy.push(cloneTree(node))
        return
      }
      node.children?.forEach(collectItems)
    }
    collectItems(root)
    
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
    zoomedItemId.set(parent?.id || null)
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
    zoomedItemId,
    zoomedItem,
    filteredItems,
    highlightPhrase,
    
    addItem,
    deleteItem,
    deleteSelected,
    completeSelected,
    updateItem,
    toggleComplete,
    toggleOpen,
    indentItem,
    outdentItem,
    setSearch,
    clearSearch,
    select,
    selectRange,
    clearSelection,
    copySelected,
    paste,
    zoom,
    zoomOut
  }
}

export const itemStore = createItemStore()
