export interface TimezoneOption {
  value: string
  label: string
  offset: string
  abbrev?: string
  altName?: string
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  // Browser Default
  { value: 'browser', label: 'Browser Timezone', offset: 'Auto' },
  
  // UTC
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', offset: '+00:00', abbrev: 'UTC' },
  
  // Americas
  { value: 'America/New_York', label: 'New York (Eastern Time)', offset: '-05:00', abbrev: 'EST/EDT' },
  { value: 'America/Chicago', label: 'Chicago (Central Time)', offset: '-06:00', abbrev: 'CST/CDT' },
  { value: 'America/Denver', label: 'Denver (Mountain Time)', offset: '-07:00', abbrev: 'MST/MDT' },
  { value: 'America/Phoenix', label: 'Phoenix (Mountain Time - No DST)', offset: '-07:00', abbrev: 'MST' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (Pacific Time)', offset: '-08:00', abbrev: 'PST/PDT' },
  { value: 'America/Anchorage', label: 'Anchorage (Alaska Time)', offset: '-09:00', abbrev: 'AKST/AKDT' },
  { value: 'Pacific/Honolulu', label: 'Honolulu (Hawaii Time)', offset: '-10:00', abbrev: 'HST' },
  { value: 'America/Toronto', label: 'Toronto (Eastern Time)', offset: '-05:00', abbrev: 'EST/EDT' },
  { value: 'America/Vancouver', label: 'Vancouver (Pacific Time)', offset: '-08:00', abbrev: 'PST/PDT' },
  { value: 'America/Mexico_City', label: 'Mexico City (Central Time)', offset: '-06:00', abbrev: 'CST' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (Brasilia Time)', offset: '-03:00', abbrev: 'BRT' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires (Argentina Time)', offset: '-03:00', abbrev: 'ART' },
  { value: 'America/Santiago', label: 'Santiago (Chile Time)', offset: '-03:00', abbrev: 'CLT/CLST' },
  { value: 'America/Lima', label: 'Lima (Peru Time)', offset: '-05:00', abbrev: 'PET' },
  { value: 'America/Bogota', label: 'Bogotá (Colombia Time)', offset: '-05:00', abbrev: 'COT' },
  { value: 'America/Caracas', label: 'Caracas (Venezuela Time)', offset: '-04:00', abbrev: 'VET' },
  { value: 'America/Halifax', label: 'Halifax (Atlantic Time)', offset: '-04:00', abbrev: 'AST/ADT' },
  { value: 'America/St_Johns', label: "St. John's (Newfoundland Time)", offset: '-03:30', abbrev: 'NST/NDT' },
  
  // Europe
  { value: 'Europe/London', label: 'London (Greenwich Mean Time)', offset: '+00:00', abbrev: 'GMT/BST' },
  { value: 'Europe/Dublin', label: 'Dublin (Irish Time)', offset: '+00:00', abbrev: 'GMT/IST' },
  { value: 'Europe/Lisbon', label: 'Lisbon (Western European Time)', offset: '+00:00', abbrev: 'WET/WEST' },
  { value: 'Europe/Paris', label: 'Paris (Central European Time)', offset: '+01:00', abbrev: 'CET/CEST' },
  { value: 'Europe/Berlin', label: 'Berlin (Central European Time)', offset: '+01:00', abbrev: 'CET/CEST' },
  { value: 'Europe/Rome', label: 'Rome (Central European Time)', offset: '+01:00', abbrev: 'CET/CEST' },
  { value: 'Europe/Madrid', label: 'Madrid (Central European Time)', offset: '+01:00', abbrev: 'CET/CEST' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (Central European Time)', offset: '+01:00', abbrev: 'CET/CEST' },
  { value: 'Europe/Brussels', label: 'Brussels (Central European Time)', offset: '+01:00', abbrev: 'CET/CEST' },
  { value: 'Europe/Vienna', label: 'Vienna (Central European Time)', offset: '+01:00', abbrev: 'CET/CEST' },
  { value: 'Europe/Warsaw', label: 'Warsaw (Central European Time)', offset: '+01:00', abbrev: 'CET/CEST' },
  { value: 'Europe/Stockholm', label: 'Stockholm (Central European Time)', offset: '+01:00', abbrev: 'CET/CEST' },
  { value: 'Europe/Copenhagen', label: 'Copenhagen (Central European Time)', offset: '+01:00', abbrev: 'CET/CEST' },
  { value: 'Europe/Oslo', label: 'Oslo (Central European Time)', offset: '+01:00', abbrev: 'CET/CEST' },
  { value: 'Europe/Zurich', label: 'Zurich (Central European Time)', offset: '+01:00', abbrev: 'CET/CEST' },
  { value: 'Europe/Athens', label: 'Athens (Eastern European Time)', offset: '+02:00', abbrev: 'EET/EEST' },
  { value: 'Europe/Helsinki', label: 'Helsinki (Eastern European Time)', offset: '+02:00', abbrev: 'EET/EEST' },
  { value: 'Europe/Bucharest', label: 'Bucharest (Eastern European Time)', offset: '+02:00', abbrev: 'EET/EEST' },
  { value: 'Europe/Istanbul', label: 'Istanbul (Turkey Time)', offset: '+03:00', abbrev: 'TRT' },
  { value: 'Europe/Moscow', label: 'Moscow (Moscow Time)', offset: '+03:00', abbrev: 'MSK' },
  { value: 'Europe/Kiev', label: 'Kyiv (Eastern European Time)', offset: '+02:00', abbrev: 'EET/EEST' },
  
  // Africa
  { value: 'Africa/Cairo', label: 'Cairo (Eastern European Time)', offset: '+02:00', abbrev: 'EET' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (South Africa Time)', offset: '+02:00', abbrev: 'SAST' },
  { value: 'Africa/Lagos', label: 'Lagos (West Africa Time)', offset: '+01:00', abbrev: 'WAT' },
  { value: 'Africa/Nairobi', label: 'Nairobi (East Africa Time)', offset: '+03:00', abbrev: 'EAT' },
  { value: 'Africa/Casablanca', label: 'Casablanca (Western European Time)', offset: '+00:00', abbrev: 'WET/WEST' },
  
  // Middle East
  { value: 'Asia/Dubai', label: 'Dubai (Gulf Time)', offset: '+04:00', abbrev: 'GST' },
  { value: 'Asia/Riyadh', label: 'Riyadh (Arabia Time)', offset: '+03:00', abbrev: 'AST' },
  { value: 'Asia/Jerusalem', label: 'Jerusalem (Israel Time)', offset: '+02:00', abbrev: 'IST/IDT' },
  { value: 'Asia/Beirut', label: 'Beirut (Eastern European Time)', offset: '+02:00', abbrev: 'EET/EEST' },
  { value: 'Asia/Kuwait', label: 'Kuwait (Arabia Time)', offset: '+03:00', abbrev: 'AST' },
  { value: 'Asia/Qatar', label: 'Doha (Arabia Time)', offset: '+03:00', abbrev: 'AST' },
  
  // Asia
  { value: 'Asia/Karachi', label: 'Karachi (Pakistan Time)', offset: '+05:00', abbrev: 'PKT' },
  { value: 'Asia/Kolkata', label: 'India (Kolkata/Mumbai/Delhi)', offset: '+05:30', abbrev: 'IST' },
  { value: 'Asia/Dhaka', label: 'Dhaka (Bangladesh Time)', offset: '+06:00', abbrev: 'BST' },
  { value: 'Asia/Kathmandu', label: 'Kathmandu (Nepal Time)', offset: '+05:45', abbrev: 'NPT' },
  { value: 'Asia/Colombo', label: 'Colombo (Sri Lanka Time)', offset: '+05:30', abbrev: 'IST' },
  { value: 'Asia/Yangon', label: 'Yangon (Myanmar Time)', offset: '+06:30', abbrev: 'MMT' },
  { value: 'Asia/Bangkok', label: 'Bangkok (Indochina Time)', offset: '+07:00', abbrev: 'ICT' },
  { value: 'Asia/Jakarta', label: 'Jakarta (Western Indonesia Time)', offset: '+07:00', abbrev: 'WIB' },
  { value: 'Asia/Singapore', label: 'Singapore (Singapore Time)', offset: '+08:00', abbrev: 'SGT' },
  { value: 'Asia/Kuala_Lumpur', label: 'Kuala Lumpur (Malaysia Time)', offset: '+08:00', abbrev: 'MYT' },
  { value: 'Asia/Manila', label: 'Manila (Philippine Time)', offset: '+08:00', abbrev: 'PHT' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (Hong Kong Time)', offset: '+08:00', abbrev: 'HKT' },
  { value: 'Asia/Shanghai', label: 'China (Beijing/Shanghai)', offset: '+08:00', abbrev: 'CST' },
  { value: 'Asia/Taipei', label: 'Taipei (Taiwan Time)', offset: '+08:00', abbrev: 'CST' },
  { value: 'Asia/Seoul', label: 'Seoul (Korea Time)', offset: '+09:00', abbrev: 'KST' },
  { value: 'Asia/Tokyo', label: 'Tokyo (Japan Time)', offset: '+09:00', abbrev: 'JST' },
  { value: 'Asia/Vladivostok', label: 'Vladivostok (Vladivostok Time)', offset: '+10:00', abbrev: 'VLAT' },
  
  // Oceania
  { value: 'Australia/Perth', label: 'Perth (Western Australia Time)', offset: '+08:00', abbrev: 'AWST' },
  { value: 'Australia/Adelaide', label: 'Adelaide (Central Australia Time)', offset: '+09:30', abbrev: 'ACST/ACDT' },
  { value: 'Australia/Darwin', label: 'Darwin (Central Australia Time)', offset: '+09:30', abbrev: 'ACST' },
  { value: 'Australia/Brisbane', label: 'Brisbane (Eastern Australia Time)', offset: '+10:00', abbrev: 'AEST' },
  { value: 'Australia/Sydney', label: 'Sydney (Eastern Australia Time)', offset: '+10:00', abbrev: 'AEST/AEDT' },
  { value: 'Australia/Melbourne', label: 'Melbourne (Eastern Australia Time)', offset: '+10:00', abbrev: 'AEST/AEDT' },
  { value: 'Australia/Hobart', label: 'Hobart (Tasmania Time)', offset: '+10:00', abbrev: 'AEST/AEDT' },
  { value: 'Pacific/Auckland', label: 'New Zealand (Auckland/Wellington)', offset: '+12:00', abbrev: 'NZST/NZDT' },
  { value: 'Pacific/Fiji', label: 'Fiji (Fiji Time)', offset: '+12:00', abbrev: 'FJT' },
  { value: 'Pacific/Guam', label: 'Guam (Chamorro Time)', offset: '+10:00', abbrev: 'ChST' },
  { value: 'Pacific/Port_Moresby', label: 'Port Moresby (Papua New Guinea Time)', offset: '+10:00', abbrev: 'PGT' },
  { value: 'Pacific/Noumea', label: 'Nouméa (New Caledonia Time)', offset: '+11:00', abbrev: 'NCT' },
  
  // Atlantic
  { value: 'Atlantic/Bermuda', label: 'Bermuda (Atlantic Time)', offset: '-04:00', abbrev: 'AST/ADT' },
  { value: 'Atlantic/Azores', label: 'Azores (Azores Time)', offset: '-01:00', abbrev: 'AZOT/AZOST' },
  { value: 'Atlantic/Cape_Verde', label: 'Cape Verde (Cape Verde Time)', offset: '-01:00', abbrev: 'CVT' },
  { value: 'Atlantic/Reykjavik', label: 'Reykjavik (Greenwich Mean Time)', offset: '+00:00', abbrev: 'GMT' },
]

// Group timezones by region for better organization
export const TIMEZONE_GROUPS = [
  {
    label: 'Suggested',
    options: [
      TIMEZONE_OPTIONS[0], // Browser
      TIMEZONE_OPTIONS[1], // UTC
      ...TIMEZONE_OPTIONS.slice(2, 7), // US timezones
    ]
  },
  {
    label: 'Americas',
    options: TIMEZONE_OPTIONS.filter(tz => 
      tz.value.startsWith('America/') || 
      tz.value.startsWith('Atlantic/') ||
      (tz.value === 'browser' ? false : false)
    )
  },
  {
    label: 'Europe',
    options: TIMEZONE_OPTIONS.filter(tz => tz.value.startsWith('Europe/'))
  },
  {
    label: 'Africa',
    options: TIMEZONE_OPTIONS.filter(tz => tz.value.startsWith('Africa/'))
  },
  {
    label: 'Asia',
    options: TIMEZONE_OPTIONS.filter(tz => tz.value.startsWith('Asia/'))
  },
  {
    label: 'Oceania',
    options: TIMEZONE_OPTIONS.filter(tz => 
      tz.value.startsWith('Australia/') || 
      tz.value.startsWith('Pacific/')
    )
  },
  {
    label: 'UTC',
    options: TIMEZONE_OPTIONS.filter(tz => tz.value === 'UTC')
  }
]

// Helper function to get current time in a timezone
export function getCurrentTimeInTimezone(timezone: string): string {
  if (timezone === 'browser') {
    return new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }
  
  try {
    return new Date().toLocaleTimeString('en-US', { 
      timeZone: timezone,
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  } catch {
    return ''
  }
}