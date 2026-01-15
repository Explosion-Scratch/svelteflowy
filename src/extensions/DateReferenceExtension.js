import { Mark, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export const DateReferenceExtension = Mark.create({
  name: 'dateReference',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'date-ref'
      },
      onDateClick: null,
      formatRelativeTime: null,
      formatAbsoluteDate: null
    }
  },

  parseHTML() {
    return [{ tag: 'span.date-ref' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addProseMirrorPlugins() {
    const onDateClick = this.options.onDateClick
    const formatRelativeTime = this.options.formatRelativeTime
    const formatAbsoluteDate = this.options.formatAbsoluteDate
    
    return [
      new Plugin({
        key: new PluginKey('dateReference'),
        props: {
          decorations: (state) => {
            const { doc } = state
            const decorations = []
            const dateRegex = /@date\[([^\]]+)\]/g
            
            doc.descendants((node, pos) => {
              if (!node.isText) return
              
              const text = node.text
              let match
              
              while ((match = dateRegex.exec(text)) !== null) {
                const start = pos + match.index
                const end = start + match[0].length
                const isoString = match[1]
                const date = new Date(isoString)
                
                if (!isNaN(date.getTime())) {
                  const relativeText = formatRelativeTime ? formatRelativeTime(date) : match[0]
                  const absoluteText = formatAbsoluteDate ? formatAbsoluteDate(date) : isoString
                  
                  decorations.push(
                    Decoration.inline(start, end, {
                      class: 'date-ref',
                      'data-date': isoString,
                      'data-display-text': relativeText,
                      'data-absolute-text': absoluteText,
                      title: absoluteText
                    })
                  )
                }
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
            
            const dateMatch = textBefore.match(/@date\[([^\]]+)\]$/)
            if (dateMatch && event.key === 'Backspace') {
              const refLength = dateMatch[0].length
              const deleteFrom = pos - refLength
              view.dispatch(state.tr.delete(deleteFrom, pos))
              return true
            }
            
            const textAfter = $from.parent.textContent.slice($from.parentOffset)
            const dateMatchAfter = textAfter.match(/^@date\[([^\]]+)\]/)
            if (dateMatchAfter && event.key === 'Delete') {
              const refLength = dateMatchAfter[0].length
              view.dispatch(state.tr.delete(pos, pos + refLength))
              return true
            }
            
            return false
          },
          handleClick: (view, pos, event) => {
            const target = event.target
            if (target.classList?.contains('date-ref') && onDateClick) {
              const dateStr = target.getAttribute('data-date')
              if (dateStr) {
                const date = new Date(dateStr)
                if (!isNaN(date.getTime())) {
                  onDateClick(date)
                  return true
                }
              }
            }
            return false
          }
        }
      })
    ]
  }
})
