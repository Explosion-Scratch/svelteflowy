<script>
  import List from './components/List.svelte'
  import BreadCrumb from './components/BreadCrumb.svelte'
  import SearchBar from './components/SearchBar.svelte'
  import { itemStore } from './stores/itemStore.js'
  import { flattenVisibleTree } from './utils/tree.js'
  import { focusItem } from './utils/focus.js'
  import { tick } from 'svelte'
  import { generateId } from './utils/id.js'

  const { items, filteredItems, highlightPhrase, selection, zoomedItemId, zoomedItem } = itemStore

  let isSelecting = false
  let selectionStartId = null

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

  function handleMouseDown(event) {
    if (event.target.closest('[contenteditable]') || event.target.closest('button')) {
      return
    }
    
    const itemId = getItemIdFromElement(event.target)
    if (itemId) {
      isSelecting = true
      selectionStartId = itemId
      
      if (event.shiftKey || event.metaKey || event.ctrlKey) {
        itemStore.select(itemId, true)
      } else {
        itemStore.clearSelection()
        itemStore.select(itemId, false)
      }
    }
  }

  function handleMouseMove(event) {
    if (!isSelecting || !selectionStartId) return
    
    const itemId = getItemIdFromElement(event.target)
    if (itemId && itemId !== selectionStartId) {
      const flatItems = flattenVisibleTree($filteredItems.tree)
      const startIdx = flatItems.findIndex(i => i.id === selectionStartId)
      const endIdx = flatItems.findIndex(i => i.id === itemId)
      
      if (startIdx !== -1 && endIdx !== -1) {
        const minIdx = Math.min(startIdx, endIdx)
        const maxIdx = Math.max(startIdx, endIdx)
        const selectedIds = flatItems.slice(minIdx, maxIdx + 1).map(i => i.id)
        itemStore.selectRange(selectedIds)
      }
    }
  }

  function handleMouseUp() {
    isSelecting = false
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
  on:mousedown={handleMouseDown}
  on:mousemove={handleMouseMove}
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

  :global(::-webkit-scrollbar-thumb) {
    background-color: rgb(236, 238, 240);
    border-radius: 4px;
  }

  :global(::-webkit-scrollbar) {
    width: 8px;
  }
</style>
