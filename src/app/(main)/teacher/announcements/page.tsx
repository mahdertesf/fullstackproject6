
'use client';

import PageHeader from '@/components/shared/PageHeader';
import AnnouncementGeneratorForm from '@/components/announcements/AnnouncementGeneratorForm';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Speaker, ShieldAlert, Loader2 } from 'lucide-react';
import type { TeacherSectionInfo, UserProfile } from '@/types';
import { mockScheduledCourses, mockCourses, mockSemesters } from '@/lib/data';

export default function TeacherPostAnnouncementPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [teacherSections, setTeacherSections] = useState<TeacherSectionInfo[]>([]);
  const [isLoadingSections, setIsLoadingSections] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'Teacher') {
      router.replace('/dashboard');
    } else if (user && user.role === 'Teacher') {
      const currentUser = user as UserProfile;
      const sections = mockScheduledCourses
        .filter(sc => sc.teacher_id === currentUser.user_id)
        .map(sc => {
          const course = mockCourses.find(c => c.course_id === sc.course_id);
          const semester = mockSemesters.find(s => s.semester_id === sc.semester_id);
          return {
            id: String(sc.scheduled_course_id),
            name: `${course?.course_code || 'N/A'} - ${sc.section_number} (${semester?.name || 'N/A Semester'})`,
          };
        });
      setTeacherSections(sections);
      setIsLoadingSections(false);
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

  if (isLoadingSections) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <Loader2 className="w-16 h-16 animate-spin text-primary mb-4" />
        <h2 className="text-2xl font-bold mb-2">Loading your sections...</h2>
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
      <AnnouncementGeneratorForm userRole="Teacher" availableSections={teacherSections} />
    </div>
  );
}
