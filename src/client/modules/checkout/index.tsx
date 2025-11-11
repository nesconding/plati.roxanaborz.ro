'use client'

import { Logo } from '~/client/components/logo'
import { ThemeSelect } from '~/client/components/theme-select'
import { ScrollArea } from '~/client/components/ui/scroll-area'
import { CheckoutForm } from '~/client/modules/checkout/checkout-form'
import { ElementsWrapper } from '~/client/modules/checkout/elements'
import type { TRPCRouterOutput } from '~/client/trpc/react'

type PaymentLink = NonNullable<
  TRPCRouterOutput['public']['paymentLinks']['findOneById']
>

interface CheckoutModuleProps {
  paymentLink: PaymentLink
}

export function CheckoutModule({ paymentLink }: CheckoutModuleProps) {
  return (
    <ElementsWrapper clientSecret={paymentLink.stripeClientSecret}>
      <div className='flex flex-col gap-4 items-center '>
        <div className='col-span-6 w-full grid-cols-[1fr_auto_1fr] grid grid-rows-1 p-4 border-b'>
          <Logo className='col-start-2 w-48 self-center' />
          <ThemeSelect className='col-start-3 justify-self-end self-center' />
        </div>

        <ScrollArea className='sm:max-w-4xl w-full'>
          <CheckoutForm paymentLink={paymentLink} />
        </ScrollArea>
      </div>
    </ElementsWrapper>
  )
}
