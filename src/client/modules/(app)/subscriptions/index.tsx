'use client'

import { SubscriptionsTable } from '~/client/modules/(app)/subscriptions/_components/subscriptions-table'

export function SubscriptionsPageModule({ search }: { search: string }) {
  return (
    <SubscriptionsTable
      className='max-h-[calc(100svh-var(--header-height))] p-4'
      search={search}
    />
  )
}
