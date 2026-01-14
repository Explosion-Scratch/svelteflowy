<script>
  import { fileService, SaveState } from '../services/fileService.js'
  
  const { fileName, saveState } = fileService
</script>

<div class="save-indicator">
  {#if $fileName}
    <span class="file-name">{$fileName}</span>
  {/if}
  
  {#if $saveState === SaveState.SAVING}
    <div class="spinner" title="Saving..."></div>
  {:else if $saveState === SaveState.SAVED}
    <svg class="check-icon" viewBox="0 0 256 256" title="Saved">
      <path d="M229.66 77.66l-128 128a8 8 0 0 1-11.32 0l-56-56a8 8 0 0 1 11.32-11.32L96 188.69l122.34-122.35a8 8 0 0 1 11.32 11.32z" fill="currentColor"/>
    </svg>
  {:else if $saveState === SaveState.ERROR}
    <svg class="error-icon" viewBox="0 0 256 256" title="Save failed">
      <path d="M236.8 188.09L149.35 36.22a24.76 24.76 0 0 0-42.7 0L19.2 188.09a23.51 23.51 0 0 0 0 23.72A24.35 24.35 0 0 0 40.55 224h174.9a24.35 24.35 0 0 0 21.33-12.19a23.51 23.51 0 0 0 .02-23.72zM120 104a8 8 0 0 1 16 0v40a8 8 0 0 1-16 0zm8 88a12 12 0 1 1 12-12a12 12 0 0 1-12 12z" fill="currentColor"/>
    </svg>
  {:else if $saveState === SaveState.UNSAVED && $fileName}
    <span class="unsaved-dot" title="Unsaved changes">•</span>
  {/if}
</div>

<style>
  .save-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #888;
    min-width: 0;
  }

  .file-name {
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
    color: #666;
  }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(0, 0, 0, 0.05);
    border-top-color: #999;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .check-icon {
    width: 16px;
    height: 16px;
    color: #999;
    animation: fadeInScale 0.2s ease-out;
  }

  .error-icon {
    width: 16px;
    height: 16px;
    color: #ef4444;
  }

  .unsaved-dot {
    font-size: 20px;
    line-height: 1;
    color: #ccc;
  }

  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
</style>
