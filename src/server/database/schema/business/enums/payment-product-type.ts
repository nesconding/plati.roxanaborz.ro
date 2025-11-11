import { business } from '~/server/database/schema/schemas'
import { PaymentProductType } from '~/shared/enums/payment-product-type'

export const payment_product_type = business.enum('payment_product_type', [
  PaymentProductType.Product,
  PaymentProductType.Extension
])
