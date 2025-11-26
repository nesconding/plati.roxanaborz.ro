/**
 * TBI Bank API Types
 * Based on TBI eCommerce API Documentation
 */

/**
 * Customer data for TBI loan application
 */
export interface TbiCustomer {
  fname: string
  lname: string
  cnp: string
  email: string
  phone: string
  billing_address: string
  billing_city: string
  billing_county: string
  shipping_address: string
  shipping_city: string
  shipping_county: string
  promo: 0 | 1
}

/**
 * Product item in the shopping cart
 */
export interface TbiOrderItem {
  name: string
  qty: string
  price: number
  category: string
  sku: string
  ImageLink: string
}

/**
 * Complete order data structure sent to TBI API
 */
export interface TbiOrderData {
  store_id: string
  order_id: string
  back_ref: string
  order_total: string
  username: string
  password: string
  customer: TbiCustomer
  items: TbiOrderItem[]
}

/**
 * Status update received from TBI webhook (ReturnToProvider)
 * Note: status_id is a number in the actual JSON from TBI
 */
export interface TbiStatusUpdate {
  order_id: string
  status_id: 0 | 1 | 2
  motiv: string
}

/**
 * TBI Status codes
 * 0 = Rejected/Canceled
 * 1 = Approved
 * 2 = Pending
 * Note: These are numeric values as returned in TBI's JSON response
 */
export enum TbiStatusCode {
  RejectedOrCanceled = 0,
  Approved = 1,
  Pending = 2
}

/**
 * Parameters for creating a TBI loan application
 */
export interface CreateTbiLoanParams {
  orderId: string
  orderTotal: number
  customerFirstName: string
  customerLastName: string
  customerCnp: string
  customerEmail: string
  customerPhone: string
  billingAddress: string
  billingCity: string
  billingCounty: string
  shippingAddress: string
  shippingCity: string
  shippingCounty: string
  productName: string
  productSku: string
  productImageUrl?: string
  isPromo?: boolean
}

/**
 * Response from TBI Finalize endpoint
 */
export interface TbiCreateLoanResponse {
  redirectUrl: string
}

/**
 * Cancel request structure for TBI API
 */
export interface TbiCancelRequest {
  orderId: string
  statusId: '1'
  username: string
  password: string
}

/**
 * Response from TBI Cancel endpoint
 */
export interface TbiCancelResponse {
  isSuccess: boolean
  error: string | null
}
