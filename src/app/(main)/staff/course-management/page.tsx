
'use client';

import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { BookMarked, ShieldAlert, PlusCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MoreHorizontal, Edit, Trash2, Search, Filter } from 'lucide-react';
import { mockCourses, mockDepartments } from '@/lib/data'; 
import type { Course, Department } from '@/types';
import { Badge } from '@/components/ui/badge';
import AddCourseForm from '@/components/courses/AddCourseForm';
import EditCourseForm from '@/components/courses/EditCourseForm';
import { NewCourseSchema, type NewCourseFormData, EditCourseSchema, type EditCourseFormData } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';


const ITEMS_PER_PAGE = 10;

interface CourseWithDepartmentName extends Course {
  departmentName: string;
}

export default function CourseManagementPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddCourseDialogOpen, setIsAddCourseDialogOpen] = useState(false);
  const [isEditCourseDialogOpen, setIsEditCourseDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseWithDepartmentName | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const initialCoursesWithDept = useMemo(() => {
    return mockCourses.map(course => ({
      ...course,
      departmentName: mockDepartments.find(dept => dept.department_id === course.department_id)?.name || 'N/A',
    }));
  }, []);
  const [coursesList, setCoursesList] = useState<CourseWithDepartmentName[]>(initialCoursesWithDept);


  useEffect(() => {
    if (user && user.role !== 'Staff' && !user.isSuperAdmin) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const filteredCourses = useMemo(() => {
    return coursesList.filter(course => {
      const matchesSearchTerm =
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.course_code.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = selectedDepartment === 'all'
        ? true
        : (course.department_id != null && course.department_id === parseInt(selectedDepartment));
      
      return matchesSearchTerm && matchesDepartment;
    });
  }, [coursesList, searchTerm, selectedDepartment]);

  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleOpenEditDialog = (courseToEdit: CourseWithDepartmentName) => {
    setEditingCourse(courseToEdit);
    setIsEditCourseDialogOpen(true);
  };

  const handleEditCourseSubmit = async (data: EditCourseFormData) => {
    if (!editingCourse) return;
    setIsSubmitting(true);
    console.log("Editing course data:", editingCourse.course_id, data);
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

    const department = mockDepartments.find(d => d.department_id === parseInt(data.department_id));

    setCoursesList(prev => 
      prev.map(c => 
        c.course_id === editingCourse.course_id 
          ? { 
              ...c, 
              course_code: data.course_code,
              title: data.title,
              description: data.description || null,
              credits: data.credits,
              department_id: parseInt(data.department_id),
              departmentName: department?.name || 'N/A',
              updated_at: new Date().toISOString(),
            } 
          : c
      )
    );
    
    toast({
      title: 'Course Updated (Mock)',
      description: `Course ${data.title} has been updated.`,
    });
    setIsSubmitting(false);
    setIsEditCourseDialogOpen(false);
    setEditingCourse(null);
  };

  const handleDeleteCourse = (courseId: number) => {
    const courseToDelete = coursesList.find(c => c.course_id === courseId);
    if (!courseToDelete) return;

    console.log(`Attempting to delete course: ${courseId}`);
    setCoursesList(prev => prev.filter(c => c.course_id !== courseId));
    toast({ title: 'Course Deleted (Mock)', description: `Course ${courseToDelete.title} has been removed from the list.` });
  };

  const handleAddNewCourse = async (data: NewCourseFormData) => {
    setIsSubmitting(true);
    console.log("New course data:", data);
    await new Promise(resolve => setTimeout(resolve, 1000)); 

    const newCourseId = Math.max(...coursesList.map(c => c.course_id), 0) + 1;
    const department = mockDepartments.find(d => d.department_id === parseInt(data.department_id));
    
    const newCourse: CourseWithDepartmentName = {
      course_id: newCourseId,
      course_code: data.course_code,
      title: data.title,
      description: data.description || null,
      credits: data.credits,
      department_id: parseInt(data.department_id),
      departmentName: department?.name || 'N/A',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setCoursesList(prev => [newCourse, ...prev]); 
    
    toast({
      title: 'Course Created (Mock)',
      description: `Course ${data.title} has been created.`,
    });
    setIsSubmitting(false);
    setIsAddCourseDialogOpen(false);
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
        title="Course Management" 
        description="Manage academic courses, including creation, updates, and prerequisites."
        icon={BookMarked}
        action={
          <Dialog open={isAddCourseDialogOpen} onOpenChange={setIsAddCourseDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Course
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Course</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new academic course.
                </DialogDescription>
              </DialogHeader>
              <AddCourseForm
                onSubmit={handleAddNewCourse}
                onCancel={() => setIsAddCourseDialogOpen(false)}
                departments={mockDepartments}
                isSubmitting={isSubmitting}
              />
            </DialogContent>
          </Dialog>
        }
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border rounded-lg shadow-sm bg-card">
        <div className="md:col-span-2">
          <label htmlFor="search-courses" className="block text-sm font-medium text-foreground mb-1">Search Courses</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="search-courses"
              type="text"
              placeholder="Search by title or code..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-10"
            />
          </div>
        </div>
        <div>
          <label htmlFor="filter-department" className="block text-sm font-medium text-foreground mb-1">Filter by Department</label>
          <Select value={selectedDepartment} onValueChange={(value) => { setSelectedDepartment(value); setCurrentPage(1); }}>
            <SelectTrigger id="filter-department" className="w-full">
               <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {mockDepartments.map((dept) => (
                <SelectItem key={dept.department_id} value={String(dept.department_id)}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course Code</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
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
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEditDialog(course)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteCourse(course.course_id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  No courses found matching your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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

      {editingCourse && (
        <Dialog open={isEditCourseDialogOpen} onOpenChange={(isOpen) => {
          setIsEditCourseDialogOpen(isOpen);
          if (!isOpen) setEditingCourse(null);
        }}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Course: {editingCourse.title}</DialogTitle>
              <DialogDescription>
                Modify the course details below.
              </DialogDescription>
            </DialogHeader>
            <EditCourseForm
              courseToEdit={editingCourse}
              onSubmit={handleEditCourseSubmit}
              onCancel={() => { setIsEditCourseDialogOpen(false); setEditingCourse(null); }}
              departments={mockDepartments}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

    