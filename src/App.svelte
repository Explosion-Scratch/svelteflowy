<script>
  import List from './components/List.svelte'
  import BreadCrumb from './components/BreadCrumb.svelte'
  import SearchBar from './components/SearchBar.svelte'
  import SaveIndicator from './components/SaveIndicator.svelte'
  import { copyToClipboard } from './utils/clipboard.js'
  import { itemStore } from './stores/itemStore.js'
  import { dragDropStore } from './stores/dragDropStore.js'
  import { urlStore } from './stores/urlStore.js'
  import { fileService } from './services/fileService.js'
  import { flattenVisibleTree, findParent } from './utils/tree.js'
  import { focusItem, flattenVisible } from './utils/focus.js'
  import { tick, onMount } from 'svelte'
  import { generateId } from './utils/id.js'
  import { debounce } from './utils/debounce.js'
  import { get } from 'svelte/store'

  const { items, filteredItems, highlightPhrase, selection, zoomedItemId, zoomedItem } = itemStore
  const { isDraggingItems, dropTarget } = dragDropStore

  let isDragging = false
  let dragStartX = 0
  let dragStartY = 0
  let selectionBox = null
  let containerRef
  let justFinishedDragSelection = false

  let isItemDragMode = false
  let dropIndicatorY = null
  let dropIndicatorX = null

  onMount(async () => {
    urlStore.initFromUrl()
    urlStore.setupUrlSync()
    
    if (fileService.isFileSystemAccessSupported()) {
      await fileService.initFromStoredHandle()
    }
  })

  let isInitialLoad = true
  
  const debouncedSave = debounce(async () => {
    const handle = get(fileService.fileHandle)
    if (handle) {
      await handleSave()
    }
  }, 1000)

  items.subscribe(() => {
    if (isInitialLoad) {
      isInitialLoad = false
      return
    }
    fileService.markDirty()
    debouncedSave()
  })

  async function handleSave() {
    const rootItems = get(items)
    const itemsArray = rootItems.children || []
    await fileService.saveFile(itemsArray)
  }

  async function handleOpen() {
    const { hasUnsavedChanges, saveState } = fileService
    const hasDirtyChanges = get(hasUnsavedChanges)
    const handle = get(fileService.fileHandle)
    
    if (hasDirtyChanges && handle) {
      const rootItems = get(items)
      const itemsArray = rootItems.children || []
      await fileService.saveFile(itemsArray)
    }
    
    const result = await fileService.openFile()
    
    if (result.success && result.items) {
      const rootItems = get(items)
      itemStore.updateItem(rootItems.id, { children: result.items })
      fileService.hasUnsavedChanges.set(false)
    } else if (result.error) {
      alert(result.error)
    }
  }

  async function handleCopy() {
    if ($selection.size > 0) {
      await itemStore.copySelected()
    } else {
      await copyToClipboard($items.children || [])
    }
  }

  function handleGlobalKeyDown(event) {
    if ((event.metaKey || event.ctrlKey) && event.key === 's') {
      event.preventDefault()
      handleSave()
      return
    }

    if ((event.metaKey || event.ctrlKey) && event.key === 'o') {
      event.preventDefault()
      handleOpen()
      return
    }

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

    if ((event.metaKey || event.ctrlKey) && event.key === 'a') {
      if (!event.target.closest('[contenteditable]')) {
        event.preventDefault()
        const currentRoot = $zoomedItem || $filteredItems.tree
        const flat = flattenVisibleTree(currentRoot)
        const allIds = flat.map(item => item.id)
        if (allIds.length > 0) {
          itemStore.selectRange(allIds)
          itemStore.setSelectionAnchor(allIds[0])
          itemStore.setSelectionHead(allIds[allIds.length - 1])
        }
      }
    }

    if ((event.metaKey || event.ctrlKey) && (event.key === 'Delete' || event.key === 'Backspace')) {
      if ($selection.size > 0 && !event.target.closest('[contenteditable]')) {
        event.preventDefault()
        const focusTargetId = itemStore.deleteSelectedWithFocus()
        if (focusTargetId) {
          tick().then(() => focusItem(focusTargetId))
        }
      }
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      if ($selection.size > 0 && !event.target.closest('[contenteditable]')) {
        event.preventDefault()
        const focusTargetId = itemStore.deleteSelectedWithFocus()
        if (focusTargetId) {
          tick().then(() => focusItem(focusTargetId))
        }
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
      if ($isDraggingItems) {
        dragDropStore.endDrag()
        isItemDragMode = false
        dropIndicatorY = null
        dropIndicatorX = null
        return
      }

      const activeEditor = document.activeElement?.closest('[contenteditable]')
      
      if (activeEditor) {
        const itemElement = activeEditor.closest('.item') || activeEditor.closest('[id^="item_"]')
        if (itemElement) {
          const itemId = itemElement.id.replace('item_', '')
          if (itemId) {
            itemStore.clearSelection()
            itemStore.select(itemId, false)
          }
        }
        activeEditor.blur()
        return
      }

      if ($selection.size > 0) {
        itemStore.clearSelection()
        return
      }

      if ($zoomedItemId) {
        const previousZoomId = $zoomedItemId
        itemStore.zoomOut()
        tick().then(() => focusItem(previousZoomId))
        return
      }

      itemStore.clearSearch()
      selectionBox = null
    }

    if (event.key === 'Enter' && !event.target.closest('[contenteditable]') && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
      event.preventDefault()
      
      if ($selection.size === 1) {
        const selectedId = [...$selection][0]
        itemStore.clearSelection()
        tick().then(() => focusItem(selectedId))
        return
      }
      
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

    if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && !event.shiftKey && !event.altKey) {
      if (!event.target.closest('[contenteditable]')) {
        event.preventDefault()
        const currentRoot = $zoomedItem || $filteredItems.tree
        const flat = flattenVisibleTree(currentRoot)
        if (flat.length === 0) return

        if ($selection.size > 0) {
          const selectedIds = [...$selection]
          const currentId = selectedIds[0]
          const currentIndex = flat.findIndex(item => item.id === currentId)
          
          let newIndex
          if (event.key === 'ArrowUp') {
            newIndex = currentIndex > 0 ? currentIndex - 1 : 0
          } else {
            newIndex = currentIndex < flat.length - 1 ? currentIndex + 1 : flat.length - 1
          }
          
          const newItem = flat[newIndex]
          if (newItem) {
            itemStore.clearSelection()
            itemStore.select(newItem.id, false)
            itemStore.setSelectionHead(newItem.id)
            itemStore.setSelectionAnchor(newItem.id)
          }
        } else {
          if (event.key === 'ArrowUp') {
            focusItem(flat[flat.length - 1].id)
          } else {
            focusItem(flat[0].id)
          }
        }
      }
    }

    if (event.altKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault()
      
      const activeEditor = document.activeElement?.closest('[contenteditable]')
      let focusedItemId = null
      
      if (activeEditor) {
        const itemElement = activeEditor.closest('.item') || activeEditor.closest('[id^="item_"]')
        if (itemElement) {
          focusedItemId = itemElement.id.replace('item_', '')
        }
      }
      
      if (event.key === 'ArrowLeft') {
        const previousZoomId = $zoomedItemId
        itemStore.zoomOut()
        if (previousZoomId) {
          tick().then(() => focusItem(previousZoomId))
        }
      } else {
        let targetItemId = focusedItemId
        
        if (!targetItemId && $selection.size > 0) {
          targetItemId = [...$selection][0]
        }
        
        if (targetItemId) {
          itemStore.zoom(targetItemId)
        }
      }
      
      if (focusedItemId) {
        tick().then(() => focusItem(focusedItemId))
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

  function computeDropTarget(clientY) {
    const currentRoot = $zoomedItem || $filteredItems.tree
    const flat = flattenVisibleTree(currentRoot)
    const draggedIds = get(dragDropStore.draggedItemIds)
    
    let closestDistance = Infinity
    let closestTarget = null
    let closestY = null
    let closestX = null
    
    for (let i = 0; i <= flat.length; i++) {
      if (i < flat.length && draggedIds.has(flat[i].id)) continue
      if (i > 0 && draggedIds.has(flat[i - 1].id)) continue
      
      let targetY
      let targetX = 0
      let insertBeforeId = null
      let parentId = currentRoot.id
      
      if (i === 0) {
        const firstEl = document.querySelector(`#item_${flat[0]?.id}`)
        if (firstEl) {
          const rect = firstEl.getBoundingClientRect()
          targetY = rect.top
          targetX = rect.left
          insertBeforeId = flat[0]?.id
          const parent = findParent(get(items), flat[0]?.id)
          parentId = parent?.id || currentRoot.id
        }
      } else if (i === flat.length) {
        const lastEl = document.querySelector(`#item_${flat[i - 1]?.id}`)
        if (lastEl) {
          const rect = lastEl.getBoundingClientRect()
          targetY = rect.bottom
          targetX = rect.left
          insertBeforeId = null
          const parent = findParent(get(items), flat[i - 1]?.id)
          parentId = parent?.id || currentRoot.id
        }
      } else {
        const prevEl = document.querySelector(`#item_${flat[i - 1]?.id}`)
        const currEl = document.querySelector(`#item_${flat[i]?.id}`)
        if (prevEl && currEl) {
          const prevRect = prevEl.getBoundingClientRect()
          const currRect = currEl.getBoundingClientRect()
          targetY = (prevRect.bottom + currRect.top) / 2
          targetX = currRect.left
          insertBeforeId = flat[i]?.id
          const parent = findParent(get(items), flat[i]?.id)
          parentId = parent?.id || currentRoot.id
        }
      }
      
      if (targetY !== undefined) {
        const distance = Math.abs(clientY - targetY)
        if (distance < closestDistance) {
          closestDistance = distance
          closestTarget = { parentId, insertBeforeId }
          closestY = targetY
          closestX = targetX
        }
      }
    }
    
    return { target: closestTarget, y: closestY, x: closestX }
  }

  let potentialDragStart = null

  function handleMouseDown(event) {
    if (event.target.closest('button')) {
      return
    }

    const clickedItemId = getItemIdFromElement(event.target)
    const isClickOnSelectedItem = clickedItemId && $selection.has(clickedItemId)
    
    potentialDragStart = { 
      x: event.clientX, 
      y: event.clientY, 
      fromEditor: !!event.target.closest('[contenteditable]'),
      itemDrag: isClickOnSelectedItem && $selection.size > 0
    }
    isDragging = false
    isItemDragMode = false
    selectionBox = null
  }

  function handleMouseMove(event) {
    if (!potentialDragStart) return

    const currentX = event.clientX
    const currentY = event.clientY
    const dx = currentX - potentialDragStart.x
    const dy = currentY - potentialDragStart.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (!isDragging && !isItemDragMode && distance > 5) {
      if (potentialDragStart.itemDrag) {
        isItemDragMode = true
        dragDropStore.startDrag([...$selection])
        
        const activeEl = document.activeElement
        if (activeEl && activeEl.closest('[contenteditable]')) {
          activeEl.blur()
        }
        window.getSelection()?.removeAllRanges()
      } else {
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
    }

    if (isItemDragMode) {
      const { target, y, x } = computeDropTarget(currentY)
      if (target) {
        dragDropStore.updateDropTarget(target)
        dropIndicatorY = y
        dropIndicatorX = x
      }
      return
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
    const wasItemDragging = isItemDragMode
    const wasDragging = isDragging
    const hadDragBox = selectionBox !== null
    const currentDropTarget = get(dropTarget)
    
    if (wasItemDragging && currentDropTarget) {
      const draggedIds = [...get(dragDropStore.draggedItemIds)]
      itemStore.moveItems(draggedIds, currentDropTarget.parentId, currentDropTarget.insertBeforeId)
    }
    
    isDragging = false
    isItemDragMode = false
    selectionBox = null
    potentialDragStart = null
    dropIndicatorY = null
    dropIndicatorX = null
    dragDropStore.endDrag()
    
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

  <div class="header-center">
    <SaveIndicator />
  </div>

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

{#if dropIndicatorY !== null}
  <div 
    class="drop-indicator"
    style="top: {dropIndicatorY}px; left: {dropIndicatorX || 0}px;"
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

  .header-center {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
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

  :global(body.dragging-items) {
    user-select: none !important;
    cursor: grabbing !important;
  }

  :global(body.dragging-items *) {
    user-select: none !important;
  }

  .drop-indicator {
    position: fixed;
    height: 2px;
    background: var(--accent);
    pointer-events: none;
    z-index: 1001;
    width: 300px;
    border-radius: 1px;
    box-shadow: 0 0 4px var(--accent-border);
  }
</style>
