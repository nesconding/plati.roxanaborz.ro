'use client'

import { OrdersTable } from '~/client/modules/(app)/orders/_components/orders-table'

export function OrdersPageModule({ search }: { search: string }) {
  return (
    <OrdersTable
      className='max-h-[calc(100svh-var(--header-height))] p-4'
      search={search}
    />
  )
}
