# E2E Testing for Payment Flows

This directory contains end-to-end tests for the complete payment flow using Playwright.

## Setup Complete ✓

### Infrastructure
- ✅ Playwright installed and configured
- ✅ Test directory structure created
- ✅ Helper functions implemented
- ✅ Test fixtures created
- ✅ First e2e test written (Product Integral Payment)

### Directory Structure

```
e2e/
├── README.md                     # This file
├── helpers/
│   ├── database.ts              # Database setup/cleanup helpers
│   ├── stripe.ts                # Stripe webhook simulation helpers
│   ├── auth.ts                  # Authentication helpers
│   └── utils.ts                 # Common utility functions
├── fixtures/
│   ├── products.ts              # Test product data
│   ├── users.ts                 # Test user data
│   └── payments.ts              # Test payment scenarios
└── tests/
    └── product-integral-payment.test.ts  # First complete test

```

## Setup

### 1. Start Test Database

First time setup:
```bash
# Start the test database container
bun run test:db:start

# Wait for it to be ready (few seconds), then initialize schema
bun run test:db:setup
```

The test database will be running on:
- **Host:** localhost
- **Port:** 9877
- **Database:** plati_rb_ro_test_db
- **User:** plati_rb_ro_test_user
- **Password:** plati_rb_ro_test_password

### 2. Database Management Commands

```bash
# Start test database
bun run test:db:start

# Stop test database
bun run test:db:stop

# Setup/migrate test database schema
bun run test:db:setup

# Reset test database (delete all data and reinitialize)
bun run test:db:reset
```

## Running Tests

### Run all e2e tests
```bash
# Automatically loads .env.test and runs on port 9099
bun run test:e2e
```

### Run tests in UI mode (recommended for development)
```bash
# Interactive UI for watching and debugging tests
bun run test:e2e:ui
```

### Run tests in debug mode
```bash
# Step through tests with Playwright Inspector
bun run test:e2e:debug
```

**Note:** All test commands automatically set `NODE_ENV=test` which loads the `.env.test` configuration file. The test server will run on port 9099 as specified in `.env.test`.

### View test report after running
```bash
bun run test:e2e:report
```

## Test Helpers

### E2EDatabase
Provides functions for setting up and querying test data:
- `cleanup()` - Clean all test data
- `createTestUser()` - Create a test user
- `createTestProduct()` - Create a test product
- `createTestContract()` - Create a test contract
- `createTestExtension()` - Create a test extension
- `getProductPaymentLink()` - Query payment link
- `getOrderByPaymentLinkId()` - Query order
- `getMembershipByOrderId()` - Query membership

### E2EStripe
Simulates Stripe webhooks and payment flows:
- `sendWebhook()` - Send webhook to API
- `createPaymentIntentSucceededEvent()` - Create success webhook
- `createPaymentIntentFailedEvent()` - Create failure webhook
- `createPaymentIntentCanceledEvent()` - Create cancellation webhook
- `waitForWebhookProcessing()` - Wait for async processing
- `getTestCards()` - Get Stripe test card numbers

### E2EUtils
Common utility functions:
- `fillStripeCard()` - Fill Stripe card form (handles iframes)
- `submitPayment()` - Submit payment form
- `waitForPaymentSuccess()` - Wait for success redirect
- `waitForPaymentFailure()` - Wait for error message
- `generateTestId()` - Generate unique test IDs
- `formatCurrency()` - Format amounts for display
- `toCents()` / `fromCents()` - Convert amounts
- `retry()` - Retry async operations

### E2EAuth
Authentication helpers (adjust based on your auth flow):
- `login()` - Log in a user
- `logout()` - Log out current user
- `isAuthenticated()` - Check if user is logged in

## Test Fixtures

### Products
- `e2eProducts.basic` - Basic product without deposit
- `e2eProducts.withDeposit` - Product with deposit enabled
- `e2eProducts.withInstallments` - Product with installments

### Users
- `e2eUsers.admin` - Admin user
- `e2eUsers.regular` - Regular user
- `e2eUsers.customer1` - Test customer 1
- `e2eUsers.customer2` - Test customer 2

