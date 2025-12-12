'use client'

import { useQuery } from '@tanstack/react-query'
import { ChevronUp, Command } from 'lucide-react'
import Link from 'next/link'
import { useSelectedLayoutSegments } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Fragment } from 'react'

import { Logo } from '~/client/components/logo'
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '~/client/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/client/components/ui/dropdown-menu'
import { Kbd, KbdGroup } from '~/client/components/ui/kbd'
import { Separator } from '~/client/components/ui/separator'
import { SidebarTrigger, useSidebar } from '~/client/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '~/client/components/ui/tooltip'
import { useIsMac } from '~/client/hooks/use-is-mac'
import { cn } from '~/client/lib/utils'
import { useTRPC } from '~/client/trpc/react'

type BreadcrumbItemConfig = {
  route: string

  segment: string
  label: string
}

type DynamicSegmentConfig = {
  resolver: (segment: string) => string | undefined
  translationKey: string
}

type BreadcrumbConfig = {
  dynamicResolvers?: Record<string, DynamicSegmentConfig>
}

export function AppLayoutContainerHeader() {
  const t = useTranslations()
  const selectedLayoutSegments = useSelectedLayoutSegments()

  const { state, isMobile } = useSidebar()
  const isMac = useIsMac()
  const trpc = useTRPC()
  const findAllProducts = useQuery(
    trpc.protected.products.findAll.queryOptions()
  )

  function generateBreadcrumbs(
    segments: string[],
    config?: BreadcrumbConfig
  ): BreadcrumbItemConfig[] {
    const baseTranslationPath =
      'modules.(app).layout.container.sidebar.content.navigation'
    const isLayoutGroup = (s: string) => s.startsWith('(') && s.endsWith(')')

    // Find which pattern matches and return dynamic segment info
    const findDynamicSegment = () => {
      if (!config?.dynamicResolvers) return null

      for (const [pattern, dynamicConfig] of Object.entries(
        config.dynamicResolvers
      )) {
        const patternParts = pattern.split('/')

        // Pattern must be <= segments length (prefix match)
        if (patternParts.length > segments.length) continue

        let dynamicIndex = -1
        let matches = true

        for (let i = 0; i < patternParts.length; i++) {
          const patternPart = patternParts[i]
          const segment = segments[i]

          if (patternPart.startsWith('[') && patternPart.endsWith(']')) {
            dynamicIndex = i
            continue
          }

          if (patternPart !== segment) {
            matches = false
            break
          }
        }

        if (matches && dynamicIndex >= 0) {
          // TEST if the resolver actually resolves this segment
          const testResolve = dynamicConfig.resolver(segments[dynamicIndex])
          if (testResolve) {
            return { config: dynamicConfig, index: dynamicIndex }
          }
        }
      }

      return null
    }

    const dynamicSegmentInfo = findDynamicSegment()

    return segments
      .map((segment, index) => {
        if (isLayoutGroup(segment)) return null

        const routeSegments = segments
          .slice(0, index + 1)
          .filter((s) => !isLayoutGroup(s))
        const route = '/' + routeSegments.join('/')

        // If this is the dynamic segment, use the resolver
        if (dynamicSegmentInfo && index === dynamicSegmentInfo.index) {
          const label = dynamicSegmentInfo.config.resolver(segment)
          return { label: label || segment, route, segment }
        }

        // Build translation path, replacing dynamic segment with placeholder
        const translationSegments = segments.slice(0, index + 1).map((s, i) => {
          if (dynamicSegmentInfo && i === dynamicSegmentInfo.index) {
            return dynamicSegmentInfo.config.translationKey
          }
          return s
        })

        const translationPath = translationSegments.join('.routes.')
        const translationKey = `${baseTranslationPath}.${translationPath}.title`
        const label = t(translationKey)

        return { label, route, segment }
      })
      .filter((item): item is BreadcrumbItemConfig => item !== null)
  }

  const breadcrumbs = generateBreadcrumbs(selectedLayoutSegments, {
    dynamicResolvers: {
      '(admin)/products/[productId]': {
        resolver: (productId) => {
          // Return undefined for static routes
          if (productId === 'create') return undefined
          return findAllProducts.data?.find((p) => p.id === productId)?.name
        },
        translationKey: '[productId]'
      }
    }
  })

  return (
    <header
      className={cn(
        'bg-background fixed top-0 z-50 h-(--header-height) items-center gap-2 border-b transition-[width] ease-linear max-md:grid max-md:grid-cols-[1fr_auto_1fr] md:flex md:shrink-0',
        {
          'w-[calc(100%-var(--sidebar-width-icon))]':
            state === 'collapsed' && !isMobile,
          'w-[calc(100%-var(--sidebar-width))]':
            state === 'expanded' && !isMobile,
          'w-full': isMobile
        }
      )}
    >
      <div className='flex w-full items-center gap-1 px-4'>
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarTrigger className='-ml-1' />
          </TooltipTrigger>
          <TooltipContent>
            {isMac ? (
              <div className='flex flex-col items-center gap-1'>
                <KbdGroup>
                  <Kbd>
                    <Command />
                  </Kbd>

                  <span>{'+'}</span>
                  <Kbd>{'B'}</Kbd>
                </KbdGroup>

                <KbdGroup>
                  <Kbd>
                    <ChevronUp />
                  </Kbd>
                  <span>{'+'}</span>
                  <Kbd>{'B'}</Kbd>
                </KbdGroup>
              </div>
            ) : (
              <KbdGroup>
                <Kbd>{'Ctrl'}</Kbd>
                <span>{'+'}</span>
                <Kbd>{'B'}</Kbd>
              </KbdGroup>
            )}
          </TooltipContent>
        </Tooltip>
        <Separator
          className='mx-2 data-[orientation=vertical]:h-4'
          orientation='vertical'
        />

        <Breadcrumb className='max-md:hidden'>
          <BreadcrumbList>
            {breadcrumbs.length > 0 ? (
              <Fragment>
                <BreadcrumbItem>
                  <BreadcrumbLink href='/'>
                    {t(
                      'modules.(app).layout.container.sidebar.content.navigation.home.title'
                    )}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </Fragment>
            ) : (
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {t(
                    'modules.(app).layout.container.sidebar.content.navigation.home.title'
                  )}
                </BreadcrumbPage>
              </BreadcrumbItem>
            )}

            {breadcrumbs.length > 2 ? (
              <Fragment>
                <BreadcrumbItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger className='flex items-center gap-1'>
                      <BreadcrumbEllipsis />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='start'>
                      {breadcrumbs.slice(0, -1).map((breadcrumb) => (
                        <DropdownMenuItem asChild key={breadcrumb.route}>
                          <Link href={breadcrumb.route}>
                            {breadcrumb.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {breadcrumbs[breadcrumbs.length - 1].label}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </Fragment>
            ) : (
              breadcrumbs.map((breadcrumb, index) =>
                index === breadcrumbs.length - 1 ? (
                  <BreadcrumbItem key={breadcrumb.route}>
                    <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                  </BreadcrumbItem>
                ) : (
                  <Fragment key={breadcrumb.route}>
                    <BreadcrumbItem>
                      <BreadcrumbLink href={breadcrumb.route}>
                        {breadcrumb.label}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                  </Fragment>
                )
              )
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <Link className='md:hidden' href='/' passHref>
        <Logo className='h-7' />
      </Link>
    </header>
  )
}
