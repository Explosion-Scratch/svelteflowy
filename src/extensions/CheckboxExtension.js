import { Node, mergeAttributes, InputRule } from '@tiptap/core'

export const CheckboxExtension = Node.create({
  name: 'checkbox',
  
  group: 'inline',
  inline: true,
  atom: true,
  selectable: false,
  
  addAttributes() {
    return {
      checked: {
        default: false,
        parseHTML: element => element.getAttribute('data-checked') === 'true',
        renderHTML: attributes => ({
          'data-checked': attributes.checked ? 'true' : 'false'
        })
      }
    }
  },
  
  parseHTML() {
    return [
      {
        tag: 'span[data-type="checkbox"]'
      }
    ]
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'checkbox' })]
  },
  
  addNodeView() {
    return ({ node, getPos, editor }) => {
      const wrapper = document.createElement('span')
      wrapper.classList.add('inline-checkbox')
      wrapper.contentEditable = 'false'
      
      const button = document.createElement('button')
      button.type = 'button'
      button.classList.add('checkbox-button')
      if (node.attrs.checked) {
        button.classList.add('checked')
      }
      
      const updateCheckmark = (isChecked) => {
        if (isChecked) {
          button.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
          </svg>`
          button.classList.add('checked')
        } else {
          button.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
          </svg>`
          button.classList.remove('checked')
        }
      }
      
      updateCheckmark(node.attrs.checked)
      
      button.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        
        if (typeof getPos !== 'function') return
        
        const pos = getPos()
        const currentNode = editor.state.doc.nodeAt(pos)
        if (!currentNode || currentNode.type.name !== 'checkbox') return
        
        const newChecked = !currentNode.attrs.checked
        
        editor.chain()
          .focus()
          .command(({ tr }) => {
            tr.setNodeMarkup(pos, undefined, { checked: newChecked })
            return true
          })
          .run()
      })
      
      wrapper.appendChild(button)
      
      return {
        dom: wrapper,
        update: (updatedNode) => {
          if (updatedNode.type.name !== 'checkbox') return false
          updateCheckmark(updatedNode.attrs.checked)
          return true
        }
      }
    }
  },
  
  addInputRules() {
    return [
      new InputRule({
        find: /^\[( |x)\]\s$/,
        handler: ({ state, range, match }) => {
          const isChecked = match[1] === 'x'
          const { tr } = state
          
          tr.delete(range.from, range.to)
          tr.insert(range.from, this.type.create({ checked: isChecked }))
          tr.insertText(' ', range.from + 1)
          
          return tr
        }
      })
    ]
  }
})
