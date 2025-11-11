import type { Table } from 'drizzle-orm/table'
import {
  createInsertSchema as createInsertSchemaDrizzle,
  createSelectSchema as createSelectSchemaDrizzle,
  createUpdateSchema as createUpdateSchemaDrizzle
} from 'drizzle-zod'
import type { z } from 'zod'

export class TableValidatorFactory<T extends Table> {
  private static createInsertSchema = <T extends Table>(table: T) =>
    createInsertSchemaDrizzle(table)
  private static createUpdateSchema = <T extends Table>(table: T) =>
    createUpdateSchemaDrizzle(table)
  private static createSelectSchema = <T extends Table>(table: T) =>
    createSelectSchemaDrizzle(table)

  insert: ReturnType<typeof TableValidatorFactory.createInsertSchema<T>>
  update: ReturnType<typeof TableValidatorFactory.createUpdateSchema<T>>
  select: ReturnType<typeof TableValidatorFactory.createSelectSchema<T>>

  readonly $types!: {
    insert: z.infer<
      ReturnType<typeof TableValidatorFactory.createInsertSchema<T>>
    >
    update: z.infer<
      ReturnType<typeof TableValidatorFactory.createUpdateSchema<T>>
    >
    select: z.infer<
      ReturnType<typeof TableValidatorFactory.createSelectSchema<T>>
    >
  }

  constructor(private table: T) {
    this.insert = TableValidatorFactory.createInsertSchema(this.table)
    this.update = TableValidatorFactory.createUpdateSchema(this.table)
    this.select = TableValidatorFactory.createSelectSchema(this.table)
  }
}
