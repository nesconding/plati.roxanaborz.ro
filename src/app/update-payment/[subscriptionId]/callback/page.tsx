import { CheckCircle2, XCircle } from 'lucide-react'

import { ThemeSelect } from '~/client/components/theme-select'
import { Button } from '~/client/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '~/client/components/ui/card'

// import { updateSubscriptionPaymentMethod } from '~/server/application/use-cases'

interface UpdatePaymentCallbackPageProps {
  params: Promise<{ subscriptionId: string }>
  searchParams: Promise<{
    setup_intent?: string
    setup_intent_client_secret?: string
    redirect_status?: string
    token?: string
  }>
}

export default async function UpdatePaymentCallbackPage({
  params,
  searchParams
}: UpdatePaymentCallbackPageProps) {
  // const { subscriptionId } = await params
  const {
    setup_intent: setupIntentId,
    redirect_status: redirectStatus,
    token
  } = await searchParams

  let success = false
  let error: string | null = null

  if (!setupIntentId || !token) {
    error = 'Missing required parameters'
  } else if (redirectStatus !== 'succeeded') {
    error = 'Payment method setup was not successful'
  } else {
    try {
      // await updateSubscriptionPaymentMethod.execute({
      //   subscriptionId,
      //   token,
      //   setupIntentId
      // })
      success = true
    } catch (err) {
      error =
        err instanceof Error ? err.message : 'Failed to update payment method'
    }
  }

  return (
    <div className='h-screen w-screen pt-17'>
      <div className='fixed inset-x-0 top-0 grid w-full grid-cols-[1fr_auto_1fr] p-4'>
        <ThemeSelect className='col-start-3 justify-self-end' />
      </div>

      <div className='flex h-[calc(100vh-theme(spacing.16)-theme(spacing.1))] w-full items-center justify-center p-6'>
        <Card className='w-full md:max-w-md'>
          <CardHeader className='text-center'>
            {success ? (
              <>
                <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900'>
                  <CheckCircle2 className='h-10 w-10 text-green-600 dark:text-green-400' />
                </div>
                <CardTitle>Payment Method Updated</CardTitle>
                <CardDescription>
                  Your subscription payment method has been successfully updated
                </CardDescription>
              </>
            ) : (
              <>
                <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900'>
                  <XCircle className='h-10 w-10 text-red-600 dark:text-red-400' />
                </div>
                <CardTitle>Update Failed</CardTitle>
                <CardDescription>
                  {error ||
                    'An error occurred while updating your payment method'}
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent>
            {success ? (
              <p className='text-muted-foreground text-center text-sm'>
                Future subscription payments will use the new payment method you
                just added.
              </p>
            ) : (
              <p className='text-muted-foreground text-center text-sm'>
                Please contact your sales representative for assistance or try
                again with a new update link.
              </p>
            )}
          </CardContent>

          <CardFooter className='flex justify-center'>
            <form
            // action={() => {}}
            // method='get'
            >
              <Button
                type='button'
                //  onClick={() => window.close()}
              >
                Close Window
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
