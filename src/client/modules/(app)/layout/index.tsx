import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { RedirectType, redirect } from 'next/navigation'
import { Suspense } from 'react'

import { LoadingPage } from '~/client/components/utils/loading-page'
import { AppLayoutContainer } from '~/client/modules/(app)/layout/_components/app-layout-container'
import { getQueryClient, trpc } from '~/client/trpc/server'
import { UserRoles } from '~/shared/enums/user-roles'

export default async function AppLayoutModule({
  children
}: {
  children: React.ReactNode
}) {
  const queryClient = getQueryClient()

  const session = await queryClient.ensureQueryData(
    trpc.public.authentication.getSession.queryOptions()
  )
  if (!session) redirect('/sign-in', RedirectType.replace)

  const isAdmin =
    session.user.role === UserRoles.ADMIN ||
    session.user.role === UserRoles.SUPER_ADMIN
  if (isAdmin) {
    queryClient.prefetchQuery(
      trpc.admin.authentication.listUsers.queryOptions()
    )
  }

  queryClient.prefetchQuery(
    trpc.protected.settings.findAllFirstPaymentDateAfterDepositOptions.queryOptions()
  )
  queryClient.prefetchQuery(
    trpc.protected.settings.findAllPaymentSettings.queryOptions()
  )
  queryClient.prefetchQuery(
    trpc.protected.settings.getEURToRONRate.queryOptions()
  )
  queryClient.prefetchQuery(
    trpc.protected.scheduledEvents.findAll.queryOptions()
  )
  queryClient.prefetchQuery(trpc.protected.contracts.findAll.queryOptions())
  queryClient.prefetchQuery(trpc.protected.memberships.findAll.queryOptions())
  queryClient.prefetchQuery(
    trpc.protected.extensionOrders.findAll.queryOptions()
  )
  queryClient.prefetchQuery(trpc.protected.productOrders.findAll.queryOptions())

  queryClient.prefetchQuery(trpc.protected.products.findAll.queryOptions())
  queryClient.prefetchQuery(
    trpc.protected.settings.findAllPaymentSettings.queryOptions()
  )
  queryClient.prefetchQuery(
    trpc.protected.settings.getEURToRONRate.queryOptions()
  )
  queryClient.prefetchQuery(
    trpc.protected.settings.findAllFirstPaymentDateAfterDepositOptions.queryOptions()
  )
  queryClient.prefetchQuery(
    trpc.protected.extensionsSubscriptions.findAll.queryOptions()
  )
  queryClient.prefetchQuery(
    trpc.protected.productSubscriptions.findAll.queryOptions()
  )

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AppLayoutContainer>
        <Suspense fallback={<LoadingPage />}>{children}</Suspense>
      </AppLayoutContainer>
    </HydrationBoundary>
  )
}
