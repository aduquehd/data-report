'use client';

import { useState } from 'react';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { Download } from 'lucide-react';

interface DownloadImagesButtonProps {
  chartIds: string[];
  disabled?: boolean;
}

export default function DownloadImagesButton({ chartIds, disabled }: DownloadImagesButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const captureChartAsBlob = async (element: HTMLElement): Promise<Blob | null> => {
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
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  };

  const handleDownloadImages = async () => {
    setIsDownloading(true);
    
    try {
      if (!chartIds || chartIds.length === 0) {
        alert('No charts available to download');
        return;
      }

      // Create a new ZIP file
      const zip = new JSZip();
      const timestamp = new Date().toISOString().split('T')[0];
      
      // Process each chart
      for (const chartId of chartIds) {
        const element = document.getElementById(chartId);
        if (element) {
          const chartName = chartId.replace('-chart', '').replace(/-/g, '_');
          const blob = await captureChartAsBlob(element);
          
          if (blob) {
            // Add the image to the ZIP file
            zip.file(`${chartName}_chart.png`, blob);
          }
        }
      }
      
      // Generate the ZIP file
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 }
      });
      
      // Download the ZIP file
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `charts_${timestamp}.zip`;
      link.click();
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error creating ZIP file:', error);
      alert('Failed to download charts. Please try again.');
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