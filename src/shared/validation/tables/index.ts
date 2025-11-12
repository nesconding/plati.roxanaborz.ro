import * as schema from '~/server/database/schema'
import { TableValidatorFactory } from '~/shared/validation/tables/factory'

// Authentication
export const UsersTableValidators = new TableValidatorFactory(schema.users)
export const AccountsTableValidators = new TableValidatorFactory(
  schema.users_accounts
)
export const SessionsTableValidators = new TableValidatorFactory(
  schema.users_sessions
)
export const VerificationsTableValidators = new TableValidatorFactory(
  schema.verifications
)

// Business
export const ContractsTableValidators = new TableValidatorFactory(
  schema.contracts
)
export const MembershipsTableValidators = new TableValidatorFactory(
  schema.memberships
)
export const ExtensionOrdersTableValidators = new TableValidatorFactory(
  schema.extension_orders
)
export const ProductOrdersTableValidators = new TableValidatorFactory(
  schema.product_orders
)
export const ProductPaymentLinksTableValidators = new TableValidatorFactory(
  schema.product_payment_links
)
export const PaymentsSettingsTableValidators = new TableValidatorFactory(
  schema.payments_settings
)

export const ProductsTableValidators = new TableValidatorFactory(
  schema.products
)
export const ProductsInstallmentsTableValidators = new TableValidatorFactory(
  schema.products_installments
)
export const ProductsExtensionsTableValidators = new TableValidatorFactory(
  schema.products_extensions
)
export const ProductsExtensionsInstallmentsTableValidators =
  new TableValidatorFactory(schema.products_extensions_installments)

export const ExtensionSubscriptionsTableValidators = new TableValidatorFactory(
  schema.extension_subscriptions
)
export const ProductSubscriptionsTableValidators = new TableValidatorFactory(
  schema.product_subscriptions
)
export const ConstantsTableValidators = new TableValidatorFactory(
  schema.constants
)
export const FirstPaymentDateAfterDepositOptionsTableValidators =
  new TableValidatorFactory(schema.first_payment_date_after_deposit_options)

export const ExtensionPaymentLinksTableValidators = new TableValidatorFactory(
  schema.extension_payment_links
)
