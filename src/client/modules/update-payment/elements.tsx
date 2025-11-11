'use client'

import { useEffect, useState } from 'react'

import { Elements } from '@stripe/react-stripe-js'
import { Appearance, loadStripe, Stripe } from '@stripe/stripe-js'
import { formatHex, parse } from 'culori'
import { useTheme } from 'next-themes'

import { LoadingPage } from '~/client/components/utils/loading-page'

interface ElementsWrapperProps {
  children: React.ReactNode
  clientSecret?: string | undefined
}

export function ElementsWrapper({
  children,
  clientSecret
}: ElementsWrapperProps) {
  const { theme } = useTheme()

  const [stripe, setStripe] = useState<Stripe | null>(null)

  const [variables, setVariables] = useState<Appearance['variables']>()
  const [loaded, setLoaded] = useState(false)

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

      setVariables({
        colorText: foreground,
        colorTextSecondary: secondary,
        colorDanger: destructive,
        fontFamily: 'Montserrat, system-ui, sans-serif',
        colorBackground: background,
        colorTextPlaceholder: mutedForeground,
        colorPrimary: primary,
        buttonBorderRadius: radius,
        borderRadius: radius,
        focusBoxShadow: '0 0 0 3px var(--color-primary-500)',
        spacingUnit: spacing
      })
      setLoaded(true)
    })
  }, [theme])

  if (!loaded) return <LoadingPage />

  return (
    <Elements
      stripe={stripe}
      options={{
        clientSecret,
        locale: 'ro',
        appearance: {
          theme: theme === 'dark' ? 'night' : 'stripe',
          variables,
          inputs: 'spaced',
          labels: 'above'
        }
      }}
    >
      {children}
    </Elements>
  )
}
