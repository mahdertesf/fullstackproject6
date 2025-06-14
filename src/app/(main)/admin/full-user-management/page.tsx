// src/app/(main)/admin/full-user-management/page.tsx
'use client';

import { useEffect, useState, useMemo, startTransition } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Users, ShieldAlert, PlusCircle, Edit, Trash2, Search, Filter, MoreHorizontal, Loader2 } from 'lucide-react';
import type { UserProfile as FullUserProfile, UserRole, Department as PrismaDepartment } from '@prisma/client'; // Use Prisma types
import { Badge } from '@/components/ui/badge';
import AddUserForm from '@/components/users/AddUserForm';
import EditUserForm from '@/components/users/EditUserForm';
import { NewUserFormData, EditUserFormData } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';
import { getAllUsers, createUser, updateUser, deleteUser } from '@/actions/userActions';
import { getAllDepartments } from '@/actions/departmentActions'; // To fetch departments

const ITEMS_PER_PAGE = 10;

export default function FullUserManagementPage() {
  const { user: currentUser } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<FullUserProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [usersList, setUsersList] = useState<FullUserProfile[]>([]);
  const [departments, setDepartments] = useState<PrismaDepartment[]>([]);

  const fetchPageData = async () => {
    setIsLoadingData(true);
    try {
      const [usersData, departmentsData] = await Promise.all([
        getAllUsers({ searchTerm, role: selectedRole }, currentUser?.user_id, currentUser?.is_super_admin),
        getAllDepartments()
      ]);
      setUsersList(usersData);
      setDepartments(departmentsData);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load page data.' });
    } finally {
      setIsLoadingData(false);
    }
  };
  
  useEffect(() => {
    if (currentUser && !currentUser.is_super_admin) {
      router.replace('/dashboard'); 
    } else if (currentUser?.is_super_admin) {
      fetchPageData();
    }
  }, [currentUser, router]);

  useEffect(() => {
    if (currentUser?.is_super_admin) {
        const handler = setTimeout(() => {
             startTransition(() => { fetchPageData(); });
        }, 300);
        return () => clearTimeout(handler);
    }
  }, [searchTerm, selectedRole, currentUser?.is_super_admin]);


  const paginatedUsers = usersList.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(usersList.length / ITEMS_PER_PAGE);
  
  const handleOpenEditDialog = (userToEdit: FullUserProfile) => {
    setEditingUser(userToEdit);
    setIsEditUserDialogOpen(true);
  };

  const handleEditUserSubmit = async (data: EditUserFormData) => {
    if (!editingUser || !currentUser) return;
    setIsSubmitting(true);
    try {
      await updateUser(editingUser.user_id, data, currentUser.user_id);
      toast({ title: 'User Updated', description: `User ${data.username} has been updated.` });
      setIsEditUserDialogOpen(false);
      setEditingUser(null);
      startTransition(() => { fetchPageData(); });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: (error as Error).message || 'Failed to update user.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    const userToDelete = usersList.find(u => u.user_id === userId);
    if (!userToDelete || !currentUser) return;

     if (!confirm(`Are you sure you want to delete user "${userToDelete.username}"? This action cannot be undone.`)) {
        return;
    }
    setIsSubmitting(true); 
    try {
      await deleteUser(userId, currentUser.user_id);
      toast({ title: 'User Deleted', description: `User ${userToDelete.username} has been removed.` });
      startTransition(() => { fetchPageData(); });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: (error as Error).message || 'Failed to delete user.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleAddNewUser = async (data: NewUserFormData) => {
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      await createUser(data, currentUser.role, currentUser.is_super_admin);
      toast({ title: 'User Created', description: `User ${data.username} has been created.` });
      setIsAddUserDialogOpen(false);
      startTransition(() => { fetchPageData(); });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: (error as Error).message || 'Failed to create user.' });
    } finally {
      setIsSubmitting(false);
    }
  };


  if (!currentUser || !currentUser.is_super_admin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to access this page.</p>
      </div>
    );
  }
  
  const availableRoles: UserRole[] = ['Student', 'Teacher', 'Staff'];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Full User Management" 
        description="Manage all user accounts across the system (Admin)."
        icon={Users}
        action={
          <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New User (Admin)</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new user account. Admins can create Staff roles.
                </DialogDescription>
              </DialogHeader>
              <AddUserForm
                onSubmit={handleAddNewUser}
                onCancel={() => setIsAddUserDialogOpen(false)}
                availableRoles={availableRoles}
                isSubmitting={isSubmitting}
                departments={departments}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border rounded-lg shadow-sm bg-card">
        <div className="md:col-span-2">
          <label htmlFor="search-users-admin" className="block text-sm font-medium text-foreground mb-1">Search Users</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="search-users-admin"
              type="text"
              placeholder="Search by name, username, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div>
          <label htmlFor="filter-role-admin" className="block text-sm font-medium text-foreground mb-1">Filter by Role</label>
          <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole | 'all')}>
            <SelectTrigger id="filter-role-admin" className="w-full">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="Student">Student</SelectItem>
              <SelectItem value="Teacher">Teacher</SelectItem>
              <SelectItem value="Staff">Staff</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {isLoadingData ? (
         <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
      <Card>
        <CardHeader>
          <CardTitle>All Users ({usersList.length})</CardTitle>
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell>
                      <div className="font-medium">{u.first_name || ''} {u.last_name || ''}</div>
                      {(!u.first_name && !u.last_name) && <span className="text-muted-foreground italic">N/A</span>}
                    </TableCell>
                    <TableCell>{u.username}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'Student' ? 'secondary' : u.role === 'Teacher' ? 'outline' : 'default'}>
                        {u.is_super_admin ? 'Super Admin' : u.role}
                      </Badge>
                    </TableCell>
                     <TableCell>{u.student_profile?.department?.name || u.teacher_profile?.department?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={u.is_active ? 'default' : 'destructive'} className={u.is_active ? 'bg-green-500 hover:bg-green-600' : ''}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button 
                            variant="ghost" 
                            size="icon" 
                            disabled={
                                (u.is_super_admin && currentUser?.user_id === u.user_id) || // Super admin cannot perform actions on themselves via this menu
                                isSubmitting
                            }
                           >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleOpenEditDialog(u)}
                            disabled={u.is_super_admin && currentUser?.user_id === u.user_id } // Cannot edit self if super admin
                          >
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteUser(u.user_id)} 
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            disabled={u.user_id === currentUser?.user_id || (u.is_super_admin && !currentUser?.is_super_admin)} // Cannot delete self, non-SA cannot delete SA
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24"> 
                    No users found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      )}
        {totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="mx-2 self-center">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {editingUser && (
        <Dialog open={isEditUserDialogOpen} onOpenChange={(isOpen) => {
          setIsEditUserDialogOpen(isOpen);
          if (!isOpen) setEditingUser(null);
        }}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit User: {editingUser.username}</DialogTitle>
              <DialogDescription>
                Modify the user details below. As an Admin, you can manage all roles.
              </DialogDescription>
            </DialogHeader>
            <EditUserForm
              userToEdit={editingUser}
              onSubmit={handleEditUserSubmit}
              onCancel={() => { setIsEditUserDialogOpen(false); setEditingUser(null); }}
              availableRoles={availableRoles}
              isSubmitting={isSubmitting}
              currentUserRole={currentUser?.role}
              isCurrentUserSuperAdmin={currentUser?.is_super_admin}
              departments={departments}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
