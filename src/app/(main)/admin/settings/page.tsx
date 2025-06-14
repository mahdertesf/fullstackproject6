// src/app/(main)/admin/settings/page.tsx
'use client';

import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Settings, ShieldAlert } from 'lucide-react';

export default function AdminSettingsPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user && !user.is_super_admin) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  if (!user || !user.is_super_admin) {
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
        title="Admin Settings" 
        description="Configure system-wide settings and parameters."
        icon={Settings}
      />
      <Card>
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Admin settings and system configuration options will be implemented here.</p>
          {/* Example: Add a form for site name, maintenance mode, etc. */}
        </CardContent>
      </Card>
    </div>
  );
}
