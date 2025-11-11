'use client'

import * as React from 'react'

import { Check, Moon, Sun, SunMoon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'

import { Button } from '~/client/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '~/client/components/ui/dropdown-menu'
import { cn } from '~/client/lib/utils'

interface ThemeSelectProps extends React.PropsWithChildren {
  className?: string
}

export function ThemeSelect({ children, className }: ThemeSelectProps) {
  const { setTheme } = useTheme()
  const t = useTranslations()
  const { theme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children ?? (
          <Button variant='outline' size='icon' className={className}>
            <Sun className='h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90' />
            <Moon className='absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0' />
            <span className='sr-only'>{'Toggle theme'}</span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuLabel>
          {t('components.theme-select.title')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun />
          <span className='w-full'>
            {t('components.theme-select.values.light')}
          </span>
          <Check className={cn(theme !== 'light' && 'opacity-0')} />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon />
          <span className='w-full'>
            {t('components.theme-select.values.dark')}
          </span>
          <Check className={cn(theme !== 'dark' && 'opacity-0')} />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <SunMoon />
          <span className='w-full'>
            {t('components.theme-select.values.system')}
          </span>
          <Check className={cn(theme !== 'system' && 'opacity-0')} />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
