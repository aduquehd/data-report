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
 */
export function parseDateTime(value: unknown): Date | null {
  if (!value) return null
  
  const strValue = String(value).trim()
  
  // Check for Unix timestamps
  if (/^\d{10}$/.test(strValue)) {
    return new Date(parseInt(strValue) * 1000)
  }
  if (/^\d{13}$/.test(strValue)) {
    return new Date(parseInt(strValue))
  }
  
  // Try standard parsing
  const date = new Date(strValue)
  if (!isNaN(date.getTime())) {
    return date
  }
  
  // Try alternative formats
  // MM/DD/YYYY or M/D/YYYY
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