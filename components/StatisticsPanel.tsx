'use client'

import { DataPoint } from '@/lib/types'
import { calculateStatistics } from '@/lib/utils'

interface StatisticsPanelProps {
  data: DataPoint[]
}

export default function StatisticsPanel({ data }: StatisticsPanelProps) {
  const values = data.map(d => d.value)
  const stats = calculateStatistics(values)

  if (!stats) return null

  // Check if all values are 1 (timestamp-only data)
  const isTimestampOnly = values.every(v => v === 1)

  if (isTimestampOnly) {
    // Show time-based statistics for timestamp-only data
    const timestamps = data.map(d => d.timestamp.getTime())
    const minTime = new Date(Math.min(...timestamps))
    const maxTime = new Date(Math.max(...timestamps))
    const duration = maxTime.getTime() - minTime.getTime()
    const avgInterval = duration / (data.length - 1)
    
    const formatCompactDate = (date: Date) => {
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${month}/${day} ${hours}:${minutes}`
    }
    
    const statItems = [
      { label: 'Total Events', value: stats.count.toLocaleString() },
      { label: 'First Event', value: formatCompactDate(minTime) },
      { label: 'Last Event', value: formatCompactDate(maxTime) },
      { label: 'Avg Interval', value: `${Math.floor(avgInterval / 1000)}s` },
      { label: 'Events/Hour', value: (data.length / (duration / (1000 * 60 * 60))).toFixed(1) },
    ]
    
    return (
      <div className="stats-panel">
        <div className="stats-grid">
          {statItems.map((item) => (
            <div key={item.label} className="stat-item">
              <p className="stat-label">{item.label}</p>
              <p className="stat-value">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Show value-based statistics for data with numeric columns
  const statItems = [
    { label: 'Total Events', value: stats.count.toLocaleString() },
    { label: 'Mean', value: stats.mean.toFixed(2) },
    { label: 'Median', value: stats.median.toFixed(2) },
    { label: 'Std Dev', value: stats.stdDev.toFixed(2) },
    { label: 'Min', value: stats.min.toFixed(2) },
    { label: 'Max', value: stats.max.toFixed(2) },
  ]

  return (
    <div className="stats-panel">
      <div className="stats-grid">
        {statItems.map((item) => (
          <div key={item.label} className="stat-item">
            <p className="stat-label">{item.label}</p>
            <p className="stat-value">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}