<script>
  import { createEventDispatcher, onMount, onDestroy } from 'svelte'

  export let items = []
  export let coords = { top: 0, left: 0 }
  export let query = ''
  export let visible = false

  const dispatch = createEventDispatcher()

  let selectedIndex = 0
  let menuElement

  $: filteredItems = items.filter(item => 
    item.toLowerCase().includes(query.toLowerCase())
  )

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
        <span class="item-text">{item}</span>
      </button>
    {/each}
  </div>
{/if}

<style>
  .autocomplete-menu {
    position: fixed;
    z-index: 1000;
    background: white;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    min-width: 160px;
    max-width: 280px;
    max-height: 200px;
    overflow-y: auto;
    padding: 4px;
  }

  .autocomplete-item {
    all: unset;
    display: flex;
    align-items: center;
    width: 100%;
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 6px;
    font-size: 14px;
    color: #333;
    box-sizing: border-box;
  }

  .autocomplete-item:hover,
  .autocomplete-item.selected {
    background: rgba(73, 186, 242, 0.1);
  }

  .item-text {
    color: var(--accent, #49baf2);
  }
</style>
