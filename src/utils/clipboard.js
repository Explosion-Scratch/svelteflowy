export function itemsToMarkdown(items, indent = 0) {
  const prefix = '  '.repeat(indent)
  let result = ''
  
  for (const item of items) {
    const text = item.text || ''
    const hasCheckboxSyntax = /^\[( |x)\]\s/.test(text)
    
    if (hasCheckboxSyntax) {
      result += `${prefix}- ${text}\n`
    } else if (item.completed) {
      result += `${prefix}- [x] ${text}\n`
    } else {
      result += `${prefix}- ${text}\n`
    }
    
    if (item.description?.trim()) {
      const descLines = item.description.split('\n')
      for (const descLine of descLines) {
        result += `${prefix}  > ${descLine}\n`
      }
    }
    
    if (item.children?.length) {
      result += itemsToMarkdown(item.children, indent + 1)
    }
  }
  
  return result
}

function generateItemId() {
  return crypto.randomUUID?.().slice(0, 8) || Math.random().toString(36).slice(2, 10)
}

function isListLine(line) {
  const trimmed = line.trim()
  return /^[-*+]\s/.test(trimmed) || 
         /^\d+[.)]\s/.test(trimmed) || 
         /^[a-zA-Z][.)]\s/.test(trimmed) ||
         /^[-*+]\s*\[[ x]\]\s/.test(trimmed) ||
         /^\d+[.)]\s*\[[ x]\]\s/.test(trimmed)
}

function parseListLine(line) {
  const leadingSpaces = line.match(/^(\s*)/)[1]
  const indent = leadingSpaces.length
  const trimmed = line.trim()
  
  const bulletMatch = trimmed.match(/^[-*+]\s*(?:\[( |x)\])?\s*(.*)$/)
  if (bulletMatch) {
    const [, checkbox, text] = bulletMatch
    return {
      indent,
      text: text.trim(),
      completed: checkbox === 'x',
      hasCheckbox: checkbox !== undefined
    }
  }
  
  const numberedMatch = trimmed.match(/^\d+[.)]\s*(?:\[( |x)\])?\s*(.*)$/)
  if (numberedMatch) {
    const [, checkbox, text] = numberedMatch
    return {
      indent,
      text: text.trim(),
      completed: checkbox === 'x',
      hasCheckbox: checkbox !== undefined
    }
  }
  
  const letteredMatch = trimmed.match(/^[a-zA-Z][.)]\s*(?:\[( |x)\])?\s*(.*)$/)
  if (letteredMatch) {
    const [, checkbox, text] = letteredMatch
    return {
      indent,
      text: text.trim(),
      completed: checkbox === 'x',
      hasCheckbox: checkbox !== undefined
    }
  }
  
  return null
}

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
    
    const listInfo = parseListLine(line)
    if (listInfo) {
      const item = {
        id: generateItemId(),
        text: listInfo.hasCheckbox && listInfo.completed 
          ? `[x] ${listInfo.text}` 
          : listInfo.hasCheckbox 
            ? `[ ] ${listInfo.text}`
            : listInfo.text,
        completed: listInfo.completed && !listInfo.hasCheckbox,
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

export async function copyToClipboard(items) {
  const markdown = itemsToMarkdown(Array.isArray(items) ? items : [items])
  await navigator.clipboard.writeText(markdown)
  return markdown
}

export async function pasteFromClipboard() {
  const text = await navigator.clipboard.readText()
  return markdownToItems(text)
}
