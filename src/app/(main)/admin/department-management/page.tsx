// src/app/(main)/admin/department-management/page.tsx
'use client';

import { useEffect, useState, useMemo, startTransition } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Building, ShieldAlert, PlusCircle, Edit, Trash2, MoreHorizontal, Loader2 } from 'lucide-react';
import type { Department } from '@prisma/client';
import AddDepartmentForm from '@/components/departments/AddDepartmentForm';
import EditDepartmentForm from '@/components/departments/EditDepartmentForm';
import { type DepartmentFormData } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';
import { getAllDepartments, createDepartment, updateDepartment, deleteDepartment } from '@/actions/departmentActions';

const ITEMS_PER_PAGE = 10;

export default function DepartmentManagementPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  const [departmentsList, setDepartmentsList] = useState<Department[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDepartments = async () => {
    setIsLoadingData(true);
    try {
      const data = await getAllDepartments();
      setDepartmentsList(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load departments.' });
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (user && !user.is_super_admin) { // Check is_super_admin
      router.replace('/dashboard');
    } else {
      fetchDepartments();
    }
  }, [user, router]);

  const paginatedDepartments = useMemo(() => {
    return departmentsList.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [departmentsList, currentPage]);

  const totalPages = Math.ceil(departmentsList.length / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleOpenEditDialog = (department: Department) => {
    setEditingDepartment(department);
    setIsEditDialogOpen(true);
  };

  const handleDeleteDepartment = async (departmentId: number) => {
    const departmentToDelete = departmentsList.find(d => d.department_id === departmentId);
    if (!departmentToDelete) return;
    
    if (!confirm(`Are you sure you want to delete department "${departmentToDelete.name}"? This action cannot be undone.`)) {
        return;
    }

    setIsSubmitting(true); // Indicate loading for delete
    try {
      await deleteDepartment(departmentId);
      toast({ title: 'Department Deleted', description: `Department "${departmentToDelete.name}" has been removed.` });
      startTransition(() => {
         fetchDepartments(); // Re-fetch
      });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: (error as Error).message || 'Failed to delete department.' });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleAddDepartmentSubmit = async (data: DepartmentFormData) => {
    setIsSubmitting(true);
    try {
      await createDepartment(data);
      toast({ title: 'Department Created', description: `Department "${data.name}" has been created.` });
      setIsAddDialogOpen(false);
      startTransition(() => {
         fetchDepartments(); // Re-fetch
      });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: (error as Error).message || 'Failed to create department.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDepartmentSubmit = async (data: DepartmentFormData) => {
    if (!editingDepartment) return;
    setIsSubmitting(true);
    try {
      await updateDepartment(editingDepartment.department_id, data);
      toast({ title: 'Department Updated', description: `Department "${data.name}" has been updated.` });
      setIsEditDialogOpen(false);
      setEditingDepartment(null);
      startTransition(() => {
         fetchDepartments(); // Re-fetch
      });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: (error as Error).message || 'Failed to update department.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || !user.is_super_admin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to access this page.</p>
      </div>
    );
  }
  
  if (isLoadingData) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }


  return (
    <div className="space-y-6">
      <PageHeader 
        title="Department Management" 
        description="Create, edit, and manage academic departments."
        icon={Building}
        action={
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Department
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Department</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new academic department.
                </DialogDescription>
              </DialogHeader>
              <AddDepartmentForm
                onSubmit={handleAddDepartmentSubmit}
                onCancel={() => setIsAddDialogOpen(false)}
                isSubmitting={isSubmitting}
              />
            </DialogContent>
          </Dialog>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Manage Departments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDepartments.length > 0 ? (
                paginatedDepartments.map((department) => (
                  <TableRow key={department.department_id}>
                    <TableCell className="font-medium">{department.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-xs">{department.description || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={isSubmitting}>
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEditDialog(department)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteDepartment(department.department_id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center h-24">
                    No departments found.
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

      {editingDepartment && (
        <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => {
          setIsEditDialogOpen(isOpen);
          if (!isOpen) setEditingDepartment(null);
        }}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Department: {editingDepartment.name}</DialogTitle>
              <DialogDescription>
                Modify the department details below.
              </DialogDescription>
            </DialogHeader>
            <EditDepartmentForm
              departmentToEdit={editingDepartment}
              onSubmit={handleEditDepartmentSubmit}
              onCancel={() => { setIsEditDialogOpen(false); setEditingDepartment(null); }}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
