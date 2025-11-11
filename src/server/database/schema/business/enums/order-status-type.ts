import { business } from '~/server/database/schema/schemas'
import { OrderStatusType } from '~/shared/enums/order-status-type'

export const order_status_type = business.enum('order_status_type', [
  OrderStatusType.Completed,
  OrderStatusType.PendingCardPayment,
  OrderStatusType.Cancelled
])
