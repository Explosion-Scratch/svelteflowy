import { Mark, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export const HashtagExtension = Mark.create({
  name: 'hashtag',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'hashtag'
      },
      onHashtagClick: null
    }
  },

  parseHTML() {
    return [{ tag: 'span.hashtag' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addProseMirrorPlugins() {
    const onHashtagClick = this.options.onHashtagClick
    
    return [
      new Plugin({
        key: new PluginKey('hashtag'),
        props: {
          decorations: (state) => {
            const { doc } = state
            const decorations = []
            const hashtagRegex = /#[\w-]+/g
            
            doc.descendants((node, pos) => {
              if (!node.isText) return
              
              const text = node.text
              let match
              
              while ((match = hashtagRegex.exec(text)) !== null) {
                const start = pos + match.index
                const end = start + match[0].length
                
                decorations.push(
                  Decoration.inline(start, end, {
                    class: 'hashtag',
                    'data-hashtag': match[0]
                  })
                )
              }
            })
            
            return DecorationSet.create(doc, decorations)
          },
          handleClick: (view, pos, event) => {
            const target = event.target
            if (target.classList?.contains('hashtag') && onHashtagClick) {
              const hashtag = target.getAttribute('data-hashtag')
              if (hashtag) {
                onHashtagClick(hashtag)
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
