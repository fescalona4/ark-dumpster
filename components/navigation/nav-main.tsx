'use client';

import { type Icon } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
  }[];
}) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2 pt-4">
        <SidebarMenu>
          {items.map(item => {
            const isActive =
              pathname === item.url ||
              (item.url !== '/admin' && pathname.startsWith(item.url + '/'));
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title} isActive={isActive} size="lg">
                  <Link
                    href={item.url}
                    className="flex items-center gap-3 text-xl "
                    onClick={handleLinkClick}
                  >
                    {item.icon && <item.icon className="!w-6 !h-6" strokeWidth={1} />}
                    <span className="text-lg">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
