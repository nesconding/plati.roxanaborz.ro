'use client'

import { ThemeSelect } from '~/client/components/theme-select'
import { Button } from '~/client/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '~/client/components/ui/card'
import { ScrollArea } from '~/client/components/ui/scroll-area'
import { ElementsWrapper } from '~/client/modules/update-payment/elements'
import { UpdatePaymentForm } from '~/client/modules/update-payment/update-payment-form'
import { TRPCRouterOutput } from '~/client/trpc/react'

type SubscriptionForUpdate =
  TRPCRouterOutput['public']['business']['getSubscriptionForUpdate']

interface UpdatePaymentModuleProps {
  data: SubscriptionForUpdate
  subscriptionId: string
  token: string
}

const formId = 'update-payment-form'

export function UpdatePaymentModule({
  data,
  subscriptionId,
  token
}: UpdatePaymentModuleProps) {
  return (
    <ElementsWrapper clientSecret={data.clientSecret}>
      <div className='h-screen w-screen pt-17'>
        <div className='fixed inset-x-0 top-0 grid w-full grid-cols-[1fr_auto_1fr] p-4'>
          <ThemeSelect className='col-start-3 justify-self-end' />
        </div>

        <div className='flex h-[calc(100vh-theme(spacing.16)-theme(spacing.1))] w-full justify-center p-6'>
          <Card className='h-[calc(100vh-theme(spacing.16)-theme(spacing.1)-theme(spacing.12))] w-full gap-0 p-0 md:max-w-2xl lg:max-w-4xl'>
            <CardHeader className='border-b p-6'>
              <CardTitle>Update Payment Method</CardTitle>
            </CardHeader>

            <CardContent className='h-[calc(100vh-theme(spacing.16)-theme(spacing.1)-theme(spacing.12)-2px-theme(spacing.6)-var(--text-base)*var(--text-base--line-height)-theme(spacing.6)-1px-1px-theme(spacing.6)-theme(spacing.9)-theme(spacing.6))] p-0'>
              <ScrollArea className='h-full'>
                <UpdatePaymentForm
                  formId={formId}
                  className='p-6'
                  subscription={data.subscription}
                  subscriptionId={subscriptionId}
                  token={token}
                />
              </ScrollArea>
            </CardContent>

            <CardFooter className='border-t p-6 md:justify-end'>
              <Button type='submit' form={formId} className='w-full md:w-auto'>
                <span>Update Payment Method</span>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </ElementsWrapper>
  )
}
