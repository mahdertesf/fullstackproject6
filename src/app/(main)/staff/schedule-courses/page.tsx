
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
import { format } from 'date-fns';

interface EnrichedScheduledCourse extends ScheduledCourse {
  courseName?: string;
  courseCode?: string;
  teacherName?: string;
  semesterName?: string;
  roomNumber?: string;
  buildingName?: string;
}

const ITEMS_PER_PAGE = 10;

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
    });
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
  
  const handleMockDialogSubmit = async (action: 'add' | 'edit') => {
    setIsSubmittingDialog(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    if (action === 'add') {
      toast({ title: 'Schedule Submitted (Mock)', description: 'New course schedule has been notionally submitted.' });
      setIsAddDialogOpen(false);
    } else if (action === 'edit' && selectedScheduledCourse) {
      toast({ title: 'Changes Saved (Mock)', description: `Changes for ${selectedScheduledCourse.courseName} have been notionally saved.` });
      setIsEditDialogOpen(false);
      setSelectedScheduledCourse(null);
    }
    setIsSubmittingDialog(false);
  };

  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return 'N/A';
    // Check if timeString is already in hh:mm a format from previous processing or if it's HH:mm:ss
    if (timeString.match(/(\d{1,2}:\d{2}\s*(AM|PM))/i)) return timeString;

    const [hours, minutes] = timeString.split(':');
    if (isNaN(parseInt(hours)) || isNaN(parseInt(minutes))) return 'Invalid Time';
    
    const date = new Date(0, 0, 0, parseInt(hours), parseInt(minutes));
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
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Schedule New Course</DialogTitle>
                <DialogDescription>
                  The form to schedule a new course with all relevant details (course, teacher, semester, room, time, etc.) will be implemented here.
                </DialogDescription>
              </DialogHeader>
              {/* Placeholder for AddScheduleForm */}
              <div className="py-4 text-center text-muted-foreground">
                (Add Schedule Form will appear here)
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmittingDialog}>
                  Cancel
                </Button>
                <Button onClick={() => handleMockDialogSubmit('add')} disabled={isSubmittingDialog}>
                  {isSubmittingDialog && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit (Mock)
                </Button>
              </DialogFooter>
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
                        {sc.days_of_week ? `${sc.days_of_week}, ${formatTime(sc.start_time)} - ${formatTime(sc.end_time)}` : 'N/A'}
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
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Scheduled Course: {selectedScheduledCourse.courseName}</DialogTitle>
              <DialogDescription>
                The form to edit this scheduled course (ID: {selectedScheduledCourse.scheduled_course_id}) will be implemented here.
              </DialogDescription>
            </DialogHeader>
            {/* Placeholder for EditScheduleForm */}
            <div className="py-4 text-center text-muted-foreground">
              (Edit Schedule Form will appear here for {selectedScheduledCourse.courseCode} - {selectedScheduledCourse.courseName})
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setSelectedScheduledCourse(null); }} disabled={isSubmittingDialog}>
                Cancel
              </Button>
              <Button onClick={() => handleMockDialogSubmit('edit')} disabled={isSubmittingDialog}>
                {isSubmittingDialog && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes (Mock)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
