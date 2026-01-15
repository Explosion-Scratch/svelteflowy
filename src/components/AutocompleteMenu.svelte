<script>
  import { createEventDispatcher, onMount, onDestroy } from 'svelte'
  import { formatRelativeTime, formatAbsoluteDate } from '../utils/dateParser.js'

  export let items = []
  export let coords = { top: 0, left: 0 }
  export let query = ''
  export let visible = false
  export let dateItem = null

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

  $: dateDisplayItem = dateItem ? {
    _isDate: true,
    date: dateItem.date,
    relativeText: formatRelativeTime(dateItem.date),
    absoluteText: formatAbsoluteDate(dateItem.date)
  } : null

  $: allDisplayItems = dateDisplayItem 
    ? [dateDisplayItem, ...filteredItems]
    : filteredItems

  $: totalLength = allDisplayItems.length

  $: if (totalLength > 0 && selectedIndex >= totalLength) {
    selectedIndex = totalLength - 1
  }

  function handleKeyDown(event) {
    if (!visible) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      event.stopPropagation()
      selectedIndex = (selectedIndex + 1) % totalLength
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      event.stopPropagation()
      selectedIndex = (selectedIndex - 1 + totalLength) % totalLength
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      if (totalLength > 0) {
        event.preventDefault()
        event.stopPropagation()
        selectItem(allDisplayItems[selectedIndex])
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

{#if visible && totalLength > 0}
  <div 
    bind:this={menuElement}
    class="autocomplete-menu"
    style="top: {coords.bottom + 4}px; left: {coords.left}px;"
  >
    {#each allDisplayItems as item, index}
      {#if item._isDate}
        <button
          type="button"
          class="autocomplete-item date-item"
          class:selected={index === selectedIndex}
          on:click={() => selectItem(item)}
          on:mouseenter={() => selectedIndex = index}
          title={item.absoluteText}
        >
          <span class="date-icon">📅</span>
          <span class="date-relative">{item.relativeText}</span>
          <span class="date-absolute">{item.absoluteText}</span>
        </button>
      {:else}
        <button
          type="button"
          class="autocomplete-item"
          class:selected={index === selectedIndex}
          on:click={() => selectItem(item)}
          on:mouseenter={() => selectedIndex = index}
        >
          {truncateText(getItemText(item))}
        </button>
      {/if}
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
    max-width: 280px;
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

  .autocomplete-item.date-item {
    display: flex;
    align-items: center;
    gap: 6px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    margin-bottom: 2px;
    padding-bottom: 8px;
  }

  .date-icon {
    font-size: 12px;
    flex-shrink: 0;
  }

  .date-relative {
    font-weight: 500;
    color: var(--accent, #49baf2);
  }

  .date-absolute {
    font-size: 11px;
    color: #999;
    margin-left: auto;
  }
</style>
