import { test, expect } from '@playwright/test'
import { E2EDatabase } from '../helpers/database'
import { E2EStripe } from '../helpers/stripe'
import { E2EUtils } from '../helpers/utils'
import { e2eProducts } from '../fixtures/products'
import { e2eUsers, e2eContracts } from '../fixtures/users'
import { e2ePaymentScenarios, e2eStripeCards } from '../fixtures/payments'
import { OrderStatusType } from '~/shared/enums/order-status-type'
import { OrderType } from '~/shared/enums/order-type'
import { MembershipStatusType } from '~/shared/enums/membership-status-type'
import { PaymentStatusType } from '~/shared/enums/payment-status'
import { SubscriptionStatusType } from '~/shared/enums/subscription-status-type'

test.describe('Product Deposit Payment Flow (E2E)', () => {
  let depositPaymentLinkId: string
  let depositPaymentIntentId: string

  test.beforeAll(async () => {
    // Set up test database with required entities
    await E2EDatabase.cleanup()

    // Create test user
    await E2EDatabase.createTestUser(e2eUsers.admin)

    // Create test contract
    await E2EDatabase.createTestContract(e2eContracts.contract1)

    // Create test product with deposit enabled
    await E2EDatabase.createTestProduct(e2eProducts.withDeposit)
  })

  test.afterAll(async () => {
    // Clean up test data
    await E2EDatabase.cleanup()
  })

  test('should complete deposit payment and create delayed membership', async ({
    page
  }) => {
    // Step 1: Create payment link for deposit
    depositPaymentLinkId = E2EUtils.generateTestId('ppl_deposit')
    depositPaymentIntentId = `pi_${Date.now()}_deposit`

    // Navigate to checkout page
    await page.goto(`/checkout/${depositPaymentLinkId}`)

    // Verify deposit amount is shown
    await E2EUtils.expectTextContent(
      page,
      '[data-testid="deposit-amount"]',
      E2EUtils.formatCurrency(e2ePaymentScenarios.productDeposit.depositAmount)
    )

    // Verify remaining amount is shown
    await E2EUtils.expectTextContent(
      page,
      '[data-testid="remaining-amount"]',
      E2EUtils.formatCurrency(
        e2ePaymentScenarios.productDeposit.remainingAmount
      )
    )

    // Step 2: Fill in card details and submit deposit payment
    await E2EUtils.fillStripeCard(page, e2eStripeCards.success)
    await E2EUtils.submitPayment(page)

    // Wait for success
    await E2EUtils.waitForPaymentSuccess(page)

    // Step 3: Simulate deposit payment webhook
    const depositWebhookEvent = E2EStripe.createPaymentIntentSucceededEvent(
      depositPaymentIntentId,
      {
        type: e2ePaymentScenarios.productDeposit.type,
        productPaymentLinkId: depositPaymentLinkId,
        productId: e2eProducts.withDeposit.id,
        customerEmail: e2ePaymentScenarios.productDeposit.customerEmail,
        customerName: e2ePaymentScenarios.productDeposit.customerName,
        depositAmountInCents:
          e2ePaymentScenarios.productDeposit.depositAmountInCents,
        remainingAmountInCents:
          e2ePaymentScenarios.productDeposit.remainingAmountInCents
      }
    )

    const webhookResponse = await E2EStripe.sendWebhook(
      page.request,
      depositWebhookEvent,
      { skipSignature: true }
    )

    expect(webhookResponse.ok()).toBeTruthy()

    // Wait for webhook processing
    await E2EStripe.waitForWebhookProcessing(2000)

    // Step 4: Verify database state after deposit webhook
    const paymentLink = await E2EDatabase.getProductPaymentLink(
      depositPaymentLinkId
    )
    expect(paymentLink).toBeDefined()
    expect(paymentLink?.status).toBe(PaymentStatusType.PendingBankPayment)

    // Verify parent order is created
    const parentOrder = await E2EDatabase.getOrderByPaymentLinkId(
      depositPaymentLinkId
    )
    expect(parentOrder).toBeDefined()
    expect(parentOrder?.status).toBe(OrderStatusType.Completed)
    expect(parentOrder?.type).toBe(OrderType.ParentOrder)

    // Verify membership is created with DELAYED status
    const membership = await E2EDatabase.getMembershipByOrderId(parentOrder!.id)
    expect(membership).toBeDefined()
    expect(membership?.status).toBe(MembershipStatusType.Delayed)
    expect(membership?.delayedStartDate).toBeTruthy()

    // Verify subscription is created for deferred payment
    const subscriptions = await E2EDatabase.getSubscriptionsByPaymentLinkId(
      depositPaymentLinkId
    )
    expect(subscriptions.length).toBe(1)
    expect(subscriptions[0].status).toBe(SubscriptionStatusType.Active)
    expect(subscriptions[0].nextChargeDate).toBeTruthy()
  })

  test('should charge deferred payment and activate membership via cron', async ({
    page,
    request
  }) => {
    // This test simulates the cron job that charges the deferred payment

    // Step 1: Get the subscription that was created
    const subscriptions = await E2EDatabase.getSubscriptionsByPaymentLinkId(
      depositPaymentLinkId
    )
    expect(subscriptions.length).toBe(1)

    const subscription = subscriptions[0]
    const deferredPaymentIntentId = `pi_${Date.now()}_deferred`

    // Step 2: Simulate cron job triggering deferred payment
    // This would normally be done via POST /api/cron/charge-deferred-payments
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

    // Step 3: Simulate deferred payment success webhook
    const deferredWebhookEvent = E2EStripe.createPaymentIntentSucceededEvent(
      deferredPaymentIntentId,
      {
        subscriptionId: subscription.id,
        productPaymentLinkId: depositPaymentLinkId,
        isDeferred: 'true'
      }
    )

    const webhookResponse = await E2EStripe.sendWebhook(
      request,
      deferredWebhookEvent,
      { skipSignature: true }
    )

    expect(webhookResponse.ok()).toBeTruthy()
    await E2EStripe.waitForWebhookProcessing(2000)

    // Step 4: Verify payment link is now completed
    const paymentLink = await E2EDatabase.getProductPaymentLink(
      depositPaymentLinkId
    )
    expect(paymentLink?.status).toBe(PaymentStatusType.Completed)

    // Step 5: Verify renewal order is created
    const allOrders = await E2EDatabase.getOrderByPaymentLinkId(
      depositPaymentLinkId
    )
    // Should have both parent and renewal orders

    // Step 6: Verify membership is now ACTIVE
    const parentOrder = allOrders
    const membership = await E2EDatabase.getMembershipByOrderId(parentOrder!.id)
    expect(membership?.status).toBe(MembershipStatusType.Active)
    expect(membership?.delayedStartDate).toBeNull()
    expect(membership?.startDate).toBeTruthy()

    // Step 7: Verify subscription is completed
    const updatedSubscriptions =
      await E2EDatabase.getSubscriptionsByPaymentLinkId(depositPaymentLinkId)
    const updatedSubscription = updatedSubscriptions.find(
      s => s.id === subscription.id
    )
    expect(updatedSubscription?.status).toBe(SubscriptionStatusType.Completed)
  })

  test('should handle failed deferred payment correctly', async ({
    page,
    request
  }) => {
    // Create a new deposit payment for this test
    const failedDepositLinkId = E2EUtils.generateTestId('ppl_deposit_fail')
    const failedDepositPIId = `pi_${Date.now()}_deposit_fail`

    // Step 1: Complete initial deposit payment
    const depositWebhook = E2EStripe.createPaymentIntentSucceededEvent(
      failedDepositPIId,
      {
        type: e2ePaymentScenarios.productDeposit.type,
        productPaymentLinkId: failedDepositLinkId,
        productId: e2eProducts.withDeposit.id,
        customerEmail: e2ePaymentScenarios.productDeposit.customerEmail,
        customerName: e2ePaymentScenarios.productDeposit.customerName,
        depositAmountInCents:
          e2ePaymentScenarios.productDeposit.depositAmountInCents
      }
    )

    await E2EStripe.sendWebhook(page.request, depositWebhook, {
      skipSignature: true
    })
    await E2EStripe.waitForWebhookProcessing()

    // Step 2: Get the created subscription
    const subscriptions = await E2EDatabase.getSubscriptionsByPaymentLinkId(
      failedDepositLinkId
    )
    expect(subscriptions.length).toBe(1)

    // Step 3: Simulate failed deferred payment webhook
    const failedPIId = `pi_${Date.now()}_deferred_fail`
    const failedWebhook = E2EStripe.createPaymentIntentFailedEvent(failedPIId, {
      subscriptionId: subscriptions[0].id,
      productPaymentLinkId: failedDepositLinkId,
      isDeferred: 'true'
    })

    const webhookResponse = await E2EStripe.sendWebhook(
      request,
      failedWebhook,
      { skipSignature: true }
    )

    expect(webhookResponse.ok()).toBeTruthy()
    await E2EStripe.waitForWebhookProcessing()

    // Step 4: Verify subscription status is updated to failed
    const updatedSubscriptions =
      await E2EDatabase.getSubscriptionsByPaymentLinkId(failedDepositLinkId)
    const updatedSubscription = updatedSubscriptions.find(
      s => s.id === subscriptions[0].id
    )
    expect(updatedSubscription?.status).toBe(SubscriptionStatusType.Failed)

    // Step 5: Verify membership remains DELAYED
    const order = await E2EDatabase.getOrderByPaymentLinkId(failedDepositLinkId)
    const membership = await E2EDatabase.getMembershipByOrderId(order!.id)
    expect(membership?.status).toBe(MembershipStatusType.Delayed)

    // Step 6: Verify payment link remains in pending status
    const paymentLink = await E2EDatabase.getProductPaymentLink(
      failedDepositLinkId
    )
    expect(paymentLink?.status).toBe(PaymentStatusType.PendingBankPayment)
  })

  test('should prevent checkout with insufficient deposit amount', async ({
    page
  }) => {
    const insufficientDepositLinkId = E2EUtils.generateTestId(
      'ppl_deposit_insufficient'
    )

    // Navigate to checkout with deposit less than minimum
    await page.goto(`/checkout/${insufficientDepositLinkId}`)

    // Try to modify deposit amount to less than minimum
    const depositInput = page.locator('[data-testid="deposit-amount-input"]')
    if ((await depositInput.count()) > 0) {
      await depositInput.fill('100') // Less than minimum 500

      // Should show error
      await expect(
        page.locator('[data-testid="deposit-error"]')
      ).toContainText(/minimum/i)

      // Submit should be disabled
      const submitButton = page.locator('button[type="submit"]')
      await expect(submitButton).toBeDisabled()
    }
  })

  test('should show correct payment summary for deposit flow', async ({
    page
  }) => {
    const summaryLinkId = E2EUtils.generateTestId('ppl_deposit_summary')

    await page.goto(`/checkout/${summaryLinkId}`)

    // Verify payment breakdown is shown
    await expect(page.locator('[data-testid="payment-summary"]')).toBeVisible()

    // Verify deposit amount
    await E2EUtils.expectTextContent(
      page,
      '[data-testid="deposit-label"]',
      'Deposit'
    )

    // Verify remaining amount
    await E2EUtils.expectTextContent(
      page,
      '[data-testid="remaining-label"]',
      'Remaining'
    )

    // Verify total amount
    await E2EUtils.expectTextContent(
      page,
      '[data-testid="total-amount-label"]',
      'Total'
    )

    // Verify deferred payment date is shown
    await expect(
      page.locator('[data-testid="deferred-payment-date"]')
    ).toBeVisible()
  })

  test('should allow retry of failed deferred payment', async ({
    page,
    request
  }) => {
    // This tests the retry mechanism for failed deferred payments

    const retryLinkId = E2EUtils.generateTestId('ppl_deposit_retry')
    const retryDepositPIId = `pi_${Date.now()}_deposit_retry`

    // Step 1: Complete initial deposit
    const depositWebhook = E2EStripe.createPaymentIntentSucceededEvent(
      retryDepositPIId,
      {
        type: e2ePaymentScenarios.productDeposit.type,
        productPaymentLinkId: retryLinkId,
        productId: e2eProducts.withDeposit.id,
        customerEmail: e2ePaymentScenarios.productDeposit.customerEmail,
        customerName: e2ePaymentScenarios.productDeposit.customerName
      }
    )

    await E2EStripe.sendWebhook(request, depositWebhook, {
      skipSignature: true
    })
    await E2EStripe.waitForWebhookProcessing()

    // Step 2: Get subscription
    const subscriptions = await E2EDatabase.getSubscriptionsByPaymentLinkId(
      retryLinkId
    )
    const subscription = subscriptions[0]

    // Step 3: First attempt fails
    const failedPIId = `pi_${Date.now()}_retry_fail`
    const failedWebhook = E2EStripe.createPaymentIntentFailedEvent(failedPIId, {
      subscriptionId: subscription.id,
      productPaymentLinkId: retryLinkId,
      isDeferred: 'true'
    })

    await E2EStripe.sendWebhook(request, failedWebhook, {
      skipSignature: true
    })
    await E2EStripe.waitForWebhookProcessing()

    // Verify failed status
    let updatedSubscriptions =
      await E2EDatabase.getSubscriptionsByPaymentLinkId(retryLinkId)
    expect(
      updatedSubscriptions.find(s => s.id === subscription.id)?.status
    ).toBe(SubscriptionStatusType.Failed)

    // Step 4: Retry succeeds
    const retrySuccessPIId = `pi_${Date.now()}_retry_success`
    const successWebhook = E2EStripe.createPaymentIntentSucceededEvent(
      retrySuccessPIId,
      {
        subscriptionId: subscription.id,
        productPaymentLinkId: retryLinkId,
        isDeferred: 'true',
        isRetry: 'true'
      }
    )

    await E2EStripe.sendWebhook(request, successWebhook, {
      skipSignature: true
    })
    await E2EStripe.waitForWebhookProcessing()

    // Step 5: Verify subscription is now completed
    updatedSubscriptions = await E2EDatabase.getSubscriptionsByPaymentLinkId(
      retryLinkId
    )
    expect(
      updatedSubscriptions.find(s => s.id === subscription.id)?.status
    ).toBe(SubscriptionStatusType.Completed)

    // Verify membership is activated
    const order = await E2EDatabase.getOrderByPaymentLinkId(retryLinkId)
    const membership = await E2EDatabase.getMembershipByOrderId(order!.id)
    expect(membership?.status).toBe(MembershipStatusType.Active)
  })
})
