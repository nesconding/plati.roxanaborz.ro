import { ScrollArea } from '~/client/components/ui/scroll-area'
import { SidebarInset, SidebarProvider } from '~/client/components/ui/sidebar'
import { cn } from '~/client/lib/utils'
import { AppLayoutContainerHeader } from '~/client/modules/(app)/layout/_components/app-layout-container/app-layout-container-header'
import { AppLayoutContainerSidebar } from '~/client/modules/(app)/layout/_components/app-layout-container/app-layout-container-sidebar'

export function AppLayoutContainer({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider
      style={
        {
          '--header-height': 'calc(var(--spacing) * 12)'
        } as React.CSSProperties
      }
    >
      <AppLayoutContainerSidebar />

      <SidebarInset
        className={cn(
          'h-screen w-[calc(100vh-var(--sidebar-width))] pt-(--header-height) transition-[width] peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-icon))]'
        )}
      >
        <AppLayoutContainerHeader />
        <ScrollArea className='h-[calc(100vh-var(--header-height))] overflow-y-hidden'>
          {children}
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  )
}
