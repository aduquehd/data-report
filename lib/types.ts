export interface DataPoint {
  timestamp: Date
  value: number
  [key: string]: unknown
}

export interface ProcessedDatasets {
  full: DataPoint[]
  sampled: DataPoint[]
  aggregated: {
    hourly: Map<number, { count: number; avgValue: number; values: number[] }>
    daily: Map<string, { count: number; avgValue: number; timestamp: Date }>
    weekly: Map<number, { count: number; avgValue: number }>
  }
}

export interface ParsedData {
  data: DataPoint[]
  columns: string[]
  processed?: ProcessedDatasets
}

export interface ChartDimensions {
  width: number
  height: number
  margin: {
    top: number
    right: number
    bottom: number
    left: number
  }
}