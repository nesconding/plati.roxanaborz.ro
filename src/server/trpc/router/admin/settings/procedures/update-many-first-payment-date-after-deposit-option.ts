import { TRPCError } from '@trpc/server'
import { eq, inArray } from 'drizzle-orm'
import z from 'zod'
import { first_payment_date_after_deposit_options } from '~/server/database/schema'
import { adminProcedure } from '~/server/trpc/config'
import { FirstPaymentDateAfterDepositOptionsTableValidators } from '~/shared/validation/tables'
import { NumericString } from '~/shared/validation/utils'

const item = FirstPaymentDateAfterDepositOptionsTableValidators.insert.extend({
  value: NumericString()
})
const input = item.array()
const parsedInput = item.extend({ value: z.coerce.number().min(1) }).array()

export const updateManyFirstPaymentDateAfterDepositOptionProcedure =
  adminProcedure.input(input).mutation(async ({ ctx, input }) => {
    try {
      const data = await parsedInput.parseAsync(input)

      const currentItems =
        await ctx.db.query.first_payment_date_after_deposit_options.findMany({
          where: (first_payment_date_after_deposit_options, { isNull }) =>
            isNull(first_payment_date_after_deposit_options.deletedAt)
        })

      const itemsToCreate = data.filter(
        (item) =>
          !currentItems.find((currentItem) => item.id === currentItem.id)
      )
      const itemsToUpdate = data.filter((item) =>
        currentItems.find((currentItem) => item.id === currentItem.id)
      ) as (typeof FirstPaymentDateAfterDepositOptionsTableValidators.$types.select)[]
      const itemsToDelete = currentItems.filter(
        (currentItem) => !input.find((item) => item.id === currentItem.id)
      )
      const itemsToDeleteIds = itemsToDelete.map((item) => item.id)
      const deletedAt = new Date().toISOString()

      await ctx.db.transaction(
        async (tx) =>
          await Promise.all([
            itemsToCreate.length > 0
              ? tx
                  .insert(first_payment_date_after_deposit_options)
                  .values(itemsToCreate)
              : Promise.resolve(),
            ...itemsToUpdate.map(async (item) => {
              await tx
                .update(first_payment_date_after_deposit_options)
                .set(item)
                .where(eq(first_payment_date_after_deposit_options.id, item.id))
            }),
            itemsToDeleteIds.length > 0
              ? tx
                  .update(first_payment_date_after_deposit_options)
                  .set({ deletedAt })
                  .where(
                    inArray(
                      first_payment_date_after_deposit_options.id,
                      itemsToDeleteIds
                    )
                  )
              : Promise.resolve()
          ])
      )
    } catch (cause) {
      console.log(cause)

      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update first payment date after deposit options'
      })
    }
  })
