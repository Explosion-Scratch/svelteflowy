<script>
  import { itemStore } from '../stores/itemStore.js'

  const { searchQuery } = itemStore

  let inputElement

  $: searchValue = $searchQuery

  function handleInput(event) {
    itemStore.setSearch(event.target.value)
  }

  function handleClear() {
    itemStore.clearSearch()
    inputElement?.blur()
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      handleClear()
      return
    }
    
    if (event.metaKey || event.ctrlKey || event.altKey) {
      event.stopPropagation()
      return
    }
    
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Tab', 'Delete', 'Backspace'].includes(event.key)) {
      event.stopPropagation()
    }
  }

  function handleKeyUp(event) {
    event.stopPropagation()
  }

  function handleKeyPress(event) {
    event.stopPropagation()
  }

  function handleGlobalKeyDown(event) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'f') {
      event.preventDefault()
      inputElement?.focus()
    }
  }

  export function focus() {
    inputElement?.focus()
  }
</script>

<svelte:window on:keydown={handleGlobalKeyDown} />

<div class="search-bar">
  <svg class="search-icon" width="16" height="16" viewBox="0 0 256 256">
    <path
      fill="currentColor"
      d="M229.66 218.34l-50.07-50.06a88.11 88.11 0 1 0-11.31 11.31l50.06 50.07a8 8 0 0 0 11.32-11.32ZM40 112a72 72 0 1 1 72 72a72.08 72.08 0 0 1-72-72Z"
    />
  </svg>

  <input
    bind:this={inputElement}
    value={searchValue}
    on:input={handleInput}
    on:keydown={handleKeyDown}
    on:keyup={handleKeyUp}
    on:keypress={handleKeyPress}
    type="text"
    placeholder="Search... (⌘F)"
    class="search-input"
  />

  {#if searchValue}
    <button class="clear-button" on:click={handleClear} type="button" aria-label="Clear search">
      <svg width="14" height="14" viewBox="0 0 256 256">
        <path
          fill="currentColor"
          d="M205.66 194.34a8 8 0 0 1-11.32 11.32L128 139.31l-66.34 66.35a8 8 0 0 1-11.32-11.32L116.69 128L50.34 61.66a8 8 0 0 1 11.32-11.32L128 116.69l66.34-66.35a8 8 0 0 1 11.32 11.32L139.31 128Z"
        />
      </svg>
    </button>
  {/if}
</div>

<style>
  .search-bar {
    display: flex;
    align-items: center;
    background: #f5f5f5;
    border-radius: 8px;
    padding: 6px 12px;
    gap: 8px;
    flex: 1;
    max-width: 300px;
  }

  .search-icon {
    color: #999;
    flex-shrink: 0;
  }

  .search-input {
    all: unset;
    flex: 1;
    font-size: 14px;
    color: #333;
  }

  .search-input::placeholder {
    color: #999;
  }

  .clear-button {
    all: unset;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    padding: 2px;
    border-radius: 4px;
  }

  .clear-button:hover {
    background: #e0e0e0;
    color: #666;
  }
</style>
