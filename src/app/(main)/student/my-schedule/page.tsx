// src/app/(main)/student/my-schedule/page.tsx

'use client';

import { useEffect, useState, useMemo } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { mockRegistrations, mockScheduledCourses, mockCourses, mockSemesters, mockUserProfiles, mockRooms, mockBuildings } from '@/lib/data';
import type { UserProfile, ScheduledCourse, Course, Semester, Room, Building, Registration } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Clock, MapPin, ShieldAlert, BookOpen, Users } from 'lucide-react';
import Link from 'next/link';

interface EnrichedScheduledCourseForStudent extends ScheduledCourse {
  courseDetails?: Course;
  semesterDetails?: Semester;
  teacherDetails?: UserProfile; // Using UserProfile for teacher name
  roomDetails?: Room & { buildingDetails?: Building };
}

export default function StudentMySchedulePage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [currentSchedule, setCurrentSchedule] = useState<EnrichedScheduledCourseForStudent[]>([]);
  const [currentSemesterName, setCurrentSemesterName] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role === 'Student') {
      const studentUser = user as UserProfile;
      
      // Determine the "current" semester - for mock, let's assume the latest one by ID or start date
      const latestSemester = mockSemesters.sort((a,b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())[0];
      setCurrentSemesterName(latestSemester?.name || "Current Semester");

      const studentRegistrations = mockRegistrations.filter(
        reg => reg.student_id === studentUser.user_id && 
               reg.status === 'Registered' &&
               reg.scheduledCourse?.semester_id === latestSemester?.semester_id
      );
      
      const schedule: EnrichedScheduledCourseForStudent[] = studentRegistrations.map(reg => {
        const sc = mockScheduledCourses.find(s => s.scheduled_course_id === reg.scheduled_course_id);
        if (!sc) return null;

        const courseDetails = mockCourses.find(c => c.course_id === sc.course_id);
        const semesterDetails = mockSemesters.find(s => s.semester_id === sc.semester_id);
        const teacherDetails = mockUserProfiles.find(t => t.user_id === sc.teacher_id);
        const roomDetails = sc.room_id ? mockRooms.find(r => r.room_id === sc.room_id) : undefined;
        const buildingDetails = roomDetails?.building_id ? mockBuildings.find(b => b.building_id === roomDetails.building_id) : undefined;

        return {
          ...sc,
          courseDetails,
          semesterDetails,
          teacherDetails,
          roomDetails: roomDetails ? { ...roomDetails, buildingDetails } : undefined,
        };
      }).filter(Boolean) as EnrichedScheduledCourseForStudent[];
      
      setCurrentSchedule(schedule);
      setIsLoading(false);
    } else if (!user) {
      router.replace('/login');
    } else if (user.role !== 'Student') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  if (isLoading) {
    return <PageHeader title="Loading Your Schedule..." icon={CalendarDays} />;
  }

  if (!user || user.role !== 'Student') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">This page is for students only.</p>
      </div>
    );
  }
  
  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return 'N/A';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                  <Link href={`/courses/${sc.courseDetails?.course_id}`} className="hover:underline text-primary">
                    {sc.courseDetails?.title || 'Course Title'}
                  </Link>
                </CardTitle>
                <CardDescription>{sc.courseDetails?.course_code} - Section {sc.section_number}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm flex-grow">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" /> 
                  <span>{sc.teacherDetails?.first_name} {sc.teacherDetails?.last_name || 'N/A'}</span>
                </div>
                {sc.days_of_week && sc.start_time && sc.end_time && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{sc.days_of_week}, {formatTime(sc.start_time)} - {formatTime(sc.end_time)}</span>
                  </div>
                )}
                {sc.roomDetails && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{sc.roomDetails.buildingDetails?.name || 'N/A Bldg'}, Room {sc.roomDetails.room_number}</span>
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
