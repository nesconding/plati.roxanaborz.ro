'use client'

import { createContext, useContext, type ReactNode } from 'react'

import { type TRPCRouterOutput } from '~/client/trpc/react'
import { PaymentProductType } from '~/shared/enums/payment-product-type'

export type PaymentLink = NonNullable<
  TRPCRouterOutput['public']['paymentLinks']['findOneById']
>

interface CheckoutContextValue {
  paymentLink: PaymentLink
  isExtension: boolean
  hasContract: boolean
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null)

interface CheckoutProviderProps {
  children: ReactNode
  paymentLink: PaymentLink
}

export function CheckoutProvider({
  children,
  paymentLink
}: CheckoutProviderProps) {
  const isExtension =
    paymentLink.paymentProductType === PaymentProductType.Extension
  const hasContract = !!paymentLink.contract

  return (
    <CheckoutContext.Provider value={{ hasContract, isExtension, paymentLink }}>
      {children}
    </CheckoutContext.Provider>
  )
}

export function useCheckout() {
  const context = useContext(CheckoutContext)
  if (!context) {
    throw new Error('useCheckout must be used within a CheckoutProvider')
  }
  return context
}
