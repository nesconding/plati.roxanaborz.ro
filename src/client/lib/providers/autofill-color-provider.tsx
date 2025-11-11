'use client'

import { useEffect } from 'react'

function getAutofillStyleFallback() {
  const ua = navigator.userAgent

  if (/Chrome|Edg/.test(ua)) {
    return {
      bg: 'rgb(232, 240, 254)',
      imageColor: null
    }
  }

  if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
    return {
      bg: 'rgb(250, 255, 189)',
      imageColor: null
    }
  }

  if (/Firefox/.test(ua)) {
    return {
      bg: 'transparent',
      imageColor: 'rgba(255, 249, 145, 0.5)'
    }
  }

  return {
    bg: 'rgb(232, 240, 254)',
    imageColor: null
  }
}

export function AutofillColorProvider({
  children
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    const fallback = getAutofillStyleFallback()
    document.documentElement.style.setProperty('--autofill-bg', fallback.bg)

    if (fallback.imageColor) {
      document.documentElement.style.setProperty(
        '--autofill-bg-image-color',
        fallback.imageColor
      )
    }

    let styleOverride: HTMLStyleElement | null = null

    const handleAnimationStart = (e: AnimationEvent) => {
      if (e.animationName === 'onAutoFillStart') {
        const input = e.target as HTMLInputElement
        const computedStyle = window.getComputedStyle(input)

        const bg = computedStyle.backgroundColor
        const bgImage = computedStyle.backgroundImage

        // Set background color (Chrome/Safari)
        if (bg && bg !== 'rgba(0, 0, 0, 0)') {
          document.documentElement.style.setProperty('--autofill-bg', bg)
        }

        // Extract color from gradient (Firefox)
        if (bgImage && bgImage !== 'none') {
          // Extract color from: linear-gradient(rgba(255, 249, 145, 0.5), rgba(255, 249, 145, 0.5))
          const colorMatch = bgImage.match(/rgba?\([^)]+\)/)
          if (colorMatch) {
            const color = colorMatch[0]
            document.documentElement.style.setProperty(
              '--autofill-bg-image-color',
              color
            )
          }
        }

        // Remove browser's autofill styles AFTER detection
        if (!styleOverride) {
          styleOverride = document.createElement('style')
          styleOverride.textContent = `
            input:-webkit-autofill {
              background-color: light-dark(transparent, transparent) !important;
              background-image: none !important;
            }
            
            input:-internal-autofill-selected {
              background-color: light-dark(transparent, transparent) !important;
              background-image: none !important;
            }
            
            input:autofill {
              background-color: light-dark(transparent, transparent) !important;
              background-image: none !important;
            }
          `
          document.head.appendChild(styleOverride)
        }
      }
    }

    document.addEventListener(
      'animationstart',
      handleAnimationStart as EventListener
    )

    return () => {
      document.removeEventListener(
        'animationstart',
        handleAnimationStart as EventListener
      )
      // Clean up the style override when component unmounts
      if (styleOverride && styleOverride.parentNode) {
        styleOverride.parentNode.removeChild(styleOverride)
      }
    }
  }, [])

  return <>{children}</>
}
