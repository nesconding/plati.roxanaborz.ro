'use client'

import { useTranslations } from 'next-intl'

import { Spinner } from '~/client/components/ui/spinner'
import { cn } from '~/client/lib/utils'

interface LoadingPageProps {
  className?: string
}

export function LoadingPage({ className }: LoadingPageProps) {
  const t = useTranslations()

  return (
    <div
      className={cn(
        'flex size-full flex-col items-center justify-center gap-4 group-data-[slot=sidebar-wrapper]/sidebar-wrapper:h-[calc(100vh-var(--header-height))] group-data-[slot=sidebar-wrapper]/sidebar-wrapper:w-full',
        className
      )}
    >
      <Spinner className='text-primary size-12 md:size-16' />

      <div className='text-muted-foreground flex flex-col items-center justify-center gap-2 text-center'>
        <p className='text-xl font-semibold'>
          {t('components.utils.loading-page.title')}
        </p>
        <p>{t('components.utils.loading-page.description')}</p>
      </div>
    </div>
  )
}
