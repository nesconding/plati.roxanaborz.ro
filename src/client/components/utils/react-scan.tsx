'use client'

// import { scan } from 'react-scan'
import { scan } from 'react-scan/all-environments'

import { JSX, useEffect } from 'react'

export function ReactScan(): JSX.Element | null {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    scan({
      enabled: true
    })
  }, [])

  return null
}
