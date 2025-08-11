import AdminDashboard from './admin-dashboard';
import AuthGuard from '@/components/auth-guard';

// Force dynamic rendering to prevent prerender errors
export const dynamic = 'force-dynamic';

export default function AdminPage() {
  return (
    <AuthGuard>
      <AdminDashboard />
    </AuthGuard>
  );
}
