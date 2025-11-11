import { notFound } from 'next/navigation'

// import { UpdatePaymentModule } from '~/client/modules/update-payment'
// import { getQueryClient, trpc } from '~/client/trpc/server'

interface UpdatePaymentPageProps {
  params: Promise<{ subscriptionId: string }>
  searchParams: Promise<{ token?: string }>
}

export default async function UpdatePaymentPage({
  params,
  searchParams
}: UpdatePaymentPageProps) {
  const { subscriptionId } = await params
  const { token } = await searchParams

  if (!token) notFound()

  // const queryClient = getQueryClient()

  // const data = await queryClient.ensureQueryData(
  //   trpc.public.business.getSubscriptionForUpdate.queryOptions({
  //     subscriptionId,
  //     token
  //   })
  // )

  // if (!data) notFound()

  // return <UpdatePaymentModule data={data} subscriptionId={subscriptionId} token={token} />
  return <div>Update Payment Page</div>
}
