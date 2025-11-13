import { CheckoutCallbackPageModule } from '~/client/modules/checkout/callback'

interface CheckoutCallbackPageProps {
  params: Promise<{
    paymentLinkId: string
  }>
}

export default async function CheckoutCallbackPage({
  params
}: CheckoutCallbackPageProps) {
  const paramsData = await params

  return <CheckoutCallbackPageModule paymentLinkId={paramsData.paymentLinkId} />
}
