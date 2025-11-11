import { useEffect, useState } from 'react'

export function useIsMac() {
  const [isMac, setIsMac] = useState<boolean>()

  useEffect(() => {
    setIsMac(
      ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'].some((platform) =>
        window.navigator.userAgent.includes(platform)
      )
    )
  }, [])
  return !!isMac
}
