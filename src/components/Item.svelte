<script>
  import { createEventDispatcher, tick } from 'svelte'
  import RichEditor from './RichEditor.svelte'
  import Bullet from './Bullet.svelte'
  import Collapse from './Collapse.svelte'
  import ItemMenu from './ItemMenu.svelte'
  import { itemStore } from '../stores/itemStore.js'
  import { parseStatusPrefix } from '../utils/serializer.js'
  import { focusItem, focusDescription } from '../utils/focus.js'

  export let item
  export let isSelected = false
  export let highlightPhrase = null

  const dispatch = createEventDispatcher()

  let itemElement
  let showMenu = false
  let showDescriptionEditor = false
  let titleEditorRef

  $: hasDescription = !!item.description?.trim()
  $: hasChildren = item.children?.length > 0
  
  $: editorValue = item.hasCheckbox 
    ? (item.completed ? '[x] ' : '[ ] ') + (item.text || '')
    : (item.text || '')

  function handleToggleComplete() {
    const newCompleted = !item.completed
    itemStore.updateItem(item.id, { completed: newCompleted })
    
    if (titleEditorRef?.hasCheckboxNode?.()) {
      titleEditorRef.setCheckboxState(newCompleted)
    }
  }

  function handleCheckboxToggle(event) {
    const checked = event.detail.checked
    itemStore.updateItem(item.id, { completed: checked, hasCheckbox: true })
  }

  function handleCheckboxRemoved() {
    itemStore.updateItem(item.id, { hasCheckbox: false })
  }

  function handleCheckboxAdded(event) {
    const checked = event.detail.checked
    itemStore.updateItem(item.id, { hasCheckbox: true, completed: checked })
  }

  function handleDelete() {
    dispatch('delete', { id: item.id })
  }

  function handleForceDelete() {
    dispatch('forcedelete', { id: item.id })
  }

  function handleNewBullet() {
    dispatch('newbullet', { id: item.id })
  }

  function handleIndent() {
    itemStore.indentItem(item.id)
    tick().then(() => focusItem(item.id))
  }

  function handleOutdent() {
    itemStore.outdentItem(item.id)
    tick().then(() => focusItem(item.id))
  }

  function handleSelectUp() {
    dispatch('selectup', { id: item.id })
  }

  function handleSelectDown() {
    dispatch('selectdown', { id: item.id })
  }

  function handleShiftSelectUp() {
    dispatch('shiftselectup', { id: item.id })
  }

  function handleShiftSelectDown() {
    dispatch('shiftselectdown', { id: item.id })
  }

  function handleShowDescription() {
    showDescriptionEditor = true
    tick().then(() => {
      focusDescription(item.id)
    })
  }

  function handleExitDescription() {
    if (!item.description?.trim()) {
      showDescriptionEditor = false
    }
    focusItem(item.id)
  }

  function handleZoom() {
    dispatch('zoom', { item })
  }

  function handleToggleOpen() {
    itemStore.toggleOpen(item.id)
  }

  function handleHashtagClick(event) {
    itemStore.setSearch(event.detail.hashtag)
  }

  function handleItemRefClick(event) {
    itemStore.navigateToItem(event.detail.id)
  }

  function handleDateClick(event) {
    itemStore.setSearch(event.detail.searchStr)
  }

  function handleTextChange(event) {
    const rawText = event.detail.value
    const statusInfo = parseStatusPrefix(rawText)
    
    if (statusInfo.matched && statusInfo.hasCheckbox) {
      console.log('[Item] Checkbox detected via text match in item:', item.id)
      const { text, hasCheckbox, completed } = statusInfo
      itemStore.updateItem(item.id, { text, hasCheckbox, completed })
    } else {
      // console.log('[Item] No checkbox match in text:', rawText)
      itemStore.updateItem(item.id, { text: rawText })
    }
  }

  function handleDescriptionChange(event) {
    itemStore.updateItem(item.id, { description: event.detail.value })
  }

  let menuPosition = { x: 0, y: 0 }
  let menuTriggerRef

  function calculateMenuPosition() {
    if (!itemElement) return { x: 0, y: 0 }
    
    const bulletEl = itemElement.querySelector(':scope > .top > .content-area > .bullet-line > .zoom')
    const bulletLine = itemElement.querySelector(':scope > .top > .content-area > .bullet-line')
    const descEditor = itemElement.querySelector(':scope > .top > .content-area > .description-editor')
    
    let x = 0
    let y = 0
    
    if (bulletEl) {
      const bulletRect = bulletEl.getBoundingClientRect()
      x = bulletRect.left
    } else {
      x = itemElement.getBoundingClientRect().left
    }
    
    if (descEditor) {
      const descRect = descEditor.getBoundingClientRect()
      y = descRect.bottom + 4
    } else if (bulletLine) {
      const lineRect = bulletLine.getBoundingClientRect()
      y = lineRect.bottom + 4
    } else {
      y = itemElement.getBoundingClientRect().bottom + 4
    }
    
    return { x, y }
  }

  function handleMenuClick(e) {
    e.stopPropagation()
    if (showMenu) {
      showMenu = false
    } else {
      menuPosition = calculateMenuPosition()
      showMenu = true
    }
  }

  function handleContextMenu(e) {
    if (e.target.closest('.description-editor') || e.target.closest('.zoomed_description')) {
      return
    }
    e.preventDefault()
    e.stopPropagation()
    menuPosition = calculateMenuPosition()
    showMenu = true
  }

  function handleMenuAction(event) {
    const action = event.detail.action
    showMenu = false
    
    if (action === 'complete') {
      handleToggleComplete()
    } else if (action === 'delete') {
      handleDelete()
    } else if (action === 'indent') {
      handleIndent()
    } else if (action === 'outdent') {
      handleOutdent()
    }
  }

  export function focus() {
    focusItem(item.id)
  }
