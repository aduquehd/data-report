'use client'

import { useCallback } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function ExportButton() {
  const exportToPDF = useCallback(async () => {
    try {
      const element = document.getElementById('charts-container')
      if (!element) return

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#0f1419',
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height],
      })

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save('data-report.pdf')
    } catch (error) {
      console.error('Error exporting to PDF:', error)
      alert('Error exporting to PDF. Please try again.')
    }
  }, [])

  return (
    <button
      onClick={exportToPDF}
      className="btn btn-primary"
    >
      Export to PDF
    </button>
  )
}