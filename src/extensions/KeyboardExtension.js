import { Extension } from '@tiptap/core'

export const KeyboardExtension = Extension.create({
  name: 'customKeyboard',

  addOptions() {
    return {
      onEnter: null,
      onShiftEnter: null,
      onCommandEnter: null,
      onDelete: null,
      onTab: null,
      onShiftTab: null,
      onArrowUp: null,
      onArrowDown: null,
      isDescription: false
    }
  },

  addKeyboardShortcuts() {
    return {
      'Enter': ({ editor }) => {
        if (this.options.onEnter) {
          this.options.onEnter()
          return true
        }
        return false
      },

      'Shift-Enter': ({ editor }) => {
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

      'ArrowUp': () => {
        if (this.options.onArrowUp) {
          this.options.onArrowUp()
          return true
        }
        return false
      },

      'ArrowDown': () => {
        if (this.options.onArrowDown) {
          this.options.onArrowDown()
          return true
        }
        return false
      }
    }
  }
})
