
'use client';

import { useEffect, useState, useMemo } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { BookOpen, ShieldAlert, CalendarDays, Tag, ArrowRight, Layers } from 'lucide-react';
import { mockScheduledCourses, mockCourses, mockSemesters } from '@/lib/data';
import type { ScheduledCourse, Course, Semester, UserProfile } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface TeacherCourseSection extends ScheduledCourse {
  courseDetails?: Course;
  semesterDetails?: Semester;
}

interface GroupedTeacherCourse {
  course: Course;
  sections: TeacherCourseSection[];
}

export default function TeacherMyCoursesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [groupedTeacherCourses, setGroupedTeacherCourses] = useState<GroupedTeacherCourse[]>([]);

  useEffect(() => {
    if (user && user.role !== 'Teacher') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (user && user.role === 'Teacher') {
      const currentUser = user as UserProfile; 
      const scheduled = mockScheduledCourses
        .filter(sc => sc.teacher_id === currentUser.user_id) 
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
      
      const grouped: Record<number, { course: Course; sections: TeacherCourseSection[] }> = {};
      scheduled.forEach(sc => {
        if (sc.courseDetails) {
          if (!grouped[sc.courseDetails.course_id]) {
            grouped[sc.courseDetails.course_id] = {
              course: sc.courseDetails,
              sections: [],
            };
          }
          grouped[sc.courseDetails.course_id].sections.push(sc);
        }
      });
      setGroupedTeacherCourses(Object.values(grouped));
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
        title="My Courses & Sections" 
        description="View and manage the course sections you are teaching."
        icon={BookOpen}
      />
      {groupedTeacherCourses.length > 0 ? (
        <Accordion type="multiple" className="w-full space-y-4">
          {groupedTeacherCourses.map((group) => (
            <AccordionItem key={group.course.course_id} value={`course-${group.course.course_id}`} className="border bg-card rounded-lg shadow-sm">
              <AccordionTrigger className="p-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <Layers className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="text-lg font-headline text-left">{group.course.title}</h3>
                    <p className="text-sm text-muted-foreground text-left">{group.course.course_code} - {group.sections.length} section(s)</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-0">
                <div className="divide-y border-t">
                  {group.sections.map((tc) => (
                    <div key={tc.scheduled_course_id} className="p-4">
                      <CardHeader className="p-0 pb-3">
                        <CardTitle className="text-md font-semibold">Section: {tc.section_number}</CardTitle>
                        <CardDescription>{tc.semesterDetails?.name || 'N/A Semester'}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-0 pb-3 space-y-1">
                        {tc.days_of_week && tc.start_time && tc.end_time && (
                          <p className="text-xs text-muted-foreground">
                            Schedule: {tc.days_of_week}, {tc.start_time.substring(0,5)} - {tc.end_time.substring(0,5)}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Enrollment: {tc.current_enrollment} / {tc.max_capacity}
                        </p>
                      </CardContent>
                      <CardFooter className="p-0">
                        <Button variant="outline" size="sm" className="w-full whitespace-normal h-auto py-1.5" asChild>
                          <Link href={`/teacher/my-courses/${tc.scheduled_course_id}`}>
                            Manage Section <ArrowRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </CardFooter>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
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
