import { writable, derived } from 'svelte/store'

function createDragDropStore() {
  const isDraggingItems = writable(false)
  const draggedItemIds = writable(new Set())
  const dropTarget = writable(null)

  function startDrag(itemIds) {
    isDraggingItems.set(true)
    draggedItemIds.set(new Set(itemIds))
    document.body.classList.add('dragging-items')
  }

  function updateDropTarget(target) {
    dropTarget.set(target)
  }

  function endDrag() {
    isDraggingItems.set(false)
    draggedItemIds.set(new Set())
    dropTarget.set(null)
    document.body.classList.remove('dragging-items')
  }

  return {
    isDraggingItems,
    draggedItemIds,
    dropTarget,
    startDrag,
    updateDropTarget,
    endDrag
  }
}

export const dragDropStore = createDragDropStore()
