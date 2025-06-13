// src/app/(main)/staff/semester-management/page.tsx

'use client';

import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { BarChart3, ShieldAlert, PlusCircle, Edit, Trash2, MoreHorizontal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { mockSemesters } from '@/lib/data';
import type { Semester } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import AddSemesterForm from '@/components/semesters/AddSemesterForm';
import EditSemesterForm from '@/components/semesters/EditSemesterForm';
import { type NewSemesterFormData } from '@/lib/schemas';

const ITEMS_PER_PAGE = 10;

export default function SemesterManagementPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  const [semestersList, setSemestersList] = useState<Semester[]>(mockSemesters);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'Staff' && !user.isSuperAdmin) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const paginatedSemesters = useMemo(() => {
    const sortedSemesters = [...semestersList].sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
    return sortedSemesters.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [semestersList, currentPage]);

  const totalPages = Math.ceil(semestersList.length / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleOpenEditDialog = (semester: Semester) => {
    setEditingSemester(semester);
    setIsEditDialogOpen(true);
  };

  const handleDeleteSemester = (semesterId: number) => {
    const semesterToDelete = semestersList.find(s => s.semester_id === semesterId);
    if (!semesterToDelete) return;

    console.log(`Attempting to delete semester: ${semesterId}`);
    setSemestersList(prev => prev.filter(s => s.semester_id !== semesterId));
    toast({ title: 'Semester Deleted (Mock)', description: `Semester ${semesterToDelete.name} has been removed from the list.` });
  };
  
  const handleAddSemesterSubmit = async (data: NewSemesterFormData) => {
    setIsSubmitting(true);
    console.log("New semester data:", data);
    await new Promise(resolve => setTimeout(resolve, 1000)); 

    const newSemesterId = Math.max(...semestersList.map(s => s.semester_id), 0) + 1;
    const newSemester: Semester = {
      semester_id: newSemesterId,
      name: data.name,
      academic_year: data.academic_year,
      term: data.term,
      start_date: format(data.start_date, 'yyyy-MM-dd'),
      end_date: format(data.end_date, 'yyyy-MM-dd'),
      registration_start_date: data.registration_start_date.toISOString(),
      registration_end_date: data.registration_end_date.toISOString(),
      add_drop_start_date: data.add_drop_start_date.toISOString(),
      add_drop_end_date: data.add_drop_end_date.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setSemestersList(prev => [newSemester, ...prev]);
    
    toast({
      title: 'Semester Created (Mock)',
      description: `Semester ${data.name} has been created.`,
    });
    setIsSubmitting(false);
    setIsAddDialogOpen(false);
  };

  const handleEditSemesterSubmit = async (data: NewSemesterFormData) => {
    if (!editingSemester) return;
    setIsSubmitting(true);
    console.log("Editing semester data:", editingSemester.semester_id, data);
    await new Promise(resolve => setTimeout(resolve, 1000));

    setSemestersList(prev => 
      prev.map(s => 
        s.semester_id === editingSemester.semester_id 
          ? { 
              ...s, 
              name: data.name,
              academic_year: data.academic_year,
              term: data.term,
              start_date: format(data.start_date, 'yyyy-MM-dd'),
              end_date: format(data.end_date, 'yyyy-MM-dd'),
              registration_start_date: data.registration_start_date.toISOString(),
              registration_end_date: data.registration_end_date.toISOString(),
              add_drop_start_date: data.add_drop_start_date.toISOString(),
              add_drop_end_date: data.add_drop_end_date.toISOString(),
              updated_at: new Date().toISOString(),
            } 
          : s
      )
    );
    
    toast({
      title: 'Semester Updated (Mock)',
      description: `Semester ${data.name} has been updated.`,
    });
    setIsSubmitting(false);
    setIsEditDialogOpen(false);
    setEditingSemester(null);
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
        title="Semester Management" 
        description="Manage academic semesters, terms, and important dates."
        icon={BarChart3}
        action={
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Semester
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Semester</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new academic semester.
                </DialogDescription>
              </DialogHeader>
              <AddSemesterForm
                onSubmit={handleAddSemesterSubmit}
                onCancel={() => setIsAddDialogOpen(false)}
                isSubmitting={isSubmitting}
              />
            </DialogContent>
          </Dialog>
        }
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Current & Upcoming Semesters</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSemesters.length > 0 ? (
                paginatedSemesters.map((semester) => (
                  <TableRow key={semester.semester_id}>
                    <TableCell className="font-medium">{semester.name}</TableCell>
                    <TableCell>{semester.academic_year}</TableCell>
                    <TableCell>{semester.term}</TableCell>
                    <TableCell>{format(new Date(semester.start_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{format(new Date(semester.end_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEditDialog(semester)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteSemester(semester.semester_id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    No semesters found.
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

      {editingSemester && (
        <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => {
          setIsEditDialogOpen(isOpen);
          if (!isOpen) setEditingSemester(null);
        }}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Semester: {editingSemester.name}</DialogTitle>
              <DialogDescription>
                Modify the semester details below.
              </DialogDescription>
            </DialogHeader>
            <EditSemesterForm
              semesterToEdit={editingSemester}
              onSubmit={handleEditSemesterSubmit}
              onCancel={() => { setIsEditDialogOpen(false); setEditingSemester(null); }}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
        
