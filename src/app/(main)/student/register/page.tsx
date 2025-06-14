// src/app/(main)/student/register/page.tsx
'use client';

import { useEffect, useState, useMemo, startTransition } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import type { UserProfile as AuthUserProfile } from '@/types';
import type { Course as PrismaCourse, Semester as PrismaSemester, User as PrismaUser, Prerequisite as PrismaPrerequisite, ScheduledCourse as ServerScheduledCourse, Registration as PrismaRegistration } from '@prisma/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit3, ShieldAlert, CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { getSemestersOpenForRegistration } from '@/actions/semesterActions';
import { getAvailableScheduledCoursesForRegistration, type EnrichedScheduledCourse as ServerEnrichedScheduledCourse } from '@/actions/scheduledCourseActions';
import { getStudentRegistrations, registerStudentForCourse, dropStudentFromCourse, getStudentCompletedCourseIds } from '@/actions/studentActions';

interface AvailableCourseForRegistration extends ServerEnrichedScheduledCourse {
  prerequisitesMet: boolean;
  prerequisiteCourses?: PrismaCourse[];
  isRegistered: boolean;
  canRegister: boolean; 
  canDrop: boolean;
}

export default function StudentCourseRegistrationPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | undefined>(undefined);
  const [selectedSemester, setSelectedSemester] = useState<PrismaSemester | null>(null);
  const [availableCourses, setAvailableCourses] = useState<AvailableCourseForRegistration[]>([]);
  const [studentRegistrations, setStudentRegistrations] = useState<PrismaRegistration[]>([]);
  const [availableSemesters, setAvailableSemesters] = useState<PrismaSemester[]>([]);
  const [completedCourseIds, setCompletedCourseIds] = useState<number[]>([]);

  const now = useMemo(() => new Date(), []);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user || user.role !== 'Student') {
        router.replace(user ? '/dashboard' : '/login');
        return;
      }
      setIsLoadingPage(true);
      try {
        const [openSemesters, studentRegs, completedIds] = await Promise.all([
          getSemestersOpenForRegistration(),
          getStudentRegistrations(user.user_id),
          getStudentCompletedCourseIds(user.user_id)
        ]);
        setAvailableSemesters(openSemesters);
        setStudentRegistrations(studentRegs);
        setCompletedCourseIds(completedIds);
        if (openSemesters.length > 0 && !selectedSemesterId) {
          setSelectedSemesterId(String(openSemesters[0].semester_id));
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to load initial registration data." });
      } finally {
        setIsLoadingPage(false);
      }
    };
    startTransition(() => { fetchInitialData(); });
  }, [user, router, toast]); // selectedSemesterId removed from deps to avoid re-triggering initial load

  useEffect(() => {
    if (selectedSemesterId && availableSemesters.length > 0) {
      const foundSemester = availableSemesters.find(s => s.semester_id === parseInt(selectedSemesterId));
      setSelectedSemester(foundSemester || null);
    } else {
      setSelectedSemester(null);
    }
  }, [selectedSemesterId, availableSemesters]);

  useEffect(() => {
    const fetchCoursesForSemester = async () => {
      if (!user || !selectedSemester || !selectedSemesterId) {
        setAvailableCourses([]);
        return;
      }
      setIsLoadingCourses(true);
      try {
        const scheduledForSemester = await getAvailableScheduledCoursesForRegistration(selectedSemester.semester_id, user.department_id ?? undefined);
        
        const enrichedAndFiltered = scheduledForSemester.map(sc => {
          if (!sc.course) return null; // Should not happen if query is correct
          const coursePrereqs = sc.course.prerequisitesRequired || [];
          let prerequisitesMet = true;
          if (coursePrereqs.length > 0) {
            prerequisitesMet = coursePrereqs.every(p => completedCourseIds.includes(p.prerequisite_course_id));
          }
          const isRegistered = studentRegistrations.some(reg => reg.scheduled_course_id === sc.scheduled_course_id && reg.status === 'Registered');
          
          const isRegOpen = new Date(selectedSemester.registration_start_date) <= now && new Date(selectedSemester.registration_end_date) >= now;
          const isAddDropOpen = new Date(selectedSemester.add_drop_start_date) <= now && new Date(selectedSemester.add_drop_end_date) >= now;

          const canRegister = !isRegistered && prerequisitesMet && sc.current_enrollment < sc.max_capacity && isRegOpen;
          const canDrop = isRegistered && isAddDropOpen;

          return { ...sc, prerequisitesMet, prerequisiteCourses: coursePrereqs.map(p=>p.prerequisiteCourse).filter(Boolean) as PrismaCourse[], isRegistered, canRegister, canDrop };
        }).filter(Boolean) as AvailableCourseForRegistration[];
        
        setAvailableCourses(enrichedAndFiltered);
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to load courses for the semester."});
      } finally {
        setIsLoadingCourses(false);
      }
    };
    if (selectedSemesterId) {
        startTransition(() => { fetchCoursesForSemester(); });
    }
  }, [selectedSemesterId, selectedSemester, user, studentRegistrations, completedCourseIds, now, toast]);

  const handleRegister = async (scheduledCourseId: number) => {
    if (!user || !selectedSemester) return;
    setIsLoadingCourses(true); // Indicate loading for the list
    try {
      await registerStudentForCourse(user.user_id, scheduledCourseId);
      toast({ title: 'Registration Successful'});
      // Re-fetch student registrations and then courses for semester to update UI
      const updatedRegs = await getStudentRegistrations(user.user_id);
      setStudentRegistrations(updatedRegs);
      // The useEffect for selectedSemester will re-fetch courses.
    } catch (error) { toast({ variant: 'destructive', title: 'Registration Failed', description: (error as Error).message });
    } finally { setIsLoadingCourses(false); }
  };
  
  const handleDrop = async (scheduledCourseId: number) => {
    if (!user || !selectedSemester) return;
    setIsLoadingCourses(true);
    try {
      await dropStudentFromCourse(user.user_id, scheduledCourseId);
      toast({ title: 'Course Dropped'});
      const updatedRegs = await getStudentRegistrations(user.user_id);
      setStudentRegistrations(updatedRegs);
    } catch (error) { toast({ variant: 'destructive', title: 'Drop Failed', description: (error as Error).message });
    } finally { setIsLoadingCourses(false); }
  };

  if (isLoadingPage) return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-8 w-8 animate-spin"/><span className="ml-2">Loading...</span></div>;
  if (!user || user.role !== 'Student') return <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center"><ShieldAlert className="w-16 h-16 text-destructive mb-4" /><h2 className="text-2xl font-bold mb-2">Access Denied</h2></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Course Registration" description="Browse and register for available courses." icon={Edit3}/>
      <Card>
        <CardHeader>
            <p className="text-sm font-medium text-foreground mb-1">Select Semester for Registration</p>
            <Select value={selectedSemesterId} onValueChange={setSelectedSemesterId}>
              <SelectTrigger className="w-full md:w-1/3"><SelectValue placeholder="Select a semester" /></SelectTrigger>
              <SelectContent>
                {availableSemesters.length > 0 ? availableSemesters.map(sem => (<SelectItem key={sem.semester_id} value={String(sem.semester_id)}>{sem.name} ({sem.academic_year})</SelectItem>))
                : (<SelectItem value="none" disabled>No semesters open for registration</SelectItem>)}
              </SelectContent>
            </Select>
        </CardHeader>
      </Card>
      
      {isLoadingCourses && <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Loading courses...</p></div>}
      {!isLoadingCourses && availableSemesters.length === 0 && (<Card><CardContent className="py-6 text-center text-muted-foreground">No semesters are currently open for registration.</CardContent></Card>)}
      {!isLoadingCourses && selectedSemesterId && !selectedSemester && availableSemesters.length > 0 && (<Card><CardContent className="py-6 text-center text-muted-foreground">Please select a valid semester.</CardContent></Card>)}

      {!isLoadingCourses && selectedSemester && availableCourses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableCourses.map(sc => (
            <Card key={sc.scheduled_course_id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg font-headline"><Link href={`/courses/${sc.course?.course_id}`} className="hover:underline text-primary">{sc.course?.title || 'N/A'}</Link></CardTitle>
                <CardDescription>{sc.course?.course_code} - Sec {sc.section_number} <br/>Instr: {sc.teacher?.first_name} {sc.teacher?.last_name || 'N/A'} <br/>Seats: {sc.current_enrollment}/{sc.max_capacity}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow text-sm">
                {!sc.prerequisitesMet && sc.prerequisiteCourses && sc.prerequisiteCourses.length > 0 && (<div className="mb-2 p-2 border border-yellow-300 bg-yellow-50 text-yellow-700 rounded-md text-xs"><p className="font-medium flex items-center gap-1"><AlertTriangle className="h-4 w-4"/>Prereqs not met:</p><ul className="list-disc pl-4">{sc.prerequisiteCourses.map(p => <li key={p.course_id}>{p.course_code}</li>)}</ul></div>)}
                {sc.current_enrollment >= sc.max_capacity && !sc.isRegistered && (<p className="text-xs text-destructive flex items-center gap-1"><Info className="h-4 w-4"/>Section full.</p>)}
                {selectedSemester && !(new Date(selectedSemester.registration_start_date) <= now && new Date(selectedSemester.registration_end_date) >= now) && !sc.isRegistered && (<p className="text-xs text-destructive flex items-center gap-1"><Info className="h-4 w-4"/>Reg closed.</p>)}
              </CardContent>
              <CardFooter>
                {sc.isRegistered ? (<Button variant="destructive" className="w-full" onClick={() => handleDrop(sc.scheduled_course_id)} disabled={!sc.canDrop || isLoadingCourses}>{isLoadingCourses && <Loader2 className="h-4 w-4 animate-spin mr-1"/>}<XCircle className="mr-2 h-4 w-4" /> Drop {!sc.canDrop && selectedSemester && !(new Date(selectedSemester.add_drop_start_date) <= now && new Date(selectedSemester.add_drop_end_date) >= now) && <span className="text-xs ml-1">(Closed)</span>}</Button>)
                : (<Button className="w-full" onClick={() => handleRegister(sc.scheduled_course_id)} disabled={!sc.canRegister || isLoadingCourses}>{isLoadingCourses && <Loader2 className="h-4 w-4 animate-spin mr-1"/>}<CheckCircle className="mr-2 h-4 w-4" /> Register</Button>)}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      {!isLoadingCourses && selectedSemester && availableCourses.length === 0 && (<Card><CardContent className="py-6 text-center text-muted-foreground">No courses available for registration matching criteria.</CardContent></Card>)}
    </div>
  );
}
