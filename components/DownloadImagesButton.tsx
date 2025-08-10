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
      backgroundColor: '#ffffff',
      logging: false,
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
    setIsDownloading(true);
    
    try {
      for (const chartId of chartIds) {
        const element = document.getElementById(chartId);
        if (element) {
          const chartName = chartId.replace('-chart', '').replace(/-/g, '_');
          await downloadImage(element, `${chartName}_chart.png`);
          // Add a small delay between downloads to prevent browser issues
          await new Promise(resolve => setTimeout(resolve, 500));
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