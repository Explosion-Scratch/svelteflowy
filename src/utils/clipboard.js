export function itemsToMarkdown(items, indent = 0) {
  const prefix = '  '.repeat(indent)
  let result = ''
  
  for (const item of items) {
    const checkbox = item.completed ? '[x]' : '[ ]'
    const text = item.text || ''
    result += `${prefix}- ${checkbox} ${text}\n`
    
    if (item.description?.trim()) {
      result += `${prefix}  > ${item.description}\n`
    }
    
    if (item.children?.length) {
      result += itemsToMarkdown(item.children, indent + 1)
    }
  }
  
  return result
}

export function markdownToItems(markdown) {
  const lines = markdown.split('\n').filter(l => l.trim())
  const root = { children: [] }
  const stack = [{ node: root, indent: -1 }]
  
  for (const line of lines) {
    const match = line.match(/^(\s*)[-*]\s*(?:\[([ x])\])?\s*(.*)$/)
    if (!match) continue
    
    const [, spaces, checkbox, text] = match
    const indent = spaces.length
    const completed = checkbox === 'x'
    
    const item = {
      id: crypto.randomUUID?.().slice(0, 8) || Math.random().toString(36).slice(2, 10),
      text: text.trim(),
      completed,
      children: [],
      open: true,
      description: ''
    }
    
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop()
    }
    
    stack[stack.length - 1].node.children.push(item)
    stack.push({ node: item, indent })
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
