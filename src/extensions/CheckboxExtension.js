import { Extension } from '@tiptap/core'
import { InputRule } from '@tiptap/core'

export const CheckboxExtension = Extension.create({
  name: 'checkboxSyntax',

  addInputRules() {
    return [
      new InputRule({
        find: /^\[( |x)\]\s$/,
        handler: ({ state, range, match }) => {
          const { tr } = state
          const isChecked = match[1] === 'x'
          
          tr.delete(range.from, range.to)
          
          const checkboxText = isChecked ? '☑ ' : '☐ '
          tr.insertText(checkboxText, range.from)
          
          return tr
        }
      })
    ]
  }
})
