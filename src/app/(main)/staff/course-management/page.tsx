// src/app/(main)/staff/course-management/page.tsx
'use client';

import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, startTransition } from 'react';
import { BookMarked, ShieldAlert, PlusCircle, Loader2, Edit, Trash2, MoreHorizontal, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Course as PrismaCourse, Department as PrismaDepartment } from '@prisma/client';
import AddCourseForm from '@/components/courses/AddCourseForm';
import EditCourseForm from '@/components/courses/EditCourseForm';
import { NewCourseFormData, EditCourseFormData } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';
import { getAllCoursesWithDetails, createCourse, updateCourse, deleteCourse } from '@/actions/courseActions';
import { getAllDepartments } from '@/actions/departmentActions';

const ITEMS_PER_PAGE = 10;

interface CourseWithDepartmentName extends PrismaCourse {
  departmentName: string;
}

export default function CourseManagementPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddCourseDialogOpen, setIsAddCourseDialogOpen] = useState(false);
  const [isEditCourseDialogOpen, setIsEditCourseDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseWithDepartmentName | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const [coursesList, setCoursesList] = useState<CourseWithDepartmentName[]>([]);
  const [departments, setDepartments] = useState<PrismaDepartment[]>([]);

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      const [coursesData, departmentsData] = await Promise.all([
        getAllCoursesWithDetails(),
        getAllDepartments()
      ]);
      setCoursesList(coursesData.map(course => ({
        ...course,
        departmentName: course.department?.name || 'N/A',
      })));
      setDepartments(departmentsData);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load data."});
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (user && user.role !== 'Staff' && !user.is_super_admin) {
      router.replace('/dashboard');
    } else {
        fetchData();
    }
  }, [user, router]);

  const filteredCourses = useMemo(() => {
    return coursesList.filter(course => {
      const matchesSearchTerm =
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.course_code.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = selectedDepartmentFilter === 'all'
        ? true
        : (course.department_id != null && course.department_id === parseInt(selectedDepartmentFilter));
      
      return matchesSearchTerm && matchesDepartment;
    });
  }, [coursesList, searchTerm, selectedDepartmentFilter]);

  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };
  const handleOpenEditDialog = (courseToEdit: CourseWithDepartmentName) => {
    setEditingCourse(courseToEdit); setIsEditCourseDialogOpen(true);
  };

  const handleEditCourseSubmit = async (data: EditCourseFormData) => {
    if (!editingCourse) return;
    setIsSubmitting(true);
    try {
      await updateCourse(editingCourse.course_id, data);
      toast({ title: 'Course Updated', description: `Course ${data.title} has been updated.` });
      setIsEditCourseDialogOpen(false); setEditingCourse(null);
      startTransition(fetchData);
    } catch (error) { toast({ variant: 'destructive', title: 'Error', description: (error as Error).message || 'Failed to update course.' });
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteCourse = async (courseId: number) => {
    const courseToDelete = coursesList.find(c => c.course_id === courseId);
    if (!courseToDelete) return;
    if (!confirm(`Are you sure you want to delete course "${courseToDelete.title}"?`)) return;
    setIsSubmitting(true);
    try {
      await deleteCourse(courseId);
      toast({ title: 'Course Deleted', description: `Course ${courseToDelete.title} has been removed.` });
      startTransition(fetchData);
    } catch (error) { toast({ variant: 'destructive', title: 'Error', description: (error as Error).message || 'Failed to delete course.' });
    } finally { setIsSubmitting(false); }
  };

  const handleAddNewCourse = async (data: NewCourseFormData) => {
    setIsSubmitting(true);
    try {
      await createCourse(data);
      toast({ title: 'Course Created', description: `Course ${data.title} has been created.` });
      setIsAddCourseDialogOpen(false);
      startTransition(fetchData);
    } catch (error) { toast({ variant: 'destructive', title: 'Error', description: (error as Error).message || 'Failed to create course.' });
    } finally { setIsSubmitting(false); }
  };


  if (!user || (user.role !== 'Staff' && !user.is_super_admin)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
      </div>
    );
  }
  
  if (isLoadingData) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Course Management" 
        description="Manage academic courses, including creation, updates, and prerequisites."
        icon={BookMarked}
        action={
          <Dialog open={isAddCourseDialogOpen} onOpenChange={setIsAddCourseDialogOpen}>
            <DialogTrigger asChild>
              <Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Course</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader><DialogTitle>Add New Course</DialogTitle><DialogDescription>Fill details.</DialogDescription></DialogHeader>
              <AddCourseForm onSubmit={handleAddNewCourse} onCancel={() => setIsAddCourseDialogOpen(false)} departments={departments} isSubmitting={isSubmitting} />
            </DialogContent>
          </Dialog>
        }
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border rounded-lg shadow-sm bg-card">
        <div className="md:col-span-2">
          <label htmlFor="search-courses" className="block text-sm font-medium text-foreground mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input id="search-courses" type="text" placeholder="Search by title or code..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-10"/>
          </div>
        </div>
        <div>
          <label htmlFor="filter-department" className="block text-sm font-medium text-foreground mb-1">Filter by Department</label>
          <Select value={selectedDepartmentFilter} onValueChange={(value) => { setSelectedDepartmentFilter(value); setCurrentPage(1); }}>
            <SelectTrigger id="filter-department" className="w-full"><Filter className="h-4 w-4 mr-2 text-muted-foreground" /><SelectValue placeholder="All Departments" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (<SelectItem key={dept.department_id} value={String(dept.department_id)}>{dept.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Title</TableHead><TableHead>Department</TableHead><TableHead>Credits</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {paginatedCourses.length > 0 ? (
              paginatedCourses.map((course) => (
                <TableRow key={course.course_id}>
                  <TableCell className="font-medium">{course.course_code}</TableCell>
                  <TableCell>{course.title}</TableCell>
                  <TableCell>{course.departmentName}</TableCell>
                  <TableCell>{course.credits}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={isSubmitting}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEditDialog(course)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteCourse(course.course_id)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (<TableRow><TableCell colSpan={5} className="text-center h-24">No courses found.</TableCell></TableRow>)}
          </TableBody>
        </Table>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          <Button variant="outline" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Previous</Button>
          <span className="self-center px-2">Page {currentPage} of {totalPages}</span>
          <Button variant="outline" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Next</Button>
        </div>
      )}

      {editingCourse && (
        <Dialog open={isEditCourseDialogOpen} onOpenChange={(isOpen) => { setIsEditCourseDialogOpen(isOpen); if (!isOpen) setEditingCourse(null); }}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader><DialogTitle>Edit Course: {editingCourse.title}</DialogTitle></DialogHeader>
            <EditCourseForm courseToEdit={editingCourse} onSubmit={handleEditCourseSubmit} onCancel={() => { setIsEditCourseDialogOpen(false); setEditingCourse(null); }} departments={departments} isSubmitting={isSubmitting}/>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
