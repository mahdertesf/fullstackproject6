
'use client';

import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Edit3, ShieldAlert, PlusCircle, MoreHorizontal, Edit, Trash2, Loader2 } from 'lucide-react';
import { mockScheduledCourses, mockCourses, mockTeachers, mockSemesters, mockRooms, mockBuildings } from '@/lib/data';
import type { ScheduledCourse, Course, Teacher, Semester, Room, Building } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format, parse } from 'date-fns';
import ScheduleCourseForm from '@/components/scheduling/ScheduleCourseForm';
import type { ScheduleCourseFormData } from '@/lib/schemas';

interface EnrichedScheduledCourse extends ScheduledCourse {
  courseName?: string;
  courseCode?: string;
  teacherName?: string;
  semesterName?: string;
  roomNumber?: string;
  buildingName?: string;
}

const ITEMS_PER_PAGE = 10;
const NO_ROOM_VALUE = "none"; 

// Helper function to format time to HH:MM, which the input type="time" expects
const formatTimeToHHMM = (timeString: string | null | undefined): string => {
  if (!timeString) return '';
  // Check if already HH:MM
  if (timeString.match(/^\d{2}:\d{2}$/)) return timeString;
  // Check for HH:MM:SS
  if (timeString.match(/^\d{2}:\d{2}:\d{2}$/)) return timeString.substring(0,5);
  
  // Attempt to parse common formats like 'hh:mm a' or Date object
  try {
    // Use a dummy date for parsing if it's not a full date string
    const date = parse(timeString, 'hh:mm a', new Date());
    if (!isNaN(date.getTime())) {
      return format(date, 'HH:mm');
    }
  } catch (e) {
    // ignore parsing error
  }
  
  // Fallback for unhandled or already correct formats
  return timeString.split(' ')[0]; // Attempt to remove AM/PM if present and no other format matches
};


