import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { notFound } from 'next/navigation'

import { getQueryClient, trpc } from '~/client/trpc/server'

interface ProductLayoutProps extends React.PropsWithChildren {
  params: Promise<{ productId: string }>
}
export default async function ProductLayout({
  children,
  params
}: ProductLayoutProps) {
  const { productId } = await params
  const queryClient = getQueryClient()
  const product = await queryClient.ensureQueryData(
    trpc.protected.products.findOneById.queryOptions({ productId })
  )
  if (!product) notFound()

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  )
}
