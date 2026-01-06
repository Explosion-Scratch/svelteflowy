<script>
  import { createEventDispatcher } from 'svelte'
  import { clickOutside } from '../actions/clickOutside.js'

  const dispatch = createEventDispatcher()

  const menuItems = [
    { action: 'complete', label: 'Complete', icon: '✓', shortcut: '⌘↵' },
    { action: 'delete', label: 'Delete', icon: '✕', shortcut: '⌫' },
    { action: 'indent', label: 'Indent', icon: '→', shortcut: 'Tab' },
    { action: 'outdent', label: 'Outdent', icon: '←', shortcut: '⇧Tab' }
  ]

  function handleClick(item) {
    dispatch('action', item)
  }
</script>

<div
  class="menu"
  use:clickOutside
  on:click_outside={() => dispatch('close')}
>
  {#each menuItems as item}
    <button
      class="menu-item"
      on:click|stopPropagation={() => handleClick(item)}
    >
      <span class="icon">{item.icon}</span>
      <span class="label">{item.label}</span>
      <span class="shortcut">{item.shortcut}</span>
    </button>
  {/each}
</div>

<style>
  .menu {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 1000;
    background: white;
    border: 1px solid #eee;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    min-width: 160px;
    padding: 4px 0;
  }

  .menu-item {
    all: unset;
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 12px;
    cursor: pointer;
    font-size: 13px;
    color: #555;
    box-sizing: border-box;
  }

  .menu-item:hover {
    background: var(--accent, #49baf2);
    color: white;
  }

  .icon {
    width: 16px;
    text-align: center;
  }

  .label {
    flex: 1;
  }

  .shortcut {
    font-size: 11px;
    opacity: 0.6;
  }
</style>
