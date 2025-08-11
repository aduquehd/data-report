'use client'

import { useCallback, useState, DragEvent, useEffect, useRef } from 'react'
import Papa from 'papaparse'
import { ParsedData } from '@/lib/types'
import { processLargeDataset } from '@/lib/dataProcessor'
import { detectDateTimeColumn, parseDateTime } from '@/lib/dateTimeDetector'

interface FileUploadProps {
  onDataLoaded: (data: ParsedData) => void
}

export default function FileUpload({ onDataLoaded }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => {
    // Initialize web worker
    if (typeof window !== 'undefined' && window.Worker) {
      workerRef.current = new Worker('/csvWorker.js')
    }
    
    return () => {
      workerRef.current?.terminate()
    }
  }, [])

  const processWithWorker = useCallback((text: string, fallbackProcessor?: (text: string) => void) => {
    if (!workerRef.current) {
      // Fallback to main thread processing
      if (fallbackProcessor) fallbackProcessor(text)
      return
    }

    setIsLoading(true)
    setProgress(0)

    workerRef.current.onmessage = (e) => {
      if (e.data.progress) {
        setProgress(e.data.progress)
      } else if (e.data.complete) {
        const data = e.data.data as Record<string, unknown>[]
        
        // Auto-detect datetime column
        const dateTimeColumn = e.data.dateTimeColumn || detectDateTimeColumn(data)
        
        if (!dateTimeColumn) {
          alert('No datetime column detected in the CSV file')
          setIsLoading(false)
          setProgress(0)
          return
        }
        
        const filteredData = data.filter((row) => {
          const dateValue = parseDateTime(row[dateTimeColumn])
          return dateValue !== null
        }).map((row) => {
          // Find the first numeric column (excluding the datetime column)
          let value = 1 // Default to 1 for counting occurrences
          
          for (const [key, val] of Object.entries(row)) {
            if (key !== dateTimeColumn && typeof val === 'number' && !isNaN(val)) {
              value = val
              break
            }
          }
          
          return {
            ...row,
            timestamp: parseDateTime(row[dateTimeColumn])!,
            value,
            dateTimeColumn, // Store which column was used
          }
        })

        // Process large dataset for optimization
        const processed = processLargeDataset(filteredData)
        
        setIsLoading(false)
        setProgress(0)
        onDataLoaded({
          data: filteredData,
          columns: e.data.columns || [],
          processed
        })
      } else if (e.data.error) {
        console.error('Worker error:', e.data.error)
        alert('Error processing CSV: ' + e.data.error)
        setIsLoading(false)
        setProgress(0)
      }
    }

    workerRef.current.postMessage({ csvText: text, action: 'parse' })
  }, [onDataLoaded])

  const processFile = useCallback((text: string) => {
    setIsLoading(true)
    setProgress(0)
    
    // Use setTimeout to prevent blocking UI
    setTimeout(() => {
      let rowCount = 0
      const allData: Record<string, unknown>[] = []
      
      Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        chunk: (results: any) => {
          // Process in chunks to avoid freezing
          if (results?.data) {
            allData.push(...(results.data as Record<string, unknown>[]))
            rowCount += results.data.length
            setProgress(Math.min(90, Math.floor((rowCount / 1000) * 90)))
          }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        complete: (results: any) => {
          // Use accumulated data if available, otherwise use results.data
          const data = allData.length > 0 ? allData : (results?.data || []) as Record<string, unknown>[]
          
          // Auto-detect datetime column
          const dateTimeColumn = detectDateTimeColumn(data)
          
          if (!dateTimeColumn) {
            alert('No datetime column detected in the CSV file')
            setIsLoading(false)
            setProgress(0)
            return
          }
          
          const filteredData = data.filter((row) => {
            const dateValue = parseDateTime(row[dateTimeColumn])
            return dateValue !== null
          }).map((row) => {
            // Find the first numeric column (excluding the datetime column)
            let value = 1 // Default to 1 for counting occurrences
            
            for (const [key, val] of Object.entries(row)) {
              if (key !== dateTimeColumn && typeof val === 'number' && !isNaN(val)) {
                value = val
                break
              }
            }
            
            return {
              ...row,
              timestamp: parseDateTime(row[dateTimeColumn])!,
              value,
              dateTimeColumn, // Store which column was used
            }
          })

          // Process large dataset for optimization
          const processed = processLargeDataset(filteredData)
          
          setProgress(100)
          setTimeout(() => {
            setIsLoading(false)
            setProgress(0)
            onDataLoaded({
              data: filteredData,
              columns: results?.meta?.fields || [],
              processed
            })
          }, 300)
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error: (error: any) => {
          console.error('Error parsing CSV:', error)
          alert('Error parsing CSV file. Please check the format.')
          setIsLoading(false)
          setProgress(0)
        },
      })
    }, 100)
  }, [onDataLoaded])

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      if (file.size > 1024 * 1024) { // > 1MB, use worker
        processWithWorker(text, processFile)
      } else {
        processFile(text)
      }
    }
    reader.readAsText(file)
  }, [processFile, processWithWorker])

  const loadSampleData = useCallback(async (filename: string = '/sample-data-10k.csv') => {
    setIsLoading(true)
    try {
      const response = await fetch(filename)
      const text = await response.text()
      processFile(text)
    } catch (error) {
      console.error('Error loading sample data:', error)
      alert('Error loading sample data.')
      setIsLoading(false)
    }
  }, [processFile])

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        if (file.size > 1024 * 1024) { // > 1MB, use worker
          processWithWorker(text, processFile)
        } else {
          processFile(text)
        }
      }
      reader.readAsText(file)
    } else {
      alert('Please drop a CSV file')
    }
  }, [processFile, processWithWorker])

  return (
    <div className="upload-section">
      <div className="sample-data-buttons">
        <button 
          onClick={() => loadSampleData('/sample-data-10k.csv')} 
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Load Sample Data (10k)'}
        </button>
        <button 
          onClick={() => loadSampleData('/sample-data-20k.csv')} 
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Load Sample Data (20k)'}
        </button>
      </div>
      
      <div className="divider">
        <span>OR</span>
      </div>

      <div 
        className={`file-upload ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isLoading && progress > 0 ? (
          <div className="upload-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <p>Processing: {progress}%</p>
          </div>
        ) : (
          <>
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <label htmlFor="csv-upload">
              <span>Drag & Drop CSV file here</span>
              <p>or</p>
              <span className="upload-btn">Click to browse</span>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isLoading}
              />
            </label>
            <p className="upload-hint">CSV must contain a datetime column (auto-detected)</p>
          </>
        )}
      </div>
    </div>
  )
}