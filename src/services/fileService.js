import { writable, get } from 'svelte/store'
import { serializeItems, parseText } from '../utils/serializer.js'

const DB_NAME = 'svelteflowy-filehandles'
const DB_VERSION = 1
const STORE_NAME = 'handles'
const FILE_HANDLE_KEY = 'currentFileHandle'

export const SaveState = {
  UNSAVED: 'unsaved',
  SAVING: 'saving',
  SAVED: 'saved',
  ERROR: 'error'
}

function createFileService() {
  const fileHandle = writable(null)
  const fileName = writable(null)
  const saveState = writable(SaveState.UNSAVED)
  const hasUnsavedChanges = writable(false)
  let db = null

  async function openDB() {
    if (db) return db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        db = request.result
        resolve(db)
      }
      request.onupgradeneeded = (event) => {
        const database = event.target.result
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME)
        }
      }
    })
  }

  async function storeFileHandle(handle) {
    try {
      const database = await openDB()
      return new Promise((resolve, reject) => {
        const tx = database.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        const request = store.put(handle, FILE_HANDLE_KEY)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (e) {
      console.warn('Failed to store file handle:', e)
    }
  }

  async function retrieveStoredHandle() {
    try {
      const database = await openDB()
      return new Promise((resolve) => {
        const tx = database.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const request = store.get(FILE_HANDLE_KEY)
        request.onsuccess = () => resolve(request.result || null)
        request.onerror = () => resolve(null)
      })
    } catch (e) {
      console.warn('Failed to retrieve file handle:', e)
      return null
    }
  }

  async function clearStoredHandle() {
    try {
      const database = await openDB()
      return new Promise((resolve) => {
        const tx = database.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        const request = store.delete(FILE_HANDLE_KEY)
        request.onsuccess = () => resolve()
        request.onerror = () => resolve()
      })
    } catch (e) {
      console.warn('Failed to clear file handle:', e)
    }
  }

  async function verifyPermission(handle, readWrite = true) {
    const options = { mode: readWrite ? 'readwrite' : 'read' }
    
    if ((await handle.queryPermission(options)) === 'granted') {
      return true
    }
    
    if ((await handle.requestPermission(options)) === 'granted') {
      return true
    }
    
    return false
  }

  async function testWritePermission(handle) {
    try {
      const file = await handle.getFile()
      const originalContent = await file.text()
      
      const writable = await handle.createWritable()
      await writable.write(originalContent + ' ')
      await writable.close()
      
      const revertWritable = await handle.createWritable()
      await revertWritable.write(originalContent)
      await revertWritable.close()
      
      return true
    } catch (e) {
      console.warn('Write permission test failed:', e)
      return false
    }
  }

  async function initFromStoredHandle() {
    const stored = await retrieveStoredHandle()
    if (!stored) return false

    try {
      const hasPermission = await verifyPermission(stored)
      if (!hasPermission) {
        await clearStoredHandle()
        return false
      }

      const canWrite = await testWritePermission(stored)
      if (!canWrite) {
        await clearStoredHandle()
        return false
      }

      fileHandle.set(stored)
      fileName.set(stored.name)
      saveState.set(SaveState.SAVED)
      return true
    } catch (e) {
      console.warn('Failed to restore file handle:', e)
      await clearStoredHandle()
      return false
    }
  }

  async function saveFile(items) {
    const handle = get(fileHandle)
    
    if (!handle) {
      return saveFileAs(items)
    }

    saveState.set(SaveState.SAVING)

    try {
      const hasPermission = await verifyPermission(handle)
      if (!hasPermission) {
        saveState.set(SaveState.ERROR)
        return false
      }

      const markdown = serializeItems(items)
      const writable = await handle.createWritable()
      await writable.write(markdown)
      await writable.close()

      saveState.set(SaveState.SAVED)
      hasUnsavedChanges.set(false)
      return true
    } catch (e) {
      console.error('Failed to save file:', e)
      saveState.set(SaveState.ERROR)
      return false
    }
  }

  async function saveFileAs(items) {
    saveState.set(SaveState.SAVING)

    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'todos.md',
        types: [{
          description: 'Markdown files',
          accept: { 'text/markdown': ['.md'] }
        }, {
          description: 'Text files',
          accept: { 'text/plain': ['.txt'] }
        }]
      })

      fileHandle.set(handle)
      fileName.set(handle.name)
      await storeFileHandle(handle)

      const markdown = serializeItems(items)
      const writable = await handle.createWritable()
      await writable.write(markdown)
      await writable.close()

      saveState.set(SaveState.SAVED)
      hasUnsavedChanges.set(false)
      return true
    } catch (e) {
      if (e.name === 'AbortError') {
        saveState.set(get(fileHandle) ? SaveState.SAVED : SaveState.UNSAVED)
        return false
      }
      console.error('Failed to save file:', e)
      saveState.set(SaveState.ERROR)
      return false
    }
  }

  async function openFile() {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{
          description: 'Markdown files',
          accept: { 'text/markdown': ['.md'] }
        }, {
          description: 'Text files',
          accept: { 'text/plain': ['.txt'] }
        }],
        multiple: false
      })

      const hasPermission = await verifyPermission(handle)
      if (!hasPermission) {
        return { success: false, items: null, error: 'Permission denied' }
      }

      const canWrite = await testWritePermission(handle)
      if (!canWrite) {
        return { success: false, items: null, error: 'Unable to write to file. Please check permissions.' }
      }

      const file = await handle.getFile()
      const content = await file.text()
      const items = parseText(content)

      fileHandle.set(handle)
      fileName.set(handle.name)
      await storeFileHandle(handle)
      saveState.set(SaveState.SAVED)
      hasUnsavedChanges.set(false)

      return { success: true, items, error: null }
    } catch (e) {
      if (e.name === 'AbortError') {
        return { success: false, items: null, error: null }
      }
      console.error('Failed to open file:', e)
      return { success: false, items: null, error: e.message }
    }
  }

  function markDirty() {
    hasUnsavedChanges.set(true)
    const currentHandle = get(fileHandle)
    if (currentHandle) {
      saveState.set(SaveState.UNSAVED)
    }
  }

  function closeFile() {
    fileHandle.set(null)
    fileName.set(null)
    saveState.set(SaveState.UNSAVED)
    hasUnsavedChanges.set(false)
    clearStoredHandle()
  }

  function isFileSystemAccessSupported() {
    return 'showSaveFilePicker' in window && 'showOpenFilePicker' in window
  }

  return {
    fileHandle,
    fileName,
    saveState,
    hasUnsavedChanges,
    
    initFromStoredHandle,
    saveFile,
    saveFileAs,
    openFile,
    markDirty,
    closeFile,
    isFileSystemAccessSupported
  }
}

export const fileService = createFileService()
