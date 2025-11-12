import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { SettingsPageModule } from '~/client/modules/(app)/(admin)/settings'
import { getQueryClient, trpc } from '~/client/trpc/server'

export default async function SettingsPage() {
  const queryClient = getQueryClient()

  await Promise.all([
    queryClient.ensureQueryData(
      trpc.protected.settings.findAllPaymentSettings.queryOptions()
    ),
    queryClient.ensureQueryData(
      trpc.protected.settings.getEURToRONRate.queryOptions()
    ),
    queryClient.ensureQueryData(
      trpc.protected.settings.findAllFirstPaymentDateAfterDepositOptions.queryOptions()
    )
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SettingsPageModule />
    </HydrationBoundary>
  )
}
