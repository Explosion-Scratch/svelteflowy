<script>
  import { createEventDispatcher, tick } from 'svelte'
  import Item from './Item.svelte'
  import RichEditor from './RichEditor.svelte'
  import { itemStore } from '../stores/itemStore.js'
  import { generateId } from '../utils/id.js'
  import { focusItem, focusDescription, getItemAbove, getItemBelow, flattenVisible } from '../utils/focus.js'
  import { get } from 'svelte/store'

  function handleHashtagClick(event) {
    itemStore.setSearch(event.detail.hashtag)
  }

  function handleItemRefClick(event) {
    itemStore.navigateToItem(event.detail.id)
  }

  export let item
  export let isTop = false
  export let outermost = false
  export let highlightPhrase = null

  const dispatch = createEventDispatcher()

  const { zoomedItemId, selection, selectionAnchor, selectionDirection } = itemStore

  let containerElement
  let showDescriptionEditor = false
  let zoomedTitleEditorRef

  $: isZoomedRoot = isTop && !!$zoomedItemId && item.id === $zoomedItemId
  $: hasDescription = !!item.description?.trim()
  $: titleEditorValue = item.hasCheckbox 
    ? (item.completed ? '[x] ' : '[ ] ') + (item.text || '')
    : (item.text || '')

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

  function handleForceDelete(event) {
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

  function focusZoomedTitle() {
    requestAnimationFrame(() => {
      const titleEditor = containerElement?.querySelector('.zoomed_title [contenteditable]')
      if (titleEditor) {
        titleEditor.focus()
        const range = document.createRange()
        const sel = window.getSelection()
        range.selectNodeContents(titleEditor)
        range.collapse(false)
        sel.removeAllRanges()
        sel.addRange(range)
      }
    })
  }

  function handleSelectUp(event) {
    const id = event.detail.id
    const items = get(itemStore.items)
    const prevItem = getItemAbove(items, id)
    
    if (prevItem) {
      itemStore.clearSelection()
      focusItem(prevItem.id)
    } else if (isZoomedRoot) {
      focusZoomedTitle()
    } else {
      dispatch('focusparent')
    }
  }

  function handleSelectDown(event) {
    const id = event.detail.id
    const items = get(itemStore.items)
    const nextItem = getItemBelow(items, id)
    
    if (nextItem) {
      itemStore.clearSelection()
      focusItem(nextItem.id)
    }
  }

  function handleShiftSelectUp(event) {
    itemStore.extendSelection('up')
    
    const active = document.activeElement
    if (active?.closest('[contenteditable]')) {
      active.blur()
    }
  }

  function handleShiftSelectDown(event) {
    itemStore.extendSelection('down')
    
    const active = document.activeElement
    if (active?.closest('[contenteditable]')) {
      active.blur()
    }
  }

  function handleZoom(event) {
    itemStore.zoom(event.detail.item.id)
  }

  function handleDescriptionClick() {
    showDescriptionEditor = true
    tick().then(() => {
      requestAnimationFrame(() => {
        if (containerElement) {
          const el = containerElement.querySelector('.zoomed_description [contenteditable]')
          if (el) {
            el.focus()
            return
          }
        }
        focusDescription(item.id)
      })
    })
  }

  function handleDescriptionChange(event) {
    itemStore.updateItem(item.id, { description: event.detail.value })
  }

  function handleExitDescription() {
    if (!item.description?.trim()) {
      showDescriptionEditor = false
    }
    if (item.children?.length) {
      focusItem(item.children[0].id)
    } else {
      const newId = generateId()
      itemStore.updateItem(item.id, {
        children: [
          { id: newId, text: '', description: '', completed: false, open: true, children: [] }
        ]
      })
      tick().then(() => focusItem(newId))
    }
  }

  function handleDescriptionBlur() {
    if (!item.description?.trim()) {
      showDescriptionEditor = false
    }
  }

  function handleTitleDescription() {
    showDescriptionEditor = true
    tick().then(() => {
      requestAnimationFrame(() => {
        if (containerElement) {
          const el = containerElement.querySelector('.zoomed_description [contenteditable]')
          if (el) {
            el.focus()
            return
          }
        }
        focusDescription(item.id)
      })
    })
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

  function handleTitleTextChange(event) {
    const rawText = event.detail.value
    const match = rawText.match(/^\[(x| )\]\s?/)
    
    if (match) {
      console.log('[List] Checkbox detected via title match:', match[0], 'in item:', item.id)
      const hasCheckbox = true
      const completed = match[1] === 'x'
      const text = rawText.slice(match[0].length)
      itemStore.updateItem(item.id, { text, hasCheckbox, completed })
    } else {
      itemStore.updateItem(item.id, { text: rawText })
    }
  }

  function handleTitleToggleComplete() {
    const newCompleted = !item.completed
    itemStore.updateItem(item.id, { completed: newCompleted })
    
    if (zoomedTitleEditorRef?.hasCheckboxNode?.()) {
      zoomedTitleEditorRef.setCheckboxState(newCompleted)
    }
  }

  function handleTitleCheckboxToggle(event) {
    const checked = event.detail.checked
    itemStore.updateItem(item.id, { completed: checked, hasCheckbox: true })
  }

  function handleTitleCheckboxRemoved() {
    itemStore.updateItem(item.id, { hasCheckbox: false })
  }

  function handleTitleCheckboxAdded(event) {
    const checked = event.detail.checked
    itemStore.updateItem(item.id, { hasCheckbox: true, completed: checked })
  }

  function handleCollapseClick(childId) {
    itemStore.toggleOpen(childId)
  }

  function handleEmptyAreaClick(event) {
    if (event.target.closest('.item') || event.target.closest('button') || event.target.closest('[contenteditable]')) {
      return
    }
    
    if (item.children?.length) {
      const lastChild = item.children[item.children.length - 1]
      focusItem(lastChild.id)
    } else {
      const newId = generateId()
      const newItem = { id: newId, text: '', description: '', completed: false, open: true, children: [] }
      
      itemStore.updateItem(item.id, {
        children: [newItem]
      })
      
      tick().then(() => focusItem(newId))
    }
  }

  function handleAddItemClick() {
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

  function isItemSelected(childId) {
    return $selection.has(childId)
  }
</script>

<div 
  class="list-container" 
  bind:this={containerElement} 
  class:parentcompleted={item.completed}
  class:outermost
>
  {#if isZoomedRoot}
    {#key item.id}
      <h1 class="zoomed_title" class:completed={item.completed} id="item_{item.id}">
        <RichEditor
          bind:this={zoomedTitleEditorRef}
          value={titleEditorValue}
          {highlightPhrase}
          showPlaceholder={false}
          itemId={item.id}
          on:selectdown={handleTitleSelectDown}
          on:newbullet={handleTitleNewBullet}
          on:description={handleTitleDescription}
          on:change={handleTitleTextChange}
          on:hashtagclick={handleHashtagClick}
          on:itemrefclick={handleItemRefClick}
          on:togglecomplete={handleTitleToggleComplete}
          on:checkboxtoggle={handleTitleCheckboxToggle}
          on:checkboxremoved={handleTitleCheckboxRemoved}
          on:checkboxadded={handleTitleCheckboxAdded}
        />
      </h1>

      {#if hasDescription || showDescriptionEditor}
        <div class="zoomed_description">
          <RichEditor
            bind:value={item.description}
            isDescription={true}
            isZoomedRoot={true}
            showPlaceholder={false}
            {highlightPhrase}
            editorClass="editable description"
            on:change={handleDescriptionChange}
            on:delete={handleExitDescription}
            on:exitdescription={handleExitDescription}
            on:blur={handleDescriptionBlur}
          />
        </div>
      {:else}
        <button class="add-description-btn" on:click={handleDescriptionClick}>
          Click to add description...
        </button>
      {/if}
    {/key}
  {:else if isTop && item.text?.length && !outermost}
    {#key item.id}
      <h2 class="item_title" class:completed={item.completed} id="item_{item.id}">
        <RichEditor
          value={titleEditorValue}
          {highlightPhrase}
          showPlaceholder={false}
          itemId={item.id}
          on:selectdown={handleTitleSelectDown}
          on:newbullet={handleTitleNewBullet}
          on:change={handleTitleTextChange}
          on:hashtagclick={handleHashtagClick}
          on:itemrefclick={handleItemRefClick}
          on:togglecomplete={handleTitleToggleComplete}
          on:checkboxtoggle={handleTitleCheckboxToggle}
          on:checkboxremoved={handleTitleCheckboxRemoved}
          on:checkboxadded={handleTitleCheckboxAdded}
        />
      </h2>
    {/key}
  {/if}

  {#if item.children?.length && (item.open || isTop)}
    <ul class:children={!isTop} on:click={handleEmptyAreaClick}>
      {#each item.children as child (child.id)}
        <div class="item-row">
          <Item
            item={child}
            isSelected={$selection.has(child.id)}
            {highlightPhrase}
            on:delete={handleDelete}
            on:forcedelete={handleForceDelete}
            on:newbullet={handleNewBullet}
            on:selectup={handleSelectUp}
            on:selectdown={handleSelectDown}
            on:shiftselectup={handleShiftSelectUp}
            on:shiftselectdown={handleShiftSelectDown}
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
        <li class="empty-slot" on:click|stopPropagation={handleAddItemClick}>
          <span class="empty-hint">Add item...</span>
        </li>
      {/if}
    </ul>
  {:else if isTop}
    <div class="empty-slot add-first-item" on:click={handleAddItemClick}>
      <span class="empty-hint">Add item...</span>
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

  .zoomed_title {
    margin: 1rem 0 0.25rem 0;
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1.3;
  }

  .zoomed_title.completed :global(.editable),
  .item_title.completed :global(.editable) {
    text-decoration: line-through;
    opacity: 0.6;
  }

  .zoomed_description {
    width: 100%;
    margin-bottom: 1rem;
    font-size: 0.9rem;
    color: #555;
  }

  .add-description-btn {
    all: unset;
    cursor: text;
    color: #999;
    font-size: 0.9rem;
    margin-bottom: 1rem;
    display: block;
    width: 100%;
    transition: color 0.15s ease;
  }

  .add-description-btn:hover {
    color: #666;
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
    margin-left: 0.5rem;
  }

  .indent-line {
    all: unset;
    position: relative;
    width: 1px;
    background: #e0e0e0;
    margin-left: 0;
    margin-right: 0.75rem;
    cursor: pointer;
    transition: background 0.15s ease;
    flex-shrink: 0;
  }

  .indent-line::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: -12px;
    right: -12px;
  }

  .indent-line:hover {
    background: var(--accent, #49baf2);
    width: 2px;
    margin-right: calc(0.75rem - 1px);
  }

  .nested-content {
    flex: 1;
    min-width: 0;
  }

  .empty-slot {
    padding: 0.5rem 0;
    padding-left: 0.5rem;
    opacity: 0;
    transition: opacity 0.15s ease;
    cursor: text;
    font-size: 0.9rem;
    color: #999;
    min-height: 1.5rem;
    display: flex;
    align-items: center;
  }

  ul:hover .empty-slot {
    opacity: 1;
  }

  .add-first-item {
    padding-left: 0;
    opacity: 1;
  }

  .empty-hint {
    font-size: 0.85rem;
  }

  * {
    font-family: 'Helvetica Neue', Arial, sans-serif;
  }
</style>
