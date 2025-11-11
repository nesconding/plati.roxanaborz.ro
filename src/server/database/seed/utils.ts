import cliProgress from 'cli-progress'
import { getTableUniqueName } from 'drizzle-orm'
import { PgTable } from 'drizzle-orm/pg-core'

import { database } from '~/server/database/drizzle'

export function formatCount(count: number) {
  const formatter = Intl.NumberFormat('en-US')
  const formatterCompact = Intl.NumberFormat('en-US', { notation: 'compact' })

  if (count < 1000) {
    return `${formatter.format(count)}`
  }

  return `${formatterCompact.format(count)} (${formatter.format(count)})`
}

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / chunkSize) }, (_, i) =>
    array.slice(i * chunkSize, i * chunkSize + chunkSize)
  )
}

async function insertInChunks<Table extends PgTable>(
  table: Table,
  data: Table['$inferInsert'][],
  tableName: string,
  chunkSize = 5000
): Promise<Table['$inferSelect'][]> {
  if (data.length < chunkSize) {
    console.log(
      `Inserting ${formatCount(data.length)} rows into ${tableName}...`
    )
    return await database.insert(table).values(data).returning()
  }

  const allInsertedRows: Table['$inferSelect'][] = []
  const chunks = chunkArray(data, chunkSize)
  const progressBar = new cliProgress.SingleBar(
    {
      format: '    [{bar}] {percentage}% | {value}/{total}'
    },
    cliProgress.Presets.shades_grey
  )

  console.log(
    `Inserting ${formatCount(data.length)} rows as ${formatCount(chunks.length)} chunks of ${formatCount(chunkSize)} rows into ${tableName}`
  )
  progressBar.start(chunks.length, 0)
  for (const chunk of chunks) {
    const insertedChunk = await database.insert(table).values(chunk).returning()
    allInsertedRows.push(...insertedChunk)
    progressBar.increment()
  }

  progressBar.stop()
  return allInsertedRows
}

export async function seedTable<Table extends PgTable>(
  table: Table,
  seedDataGenerator: () =>
    | Table['$inferInsert'][]
    | Promise<Table['$inferInsert'][]>,
  chunkSize?: number
) {
  const tableName = getTableUniqueName(table)
  try {
    const start = Date.now()

    console.group(tableName)
    console.log(`Processing ${tableName} data...`)
    const data = await seedDataGenerator()
    const result = await insertInChunks(table, data, tableName, chunkSize)

    console.log(
      `Seeded ${formatCount(data.length)} ${tableName} in ${Date.now() - start}ms\n`
    )
    console.groupEnd()
    return [tableName, result] as const
  } catch (error) {
    throw new Error(`Error seeding ${tableName}`, { cause: error })
  }
}
