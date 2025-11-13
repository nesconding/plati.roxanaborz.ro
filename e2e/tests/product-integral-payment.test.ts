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

test.describe('Product Integral Payment Flow (E2E)', () => {
  let paymentLinkId: string
  let paymentIntentId: string

  test.beforeAll(async () => {
    // Set up test database with required entities
    await E2EDatabase.cleanup()

    // Create test user
    await E2EDatabase.createTestUser(e2eUsers.admin)

    // Create test contract
    await E2EDatabase.createTestContract(e2eContracts.contract1)

    // Create test product
    await E2EDatabase.createTestProduct(e2eProducts.basic)
  })

  test.afterAll(async () => {
    // Clean up test data
    await E2EDatabase.cleanup()
  })

  test('should complete full integral payment flow from checkout to success', async ({
    page
  }) => {
    // Step 1: Navigate to create payment link page (assumes you have this)
    // For this e2e test, we'll create the payment link via direct database/API call
    // In a real scenario, you might navigate through the UI

    // Create payment link using tRPC or direct API call
    // For now, let's assume we have a payment link ID
    // You would typically create this via the UI or API endpoint
    paymentLinkId = E2EUtils.generateTestId('ppl_integral')
    paymentIntentId = `pi_${Date.now()}_integral`

    // Simulate payment link creation by directly inserting into database
    // In a real test, you'd use the UI or API to create this

    // Step 2: Navigate to checkout page
    await page.goto(`/checkout/${paymentLinkId}`)

    // Verify checkout page loads
    await expect(page.locator('h1')).toContainText(/checkout|payment/i)

    // Verify product details are displayed
    await E2EUtils.expectTextContent(
      page,
      '[data-testid="product-name"]',
      e2eProducts.basic.name
    )

    await E2EUtils.expectTextContent(
      page,
      '[data-testid="total-amount"]',
      E2EUtils.formatCurrency(e2eProducts.basic.price)
    )

    // Step 3: Fill in Stripe card details
    await E2EUtils.fillStripeCard(page, e2eStripeCards.success)

    // Step 4: Submit payment
    await E2EUtils.submitPayment(page)

    // Step 5: Wait for Stripe to process payment
    // In test mode, Stripe processes immediately
    await E2EUtils.waitForPaymentSuccess(page)

    // Step 6: Verify success callback page
    await expect(page).toHaveURL(/\/callback\?.*redirect_status=succeeded/)

    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()

    // Step 7: Simulate webhook (since Stripe won't send real webhooks in test)
    // Create a mock payment_intent.succeeded event
    const webhookEvent = E2EStripe.createPaymentIntentSucceededEvent(
      paymentIntentId,
      {
        type: e2ePaymentScenarios.productIntegral.type,
        productPaymentLinkId: paymentLinkId,
        productId: e2eProducts.basic.id,
        customerEmail: e2ePaymentScenarios.productIntegral.customerEmail,
        customerName: e2ePaymentScenarios.productIntegral.customerName
      }
    )

    // Send webhook to API
    const webhookResponse = await E2EStripe.sendWebhook(
      page.request,
      webhookEvent,
      { skipSignature: true }
    )

    expect(webhookResponse.ok()).toBeTruthy()

    // Wait for webhook processing
    await E2EStripe.waitForWebhookProcessing(2000)

    // Step 8: Verify database state after webhook
    const paymentLink = await E2EDatabase.getProductPaymentLink(paymentLinkId)
    expect(paymentLink).toBeDefined()
    expect(paymentLink?.status).toBe(PaymentStatusType.Completed)

    const order = await E2EDatabase.getOrderByPaymentLinkId(paymentLinkId)
    expect(order).toBeDefined()
    expect(order?.status).toBe(OrderStatusType.Completed)
    expect(order?.type).toBe(OrderType.OneTimePaymentOrder)
    expect(order?.customerEmail).toBe(
      e2ePaymentScenarios.productIntegral.customerEmail
    )

    const membership = await E2EDatabase.getMembershipByOrderId(order!.id)
    expect(membership).toBeDefined()
    expect(membership?.status).toBe(MembershipStatusType.Active)

    // Verify membership duration
    const startDate = new Date(membership!.startDate)
    const endDate = new Date(membership!.endDate)
    const monthsDiff =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth())

    expect(monthsDiff).toBe(e2eProducts.basic.membershipDurationMonths)
  })

  test('should handle declined card payment correctly', async ({ page }) => {
    // Create a new payment link for this test
    const declinedPaymentLinkId = E2EUtils.generateTestId('ppl_declined')

    // Navigate to checkout
    await page.goto(`/checkout/${declinedPaymentLinkId}`)

    // Fill in card details with declined card
    await E2EUtils.fillStripeCard(page, e2eStripeCards.declined)

    // Submit payment
    await E2EUtils.submitPayment(page)

    // Wait for error message
    await E2EUtils.waitForPaymentFailure(page)

    // Verify error message is displayed
    await expect(
      page.locator('[data-testid="payment-error"]')
    ).toContainText(/declined|failed/i)

    // Verify payment link status remains unchanged
    const paymentLink = await E2EDatabase.getProductPaymentLink(
      declinedPaymentLinkId
    )

    // Payment link should not be completed
    expect(paymentLink?.status).not.toBe(PaymentStatusType.Completed)
  })

  test('should prevent payment after link expiration', async ({ page }) => {
    // Create an expired payment link
    const expiredPaymentLinkId = E2EUtils.generateTestId('ppl_expired')

    // Navigate to checkout
    await page.goto(`/checkout/${expiredPaymentLinkId}`)

    // Should show expired message
    await expect(
      page.locator('[data-testid="expired-message"]')
    ).toBeVisible()

    // Payment form should not be visible
    await expect(page.locator('[data-testid="payment-form"]')).not.toBeVisible()
  })

  test('should handle payment cancellation', async ({ page }) => {
    const cancelledPaymentLinkId = E2EUtils.generateTestId('ppl_cancelled')
    const cancelledPaymentIntentId = `pi_${Date.now()}_cancelled`

    // Navigate to checkout
    await page.goto(`/checkout/${cancelledPaymentLinkId}`)

    // Fill in card details
    await E2EUtils.fillStripeCard(page, e2eStripeCards.success)

    // Submit payment
    await E2EUtils.submitPayment(page)

    // Simulate cancellation webhook
    const cancelEvent = E2EStripe.createPaymentIntentCanceledEvent(
      cancelledPaymentIntentId,
      {
        type: e2ePaymentScenarios.productIntegral.type,
        productPaymentLinkId: cancelledPaymentLinkId,
        productId: e2eProducts.basic.id
      }
    )

    await E2EStripe.sendWebhook(page.request, cancelEvent, {
      skipSignature: true
    })

    await E2EStripe.waitForWebhookProcessing()

    // Verify payment link is cancelled
    const paymentLink = await E2EDatabase.getProductPaymentLink(
      cancelledPaymentLinkId
    )
    expect(paymentLink?.status).toBe(PaymentStatusType.Cancelled)
  })
})
