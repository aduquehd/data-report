'use client'

import React from 'react'
import { Check } from 'lucide-react'

export interface ChartOption {
  id: string
  name: string
  enabled: boolean
}

const defaultCharts: ChartOption[] = [
  { id: 'thirty-min', name: '30-Minute Distribution', enabled: true },
  { id: 'weekday', name: 'Weekday Activity', enabled: true },
  { id: 'records-per-day', name: 'Records Per Day', enabled: true },
  { id: 'heatmap', name: 'Activity Heatmap', enabled: true },
  { id: 'boxplot', name: 'Value Distribution', enabled: true },
  { id: 'radar', name: 'Radar Chart', enabled: true },
  { id: 'cumulative', name: 'Cumulative Timeline', enabled: true },
]

interface ChartSelectorProps {
  selectedCharts: ChartOption[]
  onSelectionChange: (charts: ChartOption[]) => void
  compact?: boolean
}

export default function ChartSelector({ 
  selectedCharts, 
  onSelectionChange, 
  compact = false 
}: ChartSelectorProps) {
  const handleToggle = (chartId: string) => {
    const updated = selectedCharts.map(chart => 
      chart.id === chartId ? { ...chart, enabled: !chart.enabled } : chart
    )
    onSelectionChange(updated)
  }

  const handleReset = () => {
    const reset = selectedCharts.map(chart => ({ ...chart, enabled: true }))
    onSelectionChange(reset)
  }

  const enabledCount = selectedCharts.filter(c => c.enabled).length

  return (
    <div className={compact ? "chart-selector-compact" : "chart-selector"}>
      <div className="selector-header">
        <h2 className="selector-title">SELECT CHARTS TO DISPLAY</h2>
        <span className="chart-count">{enabledCount} of {selectedCharts.length} selected</span>
      </div>
      
      <div className={compact ? "chart-options-grid-compact" : "chart-options-grid"}>
        {selectedCharts.map(chart => (
          <label 
            key={chart.id} 
            className={`chart-option ${chart.enabled ? 'selected' : ''}`}
          >
            <input
              type="checkbox"
              checked={chart.enabled}
              onChange={() => handleToggle(chart.id)}
              className="sr-only"
            />
            <div className="checkbox-custom">
              {chart.enabled && <Check size={14} />}
            </div>
            <span className="chart-name">{chart.name}</span>
          </label>
        ))}
      </div>

      <button 
        onClick={handleReset}
        className="btn-reset"
        disabled={enabledCount === selectedCharts.length}
      >
        Reset All
      </button>
    </div>
  )
}

export { defaultCharts }