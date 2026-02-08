<script>
  import { createEventDispatcher } from 'svelte'
  import { fileService } from '../services/fileService.js'
  import { itemStore } from '../stores/itemStore.js'
  import { get } from 'svelte/store'

  import iconSvg from '/icon.svg'
  const dispatch = createEventDispatcher()

  async function handleOpen() {
    const result = await fileService.openFile()
    
    if (result.success && result.items) {
      const rootItems = get(itemStore.items)
      itemStore.updateItem(rootItems.id, { children: result.items })
      fileService.hasUnsavedChanges.set(false)
    } else if (result.error) {
      alert(result.error)
    }
  }

  async function handleCreate() {
    const rootItems = get(itemStore.items)
    const itemsArray = rootItems.children || []
    const success = await fileService.saveFileAs(itemsArray)
    if (!success) {
      console.log('File creation cancelled or failed')
    }
  }

  function handleContinue() {
    dispatch('continue')
  }
</script>

<div class="homepage">
  <div class="content">
    <div class="logo-section">
      <img src={iconSvg} alt="SvelteFlowy" class="logo" />
      <h1 class="title">SvelteFlowy</h1>
    </div>

    <div class="button-group">
      <button class="action-btn" on:click={handleOpen}>
        <svg width="18" height="18" viewBox="0 0 256 256" fill="none">
          <path d="M214 88v-8a6 6 0 00-6-6h-88.4l-28.58-22.86A14 14 0 0082.35 48H40a14 14 0 00-14 14v136a14 14 0 0014 14h176.89a13.12 13.12 0 0013.11-13.12V94a6 6 0 00-6-6zm-6-2h-86.94l-8-6H208zM40 60h42.35a2 2 0 011.24.44L116.29 86H38V62a2 2 0 012-2zm178 138H40a2 2 0 01-2-2V98h180v98a1.12 1.12 0 01-1.11 2z" fill="currentColor"/>
        </svg>
        <span>Open File</span>
      </button>

      <button class="action-btn" on:click={handleCreate}>
        <svg width="18" height="18" viewBox="0 0 256 256" fill="none">
          <path d="M216 68h-84.69L104 44.69A13.94 13.94 0 0094.06 42H40a14 14 0 00-14 14v144a14 14 0 0014 14h176a14 14 0 0014-14V82a14 14 0 00-14-14zm2 132a2 2 0 01-2 2H40a2 2 0 01-2-2V56a2 2 0 012-2h54.06a2 2 0 011.41.59L124.69 82H216a2 2 0 012 2zM134 120v22h22a6 6 0 010 12h-22v22a6 6 0 01-12 0v-22H100a6 6 0 010-12h22v-22a6 6 0 0112 0z" fill="currentColor"/>
        </svg>
        <span>Create New</span>
      </button>
    </div>

    <button class="continue-link" on:click={handleContinue}>
      <span>Continue without file</span>
      <svg width="14" height="14" viewBox="0 0 256 256">
        <path d="M208.49 152.49l-72 72a12 12 0 01-17-17L171 156H40a12 12 0 010-24h131l-51.49-51.52a12 12 0 0117-17l72 72a12 12 0 010 17z" fill="currentColor" transform="rotate(90 128 128)"/>
      </svg>
    </button>
  </div>
</div>

<style>
  .homepage {
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
  }

  .content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
  }

  .logo-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .logo {
    width: 64px;
    height: 64px;
  }

  .title {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 1.5rem;
    font-weight: 600;
    color: #333;
    margin: 0;
    letter-spacing: -0.02em;
  }

  .button-group {
    display: flex;
    gap: 0.75rem;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    border-radius: 6px;
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid #e0e0e0;
    background: #fff;
    color: #555;
  }

  .action-btn:hover {
    background: #f7f7f7;
    border-color: #ccc;
  }

  .action-btn:active {
    background: #f0f0f0;
  }

  .action-btn svg {
    color: #888;
  }

  .continue-link {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem;
    background: none;
    border: none;
    color: #999;
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 0.8125rem;
    cursor: pointer;
  }

  .continue-link:hover {
    color: #666;
  }
</style>
