import { eq } from 'drizzle-orm'
import type { Database } from '~/server/database/drizzle'
import * as schema from '~/server/database/schema'
// import { DatesService } from '~/server/services/dates'
import { MembershipStatusType } from '~/shared/enums/membership-status-type'
import { SubscriptionStatusType } from '~/shared/enums/subscription-status-type'

type SubscriptionType = 'product' | 'extension'

const MAX_RETRY_ATTEMPTS = 3

export class SubscriptionMembershipSyncService {
  constructor(private readonly db: Database) {}
  /**
   * Handle payment failure - increment retry count and determine if subscription should go on hold
   * Returns true if subscription should retry, false if it should go on hold
   */
  async handlePaymentFailure(
    subscriptionId: string,
    subscriptionType: SubscriptionType,
    failureReason: string
  ): Promise<{ shouldRetry: boolean; failureCount: number }> {
    const table =
      subscriptionType === 'product'
        ? schema.product_subscriptions
        : schema.extension_subscriptions

    // Get current failure count
    const [subscription] = await this.db
      .select({ paymentFailureCount: table.paymentFailureCount })
      .from(table)
      .where(eq(schema.product_subscriptions.id, subscriptionId))

    const currentCount = subscription?.paymentFailureCount ?? 0
    const newCount = currentCount + 1
    // Update subscription with failure info
    await this.db
      .update(table)
      .set({
        lastPaymentAttemptDate: new Date().toISOString(),
        lastPaymentFailureReason: failureReason,
        paymentFailureCount: newCount
      })
      .where(eq(table.id, subscriptionId))

    // If we've hit max retries, set subscription to OnHold and membership to Paused
    if (newCount >= MAX_RETRY_ATTEMPTS) {
      await this.setSubscriptionOnHold(subscriptionId, subscriptionType)
      return { failureCount: newCount, shouldRetry: false }
    }

    return { failureCount: newCount, shouldRetry: true }
  }

  /**
   * Handle payment success - reset failure count and update next payment date
   */
  async handlePaymentSuccess(
    subscriptionId: string,
    subscriptionType: SubscriptionType,
    remainingPayments: number,
    nextPaymentDate: string | null
  ): Promise<void> {
    const table =
      subscriptionType === 'product'
        ? schema.product_subscriptions
        : schema.extension_subscriptions

    const updateData: Record<string, unknown> = {
      lastPaymentAttemptDate: null,
      lastPaymentFailureReason: null,
      paymentFailureCount: 0,
      remainingPayments
    }

    // If there are remaining payments, set next payment date
    if (remainingPayments > 0 && nextPaymentDate) {
      updateData.nextPaymentDate = nextPaymentDate
    } else {
      // No more payments - mark as completed
      updateData.status = SubscriptionStatusType.Completed
      updateData.nextPaymentDate = null
    }

    await this.db
      .update(table)
      .set(updateData)
      .where(eq(table.id, subscriptionId))
  }

  /**
   * Handle subscription cancellation
   * Graceful: Set scheduled cancellation date, subscription stays active until then
   * Immediate: Cancel subscription and membership immediately
   */
  async handleSubscriptionCancellation(
    subscriptionId: string,
    subscriptionType: SubscriptionType,
    cancelType: 'graceful' | 'immediate'
  ): Promise<void> {
    const table =
      subscriptionType === 'product'
        ? schema.product_subscriptions
        : schema.extension_subscriptions

    if (cancelType === 'graceful') {
      // Get next payment date
      const [subscription] = await this.db
        .select({
          membershipId: table.membershipId,
          nextPaymentDate: table.nextPaymentDate
        })
        .from(table)
        .where(eq(table.id, subscriptionId))

      if (!subscription) {
        throw new Error('Subscription not found')
      }

      // Set scheduled cancellation date to next payment date
      await this.db
        .update(table)
        .set({
          lastPaymentAttemptDate: null,
          lastPaymentFailureReason: null,
          // Void any pending retries
          paymentFailureCount: 0,
          scheduledCancellationDate: subscription.nextPaymentDate
        })
        .where(eq(table.id, subscriptionId))

      // Membership stays active - it will be cancelled by cron job on scheduled date
    } else {
      // Immediate cancellation
      const [subscription] = await this.db
        .select({ membershipId: table.membershipId })
        .from(table)
        .where(eq(table.id, subscriptionId))

      if (!subscription) {
        throw new Error('Subscription not found')
      }

      // Cancel subscription immediately
      await this.db
        .update(table)
        .set({
          lastPaymentAttemptDate: null,
          lastPaymentFailureReason: null,
          // Void any pending retries
          paymentFailureCount: 0,
          status: SubscriptionStatusType.Cancelled
        })
        .where(eq(table.id, subscriptionId))

      // Cancel membership immediately (only if subscription is linked to a membership)
      if (subscription.membershipId) {
        await this.db
          .update(schema.memberships)
          .set({ status: MembershipStatusType.Cancelled })
          .where(eq(schema.memberships.id, subscription.membershipId))
      }
    }
  }

  /**
   * Set subscription to OnHold and membership to Paused
   * Called after max retry attempts exceeded
   */
  async setSubscriptionOnHold(
    subscriptionId: string,
    subscriptionType: SubscriptionType
  ): Promise<void> {
    const table =
      subscriptionType === 'product'
        ? schema.product_subscriptions
        : schema.extension_subscriptions

    // Get membership ID
    const [subscription] = await this.db
      .select({ membershipId: table.membershipId })
      .from(table)
      .where(eq(table.id, subscriptionId))

    if (!subscription) {
      throw new Error('Subscription not found')
    }

    // Set subscription to OnHold
    await this.db
      .update(table)
      .set({ status: SubscriptionStatusType.OnHold })
      .where(eq(table.id, subscriptionId))

    // Set membership to Paused (only if subscription is linked to a membership)
    if (subscription.membershipId) {
      await this.db
        .update(schema.memberships)
        .set({ status: MembershipStatusType.Paused })
        .where(eq(schema.memberships.id, subscription.membershipId))
    }
  }

