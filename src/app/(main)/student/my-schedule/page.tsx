// src/app/(main)/student/my-schedule/page.tsx
'use client';

import { useEffect, useState, startTransition } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import type { UserProfile as AuthUserProfile } from '@/types'; // Auth store type
import type { ScheduledCourse as PrismaScheduledCourse, Course, Semester, User as PrismaUser, Room, Building } from '@prisma/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Clock, MapPin, ShieldAlert, BookOpen, Users, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getStudentRegistrations } from '@/actions/studentActions';
import { format } from 'date-fns';

type EnrichedScheduledCourseForStudent = PrismaScheduledCourse & {
  course: Course | null;
  semester: Semester | null;
  teacher: PrismaUser | null;
  room: (Room & { building: Building | null }) | null;
};

export default function StudentMySchedulePage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [currentSchedule, setCurrentSchedule] = useState<EnrichedScheduledCourseForStudent[]>([]);
  const [currentSemesterName, setCurrentSemesterName] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role === 'Student') {
      const fetchSchedule = async () => {
        setIsLoading(true);
        try {
          // Determine current semester ID based on dates or fetch most recent one
          // For simplicity, this might need adjustment or a dedicated action to get "current semester"
          const allRegistrations = await getStudentRegistrations(user.user_id);
          
          // Filter for "current" semester - very basic logic for now
          const now = new Date();
          const currentSemesterRegistrations = allRegistrations.filter(reg => 
            reg.scheduledCourse?.semester && 
            new Date(reg.scheduledCourse.semester.start_date) <= now &&
            new Date(reg.scheduledCourse.semester.end_date) >= now &&
            reg.status === 'Registered'
          );

          if (currentSemesterRegistrations.length > 0 && currentSemesterRegistrations[0].scheduledCourse?.semester) {
            setCurrentSemesterName(currentSemesterRegistrations[0].scheduledCourse.semester.name);
          } else {
            // Fallback if no current semester found or no registrations
            const latestSemester = allRegistrations.length > 0 ? allRegistrations[0].scheduledCourse?.semester : null;
            setCurrentSemesterName(latestSemester?.name || "Current Semester");
          }
          
          const schedule = currentSemesterRegistrations
            .map(reg => reg.scheduledCourse)
            .filter(Boolean) as EnrichedScheduledCourseForStudent[];
            
          setCurrentSchedule(schedule);
        } catch (error) {
            console.error("Failed to load student schedule:", error);
        } finally {
            setIsLoading(false);
        }
      };
      startTransition(() => { fetchSchedule(); });
    } else if (!user) {
      router.replace('/login');
    } else if (user?.role !== 'Student') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-8 w-8 animate-spin"/><span className="ml-2">Loading Your Schedule...</span></div>;
  }

  if (!user || user.role !== 'Student') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
      </div>
    );
  }
  
  const formatTimeDisplay = (timeValue: Date | string | null | undefined) => {
    if (!timeValue) return 'N/A';
    try {
      const date = typeof timeValue === 'string' ? new Date(`1970-01-01T${timeValue}`) : timeValue;
      return format(date, 'hh:mm a');
    } catch (e) {
      return 'Invalid Time';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="My Schedule"
        description={`Your registered courses for ${currentSemesterName || 'the current semester'}.`}
        icon={CalendarDays}
      />
      {currentSchedule.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentSchedule.map(sc => (
            <Card key={sc.scheduled_course_id} className="flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl font-headline">
                  <Link href={`/courses/${sc.course?.course_id}`} className="hover:underline text-primary">
                    {sc.course?.title || 'Course Title'}
                  </Link>
                </CardTitle>
                <CardDescription>{sc.course?.course_code} - Section {sc.section_number}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm flex-grow">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" /> 
                  <span>{sc.teacher?.first_name} {sc.teacher?.last_name || 'N/A'}</span>
                </div>
                {sc.days_of_week && sc.start_time && sc.end_time && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{sc.days_of_week}, {formatTimeDisplay(sc.start_time)} - {formatTimeDisplay(sc.end_time)}</span>
                  </div>
                )}
                {sc.room && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{sc.room.building?.name || 'N/A Bldg'}, Room {sc.room.room_number}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">You are not registered for any courses this semester.</p>
            <p className="text-sm text-muted-foreground mt-2">Visit the course registration page to add courses.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
