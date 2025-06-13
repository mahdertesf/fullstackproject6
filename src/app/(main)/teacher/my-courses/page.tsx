
'use client';

import { useEffect, useState, useMemo } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { BookOpen, ShieldAlert, CalendarDays, Tag } from 'lucide-react';
import { mockScheduledCourses, mockCourses, mockSemesters } from '@/lib/data';
import type { ScheduledCourse, Course, Semester, UserProfile } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface TeacherCourse extends ScheduledCourse {
  courseDetails?: Course;
  semesterDetails?: Semester;
}

export default function TeacherMyCoursesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [teacherCourses, setTeacherCourses] = useState<TeacherCourse[]>([]);

  useEffect(() => {
    if (user && user.role !== 'Teacher') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (user && user.role === 'Teacher') {
      const currentUser = user as UserProfile; // Cast to ensure teacher_id is expected
      const scheduled = mockScheduledCourses
        .filter(sc => sc.teacher_id === currentUser.user_id) // Assuming user_id maps to teacher_id for mock
        .map(sc => {
          const courseDetails = mockCourses.find(c => c.course_id === sc.course_id);
          const semesterDetails = mockSemesters.find(s => s.semester_id === sc.semester_id);
          return {
            ...sc,
            courseDetails,
            semesterDetails,
          };
        })
        .sort((a,b) => (b.semesterDetails?.start_date || '').localeCompare(a.semesterDetails?.start_date || '') || (a.courseDetails?.title || '').localeCompare(b.courseDetails?.title || ''));
      setTeacherCourses(scheduled);
    }
  }, [user]);

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
        title="My Courses" 
        description="View the courses you are teaching or have taught."
        icon={BookOpen}
      />
      {teacherCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teacherCourses.map((tc) => (
            <Card key={tc.scheduled_course_id} className="flex flex-col hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-xl font-headline">{tc.courseDetails?.title || 'Unknown Course'}</CardTitle>
                <CardDescription className="font-mono text-sm text-muted-foreground">{tc.courseDetails?.course_code || 'N/A'}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <CalendarDays className="mr-2 h-4 w-4 text-primary" />
                  <span>{tc.semesterDetails?.name || 'N/A Semester'}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Tag className="mr-2 h-4 w-4 text-primary" />
                  <span>Section: {tc.section_number}</span>
                </div>
                {tc.days_of_week && tc.start_time && tc.end_time && (
                  <p className="text-sm text-muted-foreground">
                    Schedule: {tc.days_of_week}, {tc.start_time.substring(0,5)} - {tc.end_time.substring(0,5)}
                  </p>
                )}
                 <p className="text-sm text-muted-foreground">
                    Enrollment: {tc.current_enrollment} / {tc.max_capacity}
                  </p>
              </CardContent>
              {/* Future: Link to course management page for this specific instance */}
              {/* <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/teacher/my-courses/${tc.scheduled_course_id}`}>Manage Course</Link>
                </Button>
              </CardFooter> */}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">You are not currently assigned to any courses or no courses match the records.</p>
            <p className="text-sm text-muted-foreground mt-2">If you believe this is an error, please contact the administration.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
