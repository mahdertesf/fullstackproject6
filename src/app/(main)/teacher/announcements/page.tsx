// src/app/(main)/teacher/announcements/page.tsx
'use client';

import PageHeader from '@/components/shared/PageHeader';
import AnnouncementGeneratorForm from '@/components/announcements/AnnouncementGeneratorForm';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState, startTransition } from 'react';
import { Speaker, ShieldAlert, Loader2 } from 'lucide-react';
import type { TeacherSectionInfo } from '@/types';
import { getTeacherSections } from '@/actions/teacherActions'; // Server action

export default function TeacherPostAnnouncementPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [teacherSections, setTeacherSections] = useState<TeacherSectionInfo[]>([]);
  const [isLoadingSections, setIsLoadingSections] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'Teacher') {
      router.replace('/dashboard');
    } else if (user?.role === 'Teacher') {
      const fetchSections = async () => {
        setIsLoadingSections(true);
        try {
          const sections = await getTeacherSections(user.user_id);
          setTeacherSections(sections);
        } catch (error) {
          console.error("Failed to load teacher sections:", error);
        } finally {
          setIsLoadingSections(false);
        }
      };
      startTransition(() => { fetchSections(); });
    }
  }, [user, router]);

  if (!user || user.role !== 'Teacher') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
      </div>
    );
  }

  if (isLoadingSections) {
     return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <span className="ml-2">Loading your sections...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Post New Announcement" 
        description="Share important information with students in your selected sections."
        icon={Speaker}
      />
      <AnnouncementGeneratorForm 
        userRole="Teacher" 
        authorId={user.user_id} 
        availableSections={teacherSections} 
      />
    </div>
  );
}
