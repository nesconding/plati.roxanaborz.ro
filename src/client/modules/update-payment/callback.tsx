'use client'

import { CheckCircle2, XCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '~/client/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '~/client/components/ui/card'

interface UpdatePaymentCallbackModuleProps {
  success: boolean
  error: string | null
}

export function UpdatePaymentCallbackModule({
  success,
  error
}: UpdatePaymentCallbackModuleProps) {
  const t = useTranslations('modules.update-payment.callback')

  return (
    <Card className='w-full md:max-w-md'>
      <CardHeader className='text-center'>
        {success ? (
          <>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900'>
              <CheckCircle2 className='h-10 w-10 text-green-600 dark:text-green-400' />
            </div>
            <CardTitle>{t('success.title')}</CardTitle>
            <CardDescription>{t('success.description')}</CardDescription>
          </>
        ) : (
          <>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900'>
              <XCircle className='h-10 w-10 text-red-600 dark:text-red-400' />
            </div>
            <CardTitle>{t('error.title')}</CardTitle>
            <CardDescription>
              {error || t('error.defaultMessage')}
            </CardDescription>
          </>
        )}
      </CardHeader>

      <CardContent>
        {success ? (
          <p className='text-muted-foreground text-center text-sm'>
            {t('content.success')}
          </p>
        ) : (
          <p className='text-muted-foreground text-center text-sm'>
            {t('content.error')}
          </p>
        )}
      </CardContent>

      <CardFooter className='flex justify-center'>
        <Button type='button'>{t('closeWindow')}</Button>
      </CardFooter>
    </Card>
  )
}
