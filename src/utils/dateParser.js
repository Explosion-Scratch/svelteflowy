import * as chrono from 'chrono-node'

export function parseDate(query, referenceDate = new Date()) {
  if (!query || !query.trim()) return null
  
  const results = chrono.parse(query, referenceDate, { forwardDate: true })
  if (results.length === 0) return null
  
  const parsed = results[0]
  const date = parsed.start.date()
  
  return {
    date,
    text: parsed.text,
    hasTime: parsed.start.isCertain('hour')
  }
}

export function formatRelativeTime(date, now = new Date()) {
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.round(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.round(diffMs / (1000 * 60))
  
  if (diffMinutes >= 0 && diffMinutes < 60) {
    if (diffMinutes === 0) return 'Now'
    if (diffMinutes === 1) return 'In 1 minute'
    return `In ${diffMinutes} minutes`
  }
  
  if (diffHours >= 0 && diffHours < 24) {
    if (diffHours === 1) return 'In 1 hour'
    return `In ${diffHours} hours`
  }
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  
  if (diffDays > 1 && diffDays <= 14) {
    return `In ${diffDays} days`
  }
  
  if (diffDays < -1 && diffDays >= -14) {
    return `${Math.abs(diffDays)} days ago`
  }
  
  return formatAbsoluteDate(date, now)
}

export function formatAbsoluteDate(date, now = new Date()) {
  const sameYear = date.getFullYear() === now.getFullYear()
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayName = dayNames[date.getDay()]
  
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  let hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  if (hours === 0) hours = 12
  
  const timeStr = minutes > 0 
    ? `${hours}:${minutes.toString().padStart(2, '0')}${ampm}`
    : `${hours}${ampm}`
  
  if (sameYear) {
    return `${dayName} ${month}/${day}, ${timeStr}`
  }
  
  return `${dayName}, ${month}/${day}/${date.getFullYear().toString().slice(-2)}`
}

export function formatDateForSearch(date) {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getWeekRange(dateStr) {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return null
  
  const dayOfWeek = date.getDay()
  const start = new Date(date)
  start.setDate(date.getDate() - dayOfWeek)
  start.setHours(0, 0, 0, 0)
  
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  
  return { start, end }
}

export function getMonthRange(monthInput, referenceYear = new Date().getFullYear()) {
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ]
  const monthAbbrevs = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
  
  let monthIndex = -1
  const input = monthInput.toString().toLowerCase().trim()
  
  const numMonth = parseInt(input, 10)
  if (!isNaN(numMonth) && numMonth >= 1 && numMonth <= 12) {
    monthIndex = numMonth - 1
  } else {
    monthIndex = monthNames.findIndex(m => m.startsWith(input))
    if (monthIndex === -1) {
      monthIndex = monthAbbrevs.findIndex(m => m === input)
    }
  }
  
  if (monthIndex === -1) return null
  
  const start = new Date(referenceYear, monthIndex, 1, 0, 0, 0, 0)
  const end = new Date(referenceYear, monthIndex + 1, 0, 23, 59, 59, 999)
  
  return { start, end }
}

export function getYearRange(yearInput) {
  const year = parseInt(yearInput, 10)
  if (isNaN(year) || year < 1900 || year > 2200) return null
  
  const start = new Date(year, 0, 1, 0, 0, 0, 0)
  const end = new Date(year, 11, 31, 23, 59, 59, 999)
  
  return { start, end }
}

export function getDayRange(dateStr) {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return null
  
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)
  
  return { start, end }
}

export function extractDateFromRef(text) {
  const match = text.match(/@date\[([^\]]+)\]/)
  if (!match) return null
  
  const date = new Date(match[1])
  if (isNaN(date.getTime())) return null
  
  return date
}

export function extractAllDatesFromText(text) {
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
