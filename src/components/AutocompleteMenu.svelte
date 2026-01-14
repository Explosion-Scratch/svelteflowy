<script>
  import { createEventDispatcher, onMount, onDestroy } from 'svelte'

  export let items = []
  export let coords = { top: 0, left: 0 }
  export let query = ''
  export let visible = false

  const dispatch = createEventDispatcher()

  let selectedIndex = 0
  let menuElement

  function getItemText(item) {
    return typeof item === 'object' ? item.text : item
  }

  function truncateText(text, maxLen = 50) {
    if (!text) return ''
    return text.length > maxLen ? text.slice(0, maxLen) + '…' : text
  }

  $: filteredItems = items.filter(item => {
    const text = getItemText(item)
    return text?.toLowerCase().includes(query.toLowerCase())
  })

  $: if (filteredItems.length > 0 && selectedIndex >= filteredItems.length) {
    selectedIndex = filteredItems.length - 1
  }

  function handleKeyDown(event) {
    if (!visible) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      event.stopPropagation()
      selectedIndex = (selectedIndex + 1) % filteredItems.length
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      event.stopPropagation()
      selectedIndex = (selectedIndex - 1 + filteredItems.length) % filteredItems.length
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      if (filteredItems.length > 0) {
        event.preventDefault()
        event.stopPropagation()
        selectItem(filteredItems[selectedIndex])
      }
    } else if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      dispatch('close')
    }
  }

  function selectItem(item) {
    dispatch('select', { item })
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown, true)
  })

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeyDown, true)
  })
</script>

{#if visible && filteredItems.length > 0}
  <div 
    bind:this={menuElement}
    class="autocomplete-menu"
    style="top: {coords.bottom + 4}px; left: {coords.left}px;"
  >
    {#each filteredItems as item, index}
      <button
        type="button"
        class="autocomplete-item"
        class:selected={index === selectedIndex}
        on:click={() => selectItem(item)}
        on:mouseenter={() => selectedIndex = index}
      >
        {truncateText(getItemText(item))}
      </button>
    {/each}
  </div>
{/if}

<style>
  .autocomplete-menu {
    position: fixed;
    z-index: 1000;
    background: white;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    min-width: 140px;
    max-width: 260px;
    max-height: 180px;
    overflow-y: auto;
    padding: 3px;
  }

  .autocomplete-item {
    all: unset;
    display: block;
    width: 100%;
    padding: 6px 10px;
    cursor: pointer;
    border-radius: 4px;
    font-size: 13px;
    color: #555;
    box-sizing: border-box;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .autocomplete-item:hover,
  .autocomplete-item.selected {
    background: rgba(0, 0, 0, 0.05);
    color: #333;
  }
</style>
