'use client'

import { Elements } from '@stripe/react-stripe-js'
import { type Appearance, loadStripe, type Stripe } from '@stripe/stripe-js'
import { formatHex, parse } from 'culori'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

import { LoadingPage } from '~/client/components/utils/loading-page'
import { useIsMobile } from '~/client/hooks/use-mobile'

interface ElementsWrapperProps {
  children: React.ReactNode
  clientSecret?: string | undefined
}

export function ElementsWrapper({
  children,
  clientSecret
}: ElementsWrapperProps) {
  const { theme } = useTheme()
  const isMobile = useIsMobile()

  const [stripe, setStripe] = useState<Stripe | null>(null)

  const [variables, setVariables] = useState<
    Appearance['variables'] & { inputBorderColor: string }
  >()
  const [loaded, setLoaded] = useState(false)

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    async function loadStripeClient() {
      setLoaded(false)
      const stripeClient = await loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!,
        {
          developerTools: { assistant: { enabled: true } },
          locale: 'ro'
        }
      )
      setStripe(stripeClient)
    }
    loadStripeClient().then(() => {
      const foreground = formatHex(
        parse(
          getComputedStyle(document.documentElement).getPropertyValue(
            '--foreground'
          )
        )
      )
      const destructive = formatHex(
        parse(
          getComputedStyle(document.documentElement).getPropertyValue(
            '--destructive'
          )
        )
      )
      const background = formatHex(
        parse(
          getComputedStyle(document.documentElement).getPropertyValue(
            '--background'
          )
        )
      )
      const secondary = formatHex(
        parse(
          getComputedStyle(document.documentElement).getPropertyValue(
            '--secondary'
          )
        )
      )
      const primary = formatHex(
        parse(
          getComputedStyle(document.documentElement).getPropertyValue(
            '--primary'
          )
        )
      )
      const radius = getComputedStyle(
        document.documentElement
      ).getPropertyValue('--radius')
      const mutedForeground = formatHex(
        parse(
          getComputedStyle(document.documentElement).getPropertyValue(
            '--muted-foreground'
          )
        )
      )
      const spacing = getComputedStyle(
        document.documentElement
      ).getPropertyValue('--spacing')
      const focusBoxShadow = getComputedStyle(
        document.documentElement
      ).getPropertyValue('--shadow-xs')

      const fontSizeBase = getComputedStyle(
        document.documentElement
      ).getPropertyValue('--text-base')
      const fontSizeSm = getComputedStyle(
        document.documentElement
      ).getPropertyValue('--text-sm')

      const leading = getComputedStyle(
        document.documentElement
      ).getPropertyValue('--tw-leading')

      const lineHeightBase = getComputedStyle(
        document.documentElement
      ).getPropertyValue('--text-base--line-height')
      const lineHeightSm = getComputedStyle(
        document.documentElement
      ).getPropertyValue('--text-sm--line-height')

      const lineHeight = isMobile
        ? `${leading} ${lineHeightBase}`
        : `${leading} ${lineHeightSm}`

      const inputBorderColor = getComputedStyle(
        document.documentElement
      ).getPropertyValue('--input')

      // console.log({ spacing })
      // const fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--font-sans')
      setVariables({
        borderRadius: radius,
        buttonBorderRadius: radius,
        // colorBackground: background,
        colorBackground: inputBorderColor,
        colorDanger: destructive,
        colorPrimary: primary,
        colorText: foreground,
        colorTextPlaceholder: mutedForeground,
        colorTextSecondary: secondary,
        focusBoxShadow: '0 0 0 3px var(--color-primary-500)',
        fontFamily: 'Montserrat, system-ui, sans-serif',
        fontLineHeight: lineHeight,
        fontSizeBase: isMobile ? fontSizeBase : fontSizeSm,

        inputBorderColor,
        // gridRowSpacing: '2.25rem',
        // gridColumnSpacing: '0.75rem',

        // gridRowSpacing: `calc(${spacing} * 3)`,
        // gridRowSpacing: `12px`,
        // gridColumnSpacing: `calc(${spacing} * 3)`,
        // accordionItemSpacing: `calc(${spacing} * 3)`,
        // tabSpacing: `calc(${spacing} * 3)`,
        // gridRowSpacing: '12',
        // gridColumnSpacing: '12',
        // accordionItemSpacing: '12',
        // tabSpacing: '12',
        spacingUnit: `0.25rem`
      })
      setLoaded(true)
    })
  }, [theme, isMobile])

  // useEffect(() => {
  //   if (theme) {
  //     setVariables({
  //       ...variables,
  //       theme: theme === 'dark' ? 'night' : 'stripe'
  //     })
  //   }
  // }, [theme])

  if (!loaded) return <LoadingPage />

  if (!stripe) return <div className='text-center'>Stripe not loaded</div>

  return (
    <Elements
      options={{
        appearance: {
          inputs: 'spaced',
          labels: 'above',
          rules: {
            '.Input': {
              // backgroundColor: `color-mix(in oklab, ${variables?.inputBorderColor ?? 'var(--input)'} 30%, transparent)`,
              borderColor: variables?.inputBorderColor ?? 'var(--input)'
            },
            'p-Input-input': {
              backgroundColor: `color-mix(in oklab, ${variables?.inputBorderColor ?? 'var(--input)'} 30%, transparent)`
            }
          },
          theme: theme === 'dark' ? 'night' : 'stripe',
          variables
        },
        clientSecret,

        locale: 'ro'
      }}
      stripe={stripe}
    >
      {children}
    </Elements>
  )
}
