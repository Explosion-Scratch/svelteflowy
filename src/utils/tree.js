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
  
  const lowerQuery = query.toLowerCase()
  const matches = new Set()
  
  function nodeMatches(item) {
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
