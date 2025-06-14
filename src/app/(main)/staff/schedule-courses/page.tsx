// src/app/(main)/staff/schedule-courses/page.tsx
'use client';

import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, startTransition } from 'react';
import { Edit3, ShieldAlert, PlusCircle, MoreHorizontal, Edit, Trash2, Loader2 } from 'lucide-react';
import type { Course, Semester, User as PrismaUser, Room as PrismaRoom, Building as PrismaBuilding, ScheduledCourse as PrismaScheduledCourse } from '@prisma/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import ScheduleCourseForm from '@/components/scheduling/ScheduleCourseForm';
import type { ScheduleCourseFormData } from '@/lib/schemas';
import { getAllScheduledCourses, createScheduledCourse, updateScheduledCourse, deleteScheduledCourse, type EnrichedScheduledCourse } from '@/actions/scheduledCourseActions';
import { getAllCoursesWithDetails } from '@/actions/courseActions';
import { getAllSemesters } from '@/actions/semesterActions';
import { getAllUsers } from '@/actions/userActions'; // To get teachers
import { getAllRoomsWithBuilding } from '@/actions/infrastructureActions';


const ITEMS_PER_PAGE = 10;
const NO_ROOM_VALUE = "none"; 

const formatTimeToHHMM = (timeString: string | Date | null | undefined): string => {
  if (!timeString) return '';
  if (typeof timeString === 'string') {
    if (timeString.match(/^\d{2}:\d{2}$/)) return timeString;
    if (timeString.match(/^\d{2}:\d{2}:\d{2}$/)) return timeString.substring(0,5);
  }
  try {
    const date = typeof timeString === 'string' ? new Date(`1970-01-01T${timeString}`) : timeString;
    if (date && !isNaN(date.getTime())) return format(date, 'HH:mm');
  } catch (e) { /* ignore */ }
  return '';
};

const formatDisplayTime = (timeValue: Date | string | null | undefined) => {
    if (!timeValue) return 'N/A';
    try {
      const date = typeof timeValue === 'string' ? new Date(`1970-01-01T${timeValue}`) : timeValue;
      return format(date, 'hh:mm a');
    } catch (e) {
      return 'Invalid Time';
    }
};

