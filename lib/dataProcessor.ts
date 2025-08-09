import { DataPoint } from './types'

export interface ProcessedDatasets {
  full: DataPoint[]
  sampled: DataPoint[]
  aggregated: {
    hourly: Map<number, { count: number; avgValue: number; values: number[] }>
    daily: Map<string, { count: number; avgValue: number; timestamp: Date }>
    weekly: Map<number, { count: number; avgValue: number }>
  }
}

export function processLargeDataset(data: DataPoint[]): ProcessedDatasets {
  const dataLength = data.length
  
  // Sort data by timestamp once
  const sortedData = [...data].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  
  // Sample data for visualization (max 500 points for smooth rendering)
  const sampleRate = Math.max(1, Math.floor(dataLength / 500))
  const sampled = sampleRate === 1 ? sortedData : sortedData.filter((_, index) => index % sampleRate === 0)
  
  // Aggregate data for better performance
  const hourly = new Map<number, { count: number; avgValue: number; values: number[] }>()
  const daily = new Map<string, { count: number; avgValue: number; timestamp: Date }>()
  const weekly = new Map<number, { count: number; avgValue: number }>()
  
  // Single pass through data for all aggregations
  sortedData.forEach(point => {
    const hour = point.timestamp.getHours()
    const day = point.timestamp.toISOString().split('T')[0]
    const weekDay = point.timestamp.getDay()
    
    // Hourly aggregation
    if (!hourly.has(hour)) {
      hourly.set(hour, { count: 0, avgValue: 0, values: [] })
    }
    const hourData = hourly.get(hour)!
    hourData.count++
    hourData.values.push(point.value)
    
    // Daily aggregation
    if (!daily.has(day)) {
      daily.set(day, { count: 0, avgValue: 0, timestamp: new Date(day) })
    }
    const dayData = daily.get(day)!
    dayData.count++
    dayData.avgValue = ((dayData.avgValue * (dayData.count - 1)) + point.value) / dayData.count
    
    // Weekly aggregation
    if (!weekly.has(weekDay)) {
      weekly.set(weekDay, { count: 0, avgValue: 0 })
    }
    const weekData = weekly.get(weekDay)!
    weekData.count++
    weekData.avgValue = ((weekData.avgValue * (weekData.count - 1)) + point.value) / weekData.count
  })
  
  // Calculate averages for hourly data
  hourly.forEach(hourData => {
    hourData.avgValue = hourData.values.reduce((a, b) => a + b, 0) / hourData.values.length
  })
  
  return {
    full: sortedData,
    sampled,
    aggregated: {
      hourly,
      daily,
      weekly
    }
  }
}

export function getDataSubset(data: DataPoint[], maxPoints: number = 1000): DataPoint[] {
  if (data.length <= maxPoints) return data
  
  const step = Math.ceil(data.length / maxPoints)
  return data.filter((_, index) => index % step === 0)
}

export function aggregateByTimeWindow(
  data: DataPoint[], 
  windowMs: number
): { timestamp: Date; value: number; count: number }[] {
  if (data.length === 0) return []
  
  const result: { timestamp: Date; value: number; count: number }[] = []
  const sorted = [...data].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  
  let currentWindow = new Date(Math.floor(sorted[0].timestamp.getTime() / windowMs) * windowMs)
  let currentSum = 0
  let currentCount = 0
  
  sorted.forEach(point => {
    const pointWindow = new Date(Math.floor(point.timestamp.getTime() / windowMs) * windowMs)
    
    if (pointWindow.getTime() !== currentWindow.getTime()) {
      if (currentCount > 0) {
        result.push({
          timestamp: currentWindow,
          value: currentSum / currentCount,
          count: currentCount
        })
      }
      currentWindow = pointWindow
      currentSum = point.value
      currentCount = 1
    } else {
      currentSum += point.value
      currentCount++
    }
  })
  
  if (currentCount > 0) {
    result.push({
      timestamp: currentWindow,
      value: currentSum / currentCount,
      count: currentCount
    })
  }
  
  return result
}