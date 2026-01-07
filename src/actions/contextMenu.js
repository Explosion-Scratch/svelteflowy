export function contextMenu(node, options = {}) {
  let showCallback = options.onShow
  let hideCallback = options.onHide
  let triggerElement = options.triggerElement

  function handleContextMenu(event) {
    event.preventDefault()
    event.stopPropagation()
    
    const rect = node.getBoundingClientRect()
    const bulletElement = node.querySelector('.bullet-line')
    const descriptionEditor = node.querySelector('.description-editor')
    
    let anchorY = rect.top
    if (bulletElement) {
      const bulletRect = bulletElement.getBoundingClientRect()
      anchorY = bulletRect.bottom
    }
    if (descriptionEditor) {
      const descRect = descriptionEditor.getBoundingClientRect()
      anchorY = Math.max(anchorY, descRect.bottom)
    }
    
    const bulletEl = node.querySelector(':scope > .top > .content-area > .bullet-line > .bullet')
    let anchorX = rect.left
    if (bulletEl) {
      const bulletRect = bulletEl.getBoundingClientRect()
      anchorX = bulletRect.left
    }
    
    if (showCallback) {
      showCallback({
        x: anchorX,
        y: anchorY + 4
      })
    }
  }
  
  function handleTriggerClick(event) {
    event.preventDefault()
    event.stopPropagation()
    
    const rect = node.getBoundingClientRect()
    const bulletElement = node.querySelector('.bullet-line')
    const descriptionEditor = node.querySelector('.description-editor')
    
    let anchorY = rect.top
    if (bulletElement) {
      const bulletRect = bulletElement.getBoundingClientRect()
      anchorY = bulletRect.bottom
    }
    if (descriptionEditor) {
      const descRect = descriptionEditor.getBoundingClientRect()
      anchorY = Math.max(anchorY, descRect.bottom)
    }
    
    const bulletEl = node.querySelector(':scope > .top > .content-area > .bullet-line > .bullet')
    let anchorX = rect.left
    if (bulletEl) {
      const bulletRect = bulletEl.getBoundingClientRect()
      anchorX = bulletRect.left
    }
    
    if (showCallback) {
      showCallback({
        x: anchorX,
        y: anchorY + 4
      })
    }
  }

  node.addEventListener('contextmenu', handleContextMenu)
  
  if (triggerElement) {
    triggerElement.addEventListener('click', handleTriggerClick)
  }

  return {
    update(newOptions) {
      if (triggerElement) {
        triggerElement.removeEventListener('click', handleTriggerClick)
      }
      
      showCallback = newOptions.onShow
      hideCallback = newOptions.onHide
      triggerElement = newOptions.triggerElement
      
      if (triggerElement) {
        triggerElement.addEventListener('click', handleTriggerClick)
      }
    },
    destroy() {
      node.removeEventListener('contextmenu', handleContextMenu)
      if (triggerElement) {
        triggerElement.removeEventListener('click', handleTriggerClick)
      }
    }
  }
}

export function createContextMenuState() {
  let isOpen = false
  let position = { x: 0, y: 0 }
  let closeCallback = null

  return {
    get isOpen() { return isOpen },
    get position() { return position },
    
    show(pos) {
      position = pos
      isOpen = true
    },
    
    hide() {
      isOpen = false
    },
    
    toggle(pos) {
      if (isOpen) {
        isOpen = false
      } else {
        position = pos
        isOpen = true
      }
    },
    
    setCloseCallback(cb) {
      closeCallback = cb
    }
  }
}
