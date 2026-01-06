const listeners = new Map()

export function emit(event, data) {
  const handlers = listeners.get(event) || []
  handlers.forEach(handler => handler(data))
}

export function on(event, handler) {
  if (!listeners.has(event)) {
    listeners.set(event, [])
  }
  listeners.get(event).push(handler)

  return () => off(event, handler)
}

export function off(event, handler) {
  const handlers = listeners.get(event)
  if (handlers) {
    const idx = handlers.indexOf(handler)
    if (idx !== -1) {
      handlers.splice(idx, 1)
    }
  }
}

export function once(event, handler) {
  const wrapper = (data) => {
    off(event, wrapper)
    handler(data)
  }
  on(event, wrapper)
  return () => off(event, wrapper)
}
