
'use client';

import { useEffect, useState, useMemo } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Building, ShieldAlert, PlusCircle, Edit, Trash2, MoreHorizontal, Loader2 } from 'lucide-react';
import { mockDepartments } from '@/lib/data';
import type { Department } from '@/types';
import AddDepartmentForm from '@/components/departments/AddDepartmentForm';
import EditDepartmentForm from '@/components/departments/EditDepartmentForm';
import { type DepartmentFormData } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';

const ITEMS_PER_PAGE = 10;

export default function DepartmentManagementPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  const [departmentsList, setDepartmentsList] = useState<Department[]>(mockDepartments);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && !user.isSuperAdmin) {
      router.replace('/dashboard');
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

  const handleDeleteDepartment = (departmentId: number) => {
    const departmentToDelete = departmentsList.find(d => d.department_id === departmentId);
    if (!departmentToDelete) return;

    setDepartmentsList(prev => prev.filter(d => d.department_id !== departmentId));
    toast({ title: 'Department Deleted (Mock)', description: `Department "${departmentToDelete.name}" has been removed.` });
  };
  
  const handleAddDepartmentSubmit = async (data: DepartmentFormData) => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

    const newDepartmentId = Math.max(...departmentsList.map(d => d.department_id), 0) + 1;
    const newDepartment: Department = {
      department_id: newDepartmentId,
      name: data.name,
      description: data.description || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setDepartmentsList(prev => [newDepartment, ...prev]);
    
    toast({
      title: 'Department Created (Mock)',
      description: `Department "${data.name}" has been created.`,
    });
    setIsSubmitting(false);
    setIsAddDialogOpen(false);
  };

  const handleEditDepartmentSubmit = async (data: DepartmentFormData) => {
    if (!editingDepartment) return;
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

    setDepartmentsList(prev => 
      prev.map(d => 
        d.department_id === editingDepartment.department_id 
          ? { 
              ...d, 
              name: data.name,
              description: data.description || null,
              updated_at: new Date().toISOString(),
            } 
          : d
      )
    );
    
    toast({
      title: 'Department Updated (Mock)',
      description: `Department "${data.name}" has been updated.`,
    });
    setIsSubmitting(false);
    setIsEditDialogOpen(false);
    setEditingDepartment(null);
  };

  if (!user || !user.isSuperAdmin) {
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
        title="Department Management" 
        description="Create, edit, and manage academic departments (Admin)."
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
                          <Button variant="ghost" size="icon">
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
