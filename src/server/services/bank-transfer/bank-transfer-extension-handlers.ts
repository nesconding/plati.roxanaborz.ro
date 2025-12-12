import { eq } from 'drizzle-orm'
import type { Database } from '~/server/database/drizzle'
import * as schema from '~/server/database/schema'
import { DatesService } from '~/server/services/dates'
import { MembershipStatusType } from '~/shared/enums/membership-status-type'
import { OrderStatusType } from '~/shared/enums/order-status-type'
import { OrderType } from '~/shared/enums/order-type'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'
import { PaymentMethodType } from '~/shared/enums/payment-method-type'
import { SubscriptionStatusType } from '~/shared/enums/subscription-status-type'

/**
 * Handles bank transfer payment completion for extension orders.
 * Supports both initial orders (ParentOrder/OneTimePaymentOrder) and
 * renewal orders (RenewalOrder) for subscriptions.
 */
export class BankTransferExtensionHandlers {
  constructor(private readonly db: Database) {}

  /**
   * Complete an extension bank transfer order by extending membership
   * or handling subscription payments.
   */
  async completeOrder(orderId: string): Promise<void> {
    const order = await this.db.query.extension_orders.findFirst({
      where: (extension_orders, { eq }) => eq(extension_orders.id, orderId),
      with: {
        extensionPaymentLink: {
          with: {
            extension: true
          }
        },
        membership: true
      }
    })

    if (!order) {
      throw new Error(`Extension order not found: ${orderId}`)
    }

    if (!order.extensionPaymentLink) {
      throw new Error(`Extension payment link not found for order: ${orderId}`)
    }

    if (!order.extensionPaymentLink.extension) {
      throw new Error(`Extension not found for order: ${orderId}`)
    }

    // Check if this is a subsequent payment (subscription already exists)
    const existingSubscription =
      await this.db.query.extension_subscriptions.findFirst({
        where: (extension_subscriptions, { and, eq }) =>
          and(
            eq(extension_subscriptions.parentOrderId, orderId),
            eq(extension_subscriptions.status, SubscriptionStatusType.Active)
          ),
        with: {
          membership: true
        }
      })

    if (existingSubscription && existingSubscription.remainingPayments > 0) {
      // Subsequent payment - decrement remaining payments
      await this.handleSubsequentPayment(
        existingSubscription,
        order.extensionPaymentLink.extension,
        order.membership
      )
      return
    }

    // First payment - create subscription (and possibly extend membership)
    if (
      order.type === OrderType.ParentOrder ||
      order.type === OrderType.OneTimePaymentOrder
    ) {
      await this.handleInitialOrder(order)
    } else if (order.type === OrderType.RenewalOrder) {
      await this.handleRenewalOrder(order)
    } else {
      await this.handleInitialOrder(order)
    }
  }

  /**
   * Handle initial extension order (first payment)
   */
  private async handleInitialOrder(order: {
    customerEmail: string
    customerName: string | null
    extensionPaymentLink: {
      extension: {
        extensionMonths: number
        id: string
      }
      extensionId: string
      extensionInstallmentsCount: number | null
      firstPaymentDateAfterDeposit: string | null
      id: string
      type: string
    }
    id: string
    membership: {
      endDate: string
      id: string
    } | null
    membershipId: string | null
    productName: string
  }): Promise<void> {
    const { extensionPaymentLink, membership } = order
    const { extension } = extensionPaymentLink

    if (!membership) {
      throw new Error(`Membership not found for extension order: ${order.id}`)
    }

    switch (extensionPaymentLink.type) {
      case PaymentLinkType.Integral:
        await this.handleIntegralCompletion(order, extension, membership)
        break

      case PaymentLinkType.Deposit:
        await this.handleDepositCompletion(
          order,
          extensionPaymentLink,
          extension,
          membership
        )
        break

      case PaymentLinkType.Installments:
        await this.handleInstallmentsCompletion(
          order,
          extensionPaymentLink,
          extension,
          membership
        )
        break

      case PaymentLinkType.InstallmentsDeposit:
        await this.handleInstallmentsDepositCompletion(
          order,
          extensionPaymentLink,
          extension,
          membership
        )
        break

      default:
        await this.handleIntegralCompletion(order, extension, membership)
    }
  }

