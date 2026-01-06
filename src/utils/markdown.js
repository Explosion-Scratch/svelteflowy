export function extractHashtags(text) {
  if (!text) return []
  const regex = /#[\w-]+/g
  return [...text.matchAll(regex)].map(m => m[0])
}

export function parseCheckboxSyntax(text) {
  const match = text.match(/^\[([ x])\]\s*/)
  if (!match) return null
  return {
    checked: match[1] === 'x',
    rest: text.slice(match[0].length)
  }
}

export function stripHtml(html) {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent || ''
}

export function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
