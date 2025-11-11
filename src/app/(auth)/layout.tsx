import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { RedirectType, redirect } from 'next/navigation'
import { Suspense } from 'react'

import { Logo } from '~/client/components/logo'
import { ThemeSelect } from '~/client/components/theme-select'
import { LoadingPage } from '~/client/components/utils/loading-page'
import { getQueryClient, trpc } from '~/client/trpc/server'

export default async function AuthLayout({
  children
}: {
  children: React.ReactNode
}) {
  const queryClient = getQueryClient()
  const session = await queryClient.ensureQueryData(
    trpc.public.authentication.getSession.queryOptions()
  )
  if (session) redirect('/', RedirectType.replace)

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<LoadingPage className='size-full' />}>
        <div className='grid h-screen w-screen grid-cols-1 grid-rows-[1fr_auto_1fr] place-items-center gap-6 p-6'>
          <ThemeSelect className='fixed top-6 right-6' />

          <div className='flex size-full flex-col items-center justify-end gap-2'>
            <Logo className='w-48' />
          </div>

          {children}
        </div>
      </Suspense>
    </HydrationBoundary>
  )
}
