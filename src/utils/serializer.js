/**
 * SvelteFlowy Item Serializer
 * 
 * Format Specification:
 * - Each item is a markdown-like list item starting with `- `
 * - Items can have optional metadata in curly braces after the marker: `- {id:abc123,done}` 
 * - Checkbox items use `- [ ]` or `- [x]` syntax (visual checkbox in text)
 * - The `done` flag in metadata represents completion state (separate from checkbox syntax)
 * - Item references use `@[Display Text](item_id)` format (like markdown links)
 * - Descriptions use `> ` prefix on subsequent lines
 * - Indentation uses 2 spaces per level
 * 
 * Example:
 * - {id:abc123} Task without checkbox
 * - {id:def456,done} [x] Completed task with checkbox
 * - {id:ghi789} [ ] Uncompleted task with checkbox  
 * - {id:jkl012} Task referencing @[Another Task](abc123)
 *   > This is the description
 *   > It can span multiple lines
 *   - {id:mno345} Nested child item
 */

const FORMAT_HEADER = '<!-- svelteflowy-v1 -->'

/**
 * Serialize items to SvelteFlowy markdown format
 * @param {Array} items - Array of item objects
 * @param {number} indent - Current indentation level
 * @returns {string} Serialized markdown string
 */
export function serializeItems(items, indent = 0) {
  const prefix = '  '.repeat(indent)
  let result = ''
  
  if (indent === 0) {
    result = FORMAT_HEADER + '\n'
  }
  
  for (const item of items) {
    const metadata = buildMetadata(item)
    let text = item.text || ''
    
    let statusPrefix = ''
    if (item.hasCheckbox && item.completed) {
      statusPrefix = '[xx] '
    } else if (item.hasCheckbox && !item.completed) {
      statusPrefix = '[__] '
    } else if (!item.hasCheckbox && item.completed) {
      statusPrefix = '[x] '
    }
    
    result += `${prefix}- ${metadata}${statusPrefix}${text}\n`
    
    if (item.description?.trim()) {
      const descLines = item.description.split('\n')
      for (const descLine of descLines) {
        result += `${prefix}  > ${descLine}\n`
      }
    }
    
    if (item.children?.length) {
      result += serializeItems(item.children, indent + 1)
    }
  }
  
  return result
}

/**
 * Build metadata string for an item
 * @param {Object} item - Item object
 * @returns {string} Metadata string in format `{id:xxx,done} ` or `{id:xxx} `
 */
function buildMetadata(item) {
  const parts = []
  
  if (item.id) {
    parts.push(`id:${item.id}`)
  }
  
  if (item.completed) {
    parts.push('done')
  }
  
  if (!item.open && item.children?.length > 0) {
    parts.push('collapsed')
  }
  
  if (parts.length === 0) {
    return ''
  }
  
  return `{${parts.join(',')}} `
}

/**
 * Parse metadata from string
 * @param {string} metadataStr - Metadata string like `{id:xxx,done}`
 * @returns {Object} Parsed metadata object
 */
function parseMetadata(metadataStr) {
  const result = { id: null, completed: false, open: true, hasCheckbox: false }
  
  if (!metadataStr) return result
  
  const inner = metadataStr.slice(1, -1)
  const parts = inner.split(',').map(p => p.trim())
  
  for (const part of parts) {
    if (part.startsWith('id:')) {
      result.id = part.slice(3)
    } else if (part === 'done') {
      result.completed = true
    } else if (part === 'collapsed') {
      result.open = false
    } else if (part === 'checkbox') {
      result.hasCheckbox = true
    }
  }
  
  return result
}

/**
 * Check if text starts with format header
 * @param {string} text - Text to check
 * @returns {boolean} True if SvelteFlowy format
 */
export function isSvelteFlowyFormat(text) {
  return text.trim().startsWith(FORMAT_HEADER)
}

/**
 * Deserialize SvelteFlowy markdown format to items
 * @param {string} text - Serialized markdown string
 * @returns {Array} Array of item objects
 */
