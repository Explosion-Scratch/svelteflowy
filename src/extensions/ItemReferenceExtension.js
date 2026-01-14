import { Mark, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export const ItemReferenceExtension = Mark.create({
  name: 'itemReference',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'item-ref'
      },
      onItemRefClick: null,
      getItemText: null
    }
  },

  parseHTML() {
    return [{ tag: 'span.item-ref' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addProseMirrorPlugins() {
    const onItemRefClick = this.options.onItemRefClick
    const getItemText = this.options.getItemText
    
    return [
      new Plugin({
        key: new PluginKey('itemReference'),
        props: {
          decorations: (state) => {
            const { doc } = state
            const decorations = []
            const refRegex = /@\[([^\]]+)\]/g
            
            doc.descendants((node, pos) => {
              if (!node.isText) return
              
              const text = node.text
              let match
              
              while ((match = refRegex.exec(text)) !== null) {
                const start = pos + match.index
                const end = start + match[0].length
                const itemId = match[1]
                const displayText = getItemText ? getItemText(itemId) : match[0]
                
                decorations.push(
                  Decoration.inline(start, end, {
                    class: 'item-ref',
                    'data-ref-id': itemId,
                    'data-display-text': displayText
                  })
                )
              }
            })
            
            return DecorationSet.create(doc, decorations)
          },
          handleKeyDown: (view, event) => {
            if (event.key !== 'Backspace' && event.key !== 'Delete') return false
            
            const { state } = view
            const { selection } = state
            const { $from } = selection
            
            if (!selection.empty) return false
            
            const pos = $from.pos
            const textBefore = $from.parent.textContent.slice(0, $from.parentOffset)
            
            const refMatch = textBefore.match(/@\[([^\]]+)\]$/)
            if (refMatch && event.key === 'Backspace') {
              const refLength = refMatch[0].length
              const deleteFrom = pos - refLength
              view.dispatch(state.tr.delete(deleteFrom, pos))
              return true
            }
            
            const textAfter = $from.parent.textContent.slice($from.parentOffset)
            const refMatchAfter = textAfter.match(/^@\[([^\]]+)\]/)
            if (refMatchAfter && event.key === 'Delete') {
              const refLength = refMatchAfter[0].length
              view.dispatch(state.tr.delete(pos, pos + refLength))
              return true
            }
            
            return false
          },
          handleClick: (view, pos, event) => {
            const target = event.target
            if (target.classList?.contains('item-ref') && onItemRefClick) {
              const refId = target.getAttribute('data-ref-id')
              if (refId) {
                onItemRefClick(refId)
                return true
              }
            }
            return false
          }
        }
      })
    ]
  }
})
