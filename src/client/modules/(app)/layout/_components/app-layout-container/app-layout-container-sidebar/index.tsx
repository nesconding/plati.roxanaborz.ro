import {
  Sidebar,
  SidebarRail,
  SidebarSeparator
} from '~/client/components/ui/sidebar'
import { AppLayoutContainerSidebarContent } from '~/client/modules/(app)/layout/_components/app-layout-container/app-layout-container-sidebar/app-layout-container-sidebar-content'
import { AppLayoutContainerSidebarFooter } from '~/client/modules/(app)/layout/_components/app-layout-container/app-layout-container-sidebar/app-layout-container-sidebar-footer'
import { AppLayoutContainerSidebarHeader } from '~/client/modules/(app)/layout/_components/app-layout-container/app-layout-container-sidebar/app-layout-container-sidebar-header'

export function AppLayoutContainerSidebar() {
  return (
    <Sidebar collapsible='icon'>
      <SidebarRail />
      <AppLayoutContainerSidebarHeader />
      <AppLayoutContainerSidebarContent />
      <SidebarSeparator className='mx-0' />
      <AppLayoutContainerSidebarFooter />
    </Sidebar>
  )
}
