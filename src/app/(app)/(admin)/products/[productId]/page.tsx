import { ProductPageModule } from '~/client/modules/(app)/(admin)/products/[productId]'

interface ProductPageProps {
  params: Promise<{ productId: string }>
}
export default async function ProductPage({ params }: ProductPageProps) {
  const { productId } = await params
  return <ProductPageModule productId={productId} />
}