export default function ScheduleCoursesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [scheduledCoursesList, setScheduledCoursesList] = useState<ScheduledCourse[]>(mockScheduledCourses);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedScheduledCourse, setSelectedScheduledCourse] = useState<EnrichedScheduledCourse | null>(null);
  const [isSubmittingDialog, setIsSubmittingDialog] = useState(false);


  useEffect(() => {
    if (user && user.role !== 'Staff' && !user.isSuperAdmin) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const enrichedScheduledCourses: EnrichedScheduledCourse[] = useMemo(() => {
    return scheduledCoursesList.map(sc => {
      const course = mockCourses.find(c => c.course_id === sc.course_id);
      const teacher = mockTeachers.find(t => t.teacher_id === sc.teacher_id);
      const semester = mockSemesters.find(s => s.semester_id === sc.semester_id);
      const room = sc.room_id ? mockRooms.find(r => r.room_id === sc.room_id) : undefined;
      const building = room?.building_id ? mockBuildings.find(b => b.building_id === room.building_id) : undefined;
      return {
        ...sc,
        courseName: course?.title,
        courseCode: course?.course_code,
        teacherName: teacher ? `${teacher.first_name} ${teacher.last_name}` : 'N/A',
        semesterName: semester?.name,
        roomNumber: room?.room_number,
        buildingName: building?.name,
      };
    }).sort((a,b) => b.scheduled_course_id - a.scheduled_course_id);
  }, [scheduledCoursesList]);

  const paginatedScheduledCourses = enrichedScheduledCourses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(enrichedScheduledCourses.length / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleOpenEditDialog = (scheduledCourse: EnrichedScheduledCourse) => {
    setSelectedScheduledCourse(scheduledCourse);
    setIsEditDialogOpen(true);
  };

  const handleDeleteScheduledCourse = (id: number) => {
    const courseToDelete = enrichedScheduledCourses.find(sc => sc.scheduled_course_id === id);
    if (courseToDelete) {
        setScheduledCoursesList(prev => prev.filter(sc => sc.scheduled_course_id !== id));
        toast({ title: 'Scheduled Course Deleted (Mock)', description: `Scheduled course for ${courseToDelete.courseName || 'ID: '+id} has been removed from the list.` });
    } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not find the scheduled course to delete.'});
    }
  };
  
  const handleAddScheduledCourseSubmit = async (data: ScheduleCourseFormData) => {
    setIsSubmittingDialog(true);
    console.log("New scheduled course data:", data);
    await new Promise(resolve => setTimeout(resolve, 1000)); 

    const newScheduledCourseId = Math.max(...scheduledCoursesList.map(sc => sc.scheduled_course_id), 0) + 1;
    
    let finalRoomId: number | null = null;
    if (data.room_id && data.room_id !== NO_ROOM_VALUE) {
        finalRoomId = parseInt(data.room_id);
    }

    const newScheduledCourse: ScheduledCourse = {
        scheduled_course_id: newScheduledCourseId,
        course_id: parseInt(data.course_id),
        semester_id: parseInt(data.semester_id),
        teacher_id: parseInt(data.teacher_id),
        room_id: finalRoomId,
        section_number: data.section_number,
        max_capacity: data.max_capacity,
        current_enrollment: 0, 
        days_of_week: data.days_of_week,
        start_time: data.start_time,
        end_time: data.end_time,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    setScheduledCoursesList(prev => [newScheduledCourse, ...prev]);
    
    toast({ title: 'Course Scheduled (Mock)', description: `Course has been scheduled.` });
    setIsSubmittingDialog(false);
    setIsAddDialogOpen(false);
  };

  const handleEditScheduledCourseSubmit = async (data: ScheduleCourseFormData) => {
    if (!selectedScheduledCourse) return;
    setIsSubmittingDialog(true);
    console.log("Editing scheduled course data:", selectedScheduledCourse.scheduled_course_id, data);
    await new Promise(resolve => setTimeout(resolve, 1000));

    let finalRoomId: number | null = null;
    if (data.room_id && data.room_id !== NO_ROOM_VALUE) {
        finalRoomId = parseInt(data.room_id);
    }

    setScheduledCoursesList(prevList =>
      prevList.map(sc =>
        sc.scheduled_course_id === selectedScheduledCourse.scheduled_course_id
          ? {
              ...sc,
              course_id: parseInt(data.course_id),
              semester_id: parseInt(data.semester_id),
              teacher_id: parseInt(data.teacher_id),
              room_id: finalRoomId,
              section_number: data.section_number,
              max_capacity: data.max_capacity,
              days_of_week: data.days_of_week,
              start_time: data.start_time,
              end_time: data.end_time,
              updated_at: new Date().toISOString(),
            }
          : sc
      )
    );
    
    toast({ title: 'Scheduled Course Updated (Mock)', description: `Schedule for ${selectedScheduledCourse.courseName} has been updated.` });
    setIsSubmittingDialog(false);
    setIsEditDialogOpen(false);
    setSelectedScheduledCourse(null);
  };


  const formatDisplayTime = (timeString: string | null | undefined) => {
    if (!timeString) return 'N/A';
    if (timeString.match(/(\d{1,2}:\d{2}\s*(AM|PM))/i)) return timeString;

    const [hours, minutes] = timeString.split(':');
    if (isNaN(parseInt(hours)) || isNaN(parseInt(minutes))) return 'Invalid Time';
    
    const date = new Date(2000, 0, 1, parseInt(hours), parseInt(minutes));
    return format(date, 'hh:mm a');
  };


  if (!user || (user.role !== 'Staff' && !user.isSuperAdmin)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to access this page.</p>
      </div>
    );
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
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Schedule New Course
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule New Course</DialogTitle>
                <DialogDescription>
                  Fill in the details to schedule a new course offering.
                </DialogDescription>
              </DialogHeader>
              <ScheduleCourseForm
                onSubmit={handleAddScheduledCourseSubmit}
                onCancel={() => setIsAddDialogOpen(false)}
                isSubmitting={isSubmittingDialog}
                courses={mockCourses}
                semesters={mockSemesters}
                teachers={mockTeachers}
                rooms={mockRooms}
                submitButtonText="Schedule Course"
              />
            </DialogContent>
          </Dialog>
        }
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Current & Upcoming Scheduled Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedScheduledCourses.length > 0 ? (
                paginatedScheduledCourses.map((sc) => (
                  <TableRow key={sc.scheduled_course_id}>
                    <TableCell>
                      <div className="font-medium">{sc.courseCode}</div>
                      <div className="text-xs text-muted-foreground">{sc.courseName}</div>
                    </TableCell>
                    <TableCell>{sc.teacherName}</TableCell>
                    <TableCell>{sc.semesterName}</TableCell>
                    <TableCell>{sc.section_number}</TableCell>
                    <TableCell>
                        {sc.days_of_week ? `${sc.days_of_week}, ${formatDisplayTime(sc.start_time)} - ${formatDisplayTime(sc.end_time)}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                        {sc.buildingName || 'N/A'}, {sc.roomNumber || 'N/A'}
                    </TableCell>
                    <TableCell>{sc.current_enrollment}/{sc.max_capacity}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEditDialog(sc)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteScheduledCourse(sc.scheduled_course_id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24">
                    No courses scheduled yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="self-center px-2">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
      
      {selectedScheduledCourse && (
        <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => {
          setIsEditDialogOpen(isOpen);
          if (!isOpen) setSelectedScheduledCourse(null);
        }}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Scheduled Course: {selectedScheduledCourse.courseCode} - {selectedScheduledCourse.courseName}</DialogTitle>
              <DialogDescription>
                Modify the details for this scheduled course.
              </DialogDescription>
            </DialogHeader>
            {editInitialData && (
              <ScheduleCourseForm
                onSubmit={handleEditScheduledCourseSubmit}
                onCancel={() => { setIsEditDialogOpen(false); setSelectedScheduledCourse(null); }}
                isSubmitting={isSubmittingDialog}
                courses={mockCourses}
                semesters={mockSemesters}
                teachers={mockTeachers}
                rooms={mockRooms}
                initialData={editInitialData}
                submitButtonText="Save Changes"
              />
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
