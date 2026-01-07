<script>
  import List from './components/List.svelte'
  import BreadCrumb from './components/BreadCrumb.svelte'
  import SearchBar from './components/SearchBar.svelte'
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

  function handleCopyJson() {
    const data = JSON.stringify($items, null, 2)
    navigator.clipboard.writeText(data)
  }

  function handleGlobalKeyDown(event) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'c') {
      if ($selection.size > 0) {
        event.preventDefault()
        itemStore.copySelected()
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

  function handleMouseDown(event) {
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
      return
    }

    isDragging = true
    dragStartX = event.clientX
    dragStartY = event.clientY
    selectionBox = null
    
    if (!event.shiftKey && !event.metaKey && !event.ctrlKey) {
      itemStore.clearSelection()
    }
  }

  function handleMouseMove(event) {
    if (!isDragging) return

    const currentX = event.clientX
    const currentY = event.clientY
    
    const left = Math.min(dragStartX, currentX)
    const top = Math.min(dragStartY, currentY)
    const right = Math.max(dragStartX, currentX)
    const bottom = Math.max(dragStartY, currentY)
    
    const width = right - left
    const height = bottom - top
    
    if (width > 5 || height > 5) {
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
  }

  function handleMouseUp() {
    isDragging = false
    selectionBox = null
    document.querySelectorAll('.item.drag-selecting').forEach(el => {
      el.classList.remove('drag-selecting')
    })
  }

  function handleContainerClick(event) {
    if (event.target.closest('.item') || 
        event.target.closest('button') || 
        event.target.closest('[contenteditable]') ||
        event.target.closest('.empty-slot') ||
        event.target.closest('.empty-area')) {
      return
    }
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

    <button class="copy-btn" on:click={handleCopyJson} title="Copy as JSON" aria-label="Copy as JSON">
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
    background: rgba(73, 186, 242, 0.1);
    border: 1px solid rgba(73, 186, 242, 0.5);
    pointer-events: none;
    z-index: 1000;
  }

  :global(::-webkit-scrollbar-thumb) {
    background-color: rgb(236, 238, 240);
    border-radius: 4px;
  }

  :global(::-webkit-scrollbar) {
    width: 8px;
  }

  :global(.item.drag-selecting) {
    background: rgba(73, 186, 242, 0.15);
    border-radius: 4px;
  }
</style>
