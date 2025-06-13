
'use client';

import PageHeader from '@/components/shared/PageHeader';
import AnnouncementGeneratorForm from '@/components/announcements/AnnouncementGeneratorForm';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Speaker, ShieldAlert } from 'lucide-react';

export default function TeacherPostAnnouncementPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== 'Teacher') {
      router.replace('/dashboard'); 
    }
  }, [user, router]);

  if (!user || user.role !== 'Teacher') {
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
        title="Post New Announcement" 
        description="Share important information with your students or colleagues."
        icon={Speaker}
      />
      <AnnouncementGeneratorForm />
    </div>
  );
}
