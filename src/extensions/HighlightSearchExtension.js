import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

const highlightSearchPluginKey = new PluginKey('highlightSearch')

export const HighlightSearchExtension = Extension.create({
  name: 'highlightSearch',

  addOptions() {
    return {
      phrase: null
    }
  },

  addStorage() {
    return {
      phrase: this.options.phrase
    }
  },

  onUpdate() {
    if (this.storage.phrase !== this.options.phrase) {
      this.storage.phrase = this.options.phrase
      const { view } = this.editor
      const tr = view.state.tr.setMeta('highlightSearchUpdate', true)
      view.dispatch(tr)
    }
  },

  addProseMirrorPlugins() {
    const extensionThis = this

    return [
      new Plugin({
        key: highlightSearchPluginKey,
        state: {
          init(_, state) {
            return buildDecorations(state.doc, extensionThis.options.phrase)
          },
          apply(tr, oldState, _, newState) {
            if (tr.getMeta('highlightSearchUpdate') || tr.docChanged) {
              return buildDecorations(newState.doc, extensionThis.storage.phrase)
            }
            return oldState
          }
        },
        props: {
          decorations(state) {
            return this.getState(state)
          }
        }
      })
    ]
  }
})

function buildDecorations(doc, phrase) {
  if (!phrase?.trim()) return DecorationSet.empty

  const decorations = []
  const lowerPhrase = phrase.toLowerCase()

  doc.descendants((node, pos) => {
    if (!node.isText) return

    const text = node.text.toLowerCase()
    let index = 0

    while ((index = text.indexOf(lowerPhrase, index)) !== -1) {
      const start = pos + index
      const end = start + phrase.length

      decorations.push(
        Decoration.inline(start, end, {
          class: 'search-highlight'
        })
      )
      index += phrase.length
    }
  })

  return DecorationSet.create(doc, decorations)
}
