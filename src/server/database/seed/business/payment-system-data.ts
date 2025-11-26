import { fakerRO } from '@faker-js/faker'
import { createId } from '@paralleldrive/cuid2'
import { eq } from 'drizzle-orm'
import Stripe from 'stripe'
import { PricingService } from '~/lib/pricing'
import { database } from '~/server/database/drizzle'
import type {
  extension_orders,
  extension_payment_links,
  extension_subscriptions,
  memberships,
  product_orders,
  product_payment_links,
  product_subscriptions
} from '~/server/database/schema'
import { users } from '~/server/database/schema'
import { DatesService } from '~/server/services/dates'
import { MembershipStatusType } from '~/shared/enums/membership-status-type'
import { OrderStatusType } from '~/shared/enums/order-status-type'
import { OrderType } from '~/shared/enums/order-type'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'
import { PaymentMethodType } from '~/shared/enums/payment-method-type'
import { PaymentProductType } from '~/shared/enums/payment-product-type'
import { PaymentStatusType } from '~/shared/enums/payment-status'
import { SubscriptionStatusType } from '~/shared/enums/subscription-status-type'
import { UserRoles } from '~/shared/enums/user-roles'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Helper to create Stripe customer
async function createStripeCustomer(
  email: string,
  name: string
): Promise<Stripe.Customer> {
  return await stripe.customers.create({
    email,
    metadata: {
      customerEmail: email,
      customerName: name,
      seedData: 'true'
    },
    name
  })
}

// Helper to create Stripe payment intent
async function createStripePaymentIntent(
  amount: number,
  currency: string,
  customerId: string,
  metadata: Record<string, string>
): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.create({
    amount,
    currency: currency.toLowerCase(),
    customer: customerId,
    metadata: {
      ...metadata,
      seedData: 'true'
    },
    payment_method_types: ['card'],
    setup_future_usage: 'off_session'
  })
}

/**
 * Create product payment links with all payment types and statuses
 */
