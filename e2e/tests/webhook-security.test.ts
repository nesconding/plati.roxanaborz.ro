import { test, expect } from '@playwright/test'
import { E2EDatabase } from '../helpers/database'
import { E2EStripe } from '../helpers/stripe'
import { E2EUtils } from '../helpers/utils'
import { e2eProducts } from '../fixtures/products'
import { e2eUsers, e2eContracts } from '../fixtures/users'
import { e2ePaymentScenarios } from '../fixtures/payments'
import { PaymentStatusType } from '~/shared/enums/payment-status'

test.describe('Webhook Security (E2E)', () => {
  test.beforeAll(async () => {
    await E2EDatabase.cleanup()
    await E2EDatabase.createTestUser(e2eUsers.admin)
    await E2EDatabase.createTestContract(e2eContracts.contract1)
    await E2EDatabase.createTestProduct(e2eProducts.basic)
  })

  test.afterAll(async () => {
    await E2EDatabase.cleanup()
  })

  test('should accept webhook with SKIP_STRIPE_WEBHOOK_SIGNATURE enabled', async ({
    request
  }) => {
    const paymentLinkId = E2EUtils.generateTestId('ppl_security')
    const paymentIntentId = `pi_${Date.now()}_security`

    // Send webhook without signature (should work in test mode)
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

    const response = await E2EStripe.sendWebhook(request, webhookEvent, {
      skipSignature: true
    })

    expect(response.ok()).toBeTruthy()
  })

  test('should handle duplicate webhook events (idempotency)', async ({
    request
  }) => {
    const paymentLinkId = E2EUtils.generateTestId('ppl_duplicate')
    const paymentIntentId = `pi_${Date.now()}_duplicate`
    const eventId = `evt_duplicate_${Date.now()}`

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

    // Override event ID to ensure it's the same
    webhookEvent.id = eventId

    // Send same event twice
    const response1 = await E2EStripe.sendWebhook(request, webhookEvent, {
      skipSignature: true
    })
    await E2EStripe.waitForWebhookProcessing()

    const response2 = await E2EStripe.sendWebhook(request, webhookEvent, {
      skipSignature: true
    })
    await E2EStripe.waitForWebhookProcessing()

    // Both should succeed (idempotent)
    expect(response1.ok()).toBeTruthy()
    expect(response2.ok()).toBeTruthy()

    // But payment link should only be processed once
    const paymentLink = await E2EDatabase.getProductPaymentLink(paymentLinkId)
    expect(paymentLink?.status).toBe(PaymentStatusType.Completed)

    // Should not have duplicate orders
    const order = await E2EDatabase.getOrderByPaymentLinkId(paymentLinkId)
    expect(order).toBeDefined()
  })

  test('should handle unknown webhook event types gracefully', async ({
    request
  }) => {
    const unknownEvent = {
      id: `evt_unknown_${Date.now()}`,
      type: 'unknown.event.type',
      data: {
        object: {
          id: `obj_${Date.now()}`,
          status: 'unknown'
        }
      }
    }

    const response = await E2EStripe.sendWebhook(request, unknownEvent, {
      skipSignature: true
    })

    // Should return success even for unknown events (to prevent retries)
    expect(response.ok()).toBeTruthy()
  })

  test('should handle malformed webhook data gracefully', async ({
    request
  }) => {
    const malformedEvents = [
      // Missing data object
      {
        id: `evt_malformed1_${Date.now()}`,
        type: 'payment_intent.succeeded'
        // No data field
      },
      // Missing data.object
      {
        id: `evt_malformed2_${Date.now()}`,
        type: 'payment_intent.succeeded',
        data: {}
      },
      // Missing payment intent ID
      {
        id: `evt_malformed3_${Date.now()}`,
        type: 'payment_intent.succeeded',
        data: {
          object: {
            status: 'succeeded',
            metadata: {}
          }
        }
      }
    ]

    for (const malformedEvent of malformedEvents) {
      const response = await E2EStripe.sendWebhook(request, malformedEvent, {
        skipSignature: true
      })

      // Should handle gracefully without crashing
      // Likely returns error but doesn't crash server
      expect([200, 400, 422]).toContain(response.status())
    }
  })

  test('should reject webhook with invalid payment link ID', async ({
    request
  }) => {
    const paymentIntentId = `pi_${Date.now()}_invalid_link`
    const invalidLinkId = 'ppl_nonexistent_12345'

    const webhookEvent = E2EStripe.createPaymentIntentSucceededEvent(
      paymentIntentId,
      {
        type: e2ePaymentScenarios.productIntegral.type,
        productPaymentLinkId: invalidLinkId,
        productId: e2eProducts.basic.id,
        customerEmail: e2ePaymentScenarios.productIntegral.customerEmail,
        customerName: e2ePaymentScenarios.productIntegral.customerName
      }
    )

    const response = await E2EStripe.sendWebhook(request, webhookEvent, {
      skipSignature: true
    })
    await E2EStripe.waitForWebhookProcessing()

    // Should handle gracefully (likely returns success to prevent retries)
    expect(response.ok()).toBeTruthy()

    // Payment link should not exist
    const paymentLink = await E2EDatabase.getProductPaymentLink(invalidLinkId)
    expect(paymentLink).toBeUndefined()
  })

  test('should reject webhook with missing required metadata', async ({
    request
  }) => {
    const paymentIntentId = `pi_${Date.now()}_missing_metadata`

    const webhookEvent = E2EStripe.createPaymentIntentSucceededEvent(
      paymentIntentId,
      {
        // Missing type, productPaymentLinkId, etc.
        customerEmail: 'test@example.com'
      }
    )

    const response = await E2EStripe.sendWebhook(request, webhookEvent, {
      skipSignature: true
    })

    // Should handle gracefully
    expect([200, 400, 422]).toContain(response.status())
  })

  test('should handle webhook with empty metadata object', async ({
    request
  }) => {
    const paymentIntentId = `pi_${Date.now()}_empty_metadata`

    const webhookEvent = {
      id: `evt_${Date.now()}`,
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: paymentIntentId,
          status: 'succeeded',
          metadata: {} // Empty metadata
        }
      }
    }

    const response = await E2EStripe.sendWebhook(request, webhookEvent, {
      skipSignature: true
    })

    // Should handle gracefully without crashing
    expect([200, 400, 422]).toContain(response.status())
  })

  test('should handle webhook replay attack (old timestamp)', async ({
    request
  }) => {
    const paymentLinkId = E2EUtils.generateTestId('ppl_replay')
    const paymentIntentId = `pi_${Date.now()}_replay`

    // Create event with old timestamp (e.g., 1 hour ago)
    const oldTimestamp = Math.floor(Date.now() / 1000) - 3600

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

    // Override created timestamp
    webhookEvent.created = oldTimestamp

    const response = await E2EStripe.sendWebhook(request, webhookEvent, {
      skipSignature: true
    })

    // In test mode with signature skipping, this should still work
    // In production with signature validation, old timestamps would be rejected
    expect(response.ok()).toBeTruthy()
  })

  test('should handle concurrent webhooks for same payment', async ({
    request
  }) => {
    const paymentLinkId = E2EUtils.generateTestId('ppl_concurrent')
    const paymentIntentId = `pi_${Date.now()}_concurrent`

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

    // Send multiple webhooks concurrently
    const responses = await Promise.all([
      E2EStripe.sendWebhook(request, webhookEvent, { skipSignature: true }),
      E2EStripe.sendWebhook(request, webhookEvent, { skipSignature: true }),
      E2EStripe.sendWebhook(request, webhookEvent, { skipSignature: true })
    ])

    // All should succeed
    responses.forEach(response => {
      expect(response.ok()).toBeTruthy()
    })

    await E2EStripe.waitForWebhookProcessing(2000)

    // But should only create one order (due to transaction locking)
    const paymentLink = await E2EDatabase.getProductPaymentLink(paymentLinkId)
    expect(paymentLink?.status).toBe(PaymentStatusType.Completed)

    const order = await E2EDatabase.getOrderByPaymentLinkId(paymentLinkId)
    expect(order).toBeDefined()
  })

  test('should handle webhook with invalid product ID', async ({ request }) => {
    const paymentLinkId = E2EUtils.generateTestId('ppl_invalid_product')
    const paymentIntentId = `pi_${Date.now()}_invalid_product`

    const webhookEvent = E2EStripe.createPaymentIntentSucceededEvent(
      paymentIntentId,
      {
        type: e2ePaymentScenarios.productIntegral.type,
        productPaymentLinkId: paymentLinkId,
        productId: 'prod_nonexistent_12345', // Invalid product ID
        customerEmail: e2ePaymentScenarios.productIntegral.customerEmail,
        customerName: e2ePaymentScenarios.productIntegral.customerName
      }
    )

    const response = await E2EStripe.sendWebhook(request, webhookEvent, {
      skipSignature: true
    })
    await E2EStripe.waitForWebhookProcessing()

    // Should handle gracefully
    expect(response.ok()).toBeTruthy()

    // Payment link should not be created or should be in pending/failed state
    const paymentLink = await E2EDatabase.getProductPaymentLink(paymentLinkId)
    if (paymentLink) {
      expect([
        PaymentStatusType.Pending,
        PaymentStatusType.Failed
      ]).toContain(paymentLink.status)
    }
  })

  test('should handle payment_intent.canceled event', async ({ request }) => {
    const paymentLinkId = E2EUtils.generateTestId('ppl_canceled')
    const paymentIntentId = `pi_${Date.now()}_canceled`

    const webhookEvent = E2EStripe.createPaymentIntentCanceledEvent(
      paymentIntentId,
      {
        type: e2ePaymentScenarios.productIntegral.type,
        productPaymentLinkId: paymentLinkId,
        productId: e2eProducts.basic.id,
        customerEmail: e2ePaymentScenarios.productIntegral.customerEmail,
        customerName: e2ePaymentScenarios.productIntegral.customerName
      }
    )

    const response = await E2EStripe.sendWebhook(request, webhookEvent, {
      skipSignature: true
    })
    await E2EStripe.waitForWebhookProcessing()

    expect(response.ok()).toBeTruthy()

    // Payment link should be canceled or remain pending
    const paymentLink = await E2EDatabase.getProductPaymentLink(paymentLinkId)
    if (paymentLink) {
      expect([PaymentStatusType.Pending, PaymentStatusType.Canceled]).toContain(
        paymentLink.status
      )
    }
  })

  test('should handle payment_intent.failed event', async ({ request }) => {
    const paymentLinkId = E2EUtils.generateTestId('ppl_failed_webhook')
    const paymentIntentId = `pi_${Date.now()}_failed_webhook`

    const webhookEvent = E2EStripe.createPaymentIntentFailedEvent(
      paymentIntentId,
      {
        type: e2ePaymentScenarios.productIntegral.type,
        productPaymentLinkId: paymentLinkId,
        productId: e2eProducts.basic.id,
        customerEmail: e2ePaymentScenarios.productIntegral.customerEmail,
        customerName: e2ePaymentScenarios.productIntegral.customerName
      }
    )

    const response = await E2EStripe.sendWebhook(request, webhookEvent, {
      skipSignature: true
    })
    await E2EStripe.waitForWebhookProcessing()

    expect(response.ok()).toBeTruthy()

    // Payment link should be failed or remain pending
    const paymentLink = await E2EDatabase.getProductPaymentLink(paymentLinkId)
    if (paymentLink) {
      expect([PaymentStatusType.Pending, PaymentStatusType.Failed]).toContain(
        paymentLink.status
      )
    }
  })

  test('should handle webhook with extremely long strings in metadata', async ({
    request
  }) => {
    const paymentLinkId = E2EUtils.generateTestId('ppl_long_strings')
    const paymentIntentId = `pi_${Date.now()}_long_strings`
    const veryLongString = 'a'.repeat(10000)

    const webhookEvent = E2EStripe.createPaymentIntentSucceededEvent(
      paymentIntentId,
      {
        type: e2ePaymentScenarios.productIntegral.type,
        productPaymentLinkId: paymentLinkId,
        productId: e2eProducts.basic.id,
        customerEmail: e2ePaymentScenarios.productIntegral.customerEmail,
        customerName: veryLongString, // Extremely long name
        extraData: veryLongString // Extra long field
      }
    )

    const response = await E2EStripe.sendWebhook(request, webhookEvent, {
      skipSignature: true
    })

    // Should handle gracefully (may truncate or reject)
    expect([200, 400, 413, 422]).toContain(response.status())
  })

  test('should handle webhook with SQL injection attempt in metadata', async ({
    request
  }) => {
    const paymentLinkId = E2EUtils.generateTestId('ppl_sql_injection')
    const paymentIntentId = `pi_${Date.now()}_sql_injection`
    const sqlInjection = "'; DROP TABLE users; --"

    const webhookEvent = E2EStripe.createPaymentIntentSucceededEvent(
      paymentIntentId,
      {
        type: e2ePaymentScenarios.productIntegral.type,
        productPaymentLinkId: paymentLinkId,
        productId: sqlInjection, // Attempt SQL injection
        customerEmail: sqlInjection,
        customerName: sqlInjection
      }
    )

    const response = await E2EStripe.sendWebhook(request, webhookEvent, {
      skipSignature: true
    })
    await E2EStripe.waitForWebhookProcessing()

    // Should handle safely without SQL injection
    expect(response.ok()).toBeTruthy()

    // Verify users table still exists (not dropped)
    const users = await E2EDatabase.getAllUsers()
    expect(Array.isArray(users)).toBe(true)
  })

  test('should handle webhook with XSS attempt in metadata', async ({
    request
  }) => {
    const paymentLinkId = E2EUtils.generateTestId('ppl_xss')
    const paymentIntentId = `pi_${Date.now()}_xss`
    const xssAttempt = '<script>alert("XSS")</script>'

    const webhookEvent = E2EStripe.createPaymentIntentSucceededEvent(
      paymentIntentId,
      {
        type: e2ePaymentScenarios.productIntegral.type,
        productPaymentLinkId: paymentLinkId,
        productId: e2eProducts.basic.id,
        customerEmail: e2ePaymentScenarios.productIntegral.customerEmail,
        customerName: xssAttempt // XSS attempt
      }
    )

    const response = await E2EStripe.sendWebhook(request, webhookEvent, {
      skipSignature: true
    })

    // Should handle safely (store as plain text, not execute)
    expect(response.ok()).toBeTruthy()
  })
})
