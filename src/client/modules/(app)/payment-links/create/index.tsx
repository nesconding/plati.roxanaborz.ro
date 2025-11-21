import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getTranslations } from 'next-intl/server'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '~/client/components/ui/tabs'
import { CreateExtensionPaymentLinkForm } from '~/client/modules/(app)/payment-links/create/create-extension-payment-link-form'
import { CreateProductPaymentLinkForm } from '~/client/modules/(app)/payment-links/create/create-product-payment-link-form'
import { getQueryClient, trpc } from '~/client/trpc/server'
import { PaymentProductType } from '~/shared/enums/payment-product-type'

export async function ProductPaymentLinksCreatePageModule() {
  const queryClient = getQueryClient()
  const t = await getTranslations(
    'modules.(app).payment-links._components.create-payment-link-form'
  )

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
      <Tabs className='p-4' defaultValue={PaymentProductType.Product}>
        <TabsList>
          <TabsTrigger value={PaymentProductType.Product}>
            {t(`tabs.${PaymentProductType.Product}`)}
          </TabsTrigger>
          <TabsTrigger value={PaymentProductType.Extension}>
            {t(`tabs.${PaymentProductType.Extension}`)}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={PaymentProductType.Product}>
          <CreateProductPaymentLinkForm />
        </TabsContent>

        <TabsContent value={PaymentProductType.Extension}>
          <CreateExtensionPaymentLinkForm />
        </TabsContent>
      </Tabs>
    </HydrationBoundary>
  )
}