export default function ScheduleCoursesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [scheduledCoursesList, setScheduledCoursesList] = useState<EnrichedScheduledCourse[]>([]);
  
  const [courses, setCourses] = useState<PrismaCourse[]>([]);
  const [semesters, setSemesters] = useState<PrismaSemester[]>([]);
  const [teachers, setTeachers] = useState<PrismaUser[]>([]);
  const [rooms, setRooms] = useState<(PrismaRoom & { building: PrismaBuilding | null })[]>([]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedScheduledCourse, setSelectedScheduledCourse] = useState<EnrichedScheduledCourse | null>(null);
  const [isSubmittingDialog, setIsSubmittingDialog] = useState(false);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [scData, cData, semData, tData, rData] = await Promise.all([
        getAllScheduledCourses(),
        getAllCoursesWithDetails(),
        getAllSemesters(),
        getAllUsers({role: 'Teacher'}), // Assuming teachers have 'Teacher' role
        getAllRoomsWithBuilding()
      ]);
      setScheduledCoursesList(scData);
      setCourses(cData.map(c => ({...c, department: undefined}))); // Strip department from Course for form
      setSemesters(semData);
      setTeachers(tData.filter(u => u.role === 'Teacher'));
      setRooms(rData);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load scheduling data.'});
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role !== 'Staff' && !user.is_super_admin) {
      router.replace('/dashboard');
    } else {
        fetchAllData();
    }
  }, [user, router]);

  const paginatedScheduledCourses = scheduledCoursesList.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(scheduledCoursesList.length / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => { if (page >= 1 && page <= totalPages) setCurrentPage(page); };
  const handleOpenEditDialog = (sc: EnrichedScheduledCourse) => { setSelectedScheduledCourse(sc); setIsEditDialogOpen(true); };

  const handleDeleteScheduledCourseSubmit = async (id: number) => {
    if (!confirm('Are you sure you want to delete this scheduled course?')) return;
    setIsSubmittingDialog(true);
    try {
      await deleteScheduledCourse(id);
      toast({ title: 'Scheduled Course Deleted'});
      startTransition(fetchAllData);
    } catch (error) { toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    } finally { setIsSubmittingDialog(false); }
  };
  
  const handleAddScheduledCourseSubmit = async (data: ScheduleCourseFormData) => {
    setIsSubmittingDialog(true);
    try {
      await createScheduledCourse(data);
      toast({ title: 'Course Scheduled' });
      setIsAddDialogOpen(false);
      startTransition(fetchAllData);
    } catch (error) { toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    } finally { setIsSubmittingDialog(false); }
  };

  const handleEditScheduledCourseSubmit = async (data: ScheduleCourseFormData) => {
    if (!selectedScheduledCourse) return;
    setIsSubmittingDialog(true);
    try {
      await updateScheduledCourse(selectedScheduledCourse.scheduled_course_id, data);
      toast({ title: 'Scheduled Course Updated' });
      setIsEditDialogOpen(false); setSelectedScheduledCourse(null);
      startTransition(fetchAllData);
    } catch (error) { toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    } finally { setIsSubmittingDialog(false); }
  };

  if (!user || (user.role !== 'Staff' && !user.is_super_admin)) {
    return <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center"><ShieldAlert className="w-16 h-16 text-destructive mb-4" /><h2 className="text-2xl font-bold mb-2">Access Denied</h2></div>;
  }
   if (isLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  const editInitialData: ScheduleCourseFormData | undefined = selectedScheduledCourse ? {
    course_id: String(selectedScheduledCourse.course_id),
    semester_id: String(selectedScheduledCourse.semester_id),
    teacher_id: String(selectedScheduledCourse.teacher_id),
    room_id: selectedScheduledCourse.room_id ? String(selectedScheduledCourse.room_id) : NO_ROOM_VALUE,
    section_number: selectedScheduledCourse.section_number,
    max_capacity: selectedScheduledCourse.max_capacity,
    days_of_week: selectedScheduledCourse.days_of_week || '',
    start_time: formatTimeToHHMM(selectedScheduledCourse.start_time),
    end_time: formatTimeToHHMM(selectedScheduledCourse.end_time),
  } : undefined;


  return (
    <div className="space-y-6">
      <PageHeader 
        title="Schedule Courses" 
        description="Manage course schedules for upcoming semesters."
        icon={Edit3}
        action={
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" /> Schedule New Course</Button></DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader><DialogTitle>Schedule New Course</DialogTitle><DialogDescription>Fill details.</DialogDescription></DialogHeader>
              <ScheduleCourseForm onSubmit={handleAddScheduledCourseSubmit} onCancel={() => setIsAddDialogOpen(false)} isSubmitting={isSubmittingDialog} courses={courses} semesters={semesters} teachers={teachers.map(t => ({...t, teacher_id: t.user_id})) /* Adapt User to Teacher for form */} rooms={rooms.map(r => ({...r, building: { name: r.building?.name || 'N/A'}}))} submitButtonText="Schedule Course"/>
            </DialogContent>
          </Dialog>
        }
      />
      
      <Card>
        <CardHeader><CardTitle>Current & Upcoming Scheduled Courses</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Course</TableHead><TableHead>Teacher</TableHead><TableHead>Semester</TableHead><TableHead>Section</TableHead><TableHead>Schedule</TableHead><TableHead>Location</TableHead><TableHead>Capacity</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {paginatedScheduledCourses.length > 0 ? (
                paginatedScheduledCourses.map((sc) => (
                  <TableRow key={sc.scheduled_course_id}>
                    <TableCell><div className="font-medium">{sc.course?.course_code}</div><div className="text-xs text-muted-foreground">{sc.course?.title}</div></TableCell>
                    <TableCell>{sc.teacher?.first_name} {sc.teacher?.last_name}</TableCell>
                    <TableCell>{sc.semester?.name}</TableCell>
                    <TableCell>{sc.section_number}</TableCell>
                    <TableCell>{sc.days_of_week ? `${sc.days_of_week}, ${formatDisplayTime(sc.start_time)} - ${formatDisplayTime(sc.end_time)}` : 'N/A'}</TableCell>
                    <TableCell>{sc.room?.building?.name || 'N/A'}, {sc.room?.room_number || 'N/A'}</TableCell>
                    <TableCell>{sc.current_enrollment}/{sc.max_capacity}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={isSubmittingDialog}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEditDialog(sc)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteScheduledCourseSubmit(sc.scheduled_course_id)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (<TableRow><TableCell colSpan={8} className="text-center h-24">No courses scheduled.</TableCell></TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          <Button variant="outline" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Previous</Button>
          <span className="self-center px-2">Page {currentPage} of {totalPages}</span>
          <Button variant="outline" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Next</Button>
        </div>
      )}
      
      {selectedScheduledCourse && editInitialData && (
        <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => { setIsEditDialogOpen(isOpen); if (!isOpen) setSelectedScheduledCourse(null); }}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader><DialogTitle>Edit: {selectedScheduledCourse.course?.course_code}</DialogTitle></DialogHeader>
              <ScheduleCourseForm onSubmit={handleEditScheduledCourseSubmit} onCancel={() => { setIsEditDialogOpen(false); setSelectedScheduledCourse(null); }} isSubmitting={isSubmittingDialog} courses={courses} semesters={semesters} teachers={teachers.map(t => ({...t, teacher_id: t.user_id}))} rooms={rooms.map(r => ({...r, building: { name: r.building?.name || 'N/A'}}))} initialData={editInitialData} submitButtonText="Save Changes"/>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
