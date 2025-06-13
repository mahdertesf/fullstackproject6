
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
    return semestersList.slice(
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
    // For now, the edit form is just a placeholder
    toast({ title: 'Edit Semester (Mock)', description: `Dialog to edit ${semester.name} would open here.` });
    setIsEditDialogOpen(false); // Close immediately as it's a placeholder
  };

  const handleDeleteSemester = (semesterId: number) => {
    const semesterToDelete = semestersList.find(s => s.semester_id === semesterId);
    if (!semesterToDelete) return;

    console.log(`Attempting to delete semester: ${semesterId}`);
    // Mock deletion
    setSemestersList(prev => prev.filter(s => s.semester_id !== semesterId));
    toast({ title: 'Semester Deleted (Mock)', description: `Semester ${semesterToDelete.name} has been removed.` });
  };
  
  const handleAddSemester = async () => {
    // Placeholder for adding a new semester - will need a form
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({ title: 'Add Semester (Mock)', description: 'A new semester would be added here after filling a form.'});
    setIsSubmitting(false);
    setIsAddDialogOpen(false);
  }


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
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Semester (Mock)</DialogTitle>
                <DialogDescription>
                  Semester creation form will be implemented here.
                </DialogDescription>
              </DialogHeader>
              {/* Placeholder for AddSemesterForm */}
              <div className="py-4 text-center text-muted-foreground">
                <p>Form to add a new semester will go here.</p>
              </div>
               <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button onClick={handleAddSemester} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Semester (Mock)
                </Button>
              </div>
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
                            <Edit className="mr-2 h-4 w-4" /> Edit (Mock)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteSemester(semester.semester_id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete (Mock)
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

       {/* Edit Dialog (Placeholder) - In a real app, this would have its own form */}
      {editingSemester && isEditDialogOpen && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Semester: {editingSemester.name} (Mock)</DialogTitle>
              <DialogDescription>
                Semester editing form will be implemented here.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 text-center text-muted-foreground">
                <p>Form to edit semester details for "{editingSemester.name}" will go here.</p>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => { /* Mock save */ toast({title: "Changes Saved (Mock)"}); setIsEditDialogOpen(false); }}>Save Changes (Mock)</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
        