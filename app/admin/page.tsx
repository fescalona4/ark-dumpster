import AdminDashboard from './admin-dashboard';

// Force dynamic rendering to prevent prerender errors
export const dynamic = 'force-dynamic';

export default function AdminPage() {
  return <AdminDashboard />;
}