export function deserializeItems(text) {
  const lines = text.split('\n')
  
  let startIndex = 0
  if (lines[0]?.trim() === FORMAT_HEADER) {
    startIndex = 1
  }
  
  const root = { children: [] }
  const stack = [{ node: root, indent: -1 }]
  let currentItem = null
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i]
    
    if (!line.trim()) continue
    
    const descInfo = parseDescriptionLine(line)
    if (descInfo && currentItem) {
      if (currentItem.description) {
        currentItem.description += '\n' + descInfo.content
      } else {
        currentItem.description = descInfo.content
      }
      continue
    }
    
    const listInfo = parseListLine(line)
    if (listInfo) {
      const item = {
        id: listInfo.id || generateItemId(),
        text: listInfo.text,
        completed: listInfo.completed,
        hasCheckbox: listInfo.hasCheckbox,
        children: [],
        open: listInfo.open,
        description: ''
      }
      
      while (stack.length > 1 && stack[stack.length - 1].indent >= listInfo.indent) {
        stack.pop()
      }
      
      stack[stack.length - 1].node.children.push(item)
      stack.push({ node: item, indent: listInfo.indent })
      currentItem = item
    }
  }
  
  return root.children
}

/**
 * Parse a list line with SvelteFlowy format
 * @param {string} line - Line to parse
 * @returns {Object|null} Parsed line info or null if not a list line
 */
function parseListLine(line) {
  const leadingSpaces = line.match(/^(\s*)/)[1]
  const indent = leadingSpaces.length
  const trimmed = line.trim()
  
  const bulletMatch = trimmed.match(/^[-*+]\s*(?:\{([^}]*)\}\s*)?(.*)$/)
  if (!bulletMatch) return null
  
  const [, metadataInner, restOfLine] = bulletMatch
  
  let metadata = { id: null, completed: false, open: true, hasCheckbox: false }
  if (metadataInner) {
    metadata = parseMetadata(`{${metadataInner}}`)
  }
  
  let text = restOfLine.trim()
  let hasCheckbox = metadata.hasCheckbox
  let completed = metadata.completed
  
  const statusMatch = text.match(/^\[(xx|__|x| )\]\s*/)
  if (statusMatch) {
    const status = statusMatch[1]
    text = text.slice(statusMatch[0].length)
    
    if (status === 'xx') {
      hasCheckbox = true
      completed = true
    } else if (status === '__') {
      hasCheckbox = true
      completed = false
    } else if (status === 'x') {
      hasCheckbox = false
      completed = true
    } else if (status === ' ') {
      hasCheckbox = false
      completed = false
    }
  }
  
  return {
    indent,
    text,
    id: metadata.id,
    completed,
    hasCheckbox,
    open: metadata.open
  }
}

/**
 * Parse a description line
 * @param {string} line - Line to parse
 * @returns {Object|null} Parsed description info or null
 */
function parseDescriptionLine(line) {
  const match = line.match(/^(\s*)>\s*(.*)$/)
  if (match) {
    return {
      indent: match[1].length,
      content: match[2]
    }
  }
  return null
}

/**
 * Generate a unique item ID
 * @returns {string} Generated ID
 */
function generateItemId() {
  return crypto.randomUUID?.().slice(0, 8) || Math.random().toString(36).slice(2, 10)
}

/**
 * Convert plain markdown (not SvelteFlowy format) to items
 * This handles pasting from external sources
 * @param {string} text - Plain markdown text
 * @returns {Array} Array of item objects
 */
export function markdownToItems(text) {
  const lines = text.split('\n')
  const nonEmptyLines = lines.filter(l => l.trim())
  
  if (nonEmptyLines.length === 0) {
    return []
  }
  
  const hasListLines = nonEmptyLines.some(l => isListLine(l))
  
  if (!hasListLines) {
    const firstLine = nonEmptyLines[0].trim()
    const restLines = nonEmptyLines.slice(1)
    const description = restLines.map(l => l.trim()).join('\n')
    
    return [{
      id: generateItemId(),
      text: firstLine,
      description: description,
      completed: false,
      children: [],
      open: true
    }]
  }
  
  const root = { children: [] }
  const stack = [{ node: root, indent: -1 }]
  let currentItem = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    if (!line.trim()) continue
    
    const descInfo = parseDescriptionLine(line)
    if (descInfo && currentItem) {
      if (currentItem.description) {
        currentItem.description += '\n' + descInfo.content
      } else {
        currentItem.description = descInfo.content
      }
      continue
    }
    
    const listInfo = parsePlainListLine(line)
    if (listInfo) {
      const item = {
        id: generateItemId(),
        text: listInfo.text,
        completed: listInfo.completed,
        hasCheckbox: listInfo.hasCheckbox,
        children: [],
        open: true,
        description: ''
      }
      
      while (stack.length > 1 && stack[stack.length - 1].indent >= listInfo.indent) {
        stack.pop()
      }
      
      stack[stack.length - 1].node.children.push(item)
      stack.push({ node: item, indent: listInfo.indent })
      currentItem = item
    }
  }
  
  return root.children
}

