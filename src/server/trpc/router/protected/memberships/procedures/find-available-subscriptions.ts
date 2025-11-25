import { protectedProcedure } from '~/server/trpc/config'

export const findAvailableSubscriptionsProcedure = protectedProcedure.query(
  async ({ ctx }) => {
    // Fetch all product subscriptions not linked to any membership and owned by user
    const productSubscriptions =
      await ctx.db.query.product_subscriptions.findMany({
        where: (product_subscriptions, { and, isNull }) =>
          and(isNull(product_subscriptions.membershipId))
      })

    // Fetch all extension subscriptions not linked to any membership and owned by user
    const extensionSubscriptions =
      await ctx.db.query.extension_subscriptions.findMany({
        where: (extension_subscriptions, { and, isNull }) =>
          and(isNull(extension_subscriptions.membershipId))
      })

    return {
      extensionSubscriptions,
      productSubscriptions
    }
  }
)
