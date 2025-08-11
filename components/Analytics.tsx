'use client'

import GoogleAnalytics from './GoogleAnalytics'
import Hotjar from './Hotjar'

export default function Analytics() {
  // Only load analytics in production
  if (process.env.NODE_ENV !== 'production') {
    return null
  }

  return (
    <>
      <GoogleAnalytics />
      <Hotjar />
    </>
  )
}