export async function createProductPaymentLinksData(dependencies: {
  users: (typeof users.$inferSelect)[]
  products: unknown[]
  contracts: unknown[]
  paymentsSettings: unknown[]
  productsInstallments: unknown[]
}) {
  const { products, contracts, paymentsSettings, productsInstallments } =
    dependencies

  const ronSetting = (paymentsSettings as any[]).find(
    (s) => s.currency === 'RON'
  )!

  const paymentLinks: (typeof product_payment_links.$inferInsert)[] = []

  // Get admin user from database (roles are updated after user creation in seed)
  const [adminUser] = await database
    .select()
    .from(users)
    .where(eq(users.role, UserRoles.SUPER_ADMIN))
    .limit(1)

  const [regularUser] = await database
    .select()
    .from(users)
    .where(eq(users.role, UserRoles.USER))
    .limit(1)

  // Helper function to generate customer data
  const generateCustomer = () => {
    const firstName = fakerRO.person.firstName()
    const lastName = fakerRO.person.lastName()
    return {
      customerEmail: fakerRO.internet.email({ firstName, lastName }),
      customerName: `${firstName} ${lastName}`,
      firstName,
      lastName
    }
  }

  // For each product, create payment links for each payment type
  for (const product of (products as any[]).slice(0, 3)) {
    const customer = generateCustomer()
    const contract = fakerRO.helpers.arrayElement(contracts as any[])

    // Create Stripe customer
    const stripeCustomer = await createStripeCustomer(
      customer.customerEmail,
      customer.customerName
    )

    // 1. PRODUCT INTEGRAL - Succeeded
    const integralPrice = parseFloat(product.price)
    const integralPriceInCents = PricingService.convertToCents(integralPrice)
    const integralPaymentIntent = await createStripePaymentIntent(
      integralPriceInCents,
      ronSetting.currency,
      stripeCustomer.id,
      {
        currency: ronSetting.currency,
        customerEmail: customer.customerEmail,
        customerName: customer.customerName,
        paymentProductType: PaymentProductType.Product,
        productId: product.id,
        productName: product.name,
        type: PaymentLinkType.Integral
      }
    )

    paymentLinks.push({
      contractId: contract.id,
      createdById: adminUser.id,
      currency: ronSetting.currency,
      customerEmail: customer.customerEmail,
      customerName: customer.customerName,
      expiresAt: DatesService.addDays(new Date(), 30).toISOString(),
      extraTaxRate: ronSetting.extraTaxRate,
      id: createId(),
      paymentMethodType: PaymentMethodType.Card,
      paymentProductType: PaymentProductType.Product,
      productId: product.id,
      productName: product.name,
      status: PaymentStatusType.Succeeded,
      stripeClientSecret: integralPaymentIntent.client_secret!,
      stripePaymentIntentId: integralPaymentIntent.id,
      totalAmountToPay: product.price,
      totalAmountToPayInCents: integralPriceInCents.toString(),
      tvaRate: ronSetting.tvaRate,
      type: PaymentLinkType.Integral
    })

    // 2. PRODUCT DEPOSIT - Completed deposit, pending final payment
    const depositAmount = parseFloat(product.minDepositAmount)
    const depositAmountInCents = PricingService.convertToCents(depositAmount)
    const remainingAmount = integralPrice - depositAmount
    const remainingAmountInCents =
      PricingService.convertToCents(remainingAmount)
    const firstPaymentDateAfterDeposit = DatesService.addDays(new Date(), 7)

    const depositPaymentIntent = await createStripePaymentIntent(
      depositAmountInCents,
      ronSetting.currency,
      stripeCustomer.id,
      {
        currency: ronSetting.currency,
        customerEmail: customer.customerEmail,
        customerName: customer.customerName,
        depositAmountInCents: depositAmountInCents.toString(),
        firstPaymentDateAfterDeposit:
          firstPaymentDateAfterDeposit.toISOString(),
        paymentProductType: PaymentProductType.Product,
        productId: product.id,
        productName: product.name,
        remainingAmountToPayInCents: remainingAmountInCents.toString(),
        type: PaymentLinkType.Deposit
      }
    )

    paymentLinks.push({
      contractId: contract.id,
      createdById: adminUser.id,
      currency: ronSetting.currency,
      customerEmail: customer.customerEmail,
      customerName: customer.customerName,
      depositAmount: depositAmount.toString(),
      depositAmountInCents: depositAmountInCents.toString(),
      eurToRonRate: ronSetting.eurToRonRate,
      expiresAt: DatesService.addDays(new Date(), 30).toISOString(),
      extraTaxRate: ronSetting.extraTaxRate,
      firstPaymentDateAfterDeposit: firstPaymentDateAfterDeposit.toISOString(),
      id: createId(),
      paymentMethodType: PaymentMethodType.Card,
      paymentProductType: PaymentProductType.Product,
      productId: product.id,
      productName: product.name,
      remainingAmountToPay: remainingAmount.toString(),
      remainingAmountToPayInCents: remainingAmountInCents.toString(),
      status: PaymentStatusType.Succeeded,
      stripeClientSecret: depositPaymentIntent.client_secret!,
      stripePaymentIntentId: depositPaymentIntent.id,
      totalAmountToPay: product.price,
      totalAmountToPayInCents: integralPriceInCents.toString(),
      tvaRate: ronSetting.tvaRate,
      type: PaymentLinkType.Deposit
    })

    // 3. PRODUCT INSTALLMENTS - Active subscription
    if ((productsInstallments as any[]).length > 0) {
      const installment = (productsInstallments as any[]).find(
        (i: any) => i.productId === product.id
      )
      if (installment) {
        const installmentPrice = parseFloat(installment.pricePerInstallment)
        const installmentPriceInCents =
          PricingService.convertToCents(installmentPrice)
        const totalPrice = installmentPrice * installment.count
        const totalPriceInCents = PricingService.convertToCents(totalPrice)

        const installmentsPaymentIntent = await createStripePaymentIntent(
          installmentPriceInCents,
          ronSetting.currency,
          stripeCustomer.id,
          {
            currency: ronSetting.currency,
            customerEmail: customer.customerEmail,
            customerName: customer.customerName,
            paymentProductType: PaymentProductType.Product,
            productId: product.id,
            productInstallmentAmountToPayInCents:
              installmentPriceInCents.toString(),
            productInstallmentsCount: installment.count.toString(),
            productName: product.name,
            type: PaymentLinkType.Installments
          }
        )

        paymentLinks.push({
          contractId: contract.id,
          createdById: adminUser.id,
          currency: ronSetting.currency,
          customerEmail: customer.customerEmail,
          customerName: customer.customerName,
          expiresAt: DatesService.addDays(new Date(), 30).toISOString(),
          extraTaxRate: ronSetting.extraTaxRate,
          id: createId(),
          paymentMethodType: PaymentMethodType.Card,
          paymentProductType: PaymentProductType.Product,
          productId: product.id,
          productInstallmentAmountToPay: installmentPrice.toString(),
          productInstallmentAmountToPayInCents:
            installmentPriceInCents.toString(),
          productInstallmentId: installment.id,
          productInstallmentsCount: installment.count,
          productName: product.name,
          status: PaymentStatusType.Succeeded,
          stripeClientSecret: installmentsPaymentIntent.client_secret!,
          stripePaymentIntentId: installmentsPaymentIntent.id,
          totalAmountToPay: totalPrice.toString(),
          totalAmountToPayInCents: totalPriceInCents.toString(),
          tvaRate: ronSetting.tvaRate,
          type: PaymentLinkType.Installments
        })
      }
    }

    // 4. PRODUCT INSTALLMENTS DEPOSIT - Delayed membership
    if ((productsInstallments as any[]).length > 0) {
      const installment = (productsInstallments as any[]).find(
        (i: any) => i.productId === product.id
      )
      if (installment) {
        const totalPrice = parseFloat(product.price)
        const depositAmount = parseFloat(product.minDepositAmount)
        const remainingAmount = totalPrice - depositAmount
        const installmentPrice = remainingAmount / installment.count

        const depositAmountInCents =
          PricingService.convertToCents(depositAmount)
        const totalPriceInCents = PricingService.convertToCents(totalPrice)
        const remainingAmountInCents =
          PricingService.convertToCents(remainingAmount)
        const installmentPriceInCents =
          PricingService.convertToCents(installmentPrice)
        const firstPaymentDate = DatesService.addDays(new Date(), 10)

        const installmentsDepositPaymentIntent =
          await createStripePaymentIntent(
            depositAmountInCents,
            ronSetting.currency,
            stripeCustomer.id,
            {
              currency: ronSetting.currency,
              customerEmail: customer.customerEmail,
              customerName: customer.customerName,
              depositAmountInCents: depositAmountInCents.toString(),
              firstPaymentDateAfterDeposit: firstPaymentDate.toISOString(),
              paymentProductType: PaymentProductType.Product,
              productId: product.id,
              productInstallmentAmountToPayInCents:
                installmentPriceInCents.toString(),
              productInstallmentsCount: installment.count.toString(),
              productName: product.name,
              remainingAmountToPayInCents: remainingAmountInCents.toString(),
              remainingInstallmentAmountToPayInCents:
                installmentPriceInCents.toString(),
              type: PaymentLinkType.InstallmentsDeposit
            }
          )

        paymentLinks.push({
          contractId: contract.id,
          createdById: adminUser.id,
          currency: ronSetting.currency,
          customerEmail: customer.customerEmail,
          customerName: customer.customerName,
          depositAmount: depositAmount.toString(),
          depositAmountInCents: depositAmountInCents.toString(),
          eurToRonRate: ronSetting.eurToRonRate,
          expiresAt: DatesService.addDays(new Date(), 30).toISOString(),
          extraTaxRate: ronSetting.extraTaxRate,
          firstPaymentDateAfterDeposit: firstPaymentDate.toISOString(),
          id: createId(),
          paymentMethodType: PaymentMethodType.Card,
          paymentProductType: PaymentProductType.Product,
          productId: product.id,
          productInstallmentAmountToPay: installmentPrice.toString(),
          productInstallmentAmountToPayInCents:
            installmentPriceInCents.toString(),
          productInstallmentId: installment.id,
          productInstallmentsCount: installment.count,
          productName: product.name,
          remainingAmountToPay: remainingAmount.toString(),
          remainingAmountToPayInCents: remainingAmountInCents.toString(),
          remainingInstallmentAmountToPay: installmentPrice.toString(),
          remainingInstallmentAmountToPayInCents:
            installmentPriceInCents.toString(),
          status: PaymentStatusType.Succeeded,
          stripeClientSecret: installmentsDepositPaymentIntent.client_secret!,
          stripePaymentIntentId: installmentsDepositPaymentIntent.id,
          totalAmountToPay: totalPrice.toString(),
          totalAmountToPayInCents: totalPriceInCents.toString(),
          tvaRate: ronSetting.tvaRate,
          type: PaymentLinkType.InstallmentsDeposit
        })
      }
    }
  }

  // Add payment links with all possible payment statuses
  const statusProduct = (products as any[])[0]
  const statusContract = (contracts as any[])[0]

  // Create payment links for each payment status type
  const paymentStatuses: PaymentStatusType[] = [
    PaymentStatusType.Created,
    PaymentStatusType.RequiresPaymentMethod,
    PaymentStatusType.RequiresConfirmation,
    PaymentStatusType.RequiresAction,
    PaymentStatusType.Processing,
    PaymentStatusType.RequiresCapture,
    PaymentStatusType.Canceled,
    PaymentStatusType.PaymentFailed,
    PaymentStatusType.Expired
  ]

  for (const status of paymentStatuses) {
    const customer = generateCustomer()
    const stripeCustomer = await createStripeCustomer(
      customer.customerEmail,
      customer.customerName
    )

    const price = parseFloat(statusProduct.price)
    const priceInCents = PricingService.convertToCents(price)

    // Create payment intent with appropriate status
    let paymentIntent: Stripe.PaymentIntent

    if (status === PaymentStatusType.Succeeded) {
      paymentIntent = await stripe.paymentIntents.create({
        amount: priceInCents,
        confirm: true,
        currency: ronSetting.currency.toLowerCase(),
        customer: stripeCustomer.id,
        metadata: { seedData: 'true', status },
        payment_method: 'pm_card_visa', // Auto-confirm
        return_url: 'https://example.com/return'
      })
    } else if (status === PaymentStatusType.Canceled) {
      paymentIntent = await stripe.paymentIntents.create({
        amount: priceInCents,
        currency: ronSetting.currency.toLowerCase(),
        customer: stripeCustomer.id,
        metadata: { seedData: 'true', status }
      })
      paymentIntent = await stripe.paymentIntents.cancel(paymentIntent.id)
    } else if (status === PaymentStatusType.RequiresCapture) {
      paymentIntent = await stripe.paymentIntents.create({
        amount: priceInCents,
        capture_method: 'manual',
        confirm: true,
        currency: ronSetting.currency.toLowerCase(),
        customer: stripeCustomer.id,
        metadata: { seedData: 'true', status },
        payment_method: 'pm_card_visa',
        return_url: 'https://example.com/return'
      })
    } else {
      // For other statuses, just create a basic payment intent
      paymentIntent = await stripe.paymentIntents.create({
        amount: priceInCents,
        currency: ronSetting.currency.toLowerCase(),
        customer: stripeCustomer.id,
        metadata: { seedData: 'true', status }
      })
    }

    paymentLinks.push({
      contractId: statusContract.id,
      createdById: regularUser?.id || adminUser.id,
      currency: ronSetting.currency,
      customerEmail: customer.customerEmail,
      customerName: customer.customerName,
      expiresAt:
        status === PaymentStatusType.Expired
          ? DatesService.addDays(new Date(), -5).toISOString()
          : DatesService.addDays(new Date(), 30).toISOString(),
      extraTaxRate: ronSetting.extraTaxRate,
      id: createId(),
      paymentMethodType: PaymentMethodType.Card,
      paymentProductType: PaymentProductType.Product,
      productId: statusProduct.id,
      productName: statusProduct.name,
      status: status,
      stripeClientSecret: paymentIntent.client_secret!,
      stripePaymentIntentId: paymentIntent.id,
      totalAmountToPay: statusProduct.price,
      totalAmountToPayInCents: priceInCents.toString(),
      tvaRate: ronSetting.tvaRate,
      type: PaymentLinkType.Integral
    })
  }

  // Add deposit payment links with different statuses
  for (const status of [
    PaymentStatusType.Succeeded,
    PaymentStatusType.Processing,
    PaymentStatusType.PaymentFailed
  ]) {
    const customer = generateCustomer()
    const stripeCustomer = await createStripeCustomer(
      customer.customerEmail,
      customer.customerName
    )

    const totalPrice = parseFloat(statusProduct.price)
    const depositAmount = parseFloat(statusProduct.minDepositAmount)
    const remainingAmount = totalPrice - depositAmount
    const depositAmountInCents = PricingService.convertToCents(depositAmount)
    const remainingAmountInCents =
      PricingService.convertToCents(remainingAmount)
    const totalPriceInCents = PricingService.convertToCents(totalPrice)

    const paymentIntent = await createStripePaymentIntent(
      depositAmountInCents,
      ronSetting.currency,
      stripeCustomer.id,
      {
        currency: ronSetting.currency,
        customerEmail: customer.customerEmail,
        customerName: customer.customerName,
        depositAmountInCents: depositAmountInCents.toString(),
        paymentProductType: PaymentProductType.Product,
        productId: statusProduct.id,
        productName: statusProduct.name,
        remainingAmountToPayInCents: remainingAmountInCents.toString(),
        status,
        type: PaymentLinkType.Deposit
      }
    )

    paymentLinks.push({
      contractId: statusContract.id,
      createdById: adminUser.id,
      currency: ronSetting.currency,
      customerEmail: customer.customerEmail,
      customerName: customer.customerName,
      depositAmount: depositAmount.toString(),
      depositAmountInCents: depositAmountInCents.toString(),
      eurToRonRate: ronSetting.eurToRonRate,
      expiresAt: DatesService.addDays(new Date(), 30).toISOString(),
      extraTaxRate: ronSetting.extraTaxRate,
      firstPaymentDateAfterDeposit: DatesService.addDays(
        new Date(),
        7
      ).toISOString(),
      id: createId(),
      paymentMethodType: PaymentMethodType.Card,
      paymentProductType: PaymentProductType.Product,
      productId: statusProduct.id,
      productName: statusProduct.name,
      remainingAmountToPay: remainingAmount.toString(),
      remainingAmountToPayInCents: remainingAmountInCents.toString(),
      status: status,
      stripeClientSecret: paymentIntent.client_secret!,
      stripePaymentIntentId: paymentIntent.id,
      totalAmountToPay: totalPrice.toString(),
      totalAmountToPayInCents: totalPriceInCents.toString(),
      tvaRate: ronSetting.tvaRate,
      type: PaymentLinkType.Deposit
    })
  }

  return paymentLinks
}

