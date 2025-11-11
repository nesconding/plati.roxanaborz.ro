'use client'

import { type JSX, useEffect } from 'react'
import { scan } from 'react-scan'
// import { scan } from 'react-scan/all-environments'

export function ReactScan(): JSX.Element | null {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    scan({
      enabled: false
    })
  }, [])

  return null
}
