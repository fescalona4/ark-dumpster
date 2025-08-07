"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Package, 
  Settings, 
  BarChart3, 
  Home,
  Building2
} from "lucide-react";
import DarkToggle from "@/components/dark-toggle";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

// Menu items for admin navigation
const menuItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: BarChart3,
    description: "Overview and stats"
  },
  {
    title: "Quotes",
    url: "/admin/quotes",
    icon: Package,
    description: "Manage quote requests"
  }
];

const quickActions = [
  {
    title: "View Website",
    url: "/",
    icon: Home,
    description: "Go to main site"
  },
  {
    title: "Contact Form",
    url: "/contact",
    icon: Building2,
    description: "View contact form"
  }
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <Building2 className="h-6 w-6" />
          <div>
            <h2 className="text-lg font-semibold">ARK Dumpster</h2>
            <p className="text-sm text-muted-foreground">Admin Panel</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.url}
                    tooltip={item.description}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {quickActions.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    tooltip={item.description}
                  >
                    <Link href={item.url} target={item.url.startsWith('/') ? undefined : "_blank"}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center justify-between px-4 py-2">
          <div className="text-xs text-muted-foreground">
            <p>© 2025 ARK Dumpster</p>
            <p>Admin Dashboard v1.0</p>
          </div>
          <div className="flex items-center">
            <DarkToggle />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
