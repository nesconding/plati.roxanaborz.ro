export enum OrderType {
  ParentOrder = 'parent_order', // First order that initiates recurring payments
  OneTimePaymentOrder = 'one_time_payment_order', // Order with single payment full payments without recurrence
  RenewalOrder = 'renewal_order' // Order automatically placed by shop based on subscription
}
