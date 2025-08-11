'use client'

import { Globe } from 'lucide-react'
import Select, { GroupBase, StylesConfig } from 'react-select'
import { TIMEZONE_GROUPS, TIMEZONE_OPTIONS, TimezoneOption, getCurrentTimeInTimezone } from '@/lib/timezoneData'
import { useMemo } from 'react'

interface TimezoneSelectorProps {
  selectedTimezone: string
  onTimezoneChange: (timezone: string) => void
}

// Custom styles for react-select to match our dark theme
const customStyles: StylesConfig<TimezoneOption, false, GroupBase<TimezoneOption>> = {
  control: (base, state) => ({
    ...base,
    background: 'rgba(15, 20, 25, 0.5)',
    borderColor: state.isFocused ? '#00d4ff' : 'rgba(100, 116, 139, 0.3)',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(0, 212, 255, 0.1)' : 'none',
    '&:hover': {
      borderColor: '#00d4ff',
      background: 'rgba(26, 31, 46, 0.8)',
    },
    minHeight: '42px',
    borderRadius: '8px',
  }),
  menu: (base) => ({
    ...base,
    background: '#1a1f2e',
    border: '1px solid rgba(100, 116, 139, 0.3)',
    borderRadius: '8px',
    marginTop: '4px',
    zIndex: 9999,
  }),
  menuList: (base) => ({
    ...base,
    maxHeight: '300px',
    padding: '4px',
  }),
  option: (base, state) => ({
    ...base,
    background: state.isSelected 
      ? 'rgba(0, 212, 255, 0.2)' 
      : state.isFocused 
        ? 'rgba(0, 212, 255, 0.1)' 
        : 'transparent',
    color: state.isSelected ? '#00d4ff' : '#e0e6ed',
    cursor: 'pointer',
    padding: '10px 12px',
    borderRadius: '4px',
    '&:active': {
      background: 'rgba(0, 212, 255, 0.3)',
    },
  }),
  singleValue: (base) => ({
    ...base,
    color: '#e0e6ed',
  }),
  input: (base) => ({
    ...base,
    color: '#e0e6ed',
  }),
  placeholder: (base) => ({
    ...base,
    color: '#64748b',
  }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? '#00d4ff' : '#64748b',
    '&:hover': {
      color: '#00d4ff',
    },
  }),
  clearIndicator: (base) => ({
    ...base,
    color: '#64748b',
    '&:hover': {
      color: '#ff6b6b',
    },
  }),
  indicatorSeparator: (base) => ({
    ...base,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
  }),
  groupHeading: (base) => ({
    ...base,
    color: '#00d4ff',
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: '8px 12px',
  }),
  noOptionsMessage: (base) => ({
    ...base,
    color: '#64748b',
  }),
}

// Format option label with additional info
const formatOptionLabel = (option: TimezoneOption) => {
  const currentTime = getCurrentTimeInTimezone(option.value)
  const browserTz = option.value === 'browser' ? Intl.DateTimeFormat().resolvedOptions().timeZone : null
  
  return (
    <div className="timezone-option">
      <div className="timezone-main">
        <span className="timezone-name">{option.label}</span>
        {option.abbrev && <span className="timezone-abbrev">{option.abbrev}</span>}
      </div>
      <div className="timezone-meta">
        {option.value === 'browser' && browserTz && (
          <span className="timezone-browser">({browserTz})</span>
        )}
        <span className="timezone-offset">{option.offset}</span>
        {currentTime && <span className="timezone-time">{currentTime}</span>}
      </div>
    </div>
  )
}

export default function TimezoneSelector({ selectedTimezone, onTimezoneChange }: TimezoneSelectorProps) {
  const selectedOption = useMemo(() => {
    return TIMEZONE_OPTIONS.find(tz => tz.value === selectedTimezone) || TIMEZONE_OPTIONS[0]
  }, [selectedTimezone])
  
  const handleChange = (option: TimezoneOption | null) => {
    if (option) {
      onTimezoneChange(option.value)
    }
  }
  
  return (
    <div className="timezone-selector-section">
      <div className="section-header">
        <Globe size={18} />
        <h3>TIMEZONE SETTING</h3>
        <span className="section-hint">Select timezone before loading data</span>
      </div>
      
      <div className="timezone-selector-container">
        <Select<TimezoneOption>
          value={selectedOption}
          onChange={handleChange}
          options={TIMEZONE_GROUPS}
          styles={customStyles}
          placeholder="Search for a timezone..."
          isClearable={false}
          isSearchable={true}
          formatOptionLabel={formatOptionLabel}
          filterOption={(option, inputValue) => {
            const searchValue = inputValue.toLowerCase()
            return (
              option.data.label.toLowerCase().includes(searchValue) ||
              option.data.value.toLowerCase().includes(searchValue) ||
              (option.data.abbrev && option.data.abbrev.toLowerCase().includes(searchValue)) ||
              option.data.offset.includes(searchValue)
            )
          }}
          classNamePrefix="timezone-select"
        />
      </div>
    </div>
  )
}