  /**
   * Handle renewal order (subscription payment)
   * Decrements remaining payments and extends membership if final payment
   * Updates parent order status to Completed when all payments are done
   */
  private async handleRenewalOrder(order: {
    extensionPaymentLink: {
      extension: {
        extensionMonths: number
        id: string
      }
      id: string
    }
    id: string
    membership: {
      endDate: string
      id: string
    } | null
    membershipId: string | null
  }): Promise<void> {
    const { extensionPaymentLink, membership } = order
    const { extension } = extensionPaymentLink

    // Find the active subscription for this extension
    const subscription = await this.db.query.extension_subscriptions.findFirst({
      where: (extension_subscriptions, { and, eq }) =>
        and(
          eq(extension_subscriptions.status, SubscriptionStatusType.Active),
          eq(
            extension_subscriptions.paymentMethod,
            PaymentMethodType.BankTransfer
          ),
          eq(extension_subscriptions.extensionId, extension.id)
        ),
      with: {
        membership: true
      }
    })

    if (!subscription) {
      console.log(
        `[BankTransfer] No active extension subscription found for renewal order ${order.id}`
      )
      return
    }

    // Mark current renewal order as completed
    await this.db
      .update(schema.extension_orders)
      .set({ status: OrderStatusType.Completed })
      .where(eq(schema.extension_orders.id, order.id))

    const targetMembership = subscription.membership || membership

    const newRemainingPayments = subscription.remainingPayments - 1

    if (newRemainingPayments === 0) {
      // Final payment - complete the subscription
      await this.db
        .update(schema.extension_subscriptions)
        .set({
          nextPaymentDate: null,
          remainingPayments: 0,
          status: SubscriptionStatusType.Completed
        })
        .where(eq(schema.extension_subscriptions.id, subscription.id))

      // Extend membership end date
      if (targetMembership) {
        const newEndDate = DatesService.addMonths(
          targetMembership.endDate,
          extension.extensionMonths
        )

        await this.db
          .update(schema.memberships)
          .set({
            endDate: newEndDate.toISOString(),
            status: MembershipStatusType.Active
          })
          .where(eq(schema.memberships.id, targetMembership.id))
      }

      // Mark parent order as completed (all payments done)
      await this.db
        .update(schema.extension_orders)
        .set({ status: OrderStatusType.Completed })
        .where(eq(schema.extension_orders.id, subscription.parentOrderId))
    } else {
      // More payments remaining - decrement and update next payment date
      const nextPaymentDate = DatesService.addMonths(new Date(), 1)

      await this.db
        .update(schema.extension_subscriptions)
        .set({
          nextPaymentDate: nextPaymentDate.toISOString(),
          remainingPayments: newRemainingPayments
        })
        .where(eq(schema.extension_subscriptions.id, subscription.id))
    }
  }

  /**
   * Handle subsequent payment on existing subscription
   * Decrements remaining payments and extends membership if final payment
   */
  private async handleSubsequentPayment(
    subscription: {
      id: string
      membership: {
        endDate: string
        id: string
      } | null
      parentOrderId: string
      remainingPayments: number
    },
    extension: {
      extensionMonths: number
    },
    orderMembership: {
      endDate: string
      id: string
    } | null
  ): Promise<void> {
    const newRemainingPayments = subscription.remainingPayments - 1
    const targetMembership = subscription.membership || orderMembership

    if (newRemainingPayments === 0) {
      // Final payment - complete the subscription
      await this.db
        .update(schema.extension_subscriptions)
        .set({
          nextPaymentDate: null,
          remainingPayments: 0,
          status: SubscriptionStatusType.Completed
        })
        .where(eq(schema.extension_subscriptions.id, subscription.id))

      // Extend membership end date
      if (targetMembership) {
        const newEndDate = DatesService.addMonths(
          targetMembership.endDate,
          extension.extensionMonths
        )

        await this.db
          .update(schema.memberships)
          .set({
            endDate: newEndDate.toISOString(),
            status: MembershipStatusType.Active
          })
          .where(eq(schema.memberships.id, targetMembership.id))
      }

      // Mark parent order as completed (all payments done)
      await this.db
        .update(schema.extension_orders)
        .set({ status: OrderStatusType.Completed })
        .where(eq(schema.extension_orders.id, subscription.parentOrderId))
    } else {
      // More payments remaining - decrement and update next payment date
      const nextPaymentDate = DatesService.addMonths(new Date(), 1)

      await this.db
        .update(schema.extension_subscriptions)
        .set({
          nextPaymentDate: nextPaymentDate.toISOString(),
          remainingPayments: newRemainingPayments
        })
        .where(eq(schema.extension_subscriptions.id, subscription.id))
    }
  }

