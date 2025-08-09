'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import FileUpload from '@/components/FileUpload'
import StatisticsPanel from '@/components/StatisticsPanel'
import ExportButton from '@/components/ExportButton'
import { ParsedData } from '@/lib/types'
import { getDataSubset } from '@/lib/dataProcessor'

const HourlyHistogram = dynamic(() => import('@/components/charts/HourlyHistogram'), { ssr: false })
const DailyHistogram = dynamic(() => import('@/components/charts/DailyHistogram'), { ssr: false })
const WeeklyPattern = dynamic(() => import('@/components/charts/WeeklyPattern'), { ssr: false })
const Heatmap = dynamic(() => import('@/components/charts/Heatmap'), { ssr: false })
const RadarChart = dynamic(() => import('@/components/charts/RadarChart'), { ssr: false })
const BoxPlot = dynamic(() => import('@/components/charts/BoxPlot'), { ssr: false })
const CumulativeLine = dynamic(() => import('@/components/charts/CumulativeLine'), { ssr: false })

// New charts
const RecordsPerDay = dynamic(() => import('@/components/charts/RecordsPerDay'), { ssr: false })
const RecordsByHour = dynamic(() => import('@/components/charts/RecordsByHour'), { ssr: false })
const ThirtyMinDistribution = dynamic(() => import('@/components/charts/ThirtyMinDistribution'), { ssr: false })
const WeekdayActivity = dynamic(() => import('@/components/charts/WeekdayActivity'), { ssr: false })

export default function Home() {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)

  // Use optimized data for different charts
  const chartData = useMemo(() => {
    if (!parsedData) return null

    const processed = parsedData.processed
    const dataLength = parsedData.data.length

    // For very large datasets, use sampled/aggregated data
    if (dataLength > 5000) {
      return {
        histogram: parsedData.data, // Histograms can handle more data
        heatmap: getDataSubset(parsedData.data, 2000),
        cumulative: processed?.sampled || getDataSubset(parsedData.data, 500),
        default: parsedData.data
      }
    } else if (dataLength > 1000) {
      return {
        histogram: parsedData.data,
        heatmap: parsedData.data,
        cumulative: getDataSubset(parsedData.data, 500),
        default: parsedData.data
      }
    }

    // For smaller datasets, use all data
    return {
      histogram: parsedData.data,
      heatmap: parsedData.data,
      cumulative: parsedData.data,
      default: parsedData.data
    }
  }, [parsedData])

  return (
    <main className="min-h-screen">
      <div className="container">
        <header className="header">
          <h1>Data Report Visualizer</h1>
          <p className="subtitle">
            Advanced timestamp data analysis and visualization
          </p>
          {parsedData && (
            <p className="data-info">
              Loaded {parsedData.data.length.toLocaleString()} records
              {parsedData.data.length > 5000 && ' (visualizations optimized for performance)'}
            </p>
          )}
        </header>

        {!parsedData ? (
          <FileUpload onDataLoaded={setParsedData} />
        ) : (
          <>
            <div className="controls">
              <button
                onClick={() => setParsedData(null)}
                className="btn btn-secondary"
              >
                ← Upload New File
              </button>
              <ExportButton />
            </div>

            <StatisticsPanel data={parsedData.data} />

            {chartData && (
              <div id="charts-container">
                <div className="charts-grid">
                  <HourlyHistogram data={chartData.histogram} />
                  <DailyHistogram data={chartData.histogram} />
                  <WeeklyPattern data={chartData.default} />
                  <Heatmap data={chartData.heatmap} />
                  <RadarChart data={chartData.default} />
                  <BoxPlot data={chartData.default} />
                  
                  {/* New Analytics Charts */}
                  <RecordsPerDay data={chartData.default} />
                  <RecordsByHour data={chartData.histogram} />
                  <ThirtyMinDistribution data={chartData.histogram} />
                  <WeekdayActivity data={chartData.default} />
                </div>
                <CumulativeLine data={chartData.cumulative} />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}