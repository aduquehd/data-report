// Utility functions for detecting and parsing datetime columns

/**
 * Common datetime formats to check
 */
const DATE_FORMATS = [
  // ISO 8601 formats
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
  /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d{3})?$/,
  
  // Common date formats
  /^\d{4}-\d{2}-\d{2}$/,
  /^\d{2}\/\d{2}\/\d{4}$/,
  /^\d{1,2}\/\d{1,2}\/\d{4}$/,
  /^\d{4}\/\d{2}\/\d{2}$/,
  
  // With time
  /^\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{2}(:\d{2})?( [AP]M)?$/i,
  /^\d{4}-\d{2}-\d{2} \d{1,2}:\d{2}(:\d{2})?$/,
  
  // Unix timestamps (10 or 13 digits)
  /^\d{10}$/,
  /^\d{13}$/,
]

/**
 * Check if a value appears to be a datetime
 */
export function isDateTime(value: unknown): boolean {
  if (!value) return false
  
  const strValue = String(value).trim()
  
  // Check against common patterns
  for (const pattern of DATE_FORMATS) {
    if (pattern.test(strValue)) {
      // Try to parse as date to validate
      const parsed = parseDateTime(strValue)
      if (parsed && !isNaN(parsed.getTime())) {
        return true
      }
    }
  }
  
  // Try parsing directly as a fallback
  const date = new Date(strValue)
  return !isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100
}

/**
 * Parse a datetime value into a Date object
 * @param value - The value to parse
 * @param timezone - The timezone to interpret the date in (default: 'browser')
 */
export function parseDateTime(value: unknown, timezone: string = 'browser'): Date | null {
  if (!value) return null
  
  const strValue = String(value).trim()
  
  // Check for Unix timestamps (always UTC)
  if (/^\d{10}$/.test(strValue)) {
    return new Date(parseInt(strValue) * 1000)
  }
  if (/^\d{13}$/.test(strValue)) {
    return new Date(parseInt(strValue))
  }
  
  // If the string contains timezone info (Z or +/-), parse it directly
  if (strValue.includes('Z') || /[+-]\d{2}:\d{2}/.test(strValue)) {
    const date = new Date(strValue)
    return !isNaN(date.getTime()) ? date : null
  }
  
  // For dates without timezone info, we need to interpret them in the selected timezone
  if (timezone === 'browser') {
    // Use browser's local timezone (JavaScript default behavior)
    const date = new Date(strValue)
    if (!isNaN(date.getTime())) {
      return date
    }
    
    // Try alternative formats for browser timezone
    const mmddyyyy = strValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(.*)$/)
    if (mmddyyyy) {
      const [, month, day, year, rest] = mmddyyyy
      const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}${rest}`
      const parsed = new Date(dateStr)
      if (!isNaN(parsed.getTime())) {
        return parsed
      }
    }
    
    return null
  }
  
  // For specific timezones, interpret the date string as being in that timezone
  try {
    // Parse date components from the string
    let year: string, month: string, day: string, hour: string = '0', minute: string = '0', second: string = '0'
    
    // Try different date formats
    const isoMatch = strValue.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}):(\d{2}))?/)
    const usMatch = strValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?: (\d{1,2}):(\d{2})(?::(\d{2}))?)?/)
    
    if (isoMatch) {
      [, year, month, day, hour = '0', minute = '0', second = '0'] = isoMatch
    } else if (usMatch) {
      [, month, day, year, hour = '0', minute = '0', second = '0'] = usMatch
    } else {
      // Fallback to browser parsing
      const date = new Date(strValue)
      if (!isNaN(date.getTime())) {
        year = date.getFullYear().toString()
        month = (date.getMonth() + 1).toString()
        day = date.getDate().toString()
        hour = date.getHours().toString()
        minute = date.getMinutes().toString()
        second = date.getSeconds().toString()
      } else {
        return null
      }
    }
    
    // Create a date string that explicitly sets the timezone
    // Using a format that includes timezone will ensure correct interpretation
    const dateInTz = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}`)
    
    if (isNaN(dateInTz.getTime())) {
      return null
    }
    
    // The date is now in browser's local time, but we need to adjust it
    // to represent the same wall clock time in the target timezone
    
    // Get the offset difference between browser timezone and target timezone
    const browserOffset = dateInTz.getTimezoneOffset() // in minutes, negative for ahead of UTC
    const targetOffset = getTimezoneOffsetForDate(dateInTz, timezone) // in minutes
    const offsetDiff = browserOffset - targetOffset
    
    // Adjust the time by the offset difference
    const adjustedDate = new Date(dateInTz.getTime() + offsetDiff * 60 * 1000)
    
    return adjustedDate
  } catch (e) {
    console.error('Error parsing date with timezone:', e)
    // Fallback to simple parsing
    const date = new Date(strValue)
    return !isNaN(date.getTime()) ? date : null
  }
}

/**
 * Get timezone offset for a specific date in minutes
 */
function getTimezoneOffsetForDate(date: Date, timezone: string): number {
  try {
    // Format the date in the target timezone
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }))
    // Format the date in UTC
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
    // Calculate offset in minutes (positive means behind UTC)
    return (utcDate.getTime() - tzDate.getTime()) / 60000
  } catch (error) {
    console.warn(`Invalid timezone ${timezone}, using default offset`)
    return 0
  }
}


/**
 * Detect datetime columns in a dataset
 * Returns the name of the first column that appears to contain datetime values
 */
export function detectDateTimeColumn(
  data: Record<string, unknown>[],
  sampleSize: number = 10
): string | null {
  if (!data || data.length === 0) return null
  
  const columns = Object.keys(data[0])
  const sample = data.slice(0, Math.min(sampleSize, data.length))
  
  // Check each column
  for (const column of columns) {
    let validDates = 0
    
    for (const row of sample) {
      if (isDateTime(row[column])) {
        validDates++
      }
    }
    
    // If at least 80% of sampled values are valid dates, consider it a datetime column
    if (validDates >= sample.length * 0.8) {
      return column
    }
  }
  
  return null
}

/**
 * Analyze a column to determine if it contains datetime values
 * More comprehensive than detectDateTimeColumn - checks entire column
 */
export function analyzeColumnForDateTime(
  data: Record<string, unknown>[],
  columnName: string
): { isDateTime: boolean; validRatio: number } {
  if (!data || data.length === 0) {
    return { isDateTime: false, validRatio: 0 }
  }
  
  let validDates = 0
  let totalNonNull = 0
  
  for (const row of data) {
    const value = row[columnName]
    if (value !== null && value !== undefined && value !== '') {
      totalNonNull++
      if (isDateTime(value)) {
        validDates++
      }
    }
  }
  
  const validRatio = totalNonNull > 0 ? validDates / totalNonNull : 0
  
  return {
    isDateTime: validRatio >= 0.8,
    validRatio
  }
}