'use client'

import { Home } from 'lucide-react'
import Link from 'next/link'

import { Logo } from '~/client/components/logo'
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '~/client/components/ui/sidebar'
import { cn } from '~/client/lib/utils'

export function AppLayoutContainerSidebarHeader() {
  const sidebar = useSidebar()

  const showIcon = sidebar.state === 'collapsed' && !sidebar.isMobile

  return (
    <SidebarHeader className='h-(--header-height) border-b'>
      <SidebarMenu>
        <SidebarMenuItem className='flex justify-center data-[slot=sidebar-menu-button]:!p-1.5'>
          <SidebarMenuButton
            className={cn('w-fit p-0 transition-[width,height] ease-linear', {
              'bg-transparent!': !showIcon
            })}
            asChild
          >
            <Link href='/'>
              <div
                className={cn('transition-[width,height] ease-linear', {
                  'h-6 w-24': !showIcon,
                  'size-4': showIcon
                })}
              >
                <Logo
                  className={cn(
                    'absolute flex h-6 w-24 rotate-0 items-center gap-1 transition-all',
                    {
                      '-translate-x-[calc(var(--sidebar-width)-(var(--sidebar-width)-theme(spacing.24))/2)] scale-0':
                        showIcon
                    }
                  )}
                />

                <Home
                  className={cn(
                    'absolute flex size-4 rotate-0 items-center gap-1 transition-all',
                    {
                      'translate-x-[calc(var(--sidebar-width)-(var(--sidebar-width)-theme(spacing.24))/2)] scale-0':
                        !showIcon
                    }
                  )}
                />
              </div>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  )
}
