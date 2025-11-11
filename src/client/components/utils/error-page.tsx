'use client'

import { AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { FallbackProps } from 'react-error-boundary'

import { Button } from '~/client/components/ui/button'
import { cn } from '~/client/lib/utils'

interface ErrorPageProps extends FallbackProps {
  className?: string
}

export function ErrorPage({
  error,
  resetErrorBoundary,
  className
}: ErrorPageProps) {
  const t = useTranslations()

  const handleOnClick = () => {
    resetErrorBoundary()
  }

  return (
    <div
      className={cn(
        'flex h-svh w-full flex-col items-center justify-center gap-4',
        className
      )}
    >
      <AlertCircle className='text-destructive size-12' />

      <div className='flex flex-col items-center justify-center gap-2'>
        <p className='text-destructive text-center text-xl font-semibold'>
          {t('components.utils.error-page.title')}
        </p>
        <p className='text-center'>
          {t('components.utils.error-page.description')}
        </p>
        <p className='text-muted-foreground text-center text-sm'>
          {error.message}
        </p>
      </div>

      <Link href='/' passHref>
        <Button onClick={handleOnClick}>
          {t('components.utils.error-page.button')}
        </Button>
      </Link>
    </div>
  )
}
