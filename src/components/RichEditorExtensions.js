
import StarterKit from '@tiptap/starter-kit'
import BubbleMenu from '@tiptap/extension-bubble-menu'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import { Markdown } from 'tiptap-markdown'
import { HashtagExtension } from '../extensions/HashtagExtension.js'
import { HighlightSearchExtension } from '../extensions/HighlightSearchExtension.js'
import { KeyboardExtension } from '../extensions/KeyboardExtension.js'
import { CheckboxExtension } from '../extensions/CheckboxExtension.js'
import { AutocompleteExtension } from '../extensions/AutocompleteExtension.js'
import { ItemReferenceExtension } from '../extensions/ItemReferenceExtension.js'
import { DateReferenceExtension } from '../extensions/DateReferenceExtension.js'

export function getExtensions({
  isDescription,
  highlightPhrase,
  dispatch,
  handleHashtagClick,
  handleAutocomplete,
  handleAutocompleteHide,
  handleItemRefClick,
  handleDateClick,
  getItemText,
  formatRelativeTime,
  formatAbsoluteDate,
  bubbleMenuElement,
  showPlaceholder,
  placeholder,
  getEditor
}) {
  const extensions = [
    StarterKit.configure({
      heading: false,
      blockquote: false,
      codeBlock: false,
      horizontalRule: false,
      bulletList: false,
      orderedList: false,
      listItem: false,
      hardBreak: isDescription
    }),
    Link.configure({
      openOnClick: true,
      autolink: true,
      linkOnPaste: true,
      defaultProtocol: 'https',
      protocols: [
        'http',
        'https',
        'mailto',
        { scheme: 'file', optionalSlashes: false },
        { scheme: 'tel', optionalSlashes: true }
      ],
      HTMLAttributes: {
        target: '_blank',
        rel: 'noopener noreferrer',
        class: 'editor-link'
      }
    }),
    Markdown.configure({
      html: true,
      transformPastedText: true,
      transformCopiedText: true
    }),
    HashtagExtension.configure({
      onHashtagClick: handleHashtagClick
    }),
    HighlightSearchExtension.configure({
      phrase: highlightPhrase
    }),
    KeyboardExtension.configure({
      isDescription,
      onEnter: () => {
        if (isDescription) {
          dispatch('exitdescription')
        } else {
          dispatch('newbullet')
        }
      },
      onShiftEnter: () => {
        if (!isDescription) {
          dispatch('description')
        }
      },
      onCommandEnter: () => {
        dispatch('togglecomplete')
      },
      onDelete: () => {
        dispatch('delete')
      },
      onForceDelete: () => {
        dispatch('forcedelete')
      },
      onTab: () => {
        if (isDescription) {
          getEditor()?.commands.insertContent('\t')
        } else {
          dispatch('indent')
        }
      },
      onShiftTab: () => {
        if (!isDescription) {
          dispatch('outdent')
        }
      },
      onArrowUp: () => {
        dispatch('selectup')
      },
      onArrowDown: () => {
        dispatch('selectdown')
      },
      onShiftArrowUp: () => {
        dispatch('shiftselectup')
      },
      onShiftArrowDown: () => {
        dispatch('shiftselectdown')
      }
    }),
    CheckboxExtension.configure({
      onCheckboxToggle: (checked) => {
        dispatch('checkboxtoggle', { checked })
      },
      onCheckboxRemoved: () => {
        dispatch('checkboxremoved')
      },
      onCheckboxAdded: (checked) => {
        dispatch('checkboxadded', { checked })
      }
    }),
    AutocompleteExtension.configure({
      triggers: [
        { char: '#', pattern: /#([\w-]*)$/ },
        { char: '@', pattern: /@([\w\s-]*)$/ }
      ],
      onTrigger: handleAutocomplete,
      onHide: handleAutocompleteHide
    }),
    ItemReferenceExtension.configure({
      onItemRefClick: handleItemRefClick,
      getItemText: getItemText
    }),
    DateReferenceExtension.configure({
      onDateClick: handleDateClick,
      formatRelativeTime: formatRelativeTime,
      formatAbsoluteDate: formatAbsoluteDate
    }),
    BubbleMenu.configure({
      element: bubbleMenuElement,
      tippyOptions: {
        duration: 100
      }
    })
  ]

  if (showPlaceholder && placeholder) {
    extensions.push(
      Placeholder.configure({
        placeholder
      })
    )
  }

  return extensions
}
