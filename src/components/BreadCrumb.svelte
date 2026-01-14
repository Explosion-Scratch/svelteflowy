<script>
  import { itemStore } from '../stores/itemStore.js'

  const { items, zoomedItemId } = itemStore

  let breadcrumbs = []

  function buildBreadcrumbs(root, targetId) {
    if (!targetId) return []

    const path = []

    function findPath(node, target) {
      if (node.id === target) {
        return true
      }
      if (node.children) {
        for (const child of node.children) {
          if (findPath(child, target)) {
            path.unshift(child)
            return true
          }
        }
      }
      return false
    }

    findPath(root, targetId)
    return path
  }

  $: {
    breadcrumbs = buildBreadcrumbs($items, $zoomedItemId)
  }

  function handleHome() {
    itemStore.zoom(null)
    itemStore.clearSearch()
  }

  function handleCrumbClick(item) {
    itemStore.zoom(item.id)
  }
</script>

<div class="crumb_container">
  <button class="home" on:click={handleHome} aria-label="Home">
    <svg width="32" height="32" viewBox="0 0 256 256">
      <path
        fill="currentColor"
        d="M208 222H48a14 14 0 0 1-14-14v-92.5a13.9 13.9 0 0 1 4.6-10.3l80-72.8a14.1 14.1 0 0 1 18.8 0l80 72.8a13.9 13.9 0 0 1 4.6 10.3V208a14 14 0 0 1-14 14ZM128 40.8a1.9 1.9 0 0 0-1.3.5l-80 72.8a1.6 1.6 0 0 0-.7 1.4V208a2 2 0 0 0 2 2h160a2 2 0 0 0 2-2v-92.5a1.8 1.8 0 0 0-.6-1.4l-80.1-72.8a1.9 1.9 0 0 0-1.3-.5Z"
      />
    </svg>
  </button>

  {#each breadcrumbs as crumb, idx}
    <svg class="right" width="32" height="32" viewBox="0 0 256 256">
      <path
        fill="currentColor"
        d="M96 214a6 6 0 0 1-4.2-10.2l75.7-75.8l-75.7-75.8a5.9 5.9 0 0 1 8.4-8.4l80 80a5.8 5.8 0 0 1 0 8.4l-80 80A5.8 5.8 0 0 1 96 214Z"
      />
    </svg>

    <button
      class="crumb"
      class:last={idx === breadcrumbs.length - 1}
      on:click={() => handleCrumbClick(crumb)}
    >
      {crumb.text || 'Untitled'}
    </button>
  {/each}
</div>

<style>
  .crumb_container {
    display: flex;
    color: #999;
    font-size: 0.8em;
    align-items: center;
  }

  .crumb {
    all: unset;
    cursor: pointer;
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .crumb:hover {
    color: #333;
  }

  .last {
    color: #333;
  }

  .home {
    all: unset;
    transition: background 0.1s ease;
    border-radius: 1000px;
    padding: 7px;
    margin: 0 !important;
    margin-right: -7px !important;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .home:hover {
    background: #0001;
  }

  .home svg {
    width: 1.2rem;
    height: 1.2rem;
  }

  svg {
    width: 1.2rem;
    margin: 6px;
    height: 1.2rem;
  }

  .right {
    width: 0.9em;
    height: 0.9em;
    margin: 0 2px;
  }
</style>