</script>

<li
  bind:this={itemElement}
  id="item_{item.id}"
  class="item"
  class:completed={item.completed}
  class:selected={isSelected}
  on:contextmenu={handleContextMenu}
>
  <div class="top">
    <div class="left-controls">
      <button class="menu-trigger" on:click={handleMenuClick} title="Options">
        <svg width="16" height="16" viewBox="0 0 256 256">
          <path
            fill="currentColor"
            d="M112 60a16 16 0 1 1 16 16a16 16 0 0 1-16-16Zm16 52a16 16 0 1 0 16 16a16 16 0 0 0-16-16Zm0 68a16 16 0 1 0 16 16a16 16 0 0 0-16-16Z"
          />
        </svg>
      </button>
      {#if showMenu}
        <ItemMenu
          position={menuPosition}
          on:action={handleMenuAction}
          on:close={() => showMenu = false}
        />
      {/if}
      {#if hasChildren}
        <Collapse
          collapsed={!item.open}
          on:change={handleToggleOpen}
        />
      {/if}
    </div>

    <div class="content-area">
      <div class="bullet-line">
        <Bullet
          background={hasChildren && !item.open}
          on:click={handleZoom}
        />
        <div class="title-editor">
          <RichEditor
            bind:this={titleEditorRef}
            value={editorValue}
            showPlaceholder={false}
            {highlightPhrase}
            itemId={item.id}
            on:change={handleTextChange}
            on:delete={handleDelete}
            on:forcedelete={handleForceDelete}
            on:newbullet={handleNewBullet}
            on:indent={handleIndent}
            on:outdent={handleOutdent}
            on:selectup={handleSelectUp}
            on:selectdown={handleSelectDown}
            on:shiftselectup={handleShiftSelectUp}
            on:shiftselectdown={handleShiftSelectDown}
            on:togglecomplete={handleToggleComplete}
            on:checkboxtoggle={handleCheckboxToggle}
            on:checkboxremoved={handleCheckboxRemoved}
            on:checkboxadded={handleCheckboxAdded}
            on:description={handleShowDescription}
            on:hashtagclick={handleHashtagClick}
            on:itemrefclick={handleItemRefClick}
            on:dateclick={handleDateClick}
          />
        </div>
      </div>

      {#if hasDescription || showDescriptionEditor}
        <div class="description-editor">
          <RichEditor
            bind:value={item.description}
            isDescription={true}
            showPlaceholder={false}
            {highlightPhrase}
            editorClass="editable description"
            on:change={handleDescriptionChange}
            on:delete={handleExitDescription}
            on:exitdescription={handleExitDescription}
            on:selectup={handleExitDescription}
            on:selectdown={handleSelectDown}
            on:togglecomplete={handleToggleComplete}
            on:hashtagclick={handleHashtagClick}
            on:itemrefclick={handleItemRefClick}
            on:dateclick={handleDateClick}
          />
        </div>
      {/if}
    </div>
  </div>
</li>

<style>
  .item {
    padding: 0.15rem 0;
    list-style: none;
    display: flex;
    position: relative;
    flex-direction: column;
  }

  .completed :global(.title-editor .editable) {
    text-decoration: line-through;
    opacity: 0.6;
    transition: text-decoration-color 0.3s ease, opacity 0.3s ease;
    text-decoration-color: currentColor;
  }

  :global(.title-editor .editable) {
    text-decoration: none;
    text-decoration-color: transparent;
    transition: text-decoration-color 0.3s ease, opacity 0.3s ease;
  }

  .selected {
    background: var(--accent-bg);
    border-radius: 4px;
    transition: background var(--transition-fast);
  }

  .top {
    display: flex;
    align-items: flex-start;
    width: 100%;
  }

  .left-controls {
    position: absolute;
    left: -2.2rem;
    top: 0.15rem;
    display: flex;
    align-items: center;
    opacity: 0;
    transition: opacity 0.1s ease;
    z-index: 10;
  }

  .item:hover .left-controls {
    opacity: 1;
  }

  .menu-trigger {
    all: unset;
    cursor: pointer;
    padding: 2px;
    border-radius: 4px;
    color: #ccc;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.1s ease;
  }

  .menu-trigger:hover {
    background: #f0f0f0;
    color: #666;
  }

  .content-area {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .bullet-line {
    display: flex;
    align-items: center;
  }

  .title-editor {
    flex: 1;
    min-width: 0;
  }

  .description-editor {
    margin-left: calc(1em + 0.3rem);
  }
</style>
