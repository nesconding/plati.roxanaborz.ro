interface CheckoutCallbackPageProps {
  params: Promise<{
    paymentLinkId: string
  }>
  searchParams: Promise<{
    payment_intent: string
    payment_intent_client_secret: string
    redirect_status: string
  }>
}

export default async function CheckoutCallbackPage({
  params,
  searchParams
}: CheckoutCallbackPageProps) {
  const { paymentLinkId } = await params
  const { payment_intent, payment_intent_client_secret, redirect_status } =
    await searchParams

  return (
    <div>
      <h1>Checkout Callback</h1>
      <p>Payment Intent: {payment_intent}</p>
      <p>Payment Intent Client Secret: {payment_intent_client_secret}</p>
      <p>Redirect Status: {redirect_status}</p>
      <p>Payment Link ID: {paymentLinkId}</p>
    </div>
  )
}