/**
 * Create product orders based on payment links
 */
export async function createProductOrdersData(
  paymentLinks: (typeof product_payment_links.$inferSelect)[]
) {
  const orders: (typeof product_orders.$inferInsert)[] = []

  // Create orders for all succeeded payment links
  const succeededPaymentLinks = paymentLinks.filter(
    (pl) => pl.status === PaymentStatusType.Succeeded
  )

  for (const paymentLink of succeededPaymentLinks) {
    // Create order for successful payment
    orders.push({
      customerEmail: paymentLink.customerEmail,
      customerName: paymentLink.customerName!,
      id: createId(),
      productName: paymentLink.productName,
      productPaymentLinkId: paymentLink.id,
      status: OrderStatusType.Completed,
      stripePaymentIntentId: paymentLink.stripePaymentIntentId!,
      type:
        paymentLink.type === PaymentLinkType.Integral
          ? OrderType.OneTimePaymentOrder
          : OrderType.ParentOrder
    })
  }

  // Add orders with different statuses using payment links with appropriate payment statuses
  const processingPaymentLinks = paymentLinks.filter(
    (pl) => pl.status === PaymentStatusType.Processing
  )
  const failedPaymentLinks = paymentLinks.filter(
    (pl) => pl.status === PaymentStatusType.PaymentFailed
  )

  // Pending card payment orders
  for (const paymentLink of processingPaymentLinks.slice(0, 3)) {
    orders.push({
      customerEmail: paymentLink.customerEmail,
      customerName: paymentLink.customerName!,
      id: createId(),
      productName: paymentLink.productName,
      productPaymentLinkId: paymentLink.id,
      status: OrderStatusType.PendingCardPayment,
      stripePaymentIntentId: paymentLink.stripePaymentIntentId!,
      type: OrderType.ParentOrder
    })
  }

  // Cancelled orders
  for (const paymentLink of failedPaymentLinks.slice(0, 2)) {
    orders.push({
      customerEmail: paymentLink.customerEmail,
      customerName: paymentLink.customerName!,
      id: createId(),
      productName: paymentLink.productName,
      productPaymentLinkId: paymentLink.id,
      status: OrderStatusType.Cancelled,
      stripePaymentIntentId: paymentLink.stripePaymentIntentId!,
      type: OrderType.ParentOrder
    })
  }

  return orders
}

