import { TRPCError } from '@trpc/server'
import { eq, inArray } from 'drizzle-orm'
import { payments_settings } from '~/server/database/schema'

import { adminProcedure } from '~/server/trpc/config'
import { PaymentsSettingsTableValidators } from '~/shared/validation/tables'

export const updateManyPaymentSettingsProcedure = adminProcedure
  .input(PaymentsSettingsTableValidators.insert.array())
  .mutation(async ({ ctx, input }) => {
    const currentItems = await ctx.db.query.payments_settings.findMany({
      where: (payments_settings, { isNull }) =>
        isNull(payments_settings.deletedAt)
    })

    const itemsToCreate = input.filter(
      (item) => !currentItems.find((currentItem) => item.id === currentItem.id)
    )
    const itemsToUpdate = input.filter((item) =>
      currentItems.find((currentItem) => item.id === currentItem.id)
    ) as (typeof payments_settings.$inferSelect)[]
    const itemsToDelete = currentItems.filter(
      (currentItem) => !input.find((item) => item.id === currentItem.id)
    )
    const itemsToDeleteIds = itemsToDelete.map((item) => item.id)

    const deletedAt = new Date().toISOString()
    try {
      await ctx.db.transaction(
        async (tx) =>
          await Promise.all([
            itemsToCreate.length > 0
              ? tx.insert(payments_settings).values(itemsToCreate)
              : Promise.resolve(),
            ...itemsToUpdate.map(async (item) => {
              await tx
                .update(payments_settings)
                .set(item)
                .where(eq(payments_settings.id, item.id))
            }),
            itemsToDeleteIds.length > 0
              ? tx
                  .update(payments_settings)
                  .set({ deletedAt })
                  .where(inArray(payments_settings.id, itemsToDeleteIds))
              : Promise.resolve()
          ])
      )
    } catch (cause) {
      console.log(cause)

      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update many payment settings'
      })
    }
  })
