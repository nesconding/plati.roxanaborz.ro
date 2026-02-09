import { createTRPCRouter } from '~/server/trpc/config'
import { bulkUpdateMembershipDatesProcedure } from '~/server/trpc/router/protected/memberships/procedures/bulk-update-dates'
import { createMembershipProcedure } from '~/server/trpc/router/protected/memberships/procedures/create-membership'
import { findAllMembershipsProcedure } from '~/server/trpc/router/protected/memberships/procedures/find-all-memberships'
import { findAvailableSubscriptionsProcedure } from '~/server/trpc/router/protected/memberships/procedures/find-available-subscriptions'
import { findLinkedSubscriptionsProcedure } from '~/server/trpc/router/protected/memberships/procedures/find-linked-subscriptions'
import { linkMembershipSubscriptionProcedure } from '~/server/trpc/router/protected/memberships/procedures/link-subscription'
import { transferMembershipProcedure } from '~/server/trpc/router/protected/memberships/procedures/transfer-membership'
import { unlinkMembershipSubscriptionProcedure } from '~/server/trpc/router/protected/memberships/procedures/unlink-subscription'
import { updateMembershipDatesProcedure } from '~/server/trpc/router/protected/memberships/procedures/update-dates'
import { updateMembershipStatusProcedure } from '~/server/trpc/router/protected/memberships/procedures/update-status'

export const membershipsRouter = createTRPCRouter({
  bulkUpdateDates: bulkUpdateMembershipDatesProcedure,
  create: createMembershipProcedure,
  findAll: findAllMembershipsProcedure,
  findAvailableSubscriptions: findAvailableSubscriptionsProcedure,
  findLinkedSubscriptions: findLinkedSubscriptionsProcedure,
  linkSubscription: linkMembershipSubscriptionProcedure,
  transferMembership: transferMembershipProcedure,
  unlinkSubscription: unlinkMembershipSubscriptionProcedure,
  updateDates: updateMembershipDatesProcedure,
  updateStatus: updateMembershipStatusProcedure
})