/**
 * Create memberships based on orders
 */
export async function createMembershipsData(
  orders: (typeof product_orders.$inferSelect)[],
  paymentLinks: (typeof product_payment_links.$inferSelect)[],
  products: unknown[]
): Promise<(typeof memberships.$inferSelect)[]> {
  const membershipsList: (typeof memberships.$inferInsert)[] = []

  // Only create memberships for completed orders
  const completedOrders = orders.filter(
    (o) => o.status === OrderStatusType.Completed
  )

  for (const order of completedOrders) {
    const paymentLink = paymentLinks.find(
      (pl) => pl.id === order.productPaymentLinkId
    )!
    const product = (products as any[]).find(
      (p: any) => p.id === paymentLink.productId
    )!

    const startDate = new Date()
    const endDate = DatesService.addMonths(
      startDate,
      product.membershipDurationMonths
    )

    // Determine membership status based on payment type
    let status: MembershipStatusType
    let delayedStartDate: string | undefined

    if (paymentLink.type === PaymentLinkType.Integral) {
      status = MembershipStatusType.Active
    } else if (
      paymentLink.type === PaymentLinkType.Deposit ||
      paymentLink.type === PaymentLinkType.InstallmentsDeposit
    ) {
      status = MembershipStatusType.Delayed
      delayedStartDate = paymentLink.firstPaymentDateAfterDeposit!
    } else if (paymentLink.type === PaymentLinkType.Installments) {
      status = MembershipStatusType.Active
    } else {
      status = MembershipStatusType.Active
    }

    membershipsList.push({
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      delayedStartDate,
      endDate: endDate.toISOString(),
      id: createId(),
      parentOrderId: order.id,
      productName: order.productName,
      startDate: startDate.toISOString(),
      status
    })
  }

  // Ensure we have memberships with ALL status types
  // Add additional memberships with specific statuses if not already present
  const statusCounts: Record<string, number> = {
    [MembershipStatusType.Active]: 0,
    [MembershipStatusType.Delayed]: 0,
    [MembershipStatusType.Paused]: 0,
    [MembershipStatusType.Cancelled]: 0
  }

  for (const membership of membershipsList) {
    statusCounts[membership.status]++
  }

  // If we have at least one membership, use it as base for creating missing statuses
  if (membershipsList.length > 0) {
    const baseMembership = membershipsList[0]
    const baseOrder = completedOrders[0]

    // Ensure Paused status exists
    if (statusCounts[MembershipStatusType.Paused] === 0) {
      membershipsList.push({
        customerEmail: baseOrder.customerEmail,
        customerName: baseOrder.customerName,
        delayedStartDate: baseMembership.delayedStartDate,
        endDate: baseMembership.endDate,
        id: createId(),
        parentOrderId: baseOrder.id,
        productName: baseOrder.productName,
        startDate: baseMembership.startDate,
        status: MembershipStatusType.Paused
      })
    }

    // Ensure Cancelled status exists
    if (statusCounts[MembershipStatusType.Cancelled] === 0) {
      membershipsList.push({
        customerEmail: baseOrder.customerEmail,
        customerName: baseOrder.customerName,
        delayedStartDate: baseMembership.delayedStartDate,
        endDate: baseMembership.endDate,
        id: createId(),
        parentOrderId: baseOrder.id,
        productName: baseOrder.productName,
        startDate: baseMembership.startDate,
        status: MembershipStatusType.Cancelled
      })
    }

    // Ensure Active status exists (most likely already present)
    if (statusCounts[MembershipStatusType.Active] === 0) {
      membershipsList.push({
        customerEmail: baseOrder.customerEmail,
        customerName: baseOrder.customerName,
        endDate: baseMembership.endDate,
        id: createId(),
        parentOrderId: baseOrder.id,
        productName: baseOrder.productName,
        startDate: baseMembership.startDate,
        status: MembershipStatusType.Active
      })
    }

    // Ensure Delayed status exists
    if (statusCounts[MembershipStatusType.Delayed] === 0) {
      membershipsList.push({
        customerEmail: baseOrder.customerEmail,
        customerName: baseOrder.customerName,
        delayedStartDate: DatesService.addDays(new Date(), 14).toISOString(),
        endDate: baseMembership.endDate,
        id: createId(),
        parentOrderId: baseOrder.id,
        productName: baseOrder.productName,
        startDate: baseMembership.startDate,
        status: MembershipStatusType.Delayed
      })
    }
  }

  return membershipsList as (typeof memberships.$inferSelect)[]
}

