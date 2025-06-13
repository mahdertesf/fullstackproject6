
'use client';

import { useState, useMemo, useEffect } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { mockUserProfiles, mockUsers } from '@/lib/data'; 
import type { UserProfile, UserRole } from '@/types';
import { Users, Edit, Trash2, PlusCircle, Search, Filter, MoreHorizontal, ShieldAlert, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import AddUserForm from '@/components/users/AddUserForm';
import EditUserForm from '@/components/users/EditUserForm';
import { NewUserFormData, EditUserFormData } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';

const ITEMS_PER_PAGE = 10;

export default function UserManagementPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usersList, setUsersList] = useState<UserProfile[]>(mockUserProfiles);

  useEffect(() => {
    if (user && user.role !== 'Staff' && !user.isSuperAdmin) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        u.username.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower) ||
        (u.first_name && u.first_name.toLowerCase().includes(searchLower)) ||
        (u.last_name && u.last_name.toLowerCase().includes(searchLower));

      const matchesRole = selectedRole === 'all' ? true : u.role === selectedRole;
      
      if (user?.isSuperAdmin) return matchesSearch && matchesRole;
      // Staff can see Students and Teachers, but not other Staff (unless they are also super admin, handled above)
      if (user?.role === 'Staff') {
        return matchesSearch && matchesRole && (u.role === 'Student' || u.role === 'Teacher');
      }
      return false; 
    });
  }, [searchTerm, selectedRole, user, usersList]);

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleOpenEditDialog = (userToEdit: UserProfile) => {
    if (user?.role === 'Staff' && !user?.isSuperAdmin && userToEdit.role === 'Staff') {
        toast({
            variant: 'destructive',
            title: 'Permission Denied',
            description: 'Staff users cannot edit other Staff user accounts.',
        });
        return;
    }
    if (user?.role === 'Staff' && !user?.isSuperAdmin && userToEdit.isSuperAdmin) {
        toast({
            variant: 'destructive',
            title: 'Permission Denied',
            description: 'Staff users cannot edit Super Admin accounts.',
        });
        return;
    }
    setEditingUser(userToEdit);
    setIsEditUserDialogOpen(true);
  };
  
  const handleEditUserSubmit = async (data: EditUserFormData) => {
    if (!editingUser) return;
    setIsSubmitting(true);
    console.log("Editing user data:", editingUser.user_id, data);
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

    setUsersList(prev => 
      prev.map(u => 
        u.user_id === editingUser.user_id 
          ? { 
              ...u, 
              username: data.username,
              email: data.email,
              first_name: data.firstName,
              last_name: data.lastName,
              role: data.role,
              is_active: data.is_active,
              updated_at: new Date().toISOString(),
            } 
          : u
      )
    );
    
    toast({
      title: 'User Updated (Mock)',
      description: `User ${data.username} has been updated.`,
    });
    setIsSubmitting(false);
    setIsEditUserDialogOpen(false);
    setEditingUser(null);
  };


  const handleDeleteUser = (userId: number) => {
    const userToDelete = usersList.find(u => u.user_id === userId);
    if (user?.role === 'Staff' && !user.isSuperAdmin && userToDelete?.role === 'Staff') {
         toast({ variant: 'destructive', title: 'Permission Denied', description: 'Staff cannot delete other Staff accounts.' });
         return;
    }
    if (user?.role === 'Staff' && !user.isSuperAdmin && userToDelete?.isSuperAdmin) {
        toast({ variant: 'destructive', title: 'Permission Denied', description: 'Staff cannot delete Super Admin accounts.'});
        return;
    }
    if (userToDelete?.isSuperAdmin && user?.user_id === userToDelete.user_id) {
        toast({ variant: 'destructive', title: 'Action Denied', description: 'Super Admins cannot delete their own account.'});
        return;
    }

    console.log(`Delete user: ${userId}`);
    // Mock deletion:
    // setUsersList(prev => prev.filter(u => u.user_id !== userId));
    toast({ title: 'Delete User (Not Implemented)', description: `Functionality to delete user ${userId} is not yet fully implemented. Mocked.` });
  };

  const handleAddNewUser = async (data: NewUserFormData) => {
    setIsSubmitting(true);
    console.log("New user data:", data);
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    
    const newUserId = Math.max(...usersList.map(u => u.user_id), 0) + 1;
    const newUserProfile: UserProfile = {
      user_id: newUserId,
      username: data.username,
      email: data.email,
      role: data.role,
      first_name: data.firstName,
      last_name: data.lastName,
      is_active: true, 
      password_hash: 'mock_hash', 
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      isSuperAdmin: data.role === 'Staff' ? false : undefined, // Staff cannot create super admins
    };
    setUsersList(prev => [...prev, newUserProfile]);
    
    toast({
      title: 'User Created (Mock)',
      description: `User ${data.username} has been created.`,
    });
    setIsSubmitting(false);
    setIsAddUserDialogOpen(false);
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
  
  const availableRolesForNewUser: UserRole[] = user.isSuperAdmin ? ['Student', 'Teacher', 'Staff'] : ['Student', 'Teacher'];
  const availableRolesForEdit: UserRole[] = user.isSuperAdmin ? ['Student', 'Teacher', 'Staff'] : ['Student', 'Teacher'];


  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage student and teacher accounts."
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
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new user account. Staff can create Student or Teacher roles.
                </DialogDescription>
              </DialogHeader>
              <AddUserForm
                onSubmit={handleAddNewUser}
                onCancel={() => setIsAddUserDialogOpen(false)}
                availableRoles={availableRolesForNewUser}
                isSubmitting={isSubmitting}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border rounded-lg shadow-sm bg-card">
        <div className="md:col-span-2">
          <label htmlFor="search-users" className="block text-sm font-medium text-foreground mb-1">Search Users</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="search-users"
              type="text"
              placeholder="Search by name, username, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div>
          <label htmlFor="filter-role" className="block text-sm font-medium text-foreground mb-1">Filter by Role</label>
          <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole | 'all')}>
            <SelectTrigger id="filter-role" className="w-full">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="Student">Student</SelectItem>
              <SelectItem value="Teacher">Teacher</SelectItem>
              {user?.isSuperAdmin && <SelectItem value="Staff">Staff</SelectItem>}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
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
                      {u.isSuperAdmin ? 'Admin' : u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.is_active ? 'default' : 'destructive'} className={u.is_active ? 'bg-green-500 hover:bg-green-600' : ''}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={u.isSuperAdmin && !user?.isSuperAdmin && user?.user_id !== u.user_id}>
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                            onClick={() => handleOpenEditDialog(u)}
                            disabled={(user?.role === 'Staff' && !user?.isSuperAdmin && (u.role === 'Staff' || u.isSuperAdmin))}
                        >
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                            onClick={() => handleDeleteUser(u.user_id)} 
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            disabled={ (user?.role === 'Staff' && !user?.isSuperAdmin && (u.role === 'Staff' || u.isSuperAdmin)) || (u.isSuperAdmin && u.user_id === user?.user_id) }
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
                <TableCell colSpan={6} className="text-center h-24">
                  No users found matching your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      {filteredUsers.length > ITEMS_PER_PAGE && (
        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="mx-4 self-center">
            Page {currentPage} of {Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredUsers.length / ITEMS_PER_PAGE), p + 1))}
            disabled={currentPage === Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)}
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
                Modify the user details below.
              </DialogDescription>
            </DialogHeader>
            <EditUserForm
              userToEdit={editingUser}
              onSubmit={handleEditUserSubmit}
              onCancel={() => { setIsEditUserDialogOpen(false); setEditingUser(null); }}
              availableRoles={availableRolesForEdit}
              isSubmitting={isSubmitting}
              currentUserRole={user?.role}
              isCurrentUserSuperAdmin={user?.isSuperAdmin}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
