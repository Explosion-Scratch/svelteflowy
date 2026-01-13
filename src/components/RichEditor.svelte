<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte'
  import { Editor } from '@tiptap/core'
  import StarterKit from '@tiptap/starter-kit'
  import BubbleMenu from '@tiptap/extension-bubble-menu'
  import Placeholder from '@tiptap/extension-placeholder'
  import Link from '@tiptap/extension-link'
  import { Markdown } from 'tiptap-markdown'
  import { HashtagExtension } from '../extensions/HashtagExtension.js'
  import { HighlightSearchExtension } from '../extensions/HighlightSearchExtension.js'
  import { KeyboardExtension } from '../extensions/KeyboardExtension.js'
  import { CheckboxExtension } from '../extensions/CheckboxExtension.js'

  export let value = ''
  export let placeholder = ''
  export let isDescription = false
  export let highlightPhrase = null
  export let editorClass = 'editable'
  export let showPlaceholder = true

  const dispatch = createEventDispatcher()

  let editorElement
  let bubbleMenuElement
  let editor

  function handleHashtagClick(hashtag) {
    dispatch('hashtagclick', { hashtag })
  }

  onMount(() => {
    const extensions = [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        hardBreak: false
      }),
      Link.configure({
        openOnClick: true,
        autolink: true
      }),
      Markdown.configure({
        html: true,
        transformPastedText: true,
        transformCopiedText: true
      }),
      HashtagExtension.configure({
        onHashtagClick: handleHashtagClick
      }),
      HighlightSearchExtension.configure({
        phrase: highlightPhrase
      }),
      KeyboardExtension.configure({
        isDescription,
        onEnter: () => {
          if (isDescription) {
            dispatch('exitdescription')
          } else {
            dispatch('newbullet')
          }
        },
        onShiftEnter: () => {
          if (!isDescription) {
            dispatch('description')
          }
        },
        onCommandEnter: () => {
          dispatch('togglecomplete')
        },
        onDelete: () => {
          dispatch('delete')
        },
        onForceDelete: () => {
          dispatch('forcedelete')
        },
        onTab: () => {
          if (isDescription) {
            editor?.commands.insertContent('\t')
          } else {
            dispatch('indent')
          }
        },
        onShiftTab: () => {
          if (!isDescription) {
            dispatch('outdent')
          }
        },
        onArrowUp: () => {
          dispatch('selectup')
        },
        onArrowDown: () => {
          dispatch('selectdown')
        },
        onShiftArrowUp: () => {
          dispatch('shiftselectup')
        },
        onShiftArrowDown: () => {
          dispatch('shiftselectdown')
        }
      }),
      CheckboxExtension,
      BubbleMenu.configure({
        element: bubbleMenuElement,
        tippyOptions: {
          duration: 100
        }
      })
    ]

    if (showPlaceholder && placeholder) {
      extensions.push(
        Placeholder.configure({
          placeholder
        })
      )
    }

    editor = new Editor({
      element: editorElement,
      extensions,
      content: value,
      editorProps: {
        attributes: {
          class: editorClass
        }
      },
      onUpdate: ({ editor: ed }) => {
        const markdown = ed.storage.markdown?.getMarkdown() || ed.getText()
        value = markdown
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

  export function focus() {
    editor?.commands.focus('end')
  }

  export function focusStart() {
    editor?.commands.focus('start')
  }

  export function isEmpty() {
    return editor?.isEmpty ?? true
  }
</script>

<div class="rich-editor-wrapper" class:description={isDescription}>
  <div
    bind:this={editorElement}
    class="editor-container"
  ></div>

  <div bind:this={bubbleMenuElement} class="bubble-menu">
    <button
      type="button"
      class:active={editor?.isActive('bold')}
      on:click={toggleBold}
      title="Bold (Ctrl+B)"
    >
      <strong>B</strong>
    </button>
    <button
      type="button"
      class:active={editor?.isActive('italic')}
      on:click={toggleItalic}
      title="Italic (Ctrl+I)"
    >
      <em>I</em>
    </button>
    <button
      type="button"
      class:active={editor?.isActive('code')}
      on:click={toggleCode}
      title="Code"
    >
      <code>&lt;/&gt;</code>
    </button>
    <button
      type="button"
      class:active={editor?.isActive('strike')}
      on:click={toggleStrike}
      title="Strikethrough"
    >
      <s>S</s>
    </button>
  </div>
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
  }

  .description :global(.editable:not(:focus)) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-height: 1.5em;
  }

  .bubble-menu {
    display: flex;
    gap: 2px;
    padding: 4px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    visibility: hidden;
  }

  .bubble-menu button {
    all: unset;
    padding: 4px 8px;
    cursor: pointer;
    border-radius: 4px;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 28px;
  }

  .bubble-menu button:hover {
    background: #f0f0f0;
  }

  .bubble-menu button.active {
    background: var(--accent, #49baf2);
    color: white;
  }

  .bubble-menu code {
    font-family: monospace;
    font-size: 12px;
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