/**
 * Create product subscriptions for recurring payments
 */
export async function createProductSubscriptionsData(
  orders: (typeof product_orders.$inferSelect)[],
  membershipsData: (typeof memberships.$inferSelect)[],
  paymentLinks: (typeof product_payment_links.$inferSelect)[]
) {
  const subscriptions: (typeof product_subscriptions.$inferInsert)[] = []

  // Create subscriptions for Deposit, Installments, and InstallmentsDeposit types
  const subscriptionOrders = orders.filter((o) => {
    const paymentLink = paymentLinks.find(
      (pl) => pl.id === o.productPaymentLinkId
    )
    return (
      paymentLink &&
      (paymentLink.type === PaymentLinkType.Deposit ||
        paymentLink.type === PaymentLinkType.Installments ||
        paymentLink.type === PaymentLinkType.InstallmentsDeposit) &&
      o.status === OrderStatusType.Completed
    )
  })

  for (const order of subscriptionOrders) {
    const paymentLink = paymentLinks.find(
      (pl) => pl.id === order.productPaymentLinkId
    )!
    const membership = membershipsData.find(
      (m) => m.parentOrderId === order.id
    )!

    let remainingPayments: number
    let nextPaymentDate: string
    const status: SubscriptionStatusType = SubscriptionStatusType.Active

    if (paymentLink.type === PaymentLinkType.Deposit) {
      remainingPayments = 1
      nextPaymentDate = paymentLink.firstPaymentDateAfterDeposit!
    } else if (paymentLink.type === PaymentLinkType.Installments) {
      remainingPayments = paymentLink.productInstallmentsCount!
      nextPaymentDate = DatesService.addMonths(new Date(), 1).toISOString()
    } else {
      // InstallmentsDeposit
      remainingPayments = paymentLink.productInstallmentsCount!
      nextPaymentDate = paymentLink.firstPaymentDateAfterDeposit!
    }

    subscriptions.push({
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      id: createId(),
      membershipId: membership.id,
      nextPaymentDate,
      parentOrderId: order.id,
      paymentMethod: paymentLink.paymentMethodType,
      productId: paymentLink.productId,
      productName: paymentLink.productName,
      remainingPayments,
      startDate: new Date().toISOString(),
      status
    })
  }

  // Ensure all subscription statuses are represented
  const statusCounts = {
    [SubscriptionStatusType.Active]: 0,
    [SubscriptionStatusType.OnHold]: 0,
    [SubscriptionStatusType.Completed]: 0,
    [SubscriptionStatusType.Cancelled]: 0
  }

  for (const subscription of subscriptions) {
    statusCounts[subscription.status]++
  }

  // Add subscriptions with missing statuses
  if (subscriptions.length > 0) {
    const baseSubscription = subscriptions[0]
    const baseMembership = membershipsData.find(
      (m) => m.id === baseSubscription.membershipId
    )!

    // OnHold subscription
    if (statusCounts[SubscriptionStatusType.OnHold] === 0) {
      subscriptions.push({
        customerEmail: baseSubscription.customerEmail,
        customerName: baseSubscription.customerName,
        id: createId(),
        membershipId: baseMembership.id,
        nextPaymentDate: baseSubscription.nextPaymentDate,
        parentOrderId: baseSubscription.parentOrderId,
        paymentMethod: baseSubscription.paymentMethod,
        productId: baseSubscription.productId,
        productName: baseSubscription.productName,
        remainingPayments: baseSubscription.remainingPayments,
        startDate: baseSubscription.startDate,
        status: SubscriptionStatusType.OnHold
      })
    }

    // Completed subscription
    if (statusCounts[SubscriptionStatusType.Completed] === 0) {
      subscriptions.push({
        customerEmail: baseSubscription.customerEmail,
        customerName: baseSubscription.customerName,
        id: createId(),
        membershipId: baseMembership.id,
        nextPaymentDate: null,
        parentOrderId: baseSubscription.parentOrderId,
        paymentMethod: baseSubscription.paymentMethod,
        productId: baseSubscription.productId,
        productName: baseSubscription.productName,
        remainingPayments: 0,
        startDate: baseSubscription.startDate,
        status: SubscriptionStatusType.Completed
      })
    }

    // Cancelled subscription
    if (statusCounts[SubscriptionStatusType.Cancelled] === 0) {
      subscriptions.push({
        customerEmail: baseSubscription.customerEmail,
        customerName: baseSubscription.customerName,
        id: createId(),
        membershipId: baseMembership.id,
        nextPaymentDate: baseSubscription.nextPaymentDate,
        parentOrderId: baseSubscription.parentOrderId,
        paymentMethod: baseSubscription.paymentMethod,
        productId: baseSubscription.productId,
        productName: baseSubscription.productName,
        remainingPayments: baseSubscription.remainingPayments,
        startDate: baseSubscription.startDate,
        status: SubscriptionStatusType.Cancelled
      })
    }

    // Active subscription (most likely already exists)
    if (statusCounts[SubscriptionStatusType.Active] === 0) {
      subscriptions.push({
        customerEmail: baseSubscription.customerEmail,
        customerName: baseSubscription.customerName,
        id: createId(),
        membershipId: baseMembership.id,
        nextPaymentDate: DatesService.addMonths(new Date(), 1).toISOString(),
        parentOrderId: baseSubscription.parentOrderId,
        paymentMethod: baseSubscription.paymentMethod,
        productId: baseSubscription.productId,
        productName: baseSubscription.productName,
        remainingPayments: 5,
        startDate: baseSubscription.startDate,
        status: SubscriptionStatusType.Active
      })
    }
  }

  return subscriptions
}

