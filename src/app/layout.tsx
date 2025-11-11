import { ReactScan } from '~/client/components/utils/react-scan'

import type { Metadata } from 'next'
import { Esteban, Fira_Code, Montserrat } from 'next/font/google'

import '~/client/styles/globals.css'

import { Suspense } from 'react'

import { NextIntlClientProvider } from 'next-intl'
import { ErrorBoundary } from 'react-error-boundary'

import { ThemeProvider } from '~/client/components/providers/theme-provider'
import { Toaster } from '~/client/components/ui/sonner'
import { ErrorPage } from '~/client/components/utils/error-page'
import { LoadingPage } from '~/client/components/utils/loading-page'
import { AutofillColorProvider } from '~/client/lib/providers/autofill-color-provider'
import { Devtools } from '~/client/lib/providers/devtools'
import { TRPCReactProvider } from '~/client/trpc/react'

const montserrat = Montserrat({
  variable: '--font-sans',
  subsets: ['latin']
})

const esteban = Esteban({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: ['400']
})

const firacode = Fira_Code({
  variable: '--font-mono',
  subsets: ['latin']
})
export const metadata: Metadata = {
  title: 'Plați RB',
  icons: '/favicon.svg'
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='ro' suppressHydrationWarning>
      <ReactScan />
      <body
        className={`${montserrat.variable} ${esteban.variable} ${firacode.variable} antialiased`}
      >
        <AutofillColorProvider>
          <NextIntlClientProvider>
            <ThemeProvider
              attribute='class'
              defaultTheme='system'
              enableSystem
              disableTransitionOnChange
            >
              <TRPCReactProvider>
                <ErrorBoundary FallbackComponent={ErrorPage}>
                  <Suspense
                    fallback={<LoadingPage className='h-screen w-screen' />}
                  >
                    {children}
                  </Suspense>
                </ErrorBoundary>
                <Devtools />
              </TRPCReactProvider>
              <Toaster />
            </ThemeProvider>
          </NextIntlClientProvider>
        </AutofillColorProvider>
      </body>
    </html>
  )
}
