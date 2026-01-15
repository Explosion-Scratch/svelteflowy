import { Extension } from '@tiptap/core'

export const KeyboardExtension = Extension.create({
  name: 'customKeyboard',

  addOptions() {
    return {
      onEnter: null,
      onShiftEnter: null,
      onCommandEnter: null,
      onDelete: null,
      onForceDelete: null,
      onTab: null,
      onShiftTab: null,
      onArrowUp: null,
      onArrowDown: null,
      onShiftArrowUp: null,
      onShiftArrowDown: null,
      isDescription: false,
      isZoomedRootDescription: false
    }
  },

  addKeyboardShortcuts() {
    return {
      'Enter': ({ editor }) => {
        if (this.options.isDescription) {
          return false
        }
        if (this.options.onEnter) {
          this.options.onEnter()
          return true
        }
        return false
      },

      'Shift-Enter': ({ editor }) => {
        if (this.options.isDescription && this.options.onEnter) {
          this.options.onEnter()
          return true
        }
        if (this.options.onShiftEnter) {
          this.options.onShiftEnter()
          return true
        }
        return false
      },

      'Mod-Enter': ({ editor }) => {
        if (this.options.onCommandEnter) {
          this.options.onCommandEnter()
          return true
        }
        return false
      },

      'Backspace': ({ editor }) => {
        if (editor.isEmpty && this.options.onDelete) {
          this.options.onDelete()
          return true
        }
        return false
      },

      'Delete': ({ editor }) => {
        if (editor.isEmpty && this.options.onDelete) {
          this.options.onDelete()
          return true
        }
        return false
      },

      'Mod-Delete': ({ editor }) => {
        if (this.options.onForceDelete) {
          this.options.onForceDelete()
          return true
        }
        return false
      },

      'Mod-Backspace': ({ editor }) => {
        if (this.options.onForceDelete) {
          this.options.onForceDelete()
          return true
        }
        return false
      },

      'Tab': () => {
        if (this.options.onTab) {
          this.options.onTab()
          return true
        }
        return false
      },

      'Shift-Tab': () => {
        if (this.options.onShiftTab) {
          this.options.onShiftTab()
          return true
        }
        return false
      },

      'ArrowUp': ({ editor }) => {
        if (this.options.isDescription) {
          const { state } = editor
          const { selection } = state
          if (selection.from === 1) {
            if (this.options.onArrowUp) {
              this.options.onArrowUp()
              return true
            }
          }
          return false
        }
        if (this.options.onArrowUp) {
          this.options.onArrowUp()
          return true
        }
        return false
      },

      'ArrowDown': ({ editor }) => {
        if (this.options.isDescription) {
          const { state } = editor
          const { selection, doc } = state
          // doc.content.size - 1 is the end of the last node's content
          if (selection.to >= doc.content.size - 1) {
            if (this.options.onArrowDown) {
              this.options.onArrowDown()
              return true
            }
          }
          return false
        }
        if (this.options.onArrowDown) {
          this.options.onArrowDown()
          return true
        }
        return false
      },

      'Shift-ArrowUp': () => {
        if (this.options.onShiftArrowUp) {
          this.options.onShiftArrowUp()
          return true
        }
        return false
      },

      'Shift-ArrowDown': () => {
        if (this.options.onShiftArrowDown) {
          this.options.onShiftArrowDown()
          return true
        }
        return false
      }
    }
  }
})
