import type React from 'react'
import { IconInnerShadowTop } from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { Data } from './const'
import { NavOptions } from './nav-options'
import { NavSecondary } from './nav-secondary'
import { NavUser } from './nav-user'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:p-1.5">
              <Link to="/">
                <IconInnerShadowTop className="size-5" />
                <span className="text-base font-semibold">Resume</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavOptions options={Data.modules} description="模块" />
        <NavSecondary items={Data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
