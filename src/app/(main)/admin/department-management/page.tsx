
'use client';

import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Building, ShieldAlert } from 'lucide-react';

export default function DepartmentManagementPage() {
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
        title="Department Management" 
        description="Create, edit, and manage academic departments (Admin)."
        icon={Building}
      />
      <Card>
        <CardHeader>
          <CardTitle>Manage Departments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Department management interface will be implemented here. Admins can add new departments, update existing ones, and assign heads of department.</p>
        </CardContent>
      </Card>
    </div>
  );
}
