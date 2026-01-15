
export function removeIdsFromTree(tree, idSet) {
  if (!tree.children) return

  tree.children = tree.children.filter(c => !idSet.has(c.id))
  tree.children.forEach(child => removeIdsFromTree(child, idSet))
}

export function extractIdsFromTree(tree, idList) {
  const extracted = []
  
  function traverse(node) {
    if (!node.children) return
    
    const removed = []
    node.children = node.children.filter(child => {
      if (idList.includes(child.id)) {
        removed.push(child)
        return false
      }
      return true
    })
    
    extracted.push(...removed)
    node.children.forEach(traverse)
  }
  
  traverse(tree)
  return extracted
}

export function updateIdsInTree(tree, idSet, updateFn) {
  function traverse(node) {
    if (idSet.has(node.id)) {
      updateFn(node)
    }
    node.children?.forEach(traverse)
  }
  traverse(tree)
}

export function collectIdsFromTree(tree, idSet) {
  const collected = []
  
  function traverse(node) {
    if (idSet.has(node.id)) {
      collected.push(node)
      // If we want to collect children of selected items too, we might need to adjust.
      // But the original logic in itemStore.js (copySelected) stops recursion if parent is selected?
      // Let's check the original code.
      return 
    }
    node.children?.forEach(traverse)
  }
  // The original code passed 'root' to collectItems.
  
  // Wait, let's look at the original copySelected logic carefully.
  /*
    function collectItems(node) {
      if (sel.has(node.id)) {
        itemsToCopy.push(cloneTree(node))
        return
      }
      node.children?.forEach(collectItems)
    }
  */
  // It stops at the selected node, effectively copying the subtree.
  
  traverse(tree)
  return collected
}
