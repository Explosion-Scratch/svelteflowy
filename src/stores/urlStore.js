import { writable, get } from 'svelte/store'
import { itemStore } from './itemStore.js'
import { tick } from 'svelte'

const isUpdatingFromUrl = writable(false)

function parseUrlParams() {
  const params = new URLSearchParams(window.location.search)
  return {
    scope: params.get('scope'),
    q: params.get('q'),
    selected: params.get('selected')?.split(',').filter(Boolean) || [],
    item: params.get('item')
  }
}

function buildUrlParams(state) {
  const params = new URLSearchParams()
  
  if (state.scope) {
    params.set('scope', state.scope)
  }
  if (state.q) {
    params.set('q', state.q)
  }
  if (state.selected?.length > 0) {
    params.set('selected', state.selected.join(','))
  }
  if (state.item) {
    params.set('item', state.item)
  }
  
  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

function updateUrl(state) {
  if (get(isUpdatingFromUrl)) return
  
  const newUrl = window.location.pathname + buildUrlParams(state)
  if (window.location.pathname + window.location.search !== newUrl) {
    history.replaceState(null, '', newUrl)
  }
}

async function initFromUrl() {
  const { scope, q, selected, item } = parseUrlParams()
  
  isUpdatingFromUrl.set(true)
  
  if (scope) {
    itemStore.zoom(scope)
  }
  
  if (q) {
    itemStore.setSearch(q)
  }
  
  if (selected.length > 0) {
    itemStore.selectRange(selected)
  }
  
  isUpdatingFromUrl.set(false)
  
  if (item) {
    await tick()
    await new Promise(r => setTimeout(r, 100))
    itemStore.navigateToItem(item)
  }
}

function setupUrlSync() {
  const { zoomedItemId, searchQuery, selection } = itemStore
  
  let lastScope = null
  let lastSearch = null
  let lastSelected = []
  
  zoomedItemId.subscribe(scope => {
    if (get(isUpdatingFromUrl)) return
    if (scope !== lastScope) {
      lastScope = scope
      updateUrl({ scope, q: lastSearch, selected: lastSelected })
    }
  })
  
  searchQuery.subscribe(q => {
    if (get(isUpdatingFromUrl)) return
    if (q !== lastSearch) {
      lastSearch = q
      updateUrl({ scope: lastScope, q, selected: lastSelected })
    }
  })
  
  selection.subscribe(sel => {
    if (get(isUpdatingFromUrl)) return
    const selected = [...sel]
    if (JSON.stringify(selected) !== JSON.stringify(lastSelected)) {
      lastSelected = selected
      updateUrl({ scope: lastScope, q: lastSearch, selected })
    }
  })
  
  window.addEventListener('popstate', () => {
    initFromUrl()
  })
}

export const urlStore = {
  initFromUrl,
  setupUrlSync,
  parseUrlParams
}
