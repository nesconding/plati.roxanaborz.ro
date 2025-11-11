import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { RedirectType, redirect } from 'next/navigation'
import { Suspense } from 'react'
import { LoadingPage } from '~/client/components/utils/loading-page'
import { getQueryClient, trpc } from '~/client/trpc/server'
import { UserRoles } from '~/shared/enums/user-roles'

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  const queryClient = getQueryClient()

  const session = await queryClient.ensureQueryData(
    trpc.public.authentication.getSession.queryOptions()
  )
  if (
    session?.user.role !== UserRoles.ADMIN &&
    session?.user.role !== UserRoles.SUPER_ADMIN
  ) {
    redirect('/', RedirectType.replace)
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<LoadingPage />}>{children}</Suspense>
    </HydrationBoundary>
  )
}