/**
 * Create extension payment links
 */
export async function createExtensionPaymentLinksData(dependencies: {
  users: (typeof users.$inferSelect)[]
  productsExtensions: unknown[]
  memberships: (typeof memberships.$inferSelect)[]
  paymentsSettings: unknown[]
  productsExtensionsInstallments: unknown[]
}) {
  const { productsExtensions, memberships, paymentsSettings } = dependencies

  const ronSetting = (paymentsSettings as any[]).find(
    (s: any) => s.currency === 'RON'
  )!
  const extensionPaymentLinks: (typeof extension_payment_links.$inferInsert)[] =
    []

  // Get admin user from database (roles are updated after user creation in seed)
  const [adminUser] = await database
    .select()
    .from(users)
    .where(eq(users.role, UserRoles.SUPER_ADMIN))
    .limit(1)

  // Helper function to generate customer data
  const generateCustomer = () => {
    const firstName = fakerRO.person.firstName()
    const lastName = fakerRO.person.lastName()
    return {
      customerEmail: fakerRO.internet.email({ firstName, lastName }),
      customerName: `${firstName} ${lastName}`,
      firstName,
      lastName
    }
  }

  // Only create extension payment links for active memberships
  const activeMemberships = memberships.filter(
    (m) => m.status === MembershipStatusType.Active
  )

  for (const membership of activeMemberships.slice(0, 2)) {
    const extension: any = fakerRO.helpers.arrayElement(
      productsExtensions as any[]
    )
    const customer = generateCustomer()

    // Create Stripe customer
    const stripeCustomer = await createStripeCustomer(
      customer.customerEmail,
      customer.customerName
    )

    // 1. EXTENSION INTEGRAL
    const integralPrice = parseFloat(extension.price)

    // Skip if price is too low for Stripe (minimum 0.5 RON = 50 cents)
    if (integralPrice < 0.5) continue

    const integralPriceInCents = PricingService.convertToCents(integralPrice)
    const integralPaymentIntent = await createStripePaymentIntent(
      integralPriceInCents,
      ronSetting.currency,
      stripeCustomer.id,
      {
        currency: ronSetting.currency,
        customerEmail: customer.customerEmail,
        customerName: customer.customerName,
        extensionId: extension.id,
        membershipId: membership.id,
        paymentProductType: PaymentProductType.Extension,
        type: PaymentLinkType.Integral
      }
    )

    extensionPaymentLinks.push({
      createdById: adminUser.id,
      currency: ronSetting.currency,
      customerEmail: customer.customerEmail,
      customerName: customer.customerName,
      expiresAt: DatesService.addDays(new Date(), 30).toISOString(),
      extensionId: extension.id,
      extraTaxRate: ronSetting.extraTaxRate,
      id: createId(),
      membershipId: membership.id,
      paymentMethodType: PaymentMethodType.Card,
      paymentProductType: PaymentProductType.Extension,
      productName: `Extension ${extension.extensionMonths} months`,
      status: PaymentStatusType.Succeeded,
      stripeClientSecret: integralPaymentIntent.client_secret!,
      stripePaymentIntentId: integralPaymentIntent.id,
      totalAmountToPay: extension.price,
      totalAmountToPayInCents: integralPriceInCents.toString(),
      tvaRate: ronSetting.tvaRate,
      type: PaymentLinkType.Integral
    })

    // 2. EXTENSION DEPOSIT
    const depositAmount = parseFloat(extension.minDepositAmount || '100')

    // Skip if deposit is too low or greater than price
    if (depositAmount < 0.5 || depositAmount >= integralPrice) continue

    const remainingAmount = integralPrice - depositAmount
    const depositAmountInCents = PricingService.convertToCents(depositAmount)
    const remainingAmountInCents =
      PricingService.convertToCents(remainingAmount)
    const firstPaymentDateAfterDeposit = DatesService.addDays(new Date(), 5)

    const depositPaymentIntent = await createStripePaymentIntent(
      depositAmountInCents,
      ronSetting.currency,
      stripeCustomer.id,
      {
        currency: ronSetting.currency,
        customerEmail: customer.customerEmail,
        customerName: customer.customerName,
        depositAmountInCents: depositAmountInCents.toString(),
        extensionId: extension.id,
        firstPaymentDateAfterDeposit:
          firstPaymentDateAfterDeposit.toISOString(),
        membershipId: membership.id,
        paymentProductType: PaymentProductType.Extension,
        remainingAmountToPayInCents: remainingAmountInCents.toString(),
        type: PaymentLinkType.Deposit
      }
    )

    extensionPaymentLinks.push({
      createdById: adminUser.id,
      currency: ronSetting.currency,
      customerEmail: customer.customerEmail,
      customerName: customer.customerName,
      depositAmount: depositAmount.toString(),
      depositAmountInCents: depositAmountInCents.toString(),
      eurToRonRate: ronSetting.eurToRonRate,
      expiresAt: DatesService.addDays(new Date(), 30).toISOString(),
      extensionId: extension.id,
      extraTaxRate: ronSetting.extraTaxRate,
      firstPaymentDateAfterDeposit: firstPaymentDateAfterDeposit.toISOString(),
      id: createId(),
      membershipId: membership.id,
      paymentMethodType: PaymentMethodType.Card,
      paymentProductType: PaymentProductType.Extension,
      productName: `Extension ${extension.extensionMonths} months`,
      remainingAmountToPay: remainingAmount.toString(),
      remainingAmountToPayInCents: remainingAmountInCents.toString(),
      status: PaymentStatusType.Succeeded,
      stripeClientSecret: depositPaymentIntent.client_secret!,
      stripePaymentIntentId: depositPaymentIntent.id,
      totalAmountToPay: extension.price,
      totalAmountToPayInCents: integralPriceInCents.toString(),
      tvaRate: ronSetting.tvaRate,
      type: PaymentLinkType.Deposit
    })
  }

  return extensionPaymentLinks
}