  /**
   * Integral: Extend membership endDate immediately
   * Order is completed immediately (single payment)
   */
  private async handleIntegralCompletion(
    order: {
      id: string
    },
    extension: {
      extensionMonths: number
    },
    membership: {
      endDate: string
      id: string
    }
  ): Promise<void> {
    // Check if already extended (idempotency) - skip if order was already processed
    const existingSubscription =
      await this.db.query.extension_subscriptions.findFirst({
        where: (extension_subscriptions, { eq }) =>
          eq(extension_subscriptions.parentOrderId, order.id)
      })

    if (existingSubscription) {
      console.log(
        `[BankTransfer] Extension already processed for order ${order.id}, skipping`
      )
      return
    }

    const newEndDate = DatesService.addMonths(
      membership.endDate,
      extension.extensionMonths
    )

    await this.db
      .update(schema.memberships)
      .set({
        endDate: newEndDate.toISOString()
      })
      .where(eq(schema.memberships.id, membership.id))

    // Single payment - order is completed
    await this.db
      .update(schema.extension_orders)
      .set({ status: OrderStatusType.Completed })
      .where(eq(schema.extension_orders.id, order.id))
  }

  /**
   * Deposit: Create subscription (1 remaining payment)
   * Membership extension happens when final payment is completed
   * Order is processing until final payment
   */
  private async handleDepositCompletion(
    order: {
      customerEmail: string
      customerName: string | null
      id: string
      membershipId: string | null
      productName: string
    },
    paymentLink: {
      extensionId: string
      firstPaymentDateAfterDeposit: string | null
    },
    extension: {
      id: string
    },
    membership: {
      id: string
    }
  ): Promise<void> {
    if (!paymentLink.firstPaymentDateAfterDeposit) {
      throw new Error(
        'firstPaymentDateAfterDeposit is required for deposit payments'
      )
    }

    // Check if subscription already exists (idempotency)
    const existingSubscription =
      await this.db.query.extension_subscriptions.findFirst({
        where: (extension_subscriptions, { eq }) =>
          eq(extension_subscriptions.parentOrderId, order.id)
      })

    if (existingSubscription) {
      console.log(
        `[BankTransfer] Extension subscription already exists for order ${order.id}, skipping`
      )
      return
    }

    await this.db.insert(schema.extension_subscriptions).values({
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      extensionId: extension.id,
      membershipId: membership.id,
      nextPaymentDate: paymentLink.firstPaymentDateAfterDeposit,
      parentOrderId: order.id,
      paymentMethod: PaymentMethodType.BankTransfer,
      productName: order.productName,
      remainingPayments: 1,
      startDate: new Date().toISOString(),
      status: SubscriptionStatusType.Active
    })

    // More payments pending - order is processing
    await this.db
      .update(schema.extension_orders)
      .set({ status: OrderStatusType.ProcessingBankTransferPayment })
      .where(eq(schema.extension_orders.id, order.id))
  }

