import { PaymentLinksPageModule } from '~/client/modules/(app)/payment-links'

interface PaymentLinksPageProps {
  searchParams: Promise<{
    search: string
  }>
}

export default async function PaymentLinksPage({
  searchParams
}: PaymentLinksPageProps) {
  const { search } = await searchParams
  return <PaymentLinksPageModule search={search} />
}
