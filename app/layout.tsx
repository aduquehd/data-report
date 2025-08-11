import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Data Report Visualizer',
  description: 'Interactive timestamp data visualization and analysis',
  icons: {
    icon: [
      { url: '/images/logos/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/images/logos/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/logos/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/images/logos/favicon-64x64.png', sizes: '64x64', type: 'image/png' },
    ],
    apple: [
      { url: '/images/logos/logo-medium.png', sizes: '256x256', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Data Report Visualizer',
    description: 'Interactive timestamp data visualization and analysis',
    images: [
      {
        url: '/images/logos/logo-large.png',
        width: 512,
        height: 512,
        alt: 'Data Report Visualizer Logo',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Data Report Visualizer',
    description: 'Interactive timestamp data visualization and analysis',
    images: ['/images/logos/logo-large.png'],
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}