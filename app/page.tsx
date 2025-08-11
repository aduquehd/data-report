'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import FileUpload from '@/components/FileUpload'
import StatisticsPanel from '@/components/StatisticsPanel'
import ExportButton from '@/components/ExportButton'
import DownloadImagesButton from '@/components/DownloadImagesButton'
import ChartSelector from '@/components/ChartSelector'
import ChartSelectorModal from '@/components/ChartSelectorModal'
import { ParsedData } from '@/lib/types'
import { getDataSubset } from '@/lib/dataProcessor'
import { useChartSelection } from '@/lib/useChartSelection'
import { Settings2 } from 'lucide-react'

const ThirtyMinDistribution = dynamic(() => import('@/components/charts/ThirtyMinDistribution'), { ssr: false })
const WeekdayActivity = dynamic(() => import('@/components/charts/WeekdayActivity'), { ssr: false })
const RecordsPerDay = dynamic(() => import('@/components/charts/RecordsPerDay'), { ssr: false })
const Heatmap = dynamic(() => import('@/components/charts/Heatmap'), { ssr: false })
const BoxPlot = dynamic(() => import('@/components/charts/BoxPlot'), { ssr: false })
const WeeklyPattern = dynamic(() => import('@/components/charts/WeeklyPattern'), { ssr: false })
const RadarChart = dynamic(() => import('@/components/charts/RadarChart'), { ssr: false })
const CumulativeLine = dynamic(() => import('@/components/charts/CumulativeLine'), { ssr: false })

export default function Home() {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { selectedCharts, updateSelection, getEnabledChartIds, isLoaded } = useChartSelection()

  // Use optimized data for different charts
  const chartData = useMemo(() => {
    if (!parsedData) return null

    const dataLength = parsedData.data.length

    // For very large datasets, use sampled/aggregated data
    if (dataLength > 5000) {
      return {
        histogram: parsedData.data, // Histograms can handle more data
        heatmap: getDataSubset(parsedData.data, 2000),
        cumulative: parsedData.data, // Use all data for accurate cumulative count
        default: parsedData.data
      }
    } else if (dataLength > 1000) {
      return {
        histogram: parsedData.data,
        heatmap: parsedData.data,
        cumulative: parsedData.data, // Use all data for accurate cumulative count
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
          <div className="header-content">
            <Image 
              src="/images/logos/logo-medium.png" 
              alt="Data Report Visualizer Logo" 
              width={80} 
              height={80}
              className="logo"
              priority
            />
            <div className="header-text">
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
            </div>
          </div>
        </header>

        {!parsedData ? (
          <>
            <FileUpload onDataLoaded={setParsedData} />
            {isLoaded && (
              <div className="chart-selector-wrapper">
                <ChartSelector
                  selectedCharts={selectedCharts}
                  onSelectionChange={updateSelection}
                  compact
                />
              </div>
            )}
          </>
        ) : (
          <>
            <div className="controls">
              <button
                onClick={() => setParsedData(null)}
                className="btn btn-secondary"
              >
                ← Upload New File
              </button>
              <div className="controls-right">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="btn btn-settings"
                  title="Chart Display Settings"
                >
                  <Settings2 size={18} />
                  <span>Display Settings</span>
                </button>
                <DownloadImagesButton 
                  chartIds={getEnabledChartIds()}
                  disabled={!chartData}
                />
                <ExportButton />
              </div>
            </div>

            <StatisticsPanel data={parsedData.data} />

            {chartData && isLoaded && (
              <div id="charts-container" style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 50%, #0f1419 100%)', padding: '20px', borderRadius: '12px' }}>
                <div className="charts-grid">
                  {selectedCharts.find(c => c.id === 'thirty-min')?.enabled && (
                    <ThirtyMinDistribution data={chartData.histogram} />
                  )}
                  {selectedCharts.find(c => c.id === 'weekday')?.enabled && (
                    <WeekdayActivity data={chartData.default} />
                  )}
                  {selectedCharts.find(c => c.id === 'heatmap')?.enabled && (
                    <Heatmap data={chartData.heatmap} />
                  )}
                  {selectedCharts.find(c => c.id === 'boxplot')?.enabled && (
                    <BoxPlot data={chartData.default} />
                  )}
                  {selectedCharts.find(c => c.id === 'weekly')?.enabled && (
                    <WeeklyPattern data={chartData.default} />
                  )}
                  {selectedCharts.find(c => c.id === 'radar')?.enabled && (
                    <RadarChart data={chartData.default} />
                  )}
                </div>
                {selectedCharts.find(c => c.id === 'records-per-day')?.enabled && (
                  <RecordsPerDay data={chartData.default} />
                )}
                {selectedCharts.find(c => c.id === 'cumulative')?.enabled && (
                  <CumulativeLine data={chartData.cumulative} />
                )}
              </div>
            )}

            <ChartSelectorModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              selectedCharts={selectedCharts}
              onSave={updateSelection}
            />
          </>
        )}
      </div>
    </main>
  )
}