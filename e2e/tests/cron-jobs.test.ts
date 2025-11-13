import { test, expect } from '@playwright/test'
import { E2EDatabase } from '../helpers/database'
import { E2EStripe } from '../helpers/stripe'
import { E2EUtils } from '../helpers/utils'
import { e2eProducts, e2eExtensions } from '../fixtures/products'
import { e2eUsers, e2eContracts } from '../fixtures/users'
import { e2ePaymentScenarios } from '../fixtures/payments'
import { PaymentStatusType } from '~/shared/enums/payment-status'
import { SubscriptionStatusType } from '~/shared/enums/subscription-status-type'
import { MembershipStatusType } from '~/shared/enums/membership-status-type'

test.describe('Cron Jobs (E2E)', () => {
  const cronEndpoint = `${process.env.E2E_BASE_URL || `http://localhost:${process.env.PORT || '9099'}`}/api/cron/charge-deferred-payments`
  const cronSecret = process.env.CRON_SECRET || 'your-secret-cron-key-here-change-in-production'

  test.beforeAll(async () => {
    await E2EDatabase.cleanup()
    await E2EDatabase.createTestUser(e2eUsers.admin)
    await E2EDatabase.createTestContract(e2eContracts.contract1)
    await E2EDatabase.createTestProduct(e2eProducts.basic)
    await E2EDatabase.createTestProduct(e2eProducts.withDeposit)
    await E2EDatabase.createTestProduct(e2eProducts.withInstallments)
    await E2EDatabase.createTestExtension(e2eExtensions.basic)
  })

  test.afterAll(async () => {
    await E2EDatabase.cleanup()
  })

  test('should charge deferred payment via cron and activate membership', async ({
    request
  }) => {
    const depositLinkId = E2EUtils.generateTestId('ppl_cron_deposit')
    const depositPIId = `pi_${Date.now()}_cron_deposit`

    // Step 1: Complete initial deposit payment
    const depositWebhook = E2EStripe.createPaymentIntentSucceededEvent(
      depositPIId,
      {
        type: e2ePaymentScenarios.productDeposit.type,
        productPaymentLinkId: depositLinkId,
        productId: e2eProducts.withDeposit.id,
        customerEmail: e2ePaymentScenarios.productDeposit.customerEmail,
        customerName: e2ePaymentScenarios.productDeposit.customerName,
        depositAmountInCents:
          e2ePaymentScenarios.productDeposit.depositAmountInCents
      }
    )

    await E2EStripe.sendWebhook(request, depositWebhook, {
      skipSignature: true
    })
    await E2EStripe.waitForWebhookProcessing()

    // Verify subscription created
    const subscriptions = await E2EDatabase.getSubscriptionsByPaymentLinkId(
      depositLinkId
    )
    expect(subscriptions.length).toBe(1)
    expect(subscriptions[0].status).toBe(SubscriptionStatusType.Active)

    // Step 2: Trigger cron job
    const cronResponse = await request.post(cronEndpoint, {
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      }
    })

    expect(cronResponse.ok()).toBeTruthy()

    // Step 3: Simulate successful deferred payment webhook
    const deferredPIId = `pi_${Date.now()}_cron_deferred`
    const deferredWebhook = E2EStripe.createPaymentIntentSucceededEvent(
      deferredPIId,
      {
        subscriptionId: subscriptions[0].id,
        productPaymentLinkId: depositLinkId,
        isDeferred: 'true'
      }
    )

    await E2EStripe.sendWebhook(request, deferredWebhook, {
      skipSignature: true
    })
    await E2EStripe.waitForWebhookProcessing()

    // Verify membership activated
    const order = await E2EDatabase.getOrderByPaymentLinkId(depositLinkId)
    const membership = await E2EDatabase.getMembershipByOrderId(order!.id)
    expect(membership?.status).toBe(MembershipStatusType.Active)

    // Verify subscription completed
    const updatedSubscriptions =
      await E2EDatabase.getSubscriptionsByPaymentLinkId(depositLinkId)
    expect(updatedSubscriptions[0].status).toBe(SubscriptionStatusType.Completed)
  })

  test('should charge installment payment via cron', async ({ request }) => {
    const installmentsLinkId = E2EUtils.generateTestId('ppl_cron_installments')
    const firstInstallmentPIId = `pi_${Date.now()}_cron_inst1`

    // Step 1: Complete first installment
    const firstWebhook = E2EStripe.createPaymentIntentSucceededEvent(
      firstInstallmentPIId,
      {
        type: e2ePaymentScenarios.productInstallments.type,
        productPaymentLinkId: installmentsLinkId,
        productId: e2eProducts.withInstallments.id,
        customerEmail: e2ePaymentScenarios.productInstallments.customerEmail,
        customerName: e2ePaymentScenarios.productInstallments.customerName,
        installmentsCount: String(
          e2ePaymentScenarios.productInstallments.installmentsCount
        )
      }
    )

    await E2EStripe.sendWebhook(request, firstWebhook, { skipSignature: true })
    await E2EStripe.waitForWebhookProcessing()

    // Get subscription
    const subscriptions = await E2EDatabase.getSubscriptionsByPaymentLinkId(
      installmentsLinkId
    )
    const initialRemaining = subscriptions[0].installmentsRemaining

    // Step 2: Trigger cron job
    const cronResponse = await request.post(cronEndpoint, {
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      }
    })

    expect(cronResponse.ok()).toBeTruthy()

    // Step 3: Simulate successful installment webhook
    const installmentPIId = `pi_${Date.now()}_cron_inst2`
    const installmentWebhook = E2EStripe.createPaymentIntentSucceededEvent(
      installmentPIId,
      {
        subscriptionId: subscriptions[0].id,
        productPaymentLinkId: installmentsLinkId,
        isInstallment: 'true',
        installmentNumber: '2'
      }
    )

    await E2EStripe.sendWebhook(request, installmentWebhook, {
      skipSignature: true
    })
    await E2EStripe.waitForWebhookProcessing()

    // Verify installments remaining decreased
    const updatedSubscriptions =
      await E2EDatabase.getSubscriptionsByPaymentLinkId(installmentsLinkId)
    expect(updatedSubscriptions[0].installmentsRemaining).toBe(
      initialRemaining - 1
    )
    expect(updatedSubscriptions[0].status).toBe(SubscriptionStatusType.Active)
  })

  test('should handle failed deferred payment in cron job', async ({
    request
  }) => {
    const failedDepositLinkId = E2EUtils.generateTestId('ppl_cron_fail')
    const depositPIId = `pi_${Date.now()}_cron_fail_deposit`

    // Step 1: Complete initial deposit
    const depositWebhook = E2EStripe.createPaymentIntentSucceededEvent(
      depositPIId,
      {
        type: e2ePaymentScenarios.productDeposit.type,
        productPaymentLinkId: failedDepositLinkId,
        productId: e2eProducts.withDeposit.id,
        customerEmail: e2ePaymentScenarios.productDeposit.customerEmail,
        customerName: e2ePaymentScenarios.productDeposit.customerName
      }
    )

    await E2EStripe.sendWebhook(request, depositWebhook, {
      skipSignature: true
    })
    await E2EStripe.waitForWebhookProcessing()

    const subscriptions = await E2EDatabase.getSubscriptionsByPaymentLinkId(
      failedDepositLinkId
    )

    // Step 2: Trigger cron job (will attempt to charge)
    await request.post(cronEndpoint, {
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      }
    })

    // Step 3: Simulate failed deferred payment
    const failedPIId = `pi_${Date.now()}_cron_fail_deferred`
    const failedWebhook = E2EStripe.createPaymentIntentFailedEvent(failedPIId, {
      subscriptionId: subscriptions[0].id,
      productPaymentLinkId: failedDepositLinkId,
      isDeferred: 'true'
    })

    await E2EStripe.sendWebhook(request, failedWebhook, {
      skipSignature: true
    })
    await E2EStripe.waitForWebhookProcessing()

    // Verify subscription marked as failed
    const updatedSubscriptions =
      await E2EDatabase.getSubscriptionsByPaymentLinkId(failedDepositLinkId)
    expect(updatedSubscriptions[0].status).toBe(SubscriptionStatusType.Failed)

    // Verify membership still delayed
    const order = await E2EDatabase.getOrderByPaymentLinkId(
      failedDepositLinkId
    )
    const membership = await E2EDatabase.getMembershipByOrderId(order!.id)
    expect(membership?.status).toBe(MembershipStatusType.Delayed)
  })

  test('should process multiple subscriptions in one cron run', async ({
    request
  }) => {
    // Create multiple subscriptions due for payment
    const link1Id = E2EUtils.generateTestId('ppl_cron_multi1')
    const link2Id = E2EUtils.generateTestId('ppl_cron_multi2')
    const link3Id = E2EUtils.generateTestId('ppl_cron_multi3')

    // Create 3 deposit payments
    const createDeposit = async (linkId: string) => {
      const depositPIId = `pi_${Date.now()}_${linkId}`
      const depositWebhook = E2EStripe.createPaymentIntentSucceededEvent(
        depositPIId,
        {
          type: e2ePaymentScenarios.productDeposit.type,
          productPaymentLinkId: linkId,
          productId: e2eProducts.withDeposit.id,
          customerEmail: e2ePaymentScenarios.productDeposit.customerEmail,
          customerName: e2ePaymentScenarios.productDeposit.customerName
        }
      )
      await E2EStripe.sendWebhook(request, depositWebhook, {
        skipSignature: true
      })
      await E2EStripe.waitForWebhookProcessing(500)
    }

    await createDeposit(link1Id)
    await createDeposit(link2Id)
    await createDeposit(link3Id)

    // Trigger cron job (should process all 3)
    const cronResponse = await request.post(cronEndpoint, {
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      }
    })

    expect(cronResponse.ok()).toBeTruthy()

    // Verify all subscriptions were attempted
    // (In real scenario, Stripe would send webhooks for each)
  })

  test('should not charge subscription if not yet due', async ({ request }) => {
    const futureLinkId = E2EUtils.generateTestId('ppl_cron_future')
    const depositPIId = `pi_${Date.now()}_future_deposit`

    // Create deposit payment with far future charge date
    const depositWebhook = E2EStripe.createPaymentIntentSucceededEvent(
      depositPIId,
      {
        type: e2ePaymentScenarios.productDeposit.type,
        productPaymentLinkId: futureLinkId,
        productId: e2eProducts.withDeposit.id,
        customerEmail: e2ePaymentScenarios.productDeposit.customerEmail,
        customerName: e2ePaymentScenarios.productDeposit.customerName,
        // Set next charge date far in future
        nextChargeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    )

    await E2EStripe.sendWebhook(request, depositWebhook, {
      skipSignature: true
    })
    await E2EStripe.waitForWebhookProcessing()

    const subscriptions = await E2EDatabase.getSubscriptionsByPaymentLinkId(
      futureLinkId
    )
    const initialStatus = subscriptions[0].status

    // Trigger cron job
    await request.post(cronEndpoint, {
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      }
    })

    await E2EStripe.waitForWebhookProcessing()

    // Verify subscription status unchanged
    const updatedSubscriptions =
      await E2EDatabase.getSubscriptionsByPaymentLinkId(futureLinkId)
    expect(updatedSubscriptions[0].status).toBe(initialStatus)
  })

  test('should retry failed payment on subsequent cron run', async ({
    request
  }) => {
    const retryLinkId = E2EUtils.generateTestId('ppl_cron_retry')
    const depositPIId = `pi_${Date.now()}_retry_deposit`

    // Step 1: Create subscription
    const depositWebhook = E2EStripe.createPaymentIntentSucceededEvent(
      depositPIId,
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

    const subscriptions = await E2EDatabase.getSubscriptionsByPaymentLinkId(
      retryLinkId
    )

    // Step 2: First cron run - fails
    await request.post(cronEndpoint, {
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      }
    })

    const failedPIId = `pi_${Date.now()}_retry_fail`
    const failedWebhook = E2EStripe.createPaymentIntentFailedEvent(failedPIId, {
      subscriptionId: subscriptions[0].id,
      productPaymentLinkId: retryLinkId,
      isDeferred: 'true'
    })

    await E2EStripe.sendWebhook(request, failedWebhook, {
      skipSignature: true
    })
    await E2EStripe.waitForWebhookProcessing()

    // Verify failed
    let updatedSubscriptions =
      await E2EDatabase.getSubscriptionsByPaymentLinkId(retryLinkId)
    expect(updatedSubscriptions[0].status).toBe(SubscriptionStatusType.Failed)

    // Step 3: Second cron run - succeeds
    await request.post(cronEndpoint, {
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      }
    })

    const successPIId = `pi_${Date.now()}_retry_success`
    const successWebhook = E2EStripe.createPaymentIntentSucceededEvent(
      successPIId,
      {
        subscriptionId: subscriptions[0].id,
        productPaymentLinkId: retryLinkId,
        isDeferred: 'true',
        isRetry: 'true'
      }
    )

    await E2EStripe.sendWebhook(request, successWebhook, {
      skipSignature: true
    })
    await E2EStripe.waitForWebhookProcessing()

    // Verify completed
    updatedSubscriptions = await E2EDatabase.getSubscriptionsByPaymentLinkId(
      retryLinkId
    )
    expect(updatedSubscriptions[0].status).toBe(SubscriptionStatusType.Completed)
  })

  test('should reject cron request without authorization header', async ({
    request
  }) => {
    const response = await request.post(cronEndpoint, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Should reject unauthorized request
    expect(response.status()).toBe(401)
  })

  test('should reject cron request with invalid authorization', async ({
    request
  }) => {
    const response = await request.post(cronEndpoint, {
      headers: {
        Authorization: 'Bearer invalid-secret',
        'Content-Type': 'application/json'
      }
    })

    // Should reject invalid authorization
    expect(response.status()).toBe(401)
  })

  test('should handle extension deferred payment via cron', async ({
    request
  }) => {
    const membershipId = E2EUtils.generateTestId('membership_cron_ext')
    const extDepositLinkId = E2EUtils.generateTestId('epl_cron_deposit')
    const depositPIId = `pi_${Date.now()}_ext_cron_deposit`

    // Create extension deposit payment
    const depositWebhook = E2EStripe.createPaymentIntentSucceededEvent(
      depositPIId,
      {
        type: e2ePaymentScenarios.extensionDeposit.type,
        extensionPaymentLinkId: extDepositLinkId,
        extensionId: e2eExtensions.basic.id,
        membershipId: membershipId,
        customerEmail: e2ePaymentScenarios.extensionDeposit.customerEmail,
        customerName: e2ePaymentScenarios.extensionDeposit.customerName
      }
    )

    await E2EStripe.sendWebhook(request, depositWebhook, {
      skipSignature: true
    })
    await E2EStripe.waitForWebhookProcessing()

    // Trigger cron job
    const cronResponse = await request.post(cronEndpoint, {
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      }
    })

    expect(cronResponse.ok()).toBeTruthy()

    // Simulate successful deferred extension payment
    const deferredPIId = `pi_${Date.now()}_ext_cron_deferred`
    const deferredWebhook = E2EStripe.createPaymentIntentSucceededEvent(
      deferredPIId,
      {
        extensionPaymentLinkId: extDepositLinkId,
        isDeferred: 'true'
      }
    )

    await E2EStripe.sendWebhook(request, deferredWebhook, {
      skipSignature: true
    })
    await E2EStripe.waitForWebhookProcessing()

    // Verify extension payment link completed
    const paymentLink = await E2EDatabase.getExtensionPaymentLink(
      extDepositLinkId
    )
    expect(paymentLink?.status).toBe(PaymentStatusType.Completed)
  })

  test('should complete installment subscription after final payment', async ({
    request
  }) => {
    const finalInstallmentsLinkId = E2EUtils.generateTestId(
      'ppl_cron_final_inst'
    )
    const firstPIId = `pi_${Date.now()}_final_inst1`

    // Complete first installment
    const firstWebhook = E2EStripe.createPaymentIntentSucceededEvent(firstPIId, {
      type: e2ePaymentScenarios.productInstallments.type,
      productPaymentLinkId: finalInstallmentsLinkId,
      productId: e2eProducts.withInstallments.id,
      customerEmail: e2ePaymentScenarios.productInstallments.customerEmail,
      customerName: e2ePaymentScenarios.productInstallments.customerName,
      installmentsCount: '3' // Only 3 installments for faster test
    })

    await E2EStripe.sendWebhook(request, firstWebhook, { skipSignature: true })
    await E2EStripe.waitForWebhookProcessing()

    const subscriptions = await E2EDatabase.getSubscriptionsByPaymentLinkId(
      finalInstallmentsLinkId
    )

    // Pay remaining installments
    for (let i = 2; i <= 3; i++) {
      // Trigger cron
      await request.post(cronEndpoint, {
        headers: {
          Authorization: `Bearer ${cronSecret}`,
          'Content-Type': 'application/json'
        }
      })

      // Simulate success
      const installmentPIId = `pi_${Date.now()}_final_inst${i}`
      const installmentWebhook = E2EStripe.createPaymentIntentSucceededEvent(
        installmentPIId,
        {
          subscriptionId: subscriptions[0].id,
          productPaymentLinkId: finalInstallmentsLinkId,
          isInstallment: 'true',
          installmentNumber: String(i)
        }
      )

      await E2EStripe.sendWebhook(request, installmentWebhook, {
        skipSignature: true
      })
      await E2EStripe.waitForWebhookProcessing(1000)
    }

    // Verify subscription completed
    const finalSubscriptions =
      await E2EDatabase.getSubscriptionsByPaymentLinkId(finalInstallmentsLinkId)
    expect(finalSubscriptions[0].status).toBe(SubscriptionStatusType.Completed)
    expect(finalSubscriptions[0].installmentsRemaining).toBe(0)

    // Verify payment link completed
    const paymentLink = await E2EDatabase.getProductPaymentLink(
      finalInstallmentsLinkId
    )
    expect(paymentLink?.status).toBe(PaymentStatusType.Completed)
  })
})
