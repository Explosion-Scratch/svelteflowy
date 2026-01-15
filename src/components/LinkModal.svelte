<script>
  import { createEventDispatcher, onMount, tick } from 'svelte'
  import LinkIcon from 'phosphor-svelte/lib/Link'
  import X from 'phosphor-svelte/lib/X'
  import Check from 'phosphor-svelte/lib/Check'

  export let visible = false
  export let selectedText = ''
  export let existingUrl = ''
  export let existingTitle = ''

  const dispatch = createEventDispatcher()

  let linkText = ''
  let linkUrl = ''
  let linkTitle = ''
  let textInput

  $: if (visible) {
    linkText = selectedText || ''
    linkUrl = existingUrl || ''
    linkTitle = existingTitle || ''
    tick().then(() => textInput?.focus())
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!linkUrl.trim()) return

    const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`
    const text = linkText.trim() || url
    const title = linkTitle.trim()
    
    let markdown = `[${text}](${url}${title ? ` "${title}"` : ''})`
    
    dispatch('submit', { markdown, text, url, title })
    close()
  }

  function close() {
    linkText = ''
    linkUrl = ''
    linkTitle = ''
    dispatch('close')
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      close()
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.stopPropagation()
      close()
    }
  }

  function stopInputPropagation(event) {
    const key = event.key
    const isModifier = event.metaKey || event.ctrlKey || event.altKey
    
    if (key === 'Enter') {
      return
    }
    
    if (key === 'Escape') {
      event.stopPropagation()
      close()
      return
    }
    
    if (key === 'Tab' || key === 'Delete' || key === 'Backspace' ||
        key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight' ||
        isModifier) {
      event.stopPropagation()
    }
  }
</script>

<svelte:window on:keydown={handleKeyDown} />

{#if visible}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-backdrop" on:click={handleBackdropClick} on:keydown={handleKeyDown} role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">
    <div class="modal">
      <div class="modal-header">
        <LinkIcon weight="duotone" />
        <span id="modal-title">Add Link</span>
        <button type="button" class="close-btn" on:click={close} aria-label="Close modal">
          <X weight="duotone" />
        </button>
      </div>

      <form on:submit={handleSubmit}>
        <div class="form-group">
          <label for="link-text">Text</label>
          <input
            bind:this={textInput}
            id="link-text"
            type="text"
            bind:value={linkText}
            placeholder="Link text"
            on:keydown={stopInputPropagation}
          />
        </div>

        <div class="form-group">
          <label for="link-url">URL</label>
          <input
            id="link-url"
            type="text"
            bind:value={linkUrl}
            placeholder="https://example.com"
            on:keydown={stopInputPropagation}
            required
          />
        </div>

        <div class="form-group">
          <label for="link-title">Title <span class="optional">(optional)</span></label>
          <input
            id="link-title"
            type="text"
            bind:value={linkTitle}
            placeholder="Link title for accessibility"
            on:keydown={stopInputPropagation}
          />
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" on:click={close}>
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" disabled={!linkUrl.trim()}>
            <Check weight="duotone" />
            Add Link
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
  }

  .modal {
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    width: 100%;
    max-width: 400px;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    font-weight: 600;
    font-size: 15px;
  }

  .modal-header :global(svg) {
    font-size: 18px;
    width: 18px;
    height: 18px;
    color: var(--accent, #49baf2);
  }

  .close-btn {
    all: unset;
    margin-left: auto;
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    transition: all 0.15s ease;
  }

  .close-btn:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #666;
  }

  form {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  label {
    font-size: 13px;
    font-weight: 500;
    color: #666;
  }

  .optional {
    font-weight: 400;
    color: #999;
  }

  input {
    padding: 10px 12px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  input:focus {
    border-color: var(--accent, #49baf2);
    box-shadow: 0 0 0 3px rgba(73, 186, 242, 0.15);
  }

  input::placeholder {
    color: #bbb;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 8px;
  }

  .btn {
    all: unset;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-secondary {
    color: #666;
  }

  .btn-secondary:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  .btn-primary {
    background: var(--accent, #49baf2);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #3aa8e0;
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
