'use client'

import { useState, useEffect } from 'react'
import { ChartOption, defaultCharts } from '@/components/ChartSelector'

const STORAGE_KEY = 'data-report-chart-selection'

export function useChartSelection() {
  const [selectedCharts, setSelectedCharts] = useState<ChartOption[]>(defaultCharts)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as ChartOption[]
        // Merge with default charts to handle any new charts added
        const merged = defaultCharts.map(defaultChart => {
          const stored = parsed.find(c => c.id === defaultChart.id)
          return stored || defaultChart
        })
        setSelectedCharts(merged)
      }
    } catch (error) {
      console.error('Error loading chart selection:', error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save to localStorage whenever selection changes
  const updateSelection = (charts: ChartOption[]) => {
    setSelectedCharts(charts)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(charts))
    } catch (error) {
      console.error('Error saving chart selection:', error)
    }
  }

  const getEnabledChartIds = () => {
    return selectedCharts.filter(c => c.enabled).map(c => `${c.id}-chart`)
  }

  return {
    selectedCharts,
    updateSelection,
    getEnabledChartIds,
    isLoaded
  }
}