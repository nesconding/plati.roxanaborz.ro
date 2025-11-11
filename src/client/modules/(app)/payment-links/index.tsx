import { PaymentLinksTable } from '~/client/modules/(app)/payment-links/_components/payment-links-table'

export function PaymentLinksPageModule({ search }: { search: string }) {
  return (
    <PaymentLinksTable
      className='max-h-[calc(100svh-var(--header-height))] p-4'
      search={search}
    />
  )
}
