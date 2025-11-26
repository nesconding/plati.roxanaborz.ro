/**
 * TBI Bank Service
 *
 * Handles communication with TBI Bank eCommerce API for BNPL payments.
 */

import { getTbiConfig } from './config'
import { decryptStatusUpdate, encryptOrderData } from './encryption'
import type {
  CreateTbiLoanParams,
  TbiCancelRequest,
  TbiCancelResponse,
  TbiCreateLoanResponse,
  TbiOrderData,
  TbiStatusUpdate
} from './types'

export * from './types'
export { decryptStatusUpdate } from './encryption'

class TbiServiceImpl {
  private getConfig() {
    return getTbiConfig()
  }

  /**
   * Build the TBI order data structure from application parameters
   */
  private buildOrderData(
    params: CreateTbiLoanParams,
    backRef: string
  ): TbiOrderData {
    const config = this.getConfig()

    return {
      store_id: config.storeId,
      order_id: params.orderId,
      back_ref: backRef,
      order_total: params.orderTotal.toString(),
      username: config.username,
      password: config.password,
      customer: {
        fname: params.customerFirstName,
        lname: params.customerLastName,
        cnp: params.customerCnp,
        email: params.customerEmail,
        phone: params.customerPhone,
        billing_address: params.billingAddress,
        billing_city: params.billingCity,
        billing_county: params.billingCounty,
        shipping_address: params.shippingAddress,
        shipping_city: params.shippingCity,
        shipping_county: params.shippingCounty,
        promo: params.isPromo ? 1 : 0
      },
      items: [
        {
          name: params.productName,
          qty: '1',
          price: params.orderTotal,
          category: config.defaultCategory,
          sku: params.productSku,
          ImageLink: params.productImageUrl ?? ''
        }
      ]
    }
  }

  /**
   * Create a TBI loan application
   *
   * Sends encrypted order data to TBI's Finalize endpoint.
   * Returns a redirect URL where the customer completes their credit application.
   */
  async createLoanApplication(
    params: CreateTbiLoanParams,
    backRefUrl: string
  ): Promise<TbiCreateLoanResponse> {
    const config = this.getConfig()
    const orderData = this.buildOrderData(params, backRefUrl)

    // Encrypt the order data
    const encryptedOrderData = encryptOrderData(orderData, config.sftlPublicKey)

    // Prepare form data
    const formData = new URLSearchParams()
    formData.append('order_data', encryptedOrderData)
    formData.append('providerCode', config.providerCode)

    // Make the API request
    // Disable SSL verification for UAT environment only
    // TBI's UAT environment has incomplete SSL certificate chain
    // This matches their official PHP implementation which disables SSL verification
    // Production environment will use proper SSL verification
    const fetchOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString(),
      redirect: 'manual', // Don't follow redirects - we need the Location header
      ...(config.environment === 'uat' && {
        tls: { rejectUnauthorized: false }
      })
    } as RequestInit & { tls?: { rejectUnauthorized: boolean } }

    // Debug logging for UAT SSL configuration
    if (config.environment === 'uat') {
      console.log('[TBI] UAT environment detected')
      console.log('[TBI] Endpoint:', config.endpoints.finalize)
      console.log('[TBI] TLS options:', JSON.stringify((fetchOptions as any).tls))
    }

    const response = await fetch(config.endpoints.finalize, fetchOptions)

    // TBI returns a 301 redirect with the landing page URL in the Location header
    if (response.status === 301 || response.status === 302) {
      const redirectUrl = response.headers.get('location')
      if (!redirectUrl) {
        throw new Error('TBI API returned redirect without Location header')
      }
      return { redirectUrl }
    }

    // Handle error responses
    if (response.status === 401) {
      throw new Error('TBI API authentication failed - check credentials')
    }

    const responseText = await response.text()
    throw new Error(
      `TBI API error: ${response.status} ${response.statusText} - ${responseText}`
    )
  }

  /**
   * Cancel a pending TBI loan application
   *
   * Can only be used before the loan is approved.
   */
  async cancelApplication(orderId: string): Promise<TbiCancelResponse> {
    const config = this.getConfig()

    const cancelData: TbiCancelRequest = {
      orderId,
      statusId: '1',
      username: config.username,
      password: config.password
    }

    // Encrypt the cancel request
    const encryptedData = encryptOrderData(cancelData, config.sftlPublicKey)

    const formData = new URLSearchParams()
    formData.append('orderData', encryptedData)
    formData.append('encryptCode', config.providerCode)

    // Disable SSL verification for UAT environment only
    const fetchOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString(),
      ...(config.environment === 'uat' && {
        tls: { rejectUnauthorized: false }
      })
    } as RequestInit & { tls?: { rejectUnauthorized: boolean } }

    const response = await fetch(config.endpoints.cancel, fetchOptions)

    if (!response.ok) {
      const responseText = await response.text()
      throw new Error(
        `TBI Cancel API error: ${response.status} ${response.statusText} - ${responseText}`
      )
    }

    return (await response.json()) as TbiCancelResponse
  }

  /**
   * Parse and decrypt a status update from TBI webhook
   */
  parseStatusUpdate(encryptedOrderData: string): TbiStatusUpdate {
    const config = this.getConfig()
    return decryptStatusUpdate<TbiStatusUpdate>(
      encryptedOrderData,
      config.merchantPrivateKey
    )
  }
}

export const TbiService = new TbiServiceImpl()
