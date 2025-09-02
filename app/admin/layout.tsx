import type { Metadata } from 'next';
import { MobileAwareLayout } from '@/components/layout/mobile-aware-layout';
import AdminAuthGuard from '@/components/providers/admin-auth-guard';

export const metadata: Metadata = {
  title: 'Admin Dashboard - ARK Dumpster Rentals',
  description: 'Administrative dashboard for ARK Dumpster Rentals.',
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminAuthGuard>
      <MobileAwareLayout>{children}</MobileAwareLayout>
    </AdminAuthGuard>
  );
}
