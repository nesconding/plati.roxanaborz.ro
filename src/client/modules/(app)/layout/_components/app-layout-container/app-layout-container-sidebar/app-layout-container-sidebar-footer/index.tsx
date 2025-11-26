'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Check,
  ChevronUp,
  LogOut,
  Moon,
  Sun,
  SunMoon,
  UserCircle2,
  UserRoundCog
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { useState } from 'react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '~/client/components/ui/dropdown-menu'
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '~/client/components/ui/sidebar'
import { cn } from '~/client/lib/utils'
import { AccountManagementDialog } from '~/client/modules/(app)/layout/_components/app-layout-container/app-layout-container-sidebar/app-layout-container-sidebar-footer/account-management-dialog'
import { SignOutDialog } from '~/client/modules/(app)/layout/_components/app-layout-container/app-layout-container-sidebar/app-layout-container-sidebar-footer/sign-out-dialog'
import { useTRPC } from '~/client/trpc/react'

export function AppLayoutContainerSidebarFooter() {
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false)
  const [isAccountManagementDialogOpen, setIsAccountManagementDialogOpen] =
    useState(false)
  const trpc = useTRPC()
  const getSession = useQuery(
    trpc.public.authentication.getSession.queryOptions()
  )
  const t = useTranslations()
  const sidebar = useSidebar()
  const { theme, setTheme } = useTheme()

  function handleOnCloseSignOutDialog() {
    setIsSignOutDialogOpen(false)
  }

  function handleOnCloseAccountManagementDialog() {
    setIsAccountManagementDialogOpen(false)
  }

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton>
                <UserCircle2 />
                <span className='line-clamp-1'>
                  {getSession.data?.user.name}
                </span>
                <ChevronUp className='ml-auto' />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align={sidebar.open || sidebar.openMobile ? 'start' : 'end'}
              className={cn({
                'w-(--radix-popper-anchor-width)':
                  sidebar.open || sidebar.openMobile
              })}
              onCloseAutoFocus={(e) => e.preventDefault()}
              side={sidebar.open || sidebar.openMobile ? 'top' : 'right'}
            >
              <DropdownMenuGroup>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className='gap-2'>
                    <Sun
                      className={cn('size-4', {
                        hidden: theme !== 'light'
                      })}
                    />
                    <Moon
                      className={cn('size-4', {
                        hidden: theme !== 'dark'
                      })}
                    />
                    <SunMoon
                      className={cn('size-4', {
                        hidden: theme !== 'system'
                      })}
                    />
                    <span>
                      {t(
                        'modules.(app).layout.container.sidebar.footer.dropdown.theme.title'
                      )}
                    </span>
                  </DropdownMenuSubTrigger>

                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuLabel>
                        {t(
                          'modules.(app).layout.container.sidebar.footer.dropdown.theme.title'
                        )}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => setTheme('light')}>
                        <Sun />
                        <span className='w-full'>
                          {t(
                            'modules.(app).layout.container.sidebar.footer.dropdown.theme.values.light'
                          )}
                        </span>
                        <Check
                          className={cn(theme !== 'light' && 'opacity-0')}
                        />
                      </DropdownMenuItem>

                      <DropdownMenuItem onSelect={() => setTheme('dark')}>
                        <Moon />
                        <span className='w-full'>
                          {t(
                            'modules.(app).layout.container.sidebar.footer.dropdown.theme.values.dark'
                          )}
                        </span>
                        <Check
                          className={cn(theme !== 'dark' && 'opacity-0')}
                        />
                      </DropdownMenuItem>

                      <DropdownMenuItem onSelect={() => setTheme('system')}>
                        <SunMoon />
                        <span className='w-full'>
                          {t(
                            'modules.(app).layout.container.sidebar.footer.dropdown.theme.values.system'
                          )}
                        </span>
                        <Check
                          className={cn(theme !== 'system' && 'opacity-0')}
                        />
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                <DropdownMenuItem
                  onClick={() => setIsAccountManagementDialogOpen(true)}
                >
                  <UserRoundCog />
                  <span className='w-full'>
                    {t(
                      'modules.(app).layout.container.sidebar.footer.dropdown.account-management'
                    )}
                  </span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setIsSignOutDialogOpen(true)}
                  variant='destructive'
                >
                  <LogOut />
                  <span className='w-full'>
                    {t(
                      'modules.(app).layout.container.sidebar.footer.dropdown.sign-out'
                    )}
                  </span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <SignOutDialog
        isOpen={isSignOutDialogOpen}
        onCloseDialog={handleOnCloseSignOutDialog}
      />
      <AccountManagementDialog
        isOpen={isAccountManagementDialogOpen}
        onCloseDialog={handleOnCloseAccountManagementDialog}
        user={getSession.data?.user}
      />
    </SidebarFooter>
  )
}
