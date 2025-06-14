// src/app/(main)/staff/semester-management/page.tsx
'use client';

import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, startTransition } from 'react';
import { BarChart3, ShieldAlert, PlusCircle, Edit, Trash2, MoreHorizontal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Semester as PrismaSemester } from '@prisma/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import AddSemesterForm from '@/components/semesters/AddSemesterForm';
import EditSemesterForm from '@/components/semesters/EditSemesterForm';
import { type NewSemesterFormData } from '@/lib/schemas';
import { getAllSemesters, createSemester, updateSemester, deleteSemester } from '@/actions/semesterActions';

const ITEMS_PER_PAGE = 10;

export default function SemesterManagementPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  const [semestersList, setSemestersList] = useState<PrismaSemester[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState<PrismaSemester | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSemesters = async () => {
    setIsLoadingData(true);
    try {
      const data = await getAllSemesters();
      setSemestersList(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load semesters.' });
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (user && user.role !== 'Staff' && !user.is_super_admin) {
      router.replace('/dashboard');
    } else {
        fetchSemesters();
    }
  }, [user, router]);

  const paginatedSemesters = useMemo(() => {
    return semestersList.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [semestersList, currentPage]);

  const totalPages = Math.ceil(semestersList.length / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };
  const handleOpenEditDialog = (semester: PrismaSemester) => {
    setEditingSemester(semester); setIsEditDialogOpen(true);
  };
  const handleDeleteSemesterSubmit = async (semesterId: number) => {
    const semesterToDelete = semestersList.find(s => s.semester_id === semesterId);
    if (!semesterToDelete || !confirm(`Are you sure you want to delete semester "${semesterToDelete.name}"?`)) return;
    setIsSubmitting(true);
    try {
      await deleteSemester(semesterId);
      toast({ title: 'Semester Deleted', description: `Semester ${semesterToDelete.name} has been removed.` });
      startTransition(fetchSemesters);
    } catch (error) { toast({ variant: 'destructive', title: 'Error', description: (error as Error).message || 'Failed to delete semester.' });
    } finally { setIsSubmitting(false); }
  };
  
  const handleAddSemesterSubmit = async (data: NewSemesterFormData) => {
    setIsSubmitting(true);
    try {
      await createSemester(data);
      toast({ title: 'Semester Created', description: `Semester ${data.name} has been created.` });
      setIsAddDialogOpen(false);
      startTransition(fetchSemesters);
    } catch (error) { toast({ variant: 'destructive', title: 'Error', description: (error as Error).message || 'Failed to create semester.' });
    } finally { setIsSubmitting(false); }
  };

  const handleEditSemesterSubmit = async (data: NewSemesterFormData) => {
    if (!editingSemester) return;
    setIsSubmitting(true);
    try {
      await updateSemester(editingSemester.semester_id, data);
      toast({ title: 'Semester Updated', description: `Semester ${data.name} has been updated.` });
      setIsEditDialogOpen(false); setEditingSemester(null);
      startTransition(fetchSemesters);
    } catch (error) { toast({ variant: 'destructive', title: 'Error', description: (error as Error).message || 'Failed to update semester.' });
    } finally { setIsSubmitting(false); }
  };


  if (!user || (user.role !== 'Staff' && !user.is_super_admin)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" /><h2 className="text-2xl font-bold mb-2">Access Denied</h2>
      </div>
    );
  }
  if (isLoadingData) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Semester Management" 
        description="Manage academic semesters, terms, and important dates."
        icon={BarChart3}
        action={
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Semester</Button></DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader><DialogTitle>Add New Semester</DialogTitle><DialogDescription>Fill details.</DialogDescription></DialogHeader>
              <AddSemesterForm onSubmit={handleAddSemesterSubmit} onCancel={() => setIsAddDialogOpen(false)} isSubmitting={isSubmitting}/>
            </DialogContent>
          </Dialog>
        }
      />
      
      <Card>
        <CardHeader><CardTitle>Current & Upcoming Semesters</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Academic Year</TableHead><TableHead>Term</TableHead><TableHead>Start Date</TableHead><TableHead>End Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
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
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={isSubmitting}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEditDialog(semester)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteSemesterSubmit(semester.semester_id)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (<TableRow><TableCell colSpan={6} className="text-center h-24">No semesters found.</TableCell></TableRow>)}
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

      {editingSemester && (
        <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => { setIsEditDialogOpen(isOpen); if (!isOpen) setEditingSemester(null); }}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader><DialogTitle>Edit Semester: {editingSemester.name}</DialogTitle></DialogHeader>
            <EditSemesterForm semesterToEdit={editingSemester} onSubmit={handleEditSemesterSubmit} onCancel={() => { setIsEditDialogOpen(false); setEditingSemester(null); }} isSubmitting={isSubmitting}/>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
