<script>
  import { backOut } from 'svelte/easing'
  import { clickOutside } from '../actions/clickOutside.js'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()
  
  export let items = []
  export let position = {
    type: 'relative',
    x: 0,
    y: 0
  }

  function fadescale(node, { duration }) {
    return {
      duration,
      css: (t) => {
        const eased = backOut(t)
        let amt = 3
        return `
          transform: scale(${eased / amt + (1 / amt) * (amt - 1)});
          opacity: ${eased}`
      }
    }
  }
</script>

<div
  use:clickOutside
  on:click_outside={() => dispatch('blur')}
  style:position={position.type}
  style:top={position.y + 'px'}
  style:left={position.x + 'px'}
  class="menu"
>
  {#each items as item}
    <button
      class="item {item.type}"
      on:click={(e) => {
        e.stopPropagation()
        dispatch('click', item)
      }}
    >
      {#if item.icon}
        <div class="icon">{@html item.icon}</div>
      {/if}
      <span class="label">{item.label}</span>
      {#if item.shortcut}
        <span class="shortcut">{item.shortcut}</span>
      {/if}
    </button>
  {/each}
</div>

<style>
  .menu {
    z-index: 1000;
    font-size: 13px;
    padding: 0.3em 0;
    box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 10px 0px;
    border: 1px solid #eee;
    color: #777;
    border-radius: 0.4em;
    display: flex;
    height: fit-content;
    flex-direction: column;
    max-width: 500px;
    min-width: 200px;
    background: white;
  }

  .item {
    all: unset;
    padding: 0.4rem 1rem;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
  }

  .item:hover {
    background: var(--accent, #49baf2);
    color: white;
  }

  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon :global(svg) {
    width: 16px;
    height: 16px;
  }

  .label {
    flex: 1;
  }

  .shortcut {
    opacity: 0.5;
    font-size: 0.9em;
  }
</style>
