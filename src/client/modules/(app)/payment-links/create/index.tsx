import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '~/client/components/ui/tabs'
import { CreateExtensionPaymentLinkForm } from '~/client/modules/(app)/payment-links/create/create-extension-payment-link-form'
import { CreateProductPaymentLinkForm } from '~/client/modules/(app)/payment-links/create/create-product-payment-link-form'
import { getQueryClient, trpc } from '~/client/trpc/server'

export async function ProductPaymentLinksCreatePageModule() {
  const queryClient = getQueryClient()

  await Promise.all([
    queryClient.ensureQueryData(trpc.protected.products.findAll.queryOptions()),
    queryClient.ensureQueryData(
      trpc.protected.settings.getEURToRONRate.queryOptions()
    ),
    queryClient.ensureQueryData(
      trpc.protected.settings.findAllFirstPaymentDateAfterDepositOptions.queryOptions()
    ),
    queryClient.ensureQueryData(
      trpc.protected.settings.findAllPaymentSettings.queryOptions()
    ),
    queryClient.ensureQueryData(
      trpc.protected.settings.findAllPaymentSettings.queryOptions()
    ),
    queryClient.ensureQueryData(
      trpc.protected.scheduledEvents.findAll.queryOptions()
    )
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Tabs className='p-4' defaultValue='product'>
        <TabsList>
          <TabsTrigger value='product'>Product</TabsTrigger>
          <TabsTrigger value='extension'>Extension</TabsTrigger>
        </TabsList>

        <TabsContent value='product'>
          <CreateProductPaymentLinkForm />
        </TabsContent>

        <TabsContent value='extension'>
          <CreateExtensionPaymentLinkForm />
        </TabsContent>
      </Tabs>
    </HydrationBoundary>
  )
}
