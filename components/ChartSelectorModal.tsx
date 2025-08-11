'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Settings2 } from 'lucide-react'
import ChartSelector, { ChartOption } from './ChartSelector'

interface ChartSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  selectedCharts: ChartOption[]
  onSave: (charts: ChartOption[]) => void
}

export default function ChartSelectorModal({ 
  isOpen, 
  onClose, 
  selectedCharts,
  onSave
}: ChartSelectorModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [tempSelection, setTempSelection] = useState<ChartOption[]>(selectedCharts)

  useEffect(() => {
    setTempSelection(selectedCharts)
  }, [selectedCharts])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleSelectionChange = (charts: ChartOption[]) => {
    setTempSelection(charts)
  }

  const handleSave = () => {
    onSave(tempSelection)
    onClose()
  }

  const handleCancel = () => {
    setTempSelection(selectedCharts)
    onClose()
  }

  const handleReset = () => {
    const reset = tempSelection.map(chart => ({ ...chart, enabled: true }))
    setTempSelection(reset)
    onSave(reset)
  }

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content" ref={modalRef}>
        <div className="modal-header">
          <div className="modal-title">
            <Settings2 size={20} />
            <h2>Chart Display Settings</h2>
          </div>
          <button onClick={onClose} className="modal-close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <ChartSelector
            selectedCharts={tempSelection}
            onSelectionChange={handleSelectionChange}
          />
        </div>

        <div className="modal-footer">
          <button onClick={handleCancel} className="btn-modal btn-cancel">
            Cancel
          </button>
          <button onClick={handleReset} className="btn-modal btn-reset">
            Reset All
          </button>
          <button onClick={handleSave} className="btn-modal btn-save">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}