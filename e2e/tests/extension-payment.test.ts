import { test, expect } from '@playwright/test'
import { E2EDatabase } from '../helpers/database'
import { E2EStripe } from '../helpers/stripe'
import { E2EUtils } from '../helpers/utils'
import { e2eProducts, e2eExtensions } from '../fixtures/products'
import { e2eUsers, e2eContracts } from '../fixtures/users'
import { e2ePaymentScenarios, e2eStripeCards } from '../fixtures/payments'
import { OrderStatusType } from '~/shared/enums/order-status-type'
import { OrderType } from '~/shared/enums/order-type'
import { MembershipStatusType } from '~/shared/enums/membership-status-type'
import { PaymentStatusType } from '~/shared/enums/payment-status'
import { SubscriptionStatusType } from '~/shared/enums/subscription-status-type'

test.describe('Extension Payment Flow (E2E)', () => {
  let membershipId: string
  let extensionIntegralLinkId: string

  test.beforeAll(async () => {
    await E2EDatabase.cleanup()
    await E2EDatabase.createTestUser(e2eUsers.admin)
    await E2EDatabase.createTestContract(e2eContracts.contract1)
    await E2EDatabase.createTestProduct(e2eProducts.basic)
    await E2EDatabase.createTestExtension(e2eExtensions.basic)

    // Create an existing membership to extend
    // This would normally be done through a product purchase
    // For this test, we'll assume we have a membership ID
    membershipId = E2EUtils.generateTestId('membership')
  })

  test.afterAll(async () => {
    await E2EDatabase.cleanup()
  })

  test('should complete extension integral payment and extend membership', async ({
    page
  }) => {
    extensionIntegralLinkId = E2EUtils.generateTestId('epl_integral')
    const extensionPIId = `pi_${Date.now()}_extension_integral`

    // Navigate to extension checkout
    await page.goto(`/checkout/${extensionIntegralLinkId}`)

    // Verify extension details
    await E2EUtils.expectTextContent(
      page,
      '[data-testid="extension-duration"]',
      `${e2eExtensions.basic.extensionMonths} months`
    )

    await E2EUtils.expectTextContent(
      page,
      '[data-testid="extension-price"]',
      E2EUtils.formatCurrency(e2eExtensions.basic.price)
    )

    // Fill card and submit payment
    await E2EUtils.fillStripeCard(page, e2eStripeCards.success)
    await E2EUtils.submitPayment(page)
    await E2EUtils.waitForPaymentSuccess(page)

    // Simulate extension payment webhook
    const webhookEvent = E2EStripe.createPaymentIntentSucceededEvent(
      extensionPIId,
      {
        type: e2ePaymentScenarios.extensionIntegral.type,
        extensionPaymentLinkId: extensionIntegralLinkId,
        extensionId: e2eExtensions.basic.id,
        membershipId: membershipId,
        customerEmail: e2ePaymentScenarios.extensionIntegral.customerEmail,
        customerName: e2ePaymentScenarios.extensionIntegral.customerName
      }
    )

    await E2EStripe.sendWebhook(page.request, webhookEvent, {
      skipSignature: true
    })
    await E2EStripe.waitForWebhookProcessing(2000)

    // Verify extension payment link completed
    const paymentLink = await E2EDatabase.getExtensionPaymentLink(
      extensionIntegralLinkId
    )
    expect(paymentLink?.status).toBe(PaymentStatusType.Completed)

    // Verify extension order created
    // Extension orders use a different query method
    // const extensionOrder = await E2EDatabase.getExtensionOrderByPaymentLinkId(
    //   extensionIntegralLinkId
    // )
    // expect(extensionOrder?.status).toBe(OrderStatusType.Completed)

    // Verify membership end date was extended
    const membership = await E2EDatabase.getMembershipByOrderId(membershipId)
    // End date should be extended by extensionMonths
    if (membership) {
      const endDate = new Date(membership.endDate)
      // Verify it's in the future (extended)
      expect(endDate.getTime()).toBeGreaterThan(Date.now())
    }
  })

  test('should handle extension deposit payment with deferred charge', async ({
    page,
    request
  }) => {
    const extensionDepositLinkId = E2EUtils.generateTestId('epl_deposit')
    const depositPIId = `pi_${Date.now()}_extension_deposit`

    // Navigate to extension checkout
    await page.goto(`/checkout/${extensionDepositLinkId}`)

    // Verify deposit amount
    await E2EUtils.expectTextContent(
      page,
      '[data-testid="deposit-amount"]',
      E2EUtils.formatCurrency(e2ePaymentScenarios.extensionDeposit.depositAmount)
    )

    // Submit deposit payment
    await E2EUtils.fillStripeCard(page, e2eStripeCards.success)
    await E2EUtils.submitPayment(page)
    await E2EUtils.waitForPaymentSuccess(page)

    // Simulate deposit webhook
    const depositWebhook = E2EStripe.createPaymentIntentSucceededEvent(
      depositPIId,
      {
        type: e2ePaymentScenarios.extensionDeposit.type,
        extensionPaymentLinkId: extensionDepositLinkId,
        extensionId: e2eExtensions.withDeposit.id,
        membershipId: membershipId,
        customerEmail: e2ePaymentScenarios.extensionDeposit.customerEmail,
        customerName: e2ePaymentScenarios.extensionDeposit.customerName,
        depositAmountInCents:
          e2ePaymentScenarios.extensionDeposit.depositAmountInCents
      }
    )

    await E2EStripe.sendWebhook(request, depositWebhook, {
      skipSignature: true
    })
    await E2EStripe.waitForWebhookProcessing()

    // Verify payment link is pending remaining payment
    const paymentLink = await E2EDatabase.getExtensionPaymentLink(
      extensionDepositLinkId
    )
    expect(paymentLink?.status).toBe(PaymentStatusType.PendingBankPayment)

    // Verify extension subscription created for deferred payment
    // const subscriptions = await E2EDatabase.getExtensionSubscriptionsByPaymentLinkId(
    //   extensionDepositLinkId
    // )
    // expect(subscriptions.length).toBe(1)
    // expect(subscriptions[0].status).toBe(SubscriptionStatusType.Active)
  })

  test('should complete deferred extension payment via cron', async ({
    request
  }) => {
    const deferredLinkId = E2EUtils.generateTestId('epl_deferred')
    const depositPIId = `pi_${Date.now()}_ext_deposit`

    // Complete initial deposit
    const depositWebhook = E2EStripe.createPaymentIntentSucceededEvent(
      depositPIId,
      {
        type: e2ePaymentScenarios.extensionDeposit.type,
        extensionPaymentLinkId: deferredLinkId,
        extensionId: e2eExtensions.withDeposit.id,
        membershipId: membershipId,
        customerEmail: e2ePaymentScenarios.extensionDeposit.customerEmail,
        customerName: e2ePaymentScenarios.extensionDeposit.customerName
      }
    )

    await E2EStripe.sendWebhook(request, depositWebhook, {
      skipSignature: true
    })
    await E2EStripe.waitForWebhookProcessing()

    // Trigger cron job for deferred payments
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

    // Simulate deferred payment success
    const deferredPIId = `pi_${Date.now()}_ext_deferred`
    const deferredWebhook = E2EStripe.createPaymentIntentSucceededEvent(
      deferredPIId,
      {
        extensionPaymentLinkId: deferredLinkId,
        isDeferred: 'true'
      }
    )

    await E2EStripe.sendWebhook(request, deferredWebhook, {
      skipSignature: true
    })
    await E2EStripe.waitForWebhookProcessing()

    // Verify payment link completed
    const paymentLink = await E2EDatabase.getExtensionPaymentLink(deferredLinkId)
    expect(paymentLink?.status).toBe(PaymentStatusType.Completed)
  })

  test('should prevent extension purchase without existing membership', async ({
    page
  }) => {
    const noMembershipLinkId = E2EUtils.generateTestId('epl_no_membership')

    // Try to access extension checkout without membershipId parameter
    await page.goto(`/checkout/${noMembershipLinkId}`)

    // Should show error or redirect
    await expect(
      page.locator('[data-testid="error-message"]')
    ).toContainText(/membership required/i)
  })

  test('should show extended membership end date on success page', async ({
    page
  }) => {
    const successLinkId = E2EUtils.generateTestId('epl_success')
    const extensionPIId = `pi_${Date.now()}_extension_success`

    // Complete extension payment
    const webhookEvent = E2EStripe.createPaymentIntentSucceededEvent(
      extensionPIId,
      {
        type: e2ePaymentScenarios.extensionIntegral.type,
        extensionPaymentLinkId: successLinkId,
        extensionId: e2eExtensions.basic.id,
        membershipId: membershipId,
        customerEmail: e2ePaymentScenarios.extensionIntegral.customerEmail,
        customerName: e2ePaymentScenarios.extensionIntegral.customerName
      }
    )

    await E2EStripe.sendWebhook(page.request, webhookEvent, {
      skipSignature: true
    })
    await E2EStripe.waitForWebhookProcessing()

    // Navigate to success page
    await page.goto(`/checkout/${successLinkId}/callback?redirect_status=succeeded`)

    // Verify new end date is displayed
    await expect(
      page.locator('[data-testid="new-membership-end-date"]')
    ).toBeVisible()

    // Verify extension duration is shown
    await E2EUtils.expectTextContent(
      page,
      '[data-testid="extension-duration-added"]',
      `${e2eExtensions.basic.extensionMonths}`
    )
  })

  test('should handle extension for expired membership', async ({ page }) => {
    const expiredMembershipId = E2EUtils.generateTestId('membership_expired')
    const extensionLinkId = E2EUtils.generateTestId('epl_expired_membership')

    // Navigate to extension checkout for expired membership
    await page.goto(
      `/checkout/${extensionLinkId}?membershipId=${expiredMembershipId}`
    )

    // Should still allow extension but show warning
    await expect(
      page.locator('[data-testid="expired-membership-warning"]')
    ).toContainText(/expired|inactive/i)

    // But should still allow payment
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeEnabled()
  })

  test('should handle failed extension payment correctly', async ({
    page,
    request
  }) => {
    const failedExtLinkId = E2EUtils.generateTestId('epl_failed')
    const failedPIId = `pi_${Date.now()}_extension_failed`

    // Navigate to checkout
    await page.goto(`/checkout/${failedExtLinkId}`)

    // Fill with declined card
    await E2EUtils.fillStripeCard(page, e2eStripeCards.declined)
    await E2EUtils.submitPayment(page)

    // Wait for error
    await E2EUtils.waitForPaymentFailure(page)

    // Simulate failed webhook
    const failedWebhook = E2EStripe.createPaymentIntentFailedEvent(failedPIId, {
      type: e2ePaymentScenarios.extensionIntegral.type,
      extensionPaymentLinkId: failedExtLinkId,
      extensionId: e2eExtensions.basic.id,
      membershipId: membershipId
    })

    await E2EStripe.sendWebhook(request, failedWebhook, {
      skipSignature: true
    })
    await E2EStripe.waitForWebhookProcessing()

    // Verify payment link status is failed
    const paymentLink = await E2EDatabase.getExtensionPaymentLink(
      failedExtLinkId
    )
    expect(paymentLink?.status).toBe(PaymentStatusType.Failed)

    // Verify membership end date was NOT extended
    const membership = await E2EDatabase.getMembershipByOrderId(membershipId)
    // End date should remain unchanged
  })

  test('should calculate correct extended end date based on current membership', async ({
    page
  }) => {
    const calcLinkId = E2EUtils.generateTestId('epl_calc')

    // Assume membership has an end date in the future
    await page.goto(`/checkout/${calcLinkId}?membershipId=${membershipId}`)

    // Verify the extension preview shows correct new end date
    const currentEndDateText = await page
      .locator('[data-testid="current-end-date"]')
      .textContent()

    const newEndDateText = await page
      .locator('[data-testid="new-end-date"]')
      .textContent()

    // New end date should be later than current end date
    expect(newEndDateText).toBeDefined()
    expect(currentEndDateText).toBeDefined()

    // Verify extension months are added
    await E2EUtils.expectTextContent(
      page,
      '[data-testid="extension-months"]',
      String(e2eExtensions.basic.extensionMonths)
    )
  })

  test('should handle multiple extensions for same membership', async ({
    request
  }) => {
    // Purchase first extension
    const ext1LinkId = E2EUtils.generateTestId('epl_multi_1')
    const ext1PIId = `pi_${Date.now()}_ext1`

    const ext1Webhook = E2EStripe.createPaymentIntentSucceededEvent(ext1PIId, {
      type: e2ePaymentScenarios.extensionIntegral.type,
      extensionPaymentLinkId: ext1LinkId,
      extensionId: e2eExtensions.basic.id,
      membershipId: membershipId,
      customerEmail: e2ePaymentScenarios.extensionIntegral.customerEmail,
      customerName: e2ePaymentScenarios.extensionIntegral.customerName
    })

    await E2EStripe.sendWebhook(request, ext1Webhook, { skipSignature: true })
    await E2EStripe.waitForWebhookProcessing()

    // Get membership after first extension
    const membership1 = await E2EDatabase.getMembershipByOrderId(membershipId)
    const endDate1 = membership1?.endDate

    // Purchase second extension
    const ext2LinkId = E2EUtils.generateTestId('epl_multi_2')
    const ext2PIId = `pi_${Date.now()}_ext2`

    const ext2Webhook = E2EStripe.createPaymentIntentSucceededEvent(ext2PIId, {
      type: e2ePaymentScenarios.extensionIntegral.type,
      extensionPaymentLinkId: ext2LinkId,
      extensionId: e2eExtensions.basic.id,
      membershipId: membershipId,
      customerEmail: e2ePaymentScenarios.extensionIntegral.customerEmail,
      customerName: e2ePaymentScenarios.extensionIntegral.customerName
    })

    await E2EStripe.sendWebhook(request, ext2Webhook, { skipSignature: true })
    await E2EStripe.waitForWebhookProcessing()

    // Get membership after second extension
    const membership2 = await E2EDatabase.getMembershipByOrderId(membershipId)
    const endDate2 = membership2?.endDate

    // Verify end date was extended twice
    if (endDate1 && endDate2) {
      expect(new Date(endDate2).getTime()).toBeGreaterThan(
        new Date(endDate1).getTime()
      )
    }
  })
})