  /**
   * Void pending retry - called when admin manually sets subscription to OnHold or Cancelled
   */
  async voidPendingRetry(
    subscriptionId: string,
    subscriptionType: SubscriptionType
  ): Promise<void> {
    const table =
      subscriptionType === 'product'
        ? schema.product_subscriptions
        : schema.extension_subscriptions

    await this.db
      .update(table)
      .set({
        lastPaymentAttemptDate: null,
        lastPaymentFailureReason: null,
        paymentFailureCount: 0
      })
      .where(eq(table.id, subscriptionId))
  }

  /**
   * Reschedule payment with cascade to future payments (30-day intervals)
   */
  async reschedulePayment(
    subscriptionId: string,
    subscriptionType: SubscriptionType,
    newPaymentDate: string
  ): Promise<void> {
    const table =
      subscriptionType === 'product'
        ? schema.product_subscriptions
        : schema.extension_subscriptions

    // Get current subscription details
    const [subscription] = await this.db
      .select({ remainingPayments: table.remainingPayments })
      .from(table)
      .where(eq(table.id, subscriptionId))

    if (!subscription) {
      throw new Error('Subscription not found')
    }

    // Update next payment date
    // Note: The cascade logic for multiple future payments would need to be implemented
    // in a more complex way if we track individual payment schedules in a separate table.
    // For now, we just update the next payment date, and subsequent payments will be
    // calculated as 30-day intervals from this new date by the cron job logic.
    await this.db
      .update(table)
      .set({
        nextPaymentDate: newPaymentDate
      })
      .where(eq(table.id, subscriptionId))
  }

  /**
   * Sync membership status based on subscription state
   * This is a utility function to ensure consistency
   */
  async syncMembershipStatus(
    membershipId: string,
    subscriptionStatus: SubscriptionStatusType
  ): Promise<void> {
    let newMembershipStatus: MembershipStatusType

    switch (subscriptionStatus) {
      case SubscriptionStatusType.Active:
        newMembershipStatus = MembershipStatusType.Active
        break
      case SubscriptionStatusType.OnHold:
        newMembershipStatus = MembershipStatusType.Paused
        break
      case SubscriptionStatusType.Cancelled:
        newMembershipStatus = MembershipStatusType.Cancelled
        break
      case SubscriptionStatusType.Completed:
        // Keep membership active when subscription is completed
        // (user has paid in full, should have access until end date)
        newMembershipStatus = MembershipStatusType.Active
        break
      default:
        return // No change needed
    }

    await this.db
      .update(schema.memberships)
      .set({ status: newMembershipStatus })
      .where(eq(schema.memberships.id, membershipId))
  }

  /**
   * Process scheduled cancellations
   * Called by cron job to check for subscriptions that should be cancelled today
   */
  async processScheduledCancellations(): Promise<{
    processedCount: number
    cancelledSubscriptions: string[]
  }> {
    const now = new Date().toISOString()
    const cancelledSubscriptions: string[] = []

    // Process product subscriptions
    const productSubs = await this.db
      .select({
        id: schema.product_subscriptions.id,
        membershipId: schema.product_subscriptions.membershipId,
        scheduledCancellationDate:
          schema.product_subscriptions.scheduledCancellationDate
      })
      .from(schema.product_subscriptions)
      .where(
        eq(schema.product_subscriptions.status, SubscriptionStatusType.Active)
      )

    for (const sub of productSubs) {
      if (
        sub.scheduledCancellationDate &&
        sub.scheduledCancellationDate <= now
      ) {
        // Cancel subscription
        await this.db
          .update(schema.product_subscriptions)
          .set({
            scheduledCancellationDate: null,
            status: SubscriptionStatusType.Cancelled
          })
          .where(eq(schema.product_subscriptions.id, sub.id))

        // Cancel membership (only if subscription is linked to a membership)
        if (sub.membershipId) {
          await this.db
            .update(schema.memberships)
            .set({ status: MembershipStatusType.Cancelled })
            .where(eq(schema.memberships.id, sub.membershipId))
        }

        cancelledSubscriptions.push(sub.id)
      }
    }

    // Process extension subscriptions
    const extensionSubs = await this.db
      .select({
        id: schema.extension_subscriptions.id,
        membershipId: schema.extension_subscriptions.membershipId,
        scheduledCancellationDate:
          schema.extension_subscriptions.scheduledCancellationDate
      })
      .from(schema.extension_subscriptions)
      .where(
        eq(schema.extension_subscriptions.status, SubscriptionStatusType.Active)
      )

    for (const sub of extensionSubs) {
      if (
        sub.scheduledCancellationDate &&
        sub.scheduledCancellationDate <= now
      ) {
        // Cancel subscription
        await this.db
          .update(schema.extension_subscriptions)
          .set({
            scheduledCancellationDate: null,
            status: SubscriptionStatusType.Cancelled
          })
          .where(eq(schema.extension_subscriptions.id, sub.id))

        // Cancel membership (only if subscription is linked to a membership)
        if (sub.membershipId) {
          await this.db
            .update(schema.memberships)
            .set({ status: MembershipStatusType.Cancelled })
            .where(eq(schema.memberships.id, sub.membershipId))
        }

        cancelledSubscriptions.push(sub.id)
      }
    }

    return {
      cancelledSubscriptions,
      processedCount: cancelledSubscriptions.length
    }
  }
}
