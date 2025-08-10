'use client'

import { useCallback, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function ExportButton() {
  const [isExporting, setIsExporting] = useState(false)

  const exportToPDF = useCallback(async () => {
    try {
      setIsExporting(true)
      
      const element = document.getElementById('charts-container')
      if (!element) {
        throw new Error('Charts container not found')
      }

      // Get the actual width of the content (not including empty space)
      const containerWidth = element.scrollWidth
      const containerHeight = element.scrollHeight

      // Temporarily set a fixed width to avoid capturing extra white space
      const originalStyle = element.style.cssText
      element.style.width = `${containerWidth}px`
      element.style.maxWidth = `${containerWidth}px`
      element.style.overflow = 'visible'

      // Create canvas with proper settings for dark theme
      const canvas = await html2canvas(element, {
        scale: 2, // High quality
        useCORS: true,
        logging: false,
        backgroundColor: '#0f1419', // Dark background matching the theme
        width: containerWidth,
        height: containerHeight,
        windowWidth: containerWidth,
        windowHeight: containerHeight,
        onclone: (clonedDoc) => {
          // Ensure dark theme styles are applied to cloned document
          const clonedElement = clonedDoc.getElementById('charts-container')
          if (clonedElement) {
            // Apply dark background to all chart containers
            const chartContainers = clonedElement.querySelectorAll('.chart-container')
            chartContainers.forEach((chart) => {
              (chart as HTMLElement).style.backgroundColor = 'rgba(30, 41, 59, 0.8)';
              (chart as HTMLElement).style.border = '1px solid rgba(0, 212, 255, 0.2)'
            })
            
            // Ensure SVGs have dark background
            const svgs = clonedElement.querySelectorAll('svg')
            svgs.forEach((svg) => {
              (svg as SVGElement).style.backgroundColor = 'transparent'
            })

            // Fix text colors
            const texts = clonedElement.querySelectorAll('text, .chart-title, .chart-note')
            texts.forEach((text) => {
              const element = text as HTMLElement
              if (element.classList.contains('chart-title')) {
                element.style.color = '#00d4ff'
              } else if (element.classList.contains('chart-note')) {
                element.style.color = '#64748b'
              }
            })
          }
        }
      })

      // Restore original styles
      element.style.cssText = originalStyle

      // Calculate PDF dimensions
      const pdfWidth = 297 // A4 landscape width in mm
      const pdfHeight = 210 // A4 landscape height in mm
      
      // Calculate the aspect ratio
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = imgWidth / imgHeight

      let finalWidth = pdfWidth
      let finalHeight = pdfHeight

      // Adjust dimensions to fit content without white space
      if (ratio > pdfWidth / pdfHeight) {
        // Content is wider than A4 landscape ratio
        finalHeight = pdfWidth / ratio
      } else {
        // Content is taller than A4 landscape ratio
        finalWidth = pdfHeight * ratio
      }

      // Create PDF with optimized settings
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
      })

      // Add the image centered on the page
      const xOffset = (pdfWidth - finalWidth) / 2
      const yOffset = (pdfHeight - finalHeight) / 2

      pdf.addImage(
        canvas.toDataURL('image/png', 1.0),
        'PNG',
        xOffset > 0 ? xOffset : 0,
        yOffset > 0 ? yOffset : 0,
        finalWidth,
        finalHeight,
        undefined,
        'FAST'
      )

      // Add metadata
      pdf.setProperties({
        title: 'Data Report Visualization',
        subject: 'Timestamp Data Analysis',
        author: 'Data Report Visualizer',
        keywords: 'data, visualization, analytics',
        creator: 'Data Report Visualizer'
      })

      // Save the PDF
      const timestamp = new Date().toISOString().split('T')[0]
      pdf.save(`data-report-${timestamp}.pdf`)

    } catch (error) {
      console.error('Error exporting to PDF:', error)
      alert('Error exporting to PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }, [])

  return (
    <button
      onClick={exportToPDF}
      className="btn btn-primary"
      disabled={isExporting}
    >
      {isExporting ? (
        <>
          <span className="loading-spinner"></span>
          Exporting...
        </>
      ) : (
        'Export to PDF'
      )}
    </button>
  )
}