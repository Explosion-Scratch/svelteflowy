<script>
  import { backOut } from "svelte/easing";
  import { fade } from "svelte/transition";
  import { clickOutside } from "./clickoutside.js";
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
  export let items = [];
  let selectEls = [];
  let selectValues = [];
  export let position = {
    type: "relative",
    x: 0,
    y: 0,
  };

  function fadescale(node, { duration }) {
    return {
      duration,
      css: (t) => {
        const eased = backOut(t);
        let amt = 3;
        return `
					transform: scale(${eased / amt + (1 / amt) * (amt - 1)});
					opacity: ${eased}`;
      },
    };
  }
</script>

<div
  use:clickOutside
  on:click_outside={() => dispatch("blur")}
  style:position={position.type}
  style:top={position.y + "px"}
  style:left={position.x + "px"}
  class="menu"
  out:fade={{ duration: 100 }}
  in:fadescale={{ duration: 500 }}
>
  {#each items as item, idx}
    <div
      class="item {item.type}"
      on:click={(e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (item.type === "select") {
          return;
        }
        dispatch("click", item);
      }}
    >
      {#if item.type === "select"}
        {#if selectValues[idx]}
          {@const icon = items[idx].options.find(
            (i) => i.id === selectValues[idx]
          ).icon}
          {#if icon}<div class="icon">{@html icon}</div>{/if}
        {/if}
        <select
          bind:this={selectEls[idx]}
          bind:value={selectValues[idx]}
          on:change={() =>
            dispatch("click", {
              type: "selectchange",
              value: selectValues[idx],
              element: selectEls[idx],
              ...item,
            })}
        >
          {#each item.options as opt}
            <option value={opt.id}>
              {opt.label}
            </option>
          {/each}
        </select>
      {:else if item.type === "shortcut"}
        {#if item.icon}<div class="icon">{@html item.icon}</div>{/if}
        <span class="label">{item.label}</span>
        <span class="shortcut">{item.shortcut}</span>
      {/if}
    </div>
  {/each}
</div>

<style>
  .menu {
    z-index: 2;
    font-size: 13px;
    padding: 0.3em 0;
    box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 10px 0px;
    border: 2px solid #eee;
    color: #777;
    border-radius: 0.4em;
    display: flex;
    height: fit-content;
    flex-direction: column;
    max-width: 500px;
    min-width: 240px;
    background: white;
  }
  .item {
    padding: 0.1rem 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  select {
    margin: 0;
    flex: 1;
    color: inherit;
    border: none;
    background: transparent;
    height: 100%;
    padding: 0;
  }
  .divider {
    display: block;
    padding: 1px;
    flex: 1;
    background: #eaeaea;
  }
  .icon :global(svg) {
    width: 2ch;
    height: 2h;
  }
  .icon {
    margin-right: 5px;
    display: grid;
    place-items: center;
  }
  .label {
    flex: 1;
    margin-left: 3px;
  }
  .shortcut:not(.item) {
    opacity: 0.5;
  }
  .item {
    user-select: none;
    cursor: pointer;
  }
  .item:hover {
    background: var(--accent);
    color: white;
  }
  .item:hover option {
    color: #777;
  }
  *:focus {
    outline: none;
  }
</style>
