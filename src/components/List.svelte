<script>
  import { createEventDispatcher, tick } from 'svelte'
  import Item from './Item.svelte'
  import RichEditor from './RichEditor.svelte'
  import { itemStore } from '../stores/itemStore.js'
  import { generateId } from '../utils/id.js'
  import { focusItem, getItemAbove, getItemBelow } from '../utils/focus.js'
  import { get } from 'svelte/store'

  export let item
  export let isTop = false
  export let outermost = false
  export let highlightPhrase = null

  const dispatch = createEventDispatcher()

  let containerElement

  function handleNewBullet(event) {
    const afterId = event.detail.id
    const newId = itemStore.addItem(item.id, afterId)
    tick().then(() => focusItem(newId))
  }

  function handleDelete(event) {
    const id = event.detail.id
    const items = get(itemStore.items)
    const prevItem = getItemAbove(items, id)
    
    itemStore.deleteItem(id)
    
    if (prevItem) {
      tick().then(() => focusItem(prevItem.id))
    } else {
      dispatch('focusparent')
    }
  }

  function handleSelectUp(event) {
    const id = event.detail.id
    const items = get(itemStore.items)
    const prevItem = getItemAbove(items, id)
    
    if (prevItem) {
      focusItem(prevItem.id)
    } else {
      dispatch('focusparent')
    }
  }

  function handleSelectDown(event) {
    const id = event.detail.id
    const items = get(itemStore.items)
    const nextItem = getItemBelow(items, id)
    
    if (nextItem) {
      focusItem(nextItem.id)
    }
  }

  function handleZoom(event) {
    itemStore.zoom(event.detail.item.id)
  }

  function handleTitleNewBullet() {
    if (!item.children?.length) {
      const newId = generateId()
      itemStore.updateItem(item.id, {
        children: [
          { id: newId, text: '', description: '', completed: false, open: true, children: [] }
        ]
      })
      tick().then(() => focusItem(newId))
    } else {
      const newId = generateId()
      itemStore.updateItem(item.id, {
        children: [
          { id: newId, text: '', description: '', completed: false, open: true, children: [] },
          ...item.children
        ]
      })
      tick().then(() => focusItem(newId))
    }
  }

  function handleTitleSelectDown() {
    if (item.children?.length) {
      focusItem(item.children[0].id)
    }
  }

  function handleCollapseClick(childId) {
    itemStore.toggleOpen(childId)
  }

  function handleEmptyAreaClick(event) {
    if (event.target.closest('.item') || event.target.closest('button') || event.target.closest('[contenteditable]')) {
      return
    }
    
    const newId = generateId()
    const newItem = { id: newId, text: '', description: '', completed: false, open: true, children: [] }
    
    if (item.children?.length) {
      itemStore.updateItem(item.id, {
        children: [...item.children, newItem]
      })
    } else {
      itemStore.updateItem(item.id, {
        children: [newItem]
      })
    }
    
    tick().then(() => focusItem(newId))
  }
</script>

<div 
  class="list-container" 
  bind:this={containerElement} 
  class:parentcompleted={item.completed}
  class:outermost
>
  {#if isTop && item.text?.length && !outermost}
    <h2 class="item_title" id="item_{item.id}">
      <RichEditor
        bind:value={item.text}
        {highlightPhrase}
        showPlaceholder={false}
        on:selectdown={handleTitleSelectDown}
        on:newbullet={handleTitleNewBullet}
        on:change={() => itemStore.updateItem(item.id, { text: item.text })}
      />
    </h2>
  {/if}

  {#if item.children?.length && (item.open || isTop)}
    <ul class:children={!isTop} on:click={handleEmptyAreaClick}>
      {#each item.children as child (child.id)}
        <div class="item-row">
          <Item
            item={child}
            {highlightPhrase}
            on:delete={handleDelete}
            on:newbullet={handleNewBullet}
            on:selectup={handleSelectUp}
            on:selectdown={handleSelectDown}
            on:zoom={handleZoom}
          />

          {#if child.children?.length && child.open}
            <div class="nested-container">
              <button 
                class="indent-line" 
                on:click|stopPropagation={() => handleCollapseClick(child.id)}
                title="Collapse"
              ></button>
              <div class="nested-content">
                <svelte:self
                  item={child}
                  {highlightPhrase}
                  on:focusparent={() => focusItem(child.id)}
                />
              </div>
            </div>
          {/if}
        </div>
      {/each}
      
      {#if outermost}
        <li class="empty-slot" on:click|stopPropagation={handleEmptyAreaClick}>
          <span class="empty-hint">Click to add item...</span>
        </li>
      {/if}
    </ul>
  {:else if isTop}
    <div class="empty-area" on:click={handleEmptyAreaClick}>
      <span class="empty-message">Click here to start...</span>
    </div>
  {/if}
</div>

<style>
  .list-container {
    width: 100%;
  }

  .outermost {
    min-height: 50vh;
  }

  .parentcompleted h2 {
    text-decoration: line-through;
  }

  .parentcompleted:not(.parentcompleted .parentcompleted) :global(.editable) {
    opacity: 0.7;
  }

  .item_title {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    font-weight: 600;
  }

  ul {
    padding: 0;
    margin: 0;
    list-style: none;
  }

  .item-row {
    display: flex;
    flex-direction: column;
  }

  .nested-container {
    display: flex;
    margin-left: 0.8rem;
  }

  .indent-line {
    all: unset;
    width: 1px;
    background: #e0e0e0;
    margin-left: 0.55rem;
    margin-right: 0.5rem;
    cursor: pointer;
    transition: background 0.15s ease, width 0.15s ease;
    flex-shrink: 0;
  }

  .indent-line:hover {
    background: var(--accent, #49baf2);
    width: 2px;
  }

  .nested-content {
    flex: 1;
    min-width: 0;
  }

  .empty-slot {
    padding: 0.3rem 0;
    padding-left: 2.6rem;
    opacity: 0;
    transition: opacity 0.15s ease;
    cursor: text;
    font-size: 0.9rem;
    color: #999;
  }

  ul:hover .empty-slot {
    opacity: 1;
  }

  .empty-area {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100px;
    border: 2px dashed #e0e0e0;
    border-radius: 8px;
    margin-top: 1rem;
    cursor: text;
    transition: border-color 0.15s ease, background 0.15s ease;
  }

  .empty-area:hover {
    border-color: var(--accent, #49baf2);
    background: rgba(73, 186, 242, 0.05);
  }

  .empty-message {
    color: #999;
    font-size: 0.9rem;
  }

  .empty-hint {
    font-size: 0.85rem;
  }

  * {
    font-family: 'Helvetica Neue', Arial, sans-serif;
  }
</style>
