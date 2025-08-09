import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function calculateStatistics(values: number[]) {
  const n = values.length
  if (n === 0) return null

  const sorted = [...values].sort((a, b) => a - b)
  const sum = values.reduce((a, b) => a + b, 0)
  const mean = sum / n
  const median = n % 2 === 0 
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 
    : sorted[Math.floor(n / 2)]
  
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n
  const stdDev = Math.sqrt(variance)

  return {
    count: n,
    sum,
    mean,
    median,
    min: sorted[0],
    max: sorted[n - 1],
    stdDev,
    q1: sorted[Math.floor(n * 0.25)],
    q3: sorted[Math.floor(n * 0.75)],
  }
}