### Payment Scenarios
- `e2ePaymentScenarios.productIntegral` - Full payment scenario
- `e2ePaymentScenarios.productDeposit` - Deposit payment
- `e2ePaymentScenarios.productInstallments` - Installments
- `e2ePaymentScenarios.productInstallmentsDeposit` - Deposit + Installments
- `e2ePaymentScenarios.extensionIntegral` - Extension full payment
- `e2ePaymentScenarios.extensionDeposit` - Extension deposit

### Stripe Test Cards
- `e2eStripeCards.success` - 4242 4242 4242 4242 (succeeds)
- `e2eStripeCards.declined` - 4000 0000 0000 0002 (declined)
- `e2eStripeCards.requiresAuth` - 4000 0025 0000 3155 (3D Secure)
- `e2eStripeCards.insufficientFunds` - 4000 0000 0000 9995 (insufficient)

## Completed Tests

### 1. Product Integral Payment Flow ✅
File: `tests/product-integral-payment.test.ts`

Tests (4):
1. ✅ Complete successful payment flow from checkout to success
2. ✅ Declined card handling with error display
3. ✅ Expired payment link prevention
4. ✅ Payment cancellation flow

### 2. Product Deposit Payment Flow ✅
File: `tests/product-deposit-payment.test.ts`

Tests (6):
1. ✅ Deposit payment with delayed membership creation
2. ✅ Deferred payment charging via cron and membership activation
3. ✅ Failed deferred payment handling
4. ✅ Insufficient deposit amount validation
5. ✅ Payment summary display
6. ✅ Retry of failed deferred payment

### 3. Product Installments Payment Flow ✅
File: `tests/product-installments-payment.test.ts`

Tests (7):
1. ✅ First installment payment with subscription creation
2. ✅ Monthly installment charging via cron job
3. ✅ Subscription completion after all installments paid
4. ✅ Failed installment payment handling
5. ✅ Membership pause after multiple failed installments
6. ✅ Installment schedule display on checkout page
7. ✅ Early payoff of remaining installments

### 4. Extension Payment Flows ✅
File: `tests/extension-payment.test.ts`

Tests (9):
1. ✅ Extension integral payment with membership extension
2. ✅ Extension deposit payment with deferred charge
3. ✅ Deferred extension payment via cron
4. ✅ Prevent extension purchase without existing membership
5. ✅ Extended membership end date display on success
6. ✅ Extension for expired membership
7. ✅ Failed extension payment handling
8. ✅ Extended end date calculation based on current membership
9. ✅ Multiple extensions for same membership

### 5. Webhook Security Tests ✅
File: `tests/webhook-security.test.ts`

Tests (15):
1. ✅ Accept webhook with SKIP_STRIPE_WEBHOOK_SIGNATURE enabled
2. ✅ Handle duplicate webhook events (idempotency)
3. ✅ Handle unknown webhook event types gracefully
4. ✅ Handle malformed webhook data gracefully
5. ✅ Reject webhook with invalid payment link ID
6. ✅ Reject webhook with missing required metadata
7. ✅ Handle webhook with empty metadata object
8. ✅ Handle webhook replay attack (old timestamp)
9. ✅ Handle concurrent webhooks for same payment
10. ✅ Handle webhook with invalid product ID
11. ✅ Handle payment_intent.canceled event
12. ✅ Handle payment_intent.failed event
13. ✅ Handle webhook with extremely long strings in metadata
14. ✅ Handle webhook with SQL injection attempt in metadata
15. ✅ Handle webhook with XSS attempt in metadata

### 6. Cron Job Tests ✅
File: `tests/cron-jobs.test.ts`

Tests (11):
1. ✅ Charge deferred payment via cron and activate membership
2. ✅ Charge installment payment via cron
3. ✅ Handle failed deferred payment in cron job
4. ✅ Process multiple subscriptions in one cron run
5. ✅ Skip subscription if not yet due
6. ✅ Retry failed payment on subsequent cron run
7. ✅ Reject cron request without authorization header
8. ✅ Reject cron request with invalid authorization
9. ✅ Handle extension deferred payment via cron
10. ✅ Complete installment subscription after final payment
11. ✅ Authorization and security for cron endpoints

## Summary

**Total E2E Tests Created: 52 tests across 6 test files**

