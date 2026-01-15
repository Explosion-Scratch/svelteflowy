<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte'
  import { Editor } from '@tiptap/core'

  import { getExtensions } from './RichEditorExtensions.js'
  import AutocompleteMenu from './AutocompleteMenu.svelte'
  import LinkModal from './LinkModal.svelte'
  import { allHashtags } from '../stores/hashtagStore.js'
  import { allItems } from '../stores/allItemsStore.js'
  import { parseDate, formatRelativeTime, formatAbsoluteDate, formatDateForSearch } from '../utils/dateParser.js'
  import TextB from 'phosphor-svelte/lib/TextB'
  import TextItalic from 'phosphor-svelte/lib/TextItalic'
  import TextStrikethrough from 'phosphor-svelte/lib/TextStrikethrough'
  import Code from 'phosphor-svelte/lib/Code'
  import LinkIcon from 'phosphor-svelte/lib/Link'

  export let value = ''
  export let placeholder = ''
  export let isDescription = false
  export let isZoomedRoot = false
  export let highlightPhrase = null
  export let editorClass = 'editable'
  export let showPlaceholder = true
  export let itemId = null

  const dispatch = createEventDispatcher()

  let editorElement
  let bubbleMenuElement
  let editor

  let showLinkModal = false
  let selectedTextForLink = ''

  let autocompleteVisible = false
  let autocompleteCoords = { top: 0, left: 0, bottom: 0 }
  let autocompleteQuery = ''
  let autocompleteFrom = 0
  let autocompleteTo = 0
  let currentTrigger = null
  let parsedDate = null

  function handleHashtagClick(hashtag) {
    dispatch('hashtagclick', { hashtag })
  }

  function handleAutocomplete(data) {
    autocompleteVisible = true
    autocompleteCoords = data.coords
    autocompleteQuery = data.query
    autocompleteFrom = data.from
    autocompleteTo = data.to
    currentTrigger = data.trigger
    
    if (data.trigger === '@' && data.query.trim()) {
      parsedDate = parseDate(data.query)
    } else {
      parsedDate = null
    }
  }

  function handleAutocompleteHide() {
    autocompleteVisible = false
    autocompleteQuery = ''
    currentTrigger = null
    parsedDate = null
  }

  function handleAutocompleteSelect(event) {
    const { item } = event.detail
    if (editor && autocompleteVisible) {
      let insertText
      if (item && item._isDate && item.date) {
        insertText = `@date[${item.date.toISOString()}] `
      } else if (currentTrigger === '@' && typeof item === 'object' && item.id) {
        insertText = `@[${item.id}] `
      } else if (typeof item === 'object' && item.text) {
        insertText = item.text + ' '
      } else {
        insertText = item + ' '
      }
      editor.chain()
        .focus()
        .deleteRange({ from: autocompleteFrom, to: autocompleteTo })
        .insertContent(insertText)
        .run()
    }
    autocompleteVisible = false
    autocompleteQuery = ''
    currentTrigger = null
    parsedDate = null
  }

  function handleItemRefClick(id) {
    dispatch('itemrefclick', { id })
  }

  function handleDateClick(date) {
    const searchStr = `day:${formatDateForSearch(date)}`
    dispatch('dateclick', { date, searchStr })
  }

  function getItemText(id) {
    const items = $allItems
    const found = items.find(i => i.id === id)
    if (!found) return `@${id}`
    const text = found.text || ''
    return text.length > 30 ? text.slice(0, 30) + '…' : text
  }

  onMount(() => {
    const extensions = getExtensions({
      isDescription,
      highlightPhrase,
      dispatch,
      handleHashtagClick,
      handleAutocomplete,
      handleAutocompleteHide,
      handleItemRefClick,
      handleDateClick,
      getItemText,
      formatRelativeTime,
      formatAbsoluteDate,
      bubbleMenuElement,
      showPlaceholder,
      placeholder,
      getEditor: () => editor
    })

    editor = new Editor({
      element: editorElement,
      extensions,
      content: value || '',
      editorProps: {
        attributes: {
          class: editorClass
        }
      },
      onCreate: () => {
      },
      onUpdate: ({ editor: ed }) => {
        const markdown = ed.storage.markdown?.getMarkdown() || ed.getText()
        dispatch('change', { value: markdown })
      },
      onFocus: () => {
        dispatch('focus')
      },
      onBlur: () => {
        dispatch('blur')
      }
    })

    editorElement.addEventListener('api-focus', () => {
      editor?.commands.focus('end')
    })

    editorElement.addEventListener('api-focus-start', () => {
      editor?.commands.focus('start')
    })
  })

  onDestroy(() => {
    editor?.destroy()
  })

  $: if (editor && highlightPhrase !== undefined) {
    const ext = editor.extensionManager.extensions.find(e => e.name === 'highlightSearch')
    if (ext) {
      ext.options.phrase = highlightPhrase
      ext.storage.phrase = highlightPhrase
      const { view } = editor
      const tr = view.state.tr.setMeta('highlightSearchUpdate', true)
      view.dispatch(tr)
    }
  }

  $: if (editor && value !== undefined) {
    const currentContent = editor.storage.markdown?.getMarkdown() || editor.getText()
    if (currentContent !== value && !editor.isFocused) {
      editor.commands.setContent(value || '')
    }
  }

  function toggleBold() {
    editor?.chain().focus().toggleBold().run()
  }

  function toggleItalic() {
    editor?.chain().focus().toggleItalic().run()
  }

  function toggleCode() {
    editor?.chain().focus().toggleCode().run()
  }

  function toggleStrike() {
    editor?.chain().focus().toggleStrike().run()
  }

  function openLinkModal() {
    const { from, to } = editor.state.selection
    selectedTextForLink = editor.state.doc.textBetween(from, to, ' ')
    editor?.commands.blur()
    showLinkModal = true
  }

  function handleLinkSubmit(event) {
    const { markdown } = event.detail
    editor?.chain().focus().deleteSelection().insertContent(markdown).run()
    showLinkModal = false
  }

  export function focus() {
    editor?.commands.focus('end')
  }

  export function focusStart() {
    editor?.commands.focus('start')
  }

  export function isEmpty() {
    return editor?.isEmpty ?? true
  }

  export function hasCheckboxNode() {
    if (!editor) return false
    let found = false
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'checkbox') {
        found = true
        return false
      }
    })
    return found
  }

  export function setCheckboxState(checked) {
    if (!editor) return
    let pos = null
    editor.state.doc.descendants((node, p) => {
      if (node.type.name === 'checkbox' && pos === null) {
        pos = p
        return false
      }
    })
    if (pos !== null) {
      editor.chain()
        .command(({ tr }) => {
          tr.setNodeMarkup(pos, undefined, { checked })
          return true
        })
        .run()
    }
  }
