"use client"

import * as React from "react"
import Image from "next/image"
import {
  IconDashboard,
  IconFileText,
  IconBuildingWarehouse,
  IconSettings,
  IconHelp,
  IconHome,
  IconPhone,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import DarkToggle from "@/components/dark-toggle"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Admin User",
    email: "admin@arkdumpster.com",
    avatar: "", // No avatar, will use fallback
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: IconDashboard,
    },
    {
      title: "Quotes",
      url: "/admin/quotes",
      icon: IconFileText,
    },
  ],
  navSecondary: [
    {
      title: "View Website",
      url: "/",
      icon: IconHome,
    },
    {
      title: "Contact Form",
      url: "/contact",
      icon: IconPhone,
    },
    {
      title: "Support",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
  ],
}

export function AdminAppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/admin" className="flex items-center space-x-2">
                <Image
                  src="/ark-logo.svg"
                  alt="Ark Dumpster Logo"
                  className="object-contain"
                  width={24}
                  height={24}
                />
                <span className="text-base font-semibold">ARK Dumpster</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between p-2">
          <NavUser user={data.user} />
          <div className="opacity-80 hover:opacity-100 transition-opacity">
            <DarkToggle />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
