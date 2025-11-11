import { ProductEditPageModule } from '~/client/modules/(app)/(admin)/products/[productId]/edit'

interface ProductEditPageProps {
  params: Promise<{ productId: string }>
}
export default async function ProductEditPage({
  params
}: ProductEditPageProps) {
  const { productId } = await params
  return <ProductEditPageModule productId={productId} />
}
