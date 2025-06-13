
'use client';

import { useEffect, useState, useMemo } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { 
  mockScheduledCourses, 
  mockCourses, 
  mockSemesters, 
  mockRegistrations,
  mockUserProfiles,
  mockPrerequisites
} from '@/lib/data';
import type { UserProfile, ScheduledCourse, Course, Semester, Registration } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit3, ShieldAlert, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface AvailableCourseForRegistration extends ScheduledCourse {
  courseDetails?: Course;
  teacherDetails?: UserProfile;
  prerequisitesMet: boolean;
  prerequisiteCourses?: Course[];
  isRegistered: boolean;
  canRegister: boolean; 
  canDrop: boolean;
}

export default function StudentCourseRegistrationPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | undefined>(undefined);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);
  const [availableCourses, setAvailableCourses] = useState<AvailableCourseForRegistration[]>([]);
  const [studentRegistrations, setStudentRegistrations] = useState<Registration[]>([]);

  const now = useMemo(() => new Date(), []);

  // Determine current and future semesters for selection
  const availableSemestersForRegistration = useMemo(() => {
    return mockSemesters
      .filter(sem => new Date(sem.registration_end_date) >= now) 
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  }, [now]);

  useEffect(() => {
    if (availableSemestersForRegistration.length > 0 && !selectedSemesterId) {
      setSelectedSemesterId(String(availableSemestersForRegistration[0].semester_id));
    }
  }, [availableSemestersForRegistration, selectedSemesterId]);

  useEffect(() => {
    if (selectedSemesterId) {
      const foundSemester = mockSemesters.find(s => s.semester_id === parseInt(selectedSemesterId));
      setSelectedSemester(foundSemester || null);
    } else {
      setSelectedSemester(null);
    }
  }, [selectedSemesterId]);


  useEffect(() => {
    if (user && user.role === 'Student' && selectedSemesterId && selectedSemester) {
      setIsLoading(true);
      const studentUser = user as UserProfile;
      const currentSemesterNumId = parseInt(selectedSemesterId);

      const studentRegsForSemester = mockRegistrations.filter(
        reg => reg.student_id === studentUser.user_id && reg.scheduledCourse?.semester_id === currentSemesterNumId
      );
      setStudentRegistrations(studentRegsForSemester);
      
      const completedCourseIds = mockRegistrations
        .filter(reg => reg.student_id === studentUser.user_id && reg.status === 'Completed')
        .map(reg => reg.scheduledCourse?.course_id)
        .filter(Boolean) as number[];

      const coursesForSemester = mockScheduledCourses
        .filter(sc => sc.semester_id === currentSemesterNumId)
        .map(sc => {
          const courseDetails = mockCourses.find(c => c.course_id === sc.course_id);
          
          // Department check
          if (studentUser.department_id && courseDetails?.department_id !== studentUser.department_id) {
            return null; // Student not in the course's department
          }

          const teacherDetails = mockUserProfiles.find(t => t.user_id === sc.teacher_id);
          const isRegistered = studentRegsForSemester.some(reg => reg.scheduled_course_id === sc.scheduled_course_id);
          
          const coursePrereqs = mockPrerequisites.filter(p => p.course_id === sc.course_id);
          let prerequisitesMet = true;
          let prerequisiteCourses: Course[] = [];
          if (coursePrereqs.length > 0) {
            prerequisiteCourses = coursePrereqs.map(p => mockCourses.find(c => c.course_id === p.prerequisite_course_id)).filter(Boolean) as Course[];
            prerequisitesMet = coursePrereqs.every(p => completedCourseIds.includes(p.prerequisite_course_id));
          }
          
          const isRegistrationOpen = new Date(selectedSemester.registration_end_date) >= now;
          const isAddDropOpen = new Date(selectedSemester.add_drop_end_date) >= now;

          const canRegister = !isRegistered && prerequisitesMet && sc.current_enrollment < sc.max_capacity && isRegistrationOpen;
          const canDrop = isRegistered && isAddDropOpen;

          return {
            ...sc,
            courseDetails,
            teacherDetails,
            isRegistered,
            prerequisitesMet,
            prerequisiteCourses,
            canRegister,
            canDrop,
          };
        }).filter(Boolean) as AvailableCourseForRegistration[]; // filter(Boolean) removes nulls
      
      setAvailableCourses(coursesForSemester);
      setIsLoading(false);
    } else if (!user) {
      router.replace('/login');
    } else if (user && user.role !== 'Student') {
      router.replace('/dashboard');
    } else if (!selectedSemesterId || !selectedSemester) {
      setAvailableCourses([]); // Clear courses if no semester selected
      setIsLoading(false);
    }
  }, [user, router, selectedSemesterId, selectedSemester, now]);

  const handleRegister = (scheduledCourseId: number) => {
    if (!user || !selectedSemesterId) return;
    const studentUser = user as UserProfile;
    const courseToRegister = availableCourses.find(c => c.scheduled_course_id === scheduledCourseId);

    if (courseToRegister && courseToRegister.canRegister) {
      const newRegistrationId = Math.max(0, ...mockRegistrations.map(r => r.registration_id)) + 1;
      const newReg: Registration = {
        registration_id: newRegistrationId,
        student_id: studentUser.user_id,
        scheduled_course_id: scheduledCourseId,
        registration_date: new Date().toISOString(),
        status: 'Registered',
        updated_at: new Date().toISOString(),
        scheduledCourse: mockScheduledCourses.find(sc => sc.scheduled_course_id === scheduledCourseId),
        student: studentUser,
      };
      mockRegistrations.push(newReg);

      setAvailableCourses(prev => prev.map(c => 
        c.scheduled_course_id === scheduledCourseId ? { ...c, isRegistered: true, canRegister: false, current_enrollment: c.current_enrollment + 1, canDrop: new Date(selectedSemester!.add_drop_end_date) >= now } : c
      ));
      setStudentRegistrations(prev => [...prev, newReg]);
      
      const scIndex = mockScheduledCourses.findIndex(sc => sc.scheduled_course_id === scheduledCourseId);
      if (scIndex > -1) {
        mockScheduledCourses[scIndex].current_enrollment +=1;
      }

      toast({ title: 'Registration Successful (Mock)', description: `You have been registered for ${courseToRegister.courseDetails?.title}.` });
    } else {
      toast({ variant: 'destructive', title: 'Registration Failed', description: 'Cannot register for this course. It might be full, prerequisites not met, or registration deadline passed.' });
    }
  };
  
  const handleDrop = (scheduledCourseId: number) => {
     if (!user || !selectedSemester || !selectedSemesterId) return;
      const studentUser = user as UserProfile;
      const regToDrop = studentRegistrations.find(r => r.scheduled_course_id === scheduledCourseId);
      const courseToUpdate = availableCourses.find(c => c.scheduled_course_id === scheduledCourseId);

      if (regToDrop && new Date(selectedSemester.add_drop_end_date) >= now) {
        const regIndex = mockRegistrations.findIndex(r => r.registration_id === regToDrop.registration_id);
        if (regIndex > -1) {
            mockRegistrations.splice(regIndex, 1); 
        }

        setStudentRegistrations(prev => prev.filter(r => r.registration_id !== regToDrop.registration_id));
        setAvailableCourses(prev => prev.map(c => 
            c.scheduled_course_id === scheduledCourseId ? { 
                ...c, 
                isRegistered: false, 
                canRegister: c.prerequisitesMet && (c.current_enrollment -1 < c.max_capacity) && new Date(selectedSemester.registration_end_date) >= now,
                current_enrollment: Math.max(0, c.current_enrollment -1),
                canDrop: false
            } : c
        ));

        const scIndex = mockScheduledCourses.findIndex(sc => sc.scheduled_course_id === scheduledCourseId);
        if (scIndex > -1) {
            mockScheduledCourses[scIndex].current_enrollment = Math.max(0, mockScheduledCourses[scIndex].current_enrollment -1);
        }
        toast({ title: 'Course Dropped (Mock)', description: `You have dropped ${courseToUpdate?.courseDetails?.title}.` });
      } else {
        toast({ variant: 'destructive', title: 'Drop Failed', description: 'Cannot drop this course. Add/Drop period may have ended.' });
      }
  };


  if (!user || user.role !== 'Student') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">This page is for students only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Course Registration"
        description="Browse and register for available courses."
        icon={Edit3}
      />

      <Card>
        <CardHeader>
            <FormLabel>Select Semester for Registration</FormLabel>
            <Select value={selectedSemesterId} onValueChange={setSelectedSemesterId}>
              <SelectTrigger className="w-full md:w-1/3">
                <SelectValue placeholder="Select a semester" />
              </SelectTrigger>
              <SelectContent>
                {availableSemestersForRegistration.length > 0 ? (
                  availableSemestersForRegistration.map(sem => (
                    <SelectItem key={sem.semester_id} value={String(sem.semester_id)}>
                      {sem.name} ({sem.academic_year})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No semesters open for registration</SelectItem>
                )}
              </SelectContent>
            </Select>
        </CardHeader>
      </Card>
      
      {isLoading && <p className="text-center text-muted-foreground">Loading courses...</p>}

      {!isLoading && availableSemestersForRegistration.length === 0 && (
         <Card><CardContent className="py-6 text-center text-muted-foreground">No semesters are currently open for registration.</CardContent></Card>
      )}
      
      {!isLoading && selectedSemesterId && !selectedSemester && (
          <Card><CardContent className="py-6 text-center text-muted-foreground">Please select a valid semester.</CardContent></Card>
      )}

      {!isLoading && selectedSemester && availableCourses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableCourses.map(sc => (
            <Card key={sc.scheduled_course_id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg font-headline">
                  <Link href={`/courses/${sc.courseDetails?.course_id}`} className="hover:underline text-primary">
                    {sc.courseDetails?.title || 'Course Title'}
                  </Link>
                </CardTitle>
                <CardDescription>
                  {sc.courseDetails?.course_code} - Section {sc.section_number} <br/>
                  Instructor: {sc.teacherDetails?.first_name} {sc.teacherDetails?.last_name || 'N/A'} <br/>
                  Seats: {sc.current_enrollment}/{sc.max_capacity}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow text-sm">
                {!sc.prerequisitesMet && sc.prerequisiteCourses && sc.prerequisiteCourses.length > 0 && (
                  <div className="mb-2 p-2 border border-yellow-300 bg-yellow-50 text-yellow-700 rounded-md text-xs">
                    <p className="font-medium flex items-center gap-1"><AlertTriangle className="h-4 w-4"/>Prerequisites not met:</p>
                    <ul className="list-disc pl-4">
                      {sc.prerequisiteCourses.map(p => <li key={p.course_id}>{p.course_code}</li>)}
                    </ul>
                  </div>
                )}
                 {sc.current_enrollment >= sc.max_capacity && !sc.isRegistered && (
                     <p className="text-xs text-destructive flex items-center gap-1"><Info className="h-4 w-4"/>Section is full.</p>
                 )}
                 {selectedSemester && new Date(selectedSemester.registration_end_date) < now && !sc.isRegistered && (
                    <p className="text-xs text-destructive flex items-center gap-1"><Info className="h-4 w-4"/>Registration deadline passed.</p>
                 )}
              </CardContent>
              <CardFooter>
                {sc.isRegistered ? (
                   <Button 
                    variant="destructive" 
                    className="w-full" 
                    onClick={() => handleDrop(sc.scheduled_course_id)}
                    disabled={!sc.canDrop}
                   >
                     <XCircle className="mr-2 h-4 w-4" /> Drop Course
                     {!sc.canDrop && selectedSemester && new Date(selectedSemester.add_drop_end_date) < now && <span className="text-xs ml-1">(Deadline Passed)</span>}
                   </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={() => handleRegister(sc.scheduled_course_id)}
                    disabled={!sc.canRegister}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" /> Register
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      {!isLoading && selectedSemester && availableCourses.length === 0 && (
         <Card><CardContent className="py-6 text-center text-muted-foreground">No courses available in your department for registration in this semester, or all are full/prerequisites not met.</CardContent></Card>
      )}
    </div>
  );
}
