// Convert "HH:MM" (24hr) → "hh:MM AM/PM" for display
export function to12hr(time24: string): string {
  if (!time24 || time24 === '--') return '--'
  const [hStr, mStr] = time24.split(':')
  let h = parseInt(hStr, 10)
  const m = mStr || '00'
  const ampm = h >= 12 ? 'PM' : 'AM'
  if (h === 0) h = 12
  else if (h > 12) h = h - 12
  return `${h}:${m} ${ampm}`
}

// Convert "hh:MM" + "AM"/"PM" → "HH:MM" (24hr) for storage/calc
export function to24hr(hour12: string, minute: string, ampm: string): string {
  let h = parseInt(hour12, 10)
  if (ampm === 'AM') {
    if (h === 12) h = 0
  } else {
    if (h !== 12) h = h + 12
  }
  return `${h.toString().padStart(2, '0')}:${minute}`
}

// Parse a stored "HH:MM" 24hr string into 12hr parts
export function parse24hr(time24: string): { hour: string; minute: string; ampm: string } {
  if (!time24 || !time24.includes(':')) return { hour: '12', minute: '00', ampm: 'AM' }
  const [hStr, mStr] = time24.split(':')
  let h = parseInt(hStr, 10)
  const ampm = h >= 12 ? 'PM' : 'AM'
  if (h === 0) h = 12
  else if (h > 12) h = h - 12
  return { hour: h.toString(), minute: mStr || '00', ampm }
}