/**
 * Create extension orders
 */
export async function createExtensionOrdersData(
  extensionPaymentLinks: (typeof extension_payment_links.$inferSelect)[]
) {
  const extensionOrders: (typeof extension_orders.$inferInsert)[] = []

  for (const paymentLink of extensionPaymentLinks) {
    extensionOrders.push({
      customerEmail: paymentLink.customerEmail,
      customerName: paymentLink.customerName,
      extensionPaymentLinkId: paymentLink.id,
      id: createId(),
      membershipId: paymentLink.membershipId,
      productName: paymentLink.productName,
      status: OrderStatusType.Completed,
      stripePaymentIntentId: paymentLink.stripePaymentIntentId!,
      type:
        paymentLink.type === PaymentLinkType.Integral
          ? OrderType.OneTimePaymentOrder
          : OrderType.ParentOrder
    })
  }

  return extensionOrders
}

/**
 * Create extension subscriptions
 */
export async function createExtensionSubscriptionsData(
  extensionOrders: (typeof extension_orders.$inferSelect)[],
  extensionPaymentLinks: (typeof extension_payment_links.$inferSelect)[]
) {
  const extensionSubscriptions: (typeof extension_subscriptions.$inferInsert)[] =
    []

  // Create subscriptions for Deposit type extensions
  const subscriptionOrders = extensionOrders.filter((o) => {
    const paymentLink = extensionPaymentLinks.find(
      (pl) => pl.id === o.extensionPaymentLinkId
    )
    return (
      paymentLink &&
      paymentLink.type === PaymentLinkType.Deposit &&
      o.status === OrderStatusType.Completed
    )
  })

  for (const order of subscriptionOrders) {
    const paymentLink = extensionPaymentLinks.find(
      (pl) => pl.id === order.extensionPaymentLinkId
    )!

    extensionSubscriptions.push({
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      extensionId: paymentLink.extensionId,
      id: createId(),
      membershipId: order.membershipId,
      nextPaymentDate: paymentLink.firstPaymentDateAfterDeposit!,
      parentOrderId: order.id,
      paymentMethod: paymentLink.paymentMethodType,
      productName: paymentLink.productName,
      remainingPayments: 1,
      startDate: new Date().toISOString(),
      status: SubscriptionStatusType.Active
    })
  }

  // Add subscription with completed status
  if (extensionSubscriptions.length > 0) {
    const baseSubscription = extensionSubscriptions[0]

    extensionSubscriptions.push({
      ...baseSubscription,
      id: createId(),
      nextPaymentDate: null,
      remainingPayments: 0,
      status: SubscriptionStatusType.Completed
    })
  }

  return extensionSubscriptions
}
