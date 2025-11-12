'use client'

import { useQuery } from '@tanstack/react-query'
import {
  CalendarSync,
  ClipboardList,
  Cog,
  IdCardLanyard,
  Link2,
  Package,
  Plus,
  SquareUserRound
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar
} from '~/client/components/ui/sidebar'
import { cn } from '~/client/lib/utils'
import { useTRPC } from '~/client/trpc/react'
import { UserRoles } from '~/shared/enums/user-roles'

export function AppLayoutContainerSidebarContent() {
  const trpc = useTRPC()
  const getSession = useQuery(
    trpc.public.authentication.getSession.queryOptions()
  )
  const pathname = usePathname()
  const sidebar = useSidebar()
  const t = useTranslations(
    'modules.(app).layout.container.sidebar.content.navigation'
  )

  const isAdmin =
    getSession.data?.user.role === UserRoles.ADMIN ||
    getSession.data?.user.role === UserRoles.SUPER_ADMIN

  const handleClose = () => {
    if (sidebar.isMobile && sidebar.openMobile) {
      sidebar.setOpenMobile(false)
      return
    }
  }

  return (
    <SidebarContent>
      <SidebarGroupContent>
        <SidebarMenu>
          {isAdmin && (
            <>
              <SidebarGroup>
                <SidebarGroupLabel>{t('(admin).title')}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === '/users'}
                        onClick={handleClose}
                        tooltip={t('(admin).routes.users.title')}
                      >
                        <Link href='/users' passHref>
                          <SquareUserRound />
                          <span>{t('(admin).routes.users.title')}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === '/products'}
                        onClick={handleClose}
                        tooltip={t('(admin).routes.products.title')}
                      >
                        <Link href='/products' passHref>
                          <Package />
                          <span>{t('(admin).routes.products.title')}</span>
                        </Link>
                      </SidebarMenuButton>

                      <SidebarMenuAction asChild onClick={handleClose}>
                        <Link href='/products/create' passHref>
                          <Plus />
                        </Link>
                      </SidebarMenuAction>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        className='select-none'
                        isActive={pathname === '/settings'}
                        onClick={handleClose}
                        tooltip={t('(admin).routes.settings.title')}
                      >
                        <Link href='/settings' passHref>
                          <Cog className='pointer-events-none' />
                          <span className='pointer-events-none'>
                            {t('(admin).routes.settings.title')}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarSeparator className='mx-0' />
            </>
          )}

          <SidebarGroup>
            <SidebarGroupLabel
              className={cn({
                'select-none pointer-events-none': sidebar.state === 'collapsed'
              })}
            >
              {t('payment-links.groupTitle')}
            </SidebarGroupLabel>

            <SidebarGroupAction
              onClick={handleClose}
              title={t('payment-links.routes.create.title')}
            >
              <Link href='/payment-links/create' passHref>
                <Plus className='size-4' />
                <span className='sr-only'>
                  {t('payment-links.routes.create.title')}
                </span>
              </Link>
            </SidebarGroupAction>

            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/payment-links/create'}
                    onClick={handleClose}
                    tooltip={t('payment-links.routes.create.title')}
                  >
                    <Link href='/payment-links/create' passHref>
                      <Plus />
                      <span>{t('payment-links.routes.create.title')}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/payment-links'}
                    onClick={handleClose}
                    tooltip={t('payment-links.title')}
                  >
                    <Link href='/payment-links' passHref>
                      <Link2 />
                      <span>{t('payment-links.title')}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className='mx-0' />

          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/orders'}
                    onClick={handleClose}
                    tooltip={t('orders.title')}
                  >
                    <Link href='/orders' passHref>
                      <ClipboardList />
                      <span>{t('orders.title')}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/subscriptions'}
                    onClick={handleClose}
                    tooltip={t('subscriptions.title')}
                  >
                    <Link href='/subscriptions' passHref>
                      <CalendarSync />
                      <span>{t('subscriptions.title')}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/memberships'}
                    onClick={handleClose}
                    tooltip={t('memberships.title')}
                  >
                    <Link href='/memberships' passHref>
                      <IdCardLanyard />
                      <span>{t('memberships.title')}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarContent>
  )
}