  /**
   * Installments: Create subscription (N-1 remaining payments)
   * If installmentsCount = 1, this is the first and last payment - extend immediately
   */
  private async handleInstallmentsCompletion(
    order: {
      customerEmail: string
      customerName: string | null
      id: string
      membershipId: string | null
      productName: string
    },
    paymentLink: {
      extensionId: string
      extensionInstallmentsCount: number | null
    },
    extension: {
      extensionMonths: number
      id: string
    },
    membership: {
      endDate: string
      id: string
    }
  ): Promise<void> {
    // Check if subscription already exists (idempotency for all cases)
    const existingSubscription =
      await this.db.query.extension_subscriptions.findFirst({
        where: (extension_subscriptions, { eq }) =>
          eq(extension_subscriptions.parentOrderId, order.id)
      })

    if (existingSubscription) {
      console.log(
        `[BankTransfer] Extension subscription already exists for order ${order.id}, skipping`
      )
      return
    }

    const installmentsCount = paymentLink.extensionInstallmentsCount ?? 1
    const remainingPayments = installmentsCount - 1

    if (remainingPayments > 0) {
      // Multi-payment case: Create subscription for remaining payments
      const nextPaymentDate = DatesService.addMonths(new Date(), 1)

      await this.db.insert(schema.extension_subscriptions).values({
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        extensionId: extension.id,
        membershipId: membership.id,
        nextPaymentDate: nextPaymentDate.toISOString(),
        parentOrderId: order.id,
        paymentMethod: PaymentMethodType.BankTransfer,
        productName: order.productName,
        remainingPayments,
        startDate: new Date().toISOString(),
        status: SubscriptionStatusType.Active
      })

      // More payments pending - order is processing
      await this.db
        .update(schema.extension_orders)
        .set({ status: OrderStatusType.ProcessingBankTransferPayment })
        .where(eq(schema.extension_orders.id, order.id))
    } else {
      // Single payment case (installmentsCount = 1): First and last payment
      // Extend membership immediately and create completed subscription as marker
      const newEndDate = DatesService.addMonths(
        membership.endDate,
        extension.extensionMonths
      )

      // Extend membership
      await this.db
        .update(schema.memberships)
        .set({
          endDate: newEndDate.toISOString(),
          status: MembershipStatusType.Active
        })
        .where(eq(schema.memberships.id, membership.id))

      // Create completed subscription as idempotency marker
      await this.db.insert(schema.extension_subscriptions).values({
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        extensionId: extension.id,
        membershipId: membership.id,
        nextPaymentDate: null,
        parentOrderId: order.id,
        paymentMethod: PaymentMethodType.BankTransfer,
        productName: order.productName,
        remainingPayments: 0,
        startDate: new Date().toISOString(),
        status: SubscriptionStatusType.Completed
      })

      // Single installment (n=1) - order is completed
      await this.db
        .update(schema.extension_orders)
        .set({ status: OrderStatusType.Completed })
        .where(eq(schema.extension_orders.id, order.id))
    }
  }

  /**
   * InstallmentsDeposit: Create subscription (N remaining payments)
   * Deposit is separate from installments
   * Order is processing until all payments done
   */
  private async handleInstallmentsDepositCompletion(
    order: {
      customerEmail: string
      customerName: string | null
      id: string
      membershipId: string | null
      productName: string
    },
    paymentLink: {
      extensionId: string
      extensionInstallmentsCount: number | null
      firstPaymentDateAfterDeposit: string | null
    },
    extension: {
      id: string
    },
    membership: {
      id: string
    }
  ): Promise<void> {
    if (!paymentLink.firstPaymentDateAfterDeposit) {
      throw new Error(
        'firstPaymentDateAfterDeposit is required for installments deposit payments'
      )
    }

    // Check if subscription already exists (idempotency)
    const existingSubscription =
      await this.db.query.extension_subscriptions.findFirst({
        where: (extension_subscriptions, { eq }) =>
          eq(extension_subscriptions.parentOrderId, order.id)
      })

    if (existingSubscription) {
      console.log(
        `[BankTransfer] Extension subscription already exists for order ${order.id}, skipping`
      )
      return
    }

    const installmentsCount = paymentLink.extensionInstallmentsCount ?? 1

    await this.db.insert(schema.extension_subscriptions).values({
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      extensionId: extension.id,
      membershipId: membership.id,
      nextPaymentDate: paymentLink.firstPaymentDateAfterDeposit,
      parentOrderId: order.id,
      paymentMethod: PaymentMethodType.BankTransfer,
      productName: order.productName,
      remainingPayments: installmentsCount,
      startDate: new Date().toISOString(),
      status: SubscriptionStatusType.Active
    })

    // More payments pending - order is processing
    await this.db
      .update(schema.extension_orders)
      .set({ status: OrderStatusType.ProcessingBankTransferPayment })
      .where(eq(schema.extension_orders.id, order.id))
  }
}
