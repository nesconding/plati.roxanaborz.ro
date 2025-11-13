import { vi } from 'vitest'
import type Stripe from 'stripe'

/**
 * Mock Stripe SDK for testing
 * Provides mock implementations of Stripe API methods used in the payment system
 */

export const createMockStripeCustomer = (
  overrides?: Partial<Stripe.Customer>
): Stripe.Customer => ({
  id: 'cus_mock_123',
  object: 'customer',
  address: null,
  balance: 0,
  created: Date.now(),
  currency: null,
  default_source: null,
  delinquent: false,
  description: null,
  discount: null,
  email: 'test@example.com',
  invoice_prefix: 'INV',
  invoice_settings: {
    custom_fields: null,
    default_payment_method: null,
    footer: null,
    rendering_options: null
  },
  livemode: false,
  metadata: {},
  name: 'Test Customer',
  next_invoice_sequence: 1,
  phone: null,
  preferred_locales: [],
  shipping: null,
  tax_exempt: 'none',
  test_clock: null,
  ...overrides
})

export const createMockStripePaymentIntent = (
  overrides?: Partial<Stripe.PaymentIntent>
): Stripe.PaymentIntent => ({
  id: 'pi_mock_123',
  object: 'payment_intent',
  amount: 10000,
  amount_capturable: 0,
  amount_details: { tip: {} },
  amount_received: 0,
  application: null,
  application_fee_amount: null,
  automatic_payment_methods: null,
  canceled_at: null,
  cancellation_reason: null,
  capture_method: 'automatic',
  client_secret: 'pi_mock_123_secret_abc',
  confirmation_method: 'automatic',
  created: Date.now(),
  currency: 'ron',
  customer: 'cus_mock_123',
  description: null,
  invoice: null,
  last_payment_error: null,
  latest_charge: null,
  livemode: false,
  metadata: {},
  next_action: null,
  on_behalf_of: null,
  payment_method: null,
  payment_method_configuration_details: null,
  payment_method_options: null,
  payment_method_types: ['card'],
  processing: null,
  receipt_email: null,
  review: null,
  setup_future_usage: 'off_session',
  shipping: null,
  source: null,
  statement_descriptor: null,
  statement_descriptor_suffix: null,
  status: 'requires_payment_method',
  transfer_data: null,
  transfer_group: null,
  ...overrides
})

export const createMockStripePaymentMethod = (
  overrides?: Partial<Stripe.PaymentMethod>
): Stripe.PaymentMethod => ({
  id: 'pm_mock_123',
  object: 'payment_method',
  billing_details: {
    address: null,
    email: null,
    name: null,
    phone: null
  },
  card: {
    brand: 'visa',
    checks: null,
    country: 'US',
    display_brand: 'visa',
    exp_month: 12,
    exp_year: 2025,
    fingerprint: 'mock_fingerprint',
    funding: 'credit',
    generated_from: null,
    last4: '4242',
    networks: null,
    three_d_secure_usage: null,
    wallet: null
  },
  created: Date.now(),
  customer: null,
  livemode: false,
  metadata: {},
  type: 'card',
  ...overrides
})

/**
 * Mock Stripe SDK instance
 */
export const mockStripe = {
  customers: {
    create: vi.fn().mockResolvedValue(createMockStripeCustomer()),
    retrieve: vi.fn().mockResolvedValue(createMockStripeCustomer()),
    update: vi.fn().mockResolvedValue(createMockStripeCustomer()),
    del: vi.fn().mockResolvedValue({ id: 'cus_mock_123', deleted: true })
  },
  paymentIntents: {
    create: vi.fn().mockResolvedValue(createMockStripePaymentIntent()),
    retrieve: vi.fn().mockResolvedValue(createMockStripePaymentIntent()),
    update: vi.fn().mockResolvedValue(createMockStripePaymentIntent()),
    cancel: vi.fn().mockResolvedValue(
      createMockStripePaymentIntent({ status: 'canceled' })
    ),
    confirm: vi.fn().mockResolvedValue(
      createMockStripePaymentIntent({ status: 'succeeded' })
    )
  },
  paymentMethods: {
    create: vi.fn().mockResolvedValue(createMockStripePaymentMethod()),
    retrieve: vi.fn().mockResolvedValue(createMockStripePaymentMethod()),
    attach: vi.fn().mockResolvedValue(createMockStripePaymentMethod()),
    detach: vi.fn().mockResolvedValue(createMockStripePaymentMethod())
  }
}

/**
 * Reset all Stripe mocks
 */
export const resetStripeMocks = () => {
  vi.clearAllMocks()
}

/**
 * Helper to verify Stripe method was called with expected arguments
 */
export const expectStripeMethodCalled = (
  method: keyof typeof mockStripe,
  subMethod: string,
  args?: any
) => {
  const mock = (mockStripe[method] as any)[subMethod]
  if (args) {
    expect(mock).toHaveBeenCalledWith(expect.objectContaining(args))
  } else {
    expect(mock).toHaveBeenCalled()
  }
}
