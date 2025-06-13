
'use client';

import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Users, ShieldAlert } from 'lucide-react';

export default function FullUserManagementPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user && !user.isSuperAdmin) {
      router.replace('/dashboard'); 
    }
  }, [user, router]);

  if (!user || !user.isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Full User Management" 
        description="Manage all user accounts across the system (Admin)."
        icon={Users}
      />
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Full user management interface will be implemented here. This includes staff, teachers, and students with advanced administrative actions.</p>
        </CardContent>
      </Card>
    </div>
  );
}