/**
 * Check if a line is a list line
 * @param {string} line - Line to check
 * @returns {boolean} True if list line
 */
function isListLine(line) {
  const trimmed = line.trim()
  return /^[-*+]\s/.test(trimmed) || 
         /^\d+[.)]\s/.test(trimmed) || 
         /^[a-zA-Z][.)]\s/.test(trimmed)
}

/**
 * Parse a plain markdown list line (no SvelteFlowy metadata)
 * @param {string} line - Line to parse
 * @returns {Object|null} Parsed line info or null
 */
function parsePlainListLine(line) {
  const leadingSpaces = line.match(/^(\s*)/)[1]
  const indent = leadingSpaces.length
  const trimmed = line.trim()
  
  const bulletMatch = trimmed.match(/^[-*+]\s*(?:\[(xx|__|x| )\])?\s*(.*)$/)
  if (bulletMatch) {
    const [, status, text] = bulletMatch
    
    let hasCheckbox = false
    let completed = false
    
    if (status === 'xx') {
      hasCheckbox = true
      completed = true
    } else if (status === '__') {
      hasCheckbox = true
      completed = false
    } else if (status === 'x') {
      hasCheckbox = true
      completed = true
    } else if (status === ' ') {
      hasCheckbox = true
      completed = false
    }
    
    return {
      indent,
      text: text.trim(),
      completed,
      hasCheckbox
    }
  }
  
  const numberedMatch = trimmed.match(/^\d+[.)]\s*(?:\[(xx|__|x| )\])?\s*(.*)$/)
  if (numberedMatch) {
    const [, status, text] = numberedMatch
    
    let hasCheckbox = false
    let completed = false
    
    if (status === 'xx') {
      hasCheckbox = true
      completed = true
    } else if (status === '__') {
      hasCheckbox = true
      completed = false
    } else if (status === 'x') {
      hasCheckbox = true
      completed = true
    } else if (status === ' ') {
      hasCheckbox = true
      completed = false
    }
    
    return {
      indent,
      text: text.trim(),
      completed,
      hasCheckbox
    }
  }
  
  return null
}

/**
 * Convert items to plain markdown for external copying
 * This produces readable markdown without SvelteFlowy metadata
 * @param {Array} items - Array of item objects
 * @param {number} indent - Current indentation level
 * @returns {string} Plain markdown string
 */
export function itemsToPlainMarkdown(items, indent = 0) {
  const prefix = '  '.repeat(indent)
  let result = ''
  
  for (const item of items) {
    const text = item.text || ''
    
    let statusPrefix = ''
    if (item.hasCheckbox) {
      statusPrefix = item.completed ? '[x] ' : '[ ] '
    } else if (item.completed) {
      statusPrefix = '[x] '
    }
    
    result += `${prefix}- ${statusPrefix}${text}\n`
    
    if (item.description?.trim()) {
      const descLines = item.description.split('\n')
      for (const descLine of descLines) {
        result += `${prefix}  > ${descLine}\n`
      }
    }
    
    if (item.children?.length) {
      result += itemsToPlainMarkdown(item.children, indent + 1)
    }
  }
  
  return result
}

/**
 * Smart parse function that auto-detects format
 * @param {string} text - Text to parse
 * @returns {Array} Array of item objects
 */
export function parseText(text) {
  if (isSvelteFlowyFormat(text)) {
    return deserializeItems(text)
  }
  return markdownToItems(text)
}
