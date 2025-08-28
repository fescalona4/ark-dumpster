'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import {
  IconDashboard,
  IconFileText,
  IconSettings,
  IconHome,
  IconPlus,
  IconTruck,
  IconChartBar,
  IconReceipt,
  IconTrash,
  IconTools,
} from '@tabler/icons-react';

import { NavMain } from '@/components/navigation/nav-main';
import { NavSecondary } from '@/components/navigation/nav-secondary';
import { NavUser } from '@/components/navigation/nav-user';
import DarkToggle from '@/components/shared/dark-toggle';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const navData = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/admin',
      icon: IconDashboard,
    },
    {
      title: 'Quotes',
      url: '/admin/quotes',
      icon: IconFileText,
    },
    {
      title: 'Orders',
      url: '/admin/orders',
      icon: IconTruck,
    },
    {
      title: 'Dumpsters',
      url: '/admin/dumpsters',
      icon: IconTrash,
    },
    {
      title: 'Services',
      url: '/admin/services',
      icon: IconTools,
    },
    {
      title: 'Analytics',
      url: '/admin/analytics',
      icon: IconChartBar,
    },
    {
      title: 'Create Quote',
      url: '/admin/create',
      icon: IconPlus,
    },
  ],
  navSecondary: [
    {
      title: 'View Website',
      url: '/',
      icon: IconHome,
    },
    {
      title: 'Settings',
      url: '#',
      icon: IconSettings,
    },
  ],
};

export function AdminAppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const userData = {
    name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin User',
    email: user?.email || 'admin@arkdumpster.com',
    avatar: user?.user_metadata?.avatar_url || '',
  };
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
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
        <NavMain items={navData.navMain} />
        <NavSecondary items={navData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between p-2">
          <NavUser user={userData} />
          <div className="opacity-80 hover:opacity-100 transition-opacity">
            <DarkToggle />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
