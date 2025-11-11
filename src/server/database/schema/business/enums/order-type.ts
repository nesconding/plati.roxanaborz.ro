import { business } from '~/server/database/schema/schemas'
import { OrderType } from '~/shared/enums/order-type'

export const order_type = business.enum('order_type', [
  OrderType.ParentOrder,
  OrderType.OneTimePaymentOrder,
  OrderType.RenewalOrder
])
