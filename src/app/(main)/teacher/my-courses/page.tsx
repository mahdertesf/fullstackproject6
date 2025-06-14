// src/app/(main)/teacher/my-courses/page.tsx
'use client';

import { useEffect, useState, startTransition } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { BookOpen, ShieldAlert, Layers, ArrowRight, Loader2 } from 'lucide-react';
import type { ScheduledCourse as PrismaScheduledCourse, Course as PrismaCourse, Semester as PrismaSemester, UserProfile } from '@prisma/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getScheduledCoursesByTeacher } from '@/actions/scheduledCourseActions'; // Server action

type TeacherCourseSection = PrismaScheduledCourse & {
  course: PrismaCourse | null;
  semester: PrismaSemester | null;
};

interface GroupedTeacherCourse {
  course: PrismaCourse;
  sections: TeacherCourseSection[];
}

export default function TeacherMyCoursesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [groupedTeacherCourses, setGroupedTeacherCourses] = useState<GroupedTeacherCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'Teacher') {
      router.replace('/dashboard');
    } else if (user?.role === 'Teacher') {
      const fetchCourses = async () => {
        setIsLoading(true);
        try {
          const scheduledCourses = await getScheduledCoursesByTeacher(user.user_id);
          
          const grouped: Record<number, { course: PrismaCourse; sections: TeacherCourseSection[] }> = {};
          scheduledCourses.forEach(sc => {
            if (sc.course) {
              if (!grouped[sc.course.course_id]) {
                grouped[sc.course.course_id] = {
                  course: sc.course,
                  sections: [],
                };
              }
              grouped[sc.course.course_id].sections.push(sc as TeacherCourseSection);
            }
          });
          setGroupedTeacherCourses(Object.values(grouped).sort((a,b) => a.course.title.localeCompare(b.course.title)));
        } catch (error) {
          console.error("Failed to load teacher's courses:", error);
        } finally {
          setIsLoading(false);
        }
      };
      startTransition(() => { fetchCourses(); });
    }
  }, [user, router]);

  if (!user || user.role !== 'Teacher') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" /><h2 className="text-2xl font-bold mb-2">Access Denied</h2>
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-8 w-8 animate-spin"/><span className="ml-2">Loading your courses...</span></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Courses & Sections" description="View and manage the course sections you are teaching." icon={BookOpen}/>
      {groupedTeacherCourses.length > 0 ? (
        <Accordion type="multiple" className="w-full space-y-4" defaultValue={groupedTeacherCourses.map(g => `course-${g.course.course_id}`)}>
          {groupedTeacherCourses.map((group) => (
            <AccordionItem key={group.course.course_id} value={`course-${group.course.course_id}`} className="border bg-card rounded-lg shadow-sm">
              <AccordionTrigger className="p-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <Layers className="h-6 w-6 text-primary" />
                  <div><h3 className="text-lg font-headline text-left">{group.course.title}</h3><p className="text-sm text-muted-foreground text-left">{group.course.course_code} - {group.sections.length} section(s)</p></div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-0">
                <div className="divide-y border-t">
                  {group.sections.map((tc) => (
                    <div key={tc.scheduled_course_id} className="p-4">
                      <CardHeader className="p-0 pb-3"><CardTitle className="text-md font-semibold">Section: {tc.section_number}</CardTitle><CardDescription>{tc.semester?.name || 'N/A Semester'}</CardDescription></CardHeader>
                      <CardContent className="p-0 pb-3 space-y-1">
                        {tc.days_of_week && tc.start_time && tc.end_time && (<p className="text-xs text-muted-foreground">Schedule: {tc.days_of_week}, {format(new Date(tc.start_time), 'HH:mm')} - {format(new Date(tc.end_time), 'HH:mm')}</p>)}
                        <p className="text-xs text-muted-foreground">Enrollment: {tc.current_enrollment} / {tc.max_capacity}</p>
                      </CardContent>
                      <CardFooter className="p-0"><Button variant="outline" size="sm" className="w-full whitespace-normal h-auto py-1.5" asChild><Link href={`/teacher/my-courses/${tc.scheduled_course_id}`}>Manage Section <ArrowRight className="ml-1 h-3 w-3" /></Link></Button></CardFooter>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (<Card><CardContent className="py-10 text-center"><BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" /><p className="text-lg text-muted-foreground">No courses assigned.</p></CardContent></Card>)}
    </div>
  );
}
