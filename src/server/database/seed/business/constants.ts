import type { constants } from '~/server/database/schema/business/models/constants'

const CONSTANTS = [{ eurToRonRate: '5.05' }]

export async function createConstantsData(): Promise<
  (typeof constants.$inferInsert)[]
> {
  const data: (typeof constants.$inferInsert)[] = CONSTANTS
  return data
}