</script>

<div class="rich-editor-wrapper" class:description={isDescription} class:zoomed-root={isZoomedRoot}>
  <div
    bind:this={editorElement}
    class="editor-container"
  ></div>

  <div bind:this={bubbleMenuElement} class="bubble-menu">
    <button
      type="button"
      class:active={editor?.isActive('bold')}
      on:click={toggleBold}
      title="Bold"
    >
      <TextB weight="duotone" />
    </button>
    <button
      type="button"
      class:active={editor?.isActive('italic')}
      on:click={toggleItalic}
      title="Italic"
    >
      <TextItalic weight="duotone" />
    </button>
    <button
      type="button"
      class:active={editor?.isActive('strike')}
      on:click={toggleStrike}
      title="Strikethrough"
    >
      <TextStrikethrough weight="duotone" />
    </button>
    <button
      type="button"
      class:active={editor?.isActive('code')}
      on:click={toggleCode}
      title="Code"
    >
      <Code weight="duotone" />
    </button>
    <div class="divider"></div>
    <button
      type="button"
      class:active={editor?.isActive('link')}
      on:click={openLinkModal}
      title="Add Link"
    >
      <LinkIcon weight="duotone" />
    </button>
  </div>

  <AutocompleteMenu
    visible={autocompleteVisible}
    items={currentTrigger === '@' ? $allItems.filter(i => i.id !== itemId) : $allHashtags}
    query={autocompleteQuery}
    coords={autocompleteCoords}
    dateItem={parsedDate}
    on:select={handleAutocompleteSelect}
    on:close={handleAutocompleteHide}
  />

  <LinkModal
    visible={showLinkModal}
    selectedText={selectedTextForLink}
    on:submit={handleLinkSubmit}
    on:close={() => showLinkModal = false}
  />
</div>

