'use client'

import { SearchX } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

import { cn } from '~/client/lib/utils'

import { Button } from '../ui/button'

interface NotFoundPageProps {
  className?: string
}

export function NotFoundPage({ className }: NotFoundPageProps) {
  const t = useTranslations()
  const pathname = usePathname()

  return (
    <div
      className={cn(
        'flex size-full flex-col items-center justify-center gap-4 group-data-[slot=sidebar-wrapper]/sidebar-wrapper:h-[calc(100vh-var(--header-height))] group-data-[slot=sidebar-wrapper]/sidebar-wrapper:w-full',
        className
      )}
    >
      <SearchX className='text-muted-foreground size-12' />

      <div className='text-muted-foreground flex flex-col items-center justify-center gap-2 text-center'>
        <p className='text-xl font-semibold'>
          {t('components.utils.not-found-page.title')}
        </p>
        <p>
          {t.rich('components.utils.not-found-page.description', {
            component: (chunks) => (
              <code className='bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold'>
                {chunks}
              </code>
            ),
            pathname
          })}
        </p>
      </div>

      <Link href='/' passHref replace>
        <Button>{t('components.utils.not-found-page.button')}</Button>
      </Link>
    </div>
  )
}
