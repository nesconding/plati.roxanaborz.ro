import type { Metadata } from 'next'
import { Esteban, Fira_Code, Montserrat } from 'next/font/google'
import { ReactScan } from '~/client/components/utils/react-scan'

import '~/client/styles/globals.css'

import { NextIntlClientProvider } from 'next-intl'
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { ThemeProvider } from '~/client/components/providers/theme-provider'
import { Toaster } from '~/client/components/ui/sonner'
import { ErrorPage } from '~/client/components/utils/error-page'
import { LoadingPage } from '~/client/components/utils/loading-page'
import { AutofillColorProvider } from '~/client/lib/providers/autofill-color-provider'
import { Devtools } from '~/client/lib/providers/devtools'
import { TRPCReactProvider } from '~/client/trpc/react'

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-sans'
})

const esteban = Esteban({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400']
})

const firacode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-mono'
})
export const metadata: Metadata = {
  icons: '/logo.webp',
  title: 'Plați Roxana Borz'
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
              disableTransitionOnChange
              enableSystem
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
