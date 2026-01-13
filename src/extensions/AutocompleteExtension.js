import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

export const AutocompleteExtension = Extension.create({
  name: 'autocomplete',

  addOptions() {
    return {
      triggers: [],
      onTrigger: null,
      onHide: null
    }
  },

  addStorage() {
    return {
      isActive: false,
      currentTrigger: null,
      currentQuery: '',
      cursorPos: null
    }
  },

  addProseMirrorPlugins() {
    const { triggers, onTrigger, onHide } = this.options
    const storage = this.storage

    return [
      new Plugin({
        key: new PluginKey('autocomplete'),
        
        props: {
          handleKeyDown: (view, event) => {
            if (!storage.isActive) return false
            
            if (event.key === 'Escape') {
              storage.isActive = false
              storage.currentTrigger = null
              storage.currentQuery = ''
              if (onHide) onHide()
              return true
            }
            
            return false
          }
        },

        state: {
          init() {
            return { active: false, trigger: null, query: '', from: 0 }
          },
          
          apply(tr, prev, oldState, newState) {
            const { selection } = newState
            const { $from } = selection
            
            if (!$from.parent.isTextblock) {
              if (storage.isActive) {
                storage.isActive = false
                if (onHide) onHide()
              }
              return { active: false, trigger: null, query: '', from: 0 }
            }

            const textBefore = $from.parent.textContent.slice(0, $from.parentOffset)
            
            for (const { char, pattern } of triggers) {
              const regex = pattern || new RegExp(`${char}([\\w-]*)$`)
              const match = textBefore.match(regex)
              
              if (match) {
                const query = match[1] || ''
                const triggerPos = $from.pos - query.length - char.length
                
                storage.isActive = true
                storage.currentTrigger = char
                storage.currentQuery = query
                storage.cursorPos = $from.pos
                
                if (onTrigger) {
                  const coords = view.coordsAtPos($from.pos)
                  onTrigger({
                    trigger: char,
                    query,
                    from: triggerPos,
                    to: $from.pos,
                    coords
                  })
                }
                
                return { active: true, trigger: char, query, from: triggerPos }
              }
            }

            if (storage.isActive) {
              storage.isActive = false
              storage.currentTrigger = null
              storage.currentQuery = ''
              if (onHide) onHide()
            }
            
            return { active: false, trigger: null, query: '', from: 0 }
          }
        }
      })
    ]
  },

  addCommands() {
    return {
      insertAutocomplete: (text) => ({ commands, state }) => {
        const { from, to } = state.selection
        const storage = this.storage
        
        if (!storage.isActive) return false
        
        const trigger = storage.currentTrigger
        const query = storage.currentQuery
        const deleteFrom = from - query.length - trigger.length
        
        return commands.insertContentAt({ from: deleteFrom, to }, text)
      }
    }
  }
})