<style>
  .rich-editor-wrapper {
    flex: 1;
    min-width: 0;
  }

  .editor-container {
    width: 100%;
  }

  .editor-container :global(.editable) {
    outline: none;
    min-height: 1.5em;
    word-break: break-word;
  }

  .editor-container :global(.editable p) {
    margin: 0;
  }

  .description :global(.editable) {
    font-size: 0.85em;
    opacity: 0.7;
    line-height: 1.25;
  }

  .description :global(.editable:not(:focus)) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-height: 1.1em;
    line-height: 1.1;
    display: block;
  }

  .description :global(.editable:not(:focus) p) {
    display: inline;
  }

  .zoomed-root :global(.editable) {
    white-space: normal !important;
    overflow: visible !important;
    text-overflow: clip !important;
    max-height: none !important;
    line-height: 1.4 !important;
  }

  .zoomed-root :global(.editable p) {
    display: block !important;
    margin-bottom: 0.5em !important;
  }

  .bubble-menu {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px 6px;
    background: white;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    visibility: hidden;
  }

  .bubble-menu button {
    all: unset;
    padding: 6px;
    cursor: pointer;
    border-radius: 6px;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    transition: all 0.15s ease;
  }

  .bubble-menu button:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #333;
  }

  .bubble-menu button.active {
    background: var(--accent, #49baf2);
    color: white;
  }

  .bubble-menu .divider {
    width: 1px;
    height: 16px;
    background: rgba(0, 0, 0, 0.1);
    margin: 0 4px;
  }

  :global(.hashtag) {
    color: var(--accent, #49baf2);
    background: rgba(73, 186, 242, 0.1);
    padding: 0 4px;
    border-radius: 4px;
    cursor: pointer;
  }

  :global(.hashtag:hover) {
    background: rgba(73, 186, 242, 0.2);
  }

  :global(.editor-link) {
    color: var(--accent, #49baf2);
    text-decoration: underline;
    text-decoration-color: rgba(73, 186, 242, 0.4);
    text-underline-offset: 2px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  :global(.editor-link:hover) {
    text-decoration-color: var(--accent, #49baf2);
    background: rgba(73, 186, 242, 0.1);
    border-radius: 2px;
  }

  :global(.item-ref) {
    cursor: pointer;
    font-size: 0;
  }

  :global(.item-ref::after) {
    content: attr(data-display-text);
    font-size: 1rem;
    color: #666;
    background: rgba(0, 0, 0, 0.06);
    padding: 1px 5px;
    border-radius: 4px;
  }

  :global(.item-ref:hover::after) {
    background: rgba(0, 0, 0, 0.1);
    color: #333;
  }

  :global(.date-ref) {
    cursor: pointer;
    font-size: 0;
  }

  :global(.date-ref::after) {
    content: attr(data-display-text);
    font-size: 1rem;
    color: var(--accent, #49baf2);
    background: rgba(73, 186, 242, 0.1);
    padding: 1px 5px;
    border-radius: 4px;
  }

  :global(.date-ref:hover::after) {
    background: rgba(73, 186, 242, 0.2);
  }

  :global(.search-highlight) {
    background: rgba(255, 235, 59, 0.5);
    border-radius: 2px;
  }

  :global(.hashtag .search-highlight) {
    padding: 0;
    border-radius: 0;
    background: rgba(255, 235, 59, 0.6);
  }

  :global(.ProseMirror-focused) {
    outline: none;
  }

  :global(.ProseMirror p.is-editor-empty:first-child::before) {
    color: #adb5bd;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }

  :global(.inline-checkbox) {
    display: inline-flex;
    align-items: center;
    vertical-align: middle;
    margin-right: 6px;
  }

  :global(.checkbox-button) {
    all: unset;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 2px;
    border-radius: 4px;
    color: #999;
    transition: all 0.15s ease;
  }

  :global(.checkbox-button:hover) {
    color: #666;
    background: rgba(0, 0, 0, 0.05);
  }

  :global(.checkbox-button.checked) {
    color: var(--accent, #49baf2);
  }

  :global(.checkbox-button.checked:hover) {
    color: var(--accent, #49baf2);
    background: rgba(73, 186, 242, 0.1);
  }

  :global(.checkbox-button svg) {
    width: 16px;
    height: 16px;
    transition: transform 0.15s ease;
  }

  :global(.checkbox-button.checked svg) {
    animation: checkPop 0.2s ease;
  }

  @keyframes checkPop {
    0% { transform: scale(0.8); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }

  :global(.ProseMirror:has(.inline-checkbox .checkbox-button.checked)) {
    text-decoration: line-through;
    opacity: 0.6;
    text-decoration-color: currentColor;
  }
</style>
