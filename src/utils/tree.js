export function findItem(tree, id) {
  if (tree.id === id) return tree
  if (!tree.children) return null
  for (const child of tree.children) {
    const found = findItem(child, id)
    if (found) return found
  }
  return null
}

export function findParent(tree, id, parent = null) {
  if (tree.id === id) return parent
  if (!tree.children) return null
  for (const child of tree.children) {
    const found = findParent(child, id, tree)
    if (found) return found
  }
  return null
}

export function findItemIndex(parent, id) {
  if (!parent?.children) return -1
  return parent.children.findIndex(c => c.id === id)
}

export function filterTree(tree, query) {
  if (!query?.trim()) return { tree, matches: new Set() }
  
  const matches = new Set()
  
  const dateFilter = parseDateFilter(query)
  
  function nodeMatches(item) {
    if (dateFilter) {
      return itemMatchesDateFilter(item, dateFilter)
    }
    
    const lowerQuery = query.toLowerCase()
    const textMatch = item.text?.toLowerCase().includes(lowerQuery)
    const descMatch = item.description?.toLowerCase().includes(lowerQuery)
    return textMatch || descMatch
  }
  
  function filterNode(item) {
    const selfMatches = nodeMatches(item)
    
    let filteredChildren = []
    let hasMatchingChild = false
    
    if (item.children?.length) {
      for (const child of item.children) {
        const result = filterNode(child)
        if (result) {
          filteredChildren.push(result)
          hasMatchingChild = true
        }
      }
    }
    
    if (selfMatches || hasMatchingChild) {
      if (selfMatches) matches.add(item.id)
      return {
        ...item,
        children: filteredChildren,
        open: true
      }
    }
    
    return null
  }
  
  const result = filterNode(tree)
  return { tree: result || tree, matches }
}

function parseDateFilter(query) {
  const dayMatch = query.match(/^day:(\d{4}-\d{2}-\d{2})$/i)
  if (dayMatch) {
    const date = new Date(dayMatch[1])
    if (!isNaN(date.getTime())) {
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setHours(23, 59, 59, 999)
      return { start, end }
    }
  }
  
  const weekMatch = query.match(/^week:(\d{4}-\d{2}-\d{2})$/i)
  if (weekMatch) {
    const date = new Date(weekMatch[1])
    if (!isNaN(date.getTime())) {
      const dayOfWeek = date.getDay()
      const start = new Date(date)
      start.setDate(date.getDate() - dayOfWeek)
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
      return { start, end }
    }
  }
  
  const monthMatch = query.match(/^month:(\w+)$/i)
  if (monthMatch) {
    const monthInput = monthMatch[1]
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
    const monthAbbrevs = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    
    let monthIndex = -1
    const input = monthInput.toLowerCase().trim()
    const numMonth = parseInt(input, 10)
    
    if (!isNaN(numMonth) && numMonth >= 1 && numMonth <= 12) {
      monthIndex = numMonth - 1
    } else {
      monthIndex = monthNames.findIndex(m => m.startsWith(input))
      if (monthIndex === -1) {
        monthIndex = monthAbbrevs.findIndex(m => m === input)
      }
    }
    
    if (monthIndex !== -1) {
      const year = new Date().getFullYear()
      const start = new Date(year, monthIndex, 1, 0, 0, 0, 0)
      const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999)
      return { start, end }
    }
  }
  
  const yearMatch = query.match(/^year:(\d{4})$/i)
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10)
    if (!isNaN(year) && year >= 1900 && year <= 2200) {
      const start = new Date(year, 0, 1, 0, 0, 0, 0)
      const end = new Date(year, 11, 31, 23, 59, 59, 999)
      return { start, end }
    }
  }
  
  return null
}

function itemMatchesDateFilter(item, filter) {
  const datesInText = extractDatesFromText(item.text || '')
  const datesInDesc = extractDatesFromText(item.description || '')
  const allDates = [...datesInText, ...datesInDesc]
  
  return allDates.some(date => date >= filter.start && date <= filter.end)
}

function extractDatesFromText(text) {
  const dates = []
  const regex = /@date\[([^\]]+)\]/g
  let match
  
  while ((match = regex.exec(text)) !== null) {
    const date = new Date(match[1])
    if (!isNaN(date.getTime())) {
      dates.push(date)
    }
  }
  
  return dates
}

export function flattenTree(tree, depth = 0) {
  const items = [{ ...tree, depth }]
  if (tree.children?.length && tree.open !== false) {
    for (const child of tree.children) {
      items.push(...flattenTree(child, depth + 1))
    }
  }
  return items
}

export function flattenVisibleTree(tree) {
  const items = []
  
  function traverse(node) {
    items.push(node)
    if (node.children?.length && node.open !== false) {
      for (const child of node.children) {
        traverse(child)
      }
    }
  }
  
  if (tree.children) {
    for (const child of tree.children) {
      traverse(child)
    }
  }
  
  return items
}

export function findLastVisibleChild(item) {
  if (!item.children?.length || !item.open) {
    return item
  }
  const lastChild = item.children[item.children.length - 1]
  return findLastVisibleChild(lastChild)
}

export function getAncestorPath(tree, targetId) {
  const path = []
  
  function findPath(node, target) {
    if (node.id === target) {
      return true
    }
    if (node.children) {
      for (const child of node.children) {
        if (findPath(child, target)) {
          path.unshift(node)
          return true
        }
      }
    }
    return false
  }
  
  findPath(tree, targetId)
  return path
}

export function pathTo(tree, id, currentPath = '') {
  if (tree.id === id) return currentPath
  if (!tree.children) return null
  
  for (let i = 0; i < tree.children.length; i++) {
    const child = tree.children[i]
    const path = currentPath ? `${currentPath}.children.${i}` : `children.${i}`
    const found = pathTo(child, id, path)
    if (found !== null) return found
  }
  return null
}

export function cloneTree(tree) {
  return JSON.parse(JSON.stringify(tree))
}