All major payment flows are now covered:
- ✅ Product integral payments (4 tests)
- ✅ Product deposit payments (6 tests)
- ✅ Product installments (7 tests)
- ✅ Extension payments (9 tests)
- ✅ Webhook security (15 tests)
- ✅ Cron job processing (11 tests)

## Optional Future Tests

### Edge Cases and Error Handling
Additional scenarios that could be tested:
- Concurrent payment attempts for same link
- Payment link reuse prevention
- Database transaction rollbacks
- Network timeouts
- Stripe API errors
- Rate limiting

Test scenarios:
- Concurrent payment attempts
- Payment link reuse prevention
- Database transaction rollbacks
- Network timeouts
- Stripe API errors

## Important Notes

### Webhook Signature Verification
In production, Stripe webhooks require signature verification. For e2e tests:
- Set `SKIP_STRIPE_WEBHOOK_SIGNATURE=true` in test environment, OR
- Use Stripe CLI to forward real webhooks, OR
- Generate valid test signatures using Stripe webhook secret

### Test Database ✅
E2E tests use a dedicated test database that runs in a separate Docker container:
- **Container:** plati_rb_ro_test_db (port 9877)
- **Database:** plati_rb_ro_test_db
- **User:** plati_rb_ro_test_user
- **Cleanup Strategy:** Clean up after each test using `E2EDatabase.cleanup()`

### Environment Variables ✅
The `.env.test` file is already configured with:
```env
# Test server port
PORT=9099

# Test database (port 9877)
DATABASE_URL=postgresql://plati_rb_ro_test_user:plati_rb_ro_test_password@localhost:9877/plati_rb_ro_test_db

# Stripe test keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SKIP_STRIPE_WEBHOOK_SIGNATURE=true  # Skip signature verification in tests

# E2E Testing
E2E_BASE_URL=http://localhost:9099

# Other required env vars
CRON_SECRET=your-secret-cron-key-here-change-in-production
```

### Running Tests in CI/CD
```yaml
# Example GitHub Actions workflow
- name: Run E2E Tests
  run: |
    bun run db:reset
    bun run dev &
    sleep 10  # Wait for server to start
    bun run test:e2e
```

## Test Writing Guidelines

### 1. Use Descriptive Test Names
```typescript
test('should complete full integral payment flow from checkout to success', ...)
```

### 2. Follow AAA Pattern
```typescript
// Arrange
const paymentLinkId = E2EUtils.generateTestId('ppl')
await E2EDatabase.createTestProduct(...)

// Act
await page.goto(`/checkout/${paymentLinkId}`)
await E2EUtils.fillStripeCard(page, cards.success)
await E2EUtils.submitPayment(page)

// Assert
const order = await E2EDatabase.getOrderByPaymentLinkId(paymentLinkId)
expect(order?.status).toBe(OrderStatusType.Completed)
```

### 3. Clean Up After Tests
```typescript
test.afterAll(async () => {
  await E2EDatabase.cleanup()
})
```

### 4. Use Page Object Pattern for Complex Flows
Consider creating page objects for checkout, dashboard, etc.

### 5. Add Wait States
```typescript
// Wait for webhook processing
await E2EStripe.waitForWebhookProcessing(2000)

// Wait for UI updates
await page.waitForSelector('[data-testid="success-message"]')
```

## Debugging Tests

### 1. Use UI Mode
```bash
bun run test:e2e:ui
```
This provides a visual interface to:
- Watch tests run in real browser
- Inspect DOM at each step
- View network requests
- See console logs

### 2. Use Debug Mode
```bash
bun run test:e2e:debug
```
Opens Playwright Inspector to step through tests

### 3. Take Screenshots
```typescript
await E2EUtils.screenshot(page, 'checkout-page')
```

### 4. Check Browser Console
```typescript
page.on('console', msg => console.log('Browser:', msg.text()))
```

### 5. Slow Down Execution
```typescript
test.use({ slowMo: 1000 }) // 1 second delay between actions
```

## Next Steps

1. Implement remaining test files (Deposit, Installments, Extensions)
2. Add webhook security tests
3. Add cron job tests
4. Set up CI/CD pipeline
5. Add visual regression testing (optional)
6. Add performance testing (optional)

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Next.js Testing](https://nextjs.org/docs/testing)
