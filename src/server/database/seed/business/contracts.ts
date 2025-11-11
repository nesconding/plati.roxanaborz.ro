import { fakerRO } from '@faker-js/faker'
import type { contracts } from '~/server/database/schema/business/models/contracts'

export async function createContractsData(): Promise<
  (typeof contracts.$inferInsert)[]
> {
  const data: (typeof contracts.$inferInsert)[] = []

  const count = fakerRO.number.int({ max: 10, min: 5 })

  for (let i = 0; i < count; i++) {
    data.push({
      fields: [],
      name: fakerRO.company.name(),
      pathname: fakerRO.system.filePath()
    })
  }

  return data
}
