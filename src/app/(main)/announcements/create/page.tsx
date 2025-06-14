// src/app/(main)/announcements/create/page.tsx
'use client';

import PageHeader from '@/components/shared/PageHeader';
import AnnouncementGeneratorForm from '@/components/announcements/AnnouncementGeneratorForm';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Speaker, ShieldAlert } from 'lucide-react';
import type { UserRole } from '@prisma/client'; // Use Prisma UserRole

export default function CreateAnnouncementPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== 'Staff' && !user.is_super_admin) { // Staff and Super Admins
      router.replace('/dashboard'); 
    }
  }, [user, router]);

  if (!user || (user.role !== 'Staff' && !user.is_super_admin)) {
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
        title="Create New Announcement" 
        description="Use the AI-powered generator or write your own announcement."
        icon={Speaker}
      />
      {/* Pass user role and potentially author_id for the form to use in server action */}
      <AnnouncementGeneratorForm 
        userRole={user.role as UserRole} 
        authorId={user.user_id}
      />
    </div>
  );
}
