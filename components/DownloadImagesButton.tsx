'use client';

import { useState } from 'react';
import html2canvas from 'html2canvas';
import { Download } from 'lucide-react';

interface DownloadImagesButtonProps {
  chartIds: string[];
  disabled?: boolean;
}

export default function DownloadImagesButton({ chartIds, disabled }: DownloadImagesButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadImage = async (element: HTMLElement, filename: string) => {
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: null, // Transparent to preserve the original background
      logging: false,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.querySelector(`#${element.id}`) as HTMLElement;
        if (clonedElement) {
          // Apply dark theme background matching the dashboard
          clonedElement.style.background = 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)';
          clonedElement.style.padding = '20px';
          clonedElement.style.borderRadius = '12px';
          
          // Ensure text colors are visible
          const allTexts = clonedElement.querySelectorAll('text, .chart-title, .chart-note');
          allTexts.forEach((text) => {
            const el = text as HTMLElement;
            if (!el.style.fill && !el.style.color) {
              el.style.color = '#e2e8f0';
            }
          });
        }
      }
    });
    
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      }
    }, 'image/png');
  };

  const handleDownloadImages = async () => {
    console.log('Download Images clicked');
    console.log('Chart IDs:', chartIds);
    setIsDownloading(true);
    
    try {
      if (!chartIds || chartIds.length === 0) {
        console.error('No chart IDs provided');
        alert('No charts available to download');
        return;
      }

      for (const chartId of chartIds) {
        console.log('Looking for element with ID:', chartId);
        const element = document.getElementById(chartId);
        if (element) {
          console.log('Found element:', chartId);
          const chartName = chartId.replace('-chart', '').replace(/-/g, '_');
          await downloadImage(element, `${chartName}_chart.png`);
          // Add a small delay between downloads to prevent browser issues
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          console.warn('Element not found:', chartId);
        }
      }
    } catch (error) {
      console.error('Error downloading images:', error);
      alert('Failed to download images. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownloadImages}
      disabled={disabled || isDownloading}
      className="btn btn-download-images"
      title="Download Images"
    >
      <Download size={18} />
      <span>{isDownloading ? 'Downloading...' : 'Download Images'}</span>
    </button>
  );
}