<script>
  import List from './components/List.svelte'
  import BreadCrumb from './components/BreadCrumb.svelte'
  import SearchBar from './components/SearchBar.svelte'
  import { copyToClipboard } from './utils/clipboard.js'
  import { itemStore } from './stores/itemStore.js'
  import { flattenVisibleTree } from './utils/tree.js'
  import { focusItem, flattenVisible } from './utils/focus.js'
  import { tick } from 'svelte'
  import { generateId } from './utils/id.js'

  const { items, filteredItems, highlightPhrase, selection, zoomedItemId, zoomedItem } = itemStore

  let isDragging = false
  let dragStartX = 0
  let dragStartY = 0
  let selectionBox = null
  let containerRef
  let justFinishedDragSelection = false

  async function handleCopy() {
    if ($selection.size > 0) {
      await itemStore.copySelected()
    } else {
      await copyToClipboard($items.children || [])
    }
  }

  function handleGlobalKeyDown(event) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'c') {
      if ($selection.size > 0) {
        event.preventDefault()
        itemStore.copySelected()
      }
    }

    if ((event.metaKey || event.ctrlKey) && event.key === 'x') {
      if ($selection.size > 0) {
        event.preventDefault()
        itemStore.copySelected().then(() => {
          itemStore.deleteSelected()
        })
      }
    }

    if ((event.metaKey || event.ctrlKey) && event.key === 'v') {
      event.preventDefault()
      itemStore.paste($zoomedItemId)
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      if ($selection.size > 0 && !event.target.closest('[contenteditable]')) {
        event.preventDefault()
        itemStore.deleteSelected()
      } else if (!event.target.closest('[contenteditable]')) {
        event.preventDefault()
        const currentRoot = $zoomedItem || $filteredItems.tree
        const flat = flattenVisibleTree(currentRoot)
        if (flat.length > 0) {
          const lastItem = flat[flat.length - 1]
          focusItem(lastItem.id)
        }
      }
    }

    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      if ($selection.size > 0 && !event.target.closest('[contenteditable]')) {
        event.preventDefault()
        itemStore.completeSelected()
      }
    }

    if (event.key === 'Escape') {
      itemStore.clearSelection()
      itemStore.clearSearch()
      selectionBox = null
    }

    if (event.key === 'Enter' && !event.target.closest('[contenteditable]') && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
      event.preventDefault()
      const currentRoot = $zoomedItem || $filteredItems.tree
      const newId = generateId()
      const newItem = { id: newId, text: '', description: '', completed: false, open: true, children: [] }
      
      if (currentRoot.children?.length) {
        itemStore.updateItem(currentRoot.id, {
          children: [...currentRoot.children, newItem]
        })
      } else {
        itemStore.updateItem(currentRoot.id, {
          children: [newItem]
        })
      }
      
      tick().then(() => focusItem(newId))
    }

    if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
      if (event.shiftKey) {
        event.preventDefault()
        itemStore.redo()
      } else {
        event.preventDefault()
        itemStore.undo()
      }
    }

    if (event.shiftKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      if (!event.target.closest('[contenteditable]')) {
        event.preventDefault()
        const currentRoot = $zoomedItem || $filteredItems.tree
        const flat = flattenVisibleTree(currentRoot)
        if (flat.length === 0) return

        if ($selection.size === 0) {
          const targetItem = event.key === 'ArrowUp' ? flat[flat.length - 1] : flat[0]
          itemStore.selectRange([targetItem.id])
          itemStore.setSelectionHead(targetItem.id)
          itemStore.setSelectionAnchor(targetItem.id)
        } else {
          const direction = event.key === 'ArrowUp' ? 'up' : 'down'
          itemStore.extendSelection(direction)
        }
      }
    }

    if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && !event.shiftKey) {
      if (!event.target.closest('[contenteditable]')) {
        event.preventDefault()
        const currentRoot = $zoomedItem || $filteredItems.tree
        const flat = flattenVisibleTree(currentRoot)
        if (flat.length === 0) return

        if (event.key === 'ArrowUp') {
          focusItem(flat[flat.length - 1].id)
        } else {
          focusItem(flat[0].id)
        }
      }
    }
  }

  function getItemIdFromElement(element) {
    const itemEl = element.closest('.item')
    if (itemEl) {
      const id = itemEl.id.replace('item_', '')
      return id
    }
    return null
  }

  function rectsIntersect(r1, r2) {
    return !(r2.left > r1.right || 
             r2.right < r1.left || 
             r2.top > r1.bottom ||
             r2.bottom < r1.top)
  }

  function getItemsInBox(box) {
    const itemElements = document.querySelectorAll('.item')
    const selectedIds = []
    
    for (const el of itemElements) {
      const rect = el.getBoundingClientRect()
      if (rectsIntersect(box, rect)) {
        const id = el.id.replace('item_', '')
        if (id) selectedIds.push(id)
      }
    }
    
    return selectedIds
  }

  let potentialDragStart = null

  function handleMouseDown(event) {
    if (event.target.closest('button')) {
      return
    }

    potentialDragStart = { x: event.clientX, y: event.clientY, fromEditor: !!event.target.closest('[contenteditable]') }
    isDragging = false
    selectionBox = null
  }

  function handleMouseMove(event) {
    if (!potentialDragStart) return

    const currentX = event.clientX
    const currentY = event.clientY
    const dx = currentX - potentialDragStart.x
    const dy = currentY - potentialDragStart.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (!isDragging && distance > 5) {
      isDragging = true
      dragStartX = potentialDragStart.x
      dragStartY = potentialDragStart.y
      
      if (potentialDragStart.fromEditor) {
        const activeEl = document.activeElement
        if (activeEl && activeEl.closest('[contenteditable]')) {
          activeEl.blur()
        }
        window.getSelection()?.removeAllRanges()
      }
    }

    if (!isDragging) return
    
    const left = Math.min(dragStartX, currentX)
    const top = Math.min(dragStartY, currentY)
    const right = Math.max(dragStartX, currentX)
    const bottom = Math.max(dragStartY, currentY)
    
    const width = right - left
    const height = bottom - top
    
    selectionBox = { left, top, right, bottom, width, height }
    
    const selectedIds = getItemsInBox(selectionBox)
    itemStore.selectRange(selectedIds)
    
    document.querySelectorAll('.item').forEach(el => {
      el.classList.remove('drag-selecting')
    })
    selectedIds.forEach(id => {
      const el = document.querySelector(`#item_${id}`)
      if (el) el.classList.add('drag-selecting')
    })
  }

  function handleMouseUp(event) {
    const wasDragging = isDragging
    const hadDragBox = selectionBox !== null
    
    isDragging = false
    selectionBox = null
    potentialDragStart = null
    
    if (hadDragBox) {
      justFinishedDragSelection = true
      
      if ($selection.size > 0) {
        const activeEl = document.activeElement
        if (activeEl && activeEl.closest('[contenteditable]')) {
          activeEl.blur()
        }
      }
    }
    
    requestAnimationFrame(() => {
      document.querySelectorAll('.item.drag-selecting').forEach(el => {
        el.classList.remove('drag-selecting')
      })
    })
    
    if (wasDragging && !hadDragBox) {
      if (event.target.closest('[contenteditable]') || event.target.closest('button')) {
        return
      }
      
      const itemId = getItemIdFromElement(event.target)
      
      if (itemId) {
        if (event.shiftKey || event.metaKey || event.ctrlKey) {
          itemStore.select(itemId, true)
        } else {
          itemStore.clearSelection()
          itemStore.select(itemId, false)
        }
      } else {
        itemStore.clearSelection()
      }
    }
  }

  function handleContainerClick(event) {
    if (justFinishedDragSelection) {
      justFinishedDragSelection = false
      return
    }
    
    if (event.target.closest('.item') || 
        event.target.closest('button') || 
        event.target.closest('[contenteditable]') ||
        event.target.closest('.empty-slot') ||
        event.target.closest('.empty-area')) {
      return
    }
    itemStore.clearSelection()
  }
