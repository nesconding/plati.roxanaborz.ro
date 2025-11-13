import { test, expect } from '@playwright/test'
import { E2EDatabase } from '../helpers/database'
import { E2EStripe } from '../helpers/stripe'
import { E2EUtils } from '../helpers/utils'
import { e2eProducts, e2eInstallments } from '../fixtures/products'
import { e2eUsers, e2eContracts } from '../fixtures/users'
import { e2ePaymentScenarios, e2eStripeCards } from '../fixtures/payments'
import { OrderStatusType } from '~/shared/enums/order-status-type'
import { OrderType } from '~/shared/enums/order-type'
import { MembershipStatusType } from '~/shared/enums/membership-status-type'
import { PaymentStatusType } from '~/shared/enums/payment-status'
import { SubscriptionStatusType } from '~/shared/enums/subscription-status-type'

test.describe('Product Installments Payment Flow (E2E)', () => {
  let installmentsPaymentLinkId: string
  let firstInstallmentPIId: string

  test.beforeAll(async () => {
    await E2EDatabase.cleanup()
    await E2EDatabase.createTestUser(e2eUsers.admin)
    await E2EDatabase.createTestContract(e2eContracts.contract1)
    await E2EDatabase.createTestProduct(e2eProducts.withInstallments)
  })

  test.afterAll(async () => {
    await E2EDatabase.cleanup()
  })

  test('should complete first installment payment and create subscription', async ({
    page
  }) => {
    installmentsPaymentLinkId = E2EUtils.generateTestId('ppl_installments')
    firstInstallmentPIId = `pi_${Date.now()}_installment_1`

    // Navigate to checkout
    await page.goto(`/checkout/${installmentsPaymentLinkId}`)

    // Verify installment plan details
    await E2EUtils.expectTextContent(
      page,
      '[data-testid="installments-count"]',
      String(e2ePaymentScenarios.productInstallments.installmentsCount)
    )

    await E2EUtils.expectTextContent(
      page,
      '[data-testid="installment-amount"]',
      E2EUtils.formatCurrency(
        e2ePaymentScenarios.productInstallments.installmentAmount
      )
    )

    // Fill card and submit first installment
    await E2EUtils.fillStripeCard(page, e2eStripeCards.success)
    await E2EUtils.submitPayment(page)
    await E2EUtils.waitForPaymentSuccess(page)

    // Simulate first installment webhook
    const webhookEvent = E2EStripe.createPaymentIntentSucceededEvent(
      firstInstallmentPIId,
      {
        type: e2ePaymentScenarios.productInstallments.type,
        productPaymentLinkId: installmentsPaymentLinkId,
        productId: e2eProducts.withInstallments.id,
        customerEmail: e2ePaymentScenarios.productInstallments.customerEmail,
        customerName: e2ePaymentScenarios.productInstallments.customerName,
        installmentsCount: String(
          e2ePaymentScenarios.productInstallments.installmentsCount
        ),
        installmentAmountInCents:
          e2ePaymentScenarios.productInstallments.installmentAmountInCents
      }
    )

    await E2EStripe.sendWebhook(page.request, webhookEvent, {
      skipSignature: true
    })
    await E2EStripe.waitForWebhookProcessing(2000)

    // Verify payment link status
    const paymentLink = await E2EDatabase.getProductPaymentLink(
      installmentsPaymentLinkId
    )
    expect(paymentLink?.status).toBe(PaymentStatusType.PendingBankPayment)

    // Verify parent order created
    const parentOrder = await E2EDatabase.getOrderByPaymentLinkId(
      installmentsPaymentLinkId
    )
    expect(parentOrder?.status).toBe(OrderStatusType.Completed)
    expect(parentOrder?.type).toBe(OrderType.ParentOrder)

    // Verify membership is active immediately for installments
    const membership = await E2EDatabase.getMembershipByOrderId(parentOrder!.id)
    expect(membership?.status).toBe(MembershipStatusType.Active)
    expect(membership?.startDate).toBeTruthy()

    // Verify subscription created for remaining installments
    const subscriptions = await E2EDatabase.getSubscriptionsByPaymentLinkId(
      installmentsPaymentLinkId
    )
    expect(subscriptions.length).toBe(1)
    expect(subscriptions[0].status).toBe(SubscriptionStatusType.Active)
    expect(subscriptions[0].nextChargeDate).toBeTruthy()
    expect(subscriptions[0].installmentsRemaining).toBe(
      e2ePaymentScenarios.productInstallments.installmentsCount - 1
    )
  })

  test('should charge monthly installments via cron job', async ({
    page,
    request
  }) => {
    // Get the subscription
    const subscriptions = await E2EDatabase.getSubscriptionsByPaymentLinkId(
      installmentsPaymentLinkId
    )
    const subscription = subscriptions[0]
    const remainingInstallments = subscription.installmentsRemaining

    // Simulate charging second installment
    const secondInstallmentPIId = `pi_${Date.now()}_installment_2`

    // Trigger cron job
    const cronResponse = await request.post(
      `${process.env.E2E_BASE_URL || `http://localhost:${process.env.PORT || '9099'}`}/api/cron/charge-deferred-payments`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
          'Content-Type': 'application/json'
        }
      }
    )

    expect(cronResponse.ok()).toBeTruthy()

    // Simulate second installment success webhook
    const installmentWebhook = E2EStripe.createPaymentIntentSucceededEvent(
      secondInstallmentPIId,
      {
        subscriptionId: subscription.id,
        productPaymentLinkId: installmentsPaymentLinkId,
        isInstallment: 'true',
        installmentNumber: '2'
      }
    )

    await E2EStripe.sendWebhook(request, installmentWebhook, {
      skipSignature: true
    })
    await E2EStripe.waitForWebhookProcessing()

    // Verify subscription installments remaining decreased
    const updatedSubscriptions =
      await E2EDatabase.getSubscriptionsByPaymentLinkId(
        installmentsPaymentLinkId
      )
    const updatedSubscription = updatedSubscriptions.find(
      s => s.id === subscription.id
    )
    expect(updatedSubscription?.installmentsRemaining).toBe(
      remainingInstallments - 1
    )

    // Verify renewal order created
    const orders = await E2EDatabase.getOrderByPaymentLinkId(
      installmentsPaymentLinkId
    )
    // Should have renewal orders created
    expect(orders).toBeDefined()

    // Verify membership still active
    const membership = await E2EDatabase.getMembershipByOrderId(orders!.id)
    expect(membership?.status).toBe(MembershipStatusType.Active)
  })

  test('should complete subscription after all installments paid', async ({
    request
  }) => {
    // Get current subscription state
    const subscriptions = await E2EDatabase.getSubscriptionsByPaymentLinkId(
      installmentsPaymentLinkId
    )
    const subscription = subscriptions[0]
    const remainingInstallments = subscription.installmentsRemaining

    // Pay all remaining installments
    for (let i = 0; i < remainingInstallments; i++) {
      const installmentPIId = `pi_${Date.now()}_installment_${3 + i}`

      const installmentWebhook = E2EStripe.createPaymentIntentSucceededEvent(
        installmentPIId,
        {
          subscriptionId: subscription.id,
          productPaymentLinkId: installmentsPaymentLinkId,
          isInstallment: 'true',
          installmentNumber: String(3 + i)
        }
      )

      await E2EStripe.sendWebhook(request, installmentWebhook, {
        skipSignature: true
      })
      await E2EStripe.waitForWebhookProcessing(1000)
    }

    // Verify subscription is completed
    const finalSubscriptions =
      await E2EDatabase.getSubscriptionsByPaymentLinkId(
        installmentsPaymentLinkId
      )
    const finalSubscription = finalSubscriptions.find(
      s => s.id === subscription.id
    )
    expect(finalSubscription?.status).toBe(SubscriptionStatusType.Completed)
    expect(finalSubscription?.installmentsRemaining).toBe(0)

    // Verify payment link is completed
    const paymentLink = await E2EDatabase.getProductPaymentLink(
      installmentsPaymentLinkId
    )
    expect(paymentLink?.status).toBe(PaymentStatusType.Completed)
  })

  test('should handle failed installment payment correctly', async ({
    page,
    request
  }) => {
    const failedInstallmentsLinkId = E2EUtils.generateTestId(
      'ppl_installments_fail'
    )
    const firstPIId = `pi_${Date.now()}_installments_fail_1`

    // Complete first installment
    const firstWebhook = E2EStripe.createPaymentIntentSucceededEvent(firstPIId, {
      type: e2ePaymentScenarios.productInstallments.type,
      productPaymentLinkId: failedInstallmentsLinkId,
      productId: e2eProducts.withInstallments.id,
      customerEmail: e2ePaymentScenarios.productInstallments.customerEmail,
      customerName: e2ePaymentScenarios.productInstallments.customerName
    })

    await E2EStripe.sendWebhook(request, firstWebhook, { skipSignature: true })
    await E2EStripe.waitForWebhookProcessing()

    // Get subscription
    const subscriptions = await E2EDatabase.getSubscriptionsByPaymentLinkId(
      failedInstallmentsLinkId
    )
    const subscription = subscriptions[0]

    // Simulate failed second installment
    const failedPIId = `pi_${Date.now()}_installments_fail_2`
    const failedWebhook = E2EStripe.createPaymentIntentFailedEvent(failedPIId, {
      subscriptionId: subscription.id,
      productPaymentLinkId: failedInstallmentsLinkId,
      isInstallment: 'true'
    })

    await E2EStripe.sendWebhook(request, failedWebhook, {
      skipSignature: true
    })
    await E2EStripe.waitForWebhookProcessing()

    // Verify subscription marked as failed
    const updatedSubscriptions =
      await E2EDatabase.getSubscriptionsByPaymentLinkId(
        failedInstallmentsLinkId
      )
    const updatedSubscription = updatedSubscriptions.find(
      s => s.id === subscription.id
    )
    expect(updatedSubscription?.status).toBe(SubscriptionStatusType.Failed)

    // Verify installments remaining unchanged
    expect(updatedSubscription?.installmentsRemaining).toBe(
      subscription.installmentsRemaining
    )

    // Verify membership still active (grace period)
    const order = await E2EDatabase.getOrderByPaymentLinkId(
      failedInstallmentsLinkId
    )
    const membership = await E2EDatabase.getMembershipByOrderId(order!.id)
    expect(membership?.status).toBe(MembershipStatusType.Active)
  })

  test('should pause membership after multiple failed installments', async ({
    request
  }) => {
    const pausedLinkId = E2EUtils.generateTestId('ppl_installments_paused')
    const firstPIId = `pi_${Date.now()}_paused_1`

    // Complete first installment
    const firstWebhook = E2EStripe.createPaymentIntentSucceededEvent(firstPIId, {
      type: e2ePaymentScenarios.productInstallments.type,
      productPaymentLinkId: pausedLinkId,
      productId: e2eProducts.withInstallments.id,
      customerEmail: e2ePaymentScenarios.productInstallments.customerEmail,
      customerName: e2ePaymentScenarios.productInstallments.customerName
    })

    await E2EStripe.sendWebhook(request, firstWebhook, { skipSignature: true })
    await E2EStripe.waitForWebhookProcessing()

    const subscriptions = await E2EDatabase.getSubscriptionsByPaymentLinkId(
      pausedLinkId
    )
    const subscription = subscriptions[0]

    // Simulate 3 consecutive failed payments (exceeds retry limit)
    for (let i = 0; i < 3; i++) {
      const failedPIId = `pi_${Date.now()}_paused_fail_${i}`
      const failedWebhook = E2EStripe.createPaymentIntentFailedEvent(
        failedPIId,
        {
          subscriptionId: subscription.id,
          productPaymentLinkId: pausedLinkId,
          isInstallment: 'true',
          failureCount: String(i + 1)
        }
      )

      await E2EStripe.sendWebhook(request, failedWebhook, {
        skipSignature: true
      })
      await E2EStripe.waitForWebhookProcessing(500)
    }

    // Verify membership is paused after multiple failures
    const order = await E2EDatabase.getOrderByPaymentLinkId(pausedLinkId)
    const membership = await E2EDatabase.getMembershipByOrderId(order!.id)
    expect(membership?.status).toBe(MembershipStatusType.Paused)

    // Verify subscription is failed
    const finalSubscriptions = await E2EDatabase.getSubscriptionsByPaymentLinkId(
      pausedLinkId
    )
    expect(finalSubscriptions[0].status).toBe(SubscriptionStatusType.Failed)
  })

  test('should show installment schedule on checkout page', async ({ page }) => {
    const scheduleLinkId = E2EUtils.generateTestId('ppl_installments_schedule')

    await page.goto(`/checkout/${scheduleLinkId}`)

    // Verify installment schedule table is visible
    await expect(
      page.locator('[data-testid="installment-schedule"]')
    ).toBeVisible()

    // Verify first installment row
    await expect(
      page.locator('[data-testid="installment-1"]')
    ).toContainText('Today')

    // Verify subsequent installment rows
    for (
      let i = 2;
      i <= e2ePaymentScenarios.productInstallments.installmentsCount;
      i++
    ) {
      await expect(
        page.locator(`[data-testid="installment-${i}"]`)
      ).toBeVisible()
    }

    // Verify total amount
    await E2EUtils.expectTextContent(
      page,
      '[data-testid="total-amount"]',
      E2EUtils.formatCurrency(
        e2ePaymentScenarios.productInstallments.totalAmount
      )
    )
  })

  test('should allow early payoff of remaining installments', async ({
    page,
    request
  }) => {
    const earlyPayoffLinkId = E2EUtils.generateTestId('ppl_early_payoff')
    const firstPIId = `pi_${Date.now()}_early_1`

    // Complete first installment
    const firstWebhook = E2EStripe.createPaymentIntentSucceededEvent(firstPIId, {
      type: e2ePaymentScenarios.productInstallments.type,
      productPaymentLinkId: earlyPayoffLinkId,
      productId: e2eProducts.withInstallments.id,
      customerEmail: e2ePaymentScenarios.productInstallments.customerEmail,
      customerName: e2ePaymentScenarios.productInstallments.customerName
    })

    await E2EStripe.sendWebhook(request, firstWebhook, { skipSignature: true })
    await E2EStripe.waitForWebhookProcessing()

    // Get subscription
    const subscriptions = await E2EDatabase.getSubscriptionsByPaymentLinkId(
      earlyPayoffLinkId
    )
    const subscription = subscriptions[0]

    // Simulate early payoff of all remaining installments
    const payoffPIId = `pi_${Date.now()}_early_payoff`
    const payoffWebhook = E2EStripe.createPaymentIntentSucceededEvent(
      payoffPIId,
      {
        subscriptionId: subscription.id,
        productPaymentLinkId: earlyPayoffLinkId,
        isEarlyPayoff: 'true',
        remainingInstallments: String(subscription.installmentsRemaining)
      }
    )

    await E2EStripe.sendWebhook(request, payoffWebhook, {
      skipSignature: true
    })
    await E2EStripe.waitForWebhookProcessing()

    // Verify subscription completed
    const updatedSubscriptions =
      await E2EDatabase.getSubscriptionsByPaymentLinkId(earlyPayoffLinkId)
    expect(updatedSubscriptions[0].status).toBe(SubscriptionStatusType.Completed)
    expect(updatedSubscriptions[0].installmentsRemaining).toBe(0)

    // Verify payment link completed
    const paymentLink = await E2EDatabase.getProductPaymentLink(
      earlyPayoffLinkId
    )
    expect(paymentLink?.status).toBe(PaymentStatusType.Completed)
  })
})
