export function formatDateWithTimezone(date: Date | string | number, timezone: string): Date {
  const inputDate = new Date(date)
  
  if (timezone === 'browser') {
    return inputDate
  }
  
  return inputDate
}

export function formatDateStringWithTimezone(
  date: Date | string | number, 
  timezone: string, 
  options?: Intl.DateTimeFormatOptions
): string {
  const inputDate = new Date(date)
  
  if (timezone === 'browser') {
    return inputDate.toLocaleString(undefined, options)
  }
  
  try {
    return inputDate.toLocaleString(undefined, {
      ...options,
      timeZone: timezone
    })
  } catch (error) {
    console.warn(`Invalid timezone ${timezone}, using browser timezone instead`)
    return inputDate.toLocaleString(undefined, options)
  }
}

export function getTimezoneOffset(date: Date, timezone: string): number {
  if (timezone === 'browser') {
    return date.getTimezoneOffset()
  }
  
  try {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }))
    return (utcDate.getTime() - tzDate.getTime()) / 60000
  } catch (error) {
    console.warn(`Invalid timezone ${timezone}, using browser timezone instead`)
    return date.getTimezoneOffset()
  }
}

export function convertToTimezone(date: Date | string | number, timezone: string): Date {
  const inputDate = new Date(date)
  
  if (timezone === 'browser') {
    return inputDate
  }
  
  try {
    const tzString = inputDate.toLocaleString('en-US', { timeZone: timezone })
    return new Date(tzString)
  } catch (error) {
    console.warn(`Invalid timezone ${timezone}, using browser timezone instead`)
    return inputDate
  }
}