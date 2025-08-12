'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { RiArrowLeftLine } from '@remixicon/react';

interface SiteHeaderProps {
  title?: string;
  actions?: React.ReactNode;
}

export function SiteHeader({ title, actions }: SiteHeaderProps) {
  const pathname = usePathname();

  // Generate page title based on pathname if not provided
  const getPageTitle = () => {
    if (title) return title;

    if (pathname === '/admin') return 'Dashboard';
    if (pathname === '/admin/quotes') return 'Quotes';
    if (pathname === '/admin/create') return 'Create Quote';

    // Extract page name from pathname
    const segments = pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    return lastSegment ? lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1) : 'Dashboard';
  };

  // Generate default actions based on pathname
  const getDefaultActions = () => {
    if (actions) return actions;

    if (pathname === '/admin/create') {
      return (
        <Button variant="outline" asChild size="sm">
          <Link href="/admin/quotes">
            <RiArrowLeftLine className="h-4 w-4 mr-2" />
            Back to Quotes
          </Link>
        </Button>
      );
    }

    return null;
  };

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium">{getPageTitle()}</h1>
        <div className="ml-auto flex items-center gap-2">{getDefaultActions()}</div>
      </div>
    </header>
  );
}
