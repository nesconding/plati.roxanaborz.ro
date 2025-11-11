'use client'

import { MembershipsTable } from '~/client/modules/(app)/memberships/memberships-table'

export function MembershipsPageModule() {
  return (
    <MembershipsTable className='max-h-[calc(100svh-var(--header-height))] p-4' />
  )
}