</script>

<svelte:window 
  on:keydown={handleGlobalKeyDown} 
  on:mouseup={handleMouseUp}
  on:mousemove={handleMouseMove}
/>

<div class="header">
  <BreadCrumb />

  <div class="header-right">
    <SearchBar />

    <button class="copy-btn" on:click={handleCopy} title="Copy as Markdown" aria-label="Copy as Markdown">
      <svg width="20" height="20" viewBox="0 0 256 256">
        <path
          fill="currentColor"
          d="M216 34H88a6 6 0 0 0-6 6v42H40a6 6 0 0 0-6 6v128a6 6 0 0 0 6 6h128a6 6 0 0 0 6-6v-42h42a6 6 0 0 0 6-6V40a6 6 0 0 0-6-6Zm-54 176H46V94h116Zm48-48h-36V88a6 6 0 0 0-6-6H94V46h116Z"
        />
      </svg>
    </button>
  </div>
</div>

<div 
  class="outer_container"
  bind:this={containerRef}
  on:mousedown={handleMouseDown}
  on:click={handleContainerClick}
>
  <div class="container">
    <List
      outermost={true}
      item={$filteredItems.tree}
      isTop={true}
      highlightPhrase={$highlightPhrase}
    />
  </div>
</div>

{#if selectionBox}
  <div 
    class="selection-box"
    style="left: {selectionBox.left}px; top: {selectionBox.top}px; width: {selectionBox.width}px; height: {selectionBox.height}px;"
  ></div>
{/if}

<style>
  :root {
    --accent: #49baf2;
    --accent-bg: rgba(73, 186, 242, 0.15);
    --accent-border: rgba(73, 186, 242, 0.5);
    --transition-fast: 60ms ease-out;
    --transition-normal: 120ms ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }

  @keyframes shrinkOut {
    from { opacity: 1; transform: scale(1); }
    to { opacity: 0; transform: scale(0.95); }
  }

  :global(.animate-fade-in) {
    animation: fadeIn var(--transition-fast) both;
  }

  :global(.animate-fade-out) {
    animation: fadeOut var(--transition-fast) both;
  }

  :global(.animate-shrink-out) {
    animation: shrinkOut var(--transition-fast) both;
  }

  @keyframes highlightPulse {
    0%, 100% { background: transparent; }
    30% { background: rgba(139, 92, 246, 0.25); }
  }

  :global(.highlight-pulse) {
    animation: highlightPulse 1.5s ease-out;
    border-radius: 4px;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Helvetica Neue', Arial, sans-serif;
  }

  :global(*) {
    box-sizing: border-box;
  }

  .outer_container {
    width: 100vw;
    min-height: 100vh;
    overflow-y: auto;
    display: grid;
    place-items: start center;
    padding-top: 70px;
    padding-bottom: 100px;
    user-select: none;
  }

  .header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    padding: 0.5rem 1rem;
    background: white;
    border-bottom: 1px solid #eee;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .container {
    min-height: 80vh;
    width: 90vw;
    max-width: 650px;
    padding: 0 1rem;
  }

  .copy-btn {
    all: unset;
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    color: #999;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .copy-btn:hover {
    background: #f0f0f0;
    color: #666;
  }

  .selection-box {
    position: fixed;
    background: var(--accent-bg);
    border: 1px solid var(--accent-border);
    pointer-events: none;
    z-index: 1000;
    transition: opacity var(--transition-fast);
  }

  :global(::-webkit-scrollbar-thumb) {
    background-color: rgb(236, 238, 240);
    border-radius: 4px;
  }

  :global(::-webkit-scrollbar) {
    width: 8px;
  }

  :global(.item.drag-selecting) {
    background: var(--accent-bg);
    border-radius: 4px;
    transition: background var(--transition-fast);
  }
</style>
