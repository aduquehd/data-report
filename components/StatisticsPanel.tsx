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