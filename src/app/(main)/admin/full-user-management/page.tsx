
'use client';

import { useEffect, useState, useMemo } from 'react';
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
import { mockUserProfiles, mockUsers } from '@/lib/data';
import type { UserProfile, UserRole } from '@/types';
import { Badge } from '@/components/ui/badge';
import AddUserForm from '@/components/users/AddUserForm';
import { NewUserFormData } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';

const ITEMS_PER_PAGE = 10;

export default function FullUserManagementPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usersList, setUsersList] = useState<UserProfile[]>(mockUserProfiles);


  useEffect(() => {
    if (user && !user.isSuperAdmin) {
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
      return matchesSearch && matchesRole;
    });
  }, [searchTerm, selectedRole, usersList]);

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  const handleEditUser = (userId: number) => {
    console.log(`Edit user: ${userId}`);
    toast({ title: 'Edit User (Not Implemented)', description: `Functionality to edit user ${userId} is not yet implemented.` });
  };

  const handleDeleteUser = (userId: number) => {
    console.log(`Delete user: ${userId}`);
    toast({ title: 'Delete User (Not Implemented)', description: `Functionality to delete user ${userId} is not yet implemented.` });
  };

  const handleAddNewUser = async (data: NewUserFormData) => {
    setIsSubmitting(true);
    console.log("New user data (Admin):", data);
    // Mock adding user
    await new Promise(resolve => setTimeout(resolve, 1000)); 

    const newUserId = Math.max(...mockUsers.map(u => u.user_id), 0) + 1;
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
      isSuperAdmin: data.role === 'Staff' ? false : undefined, // Example: new staff are not super by default
    };
    setUsersList(prev => [...prev, newUserProfile]);

    toast({
      title: 'User Created (Mock)',
      description: `User ${data.username} has been created.`,
    });
    setIsSubmitting(false);
    setIsAddUserDialogOpen(false);
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
                availableRoles={['Student', 'Teacher', 'Staff']}
                isSubmitting={isSubmitting}
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
      
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
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
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditUser(u.user_id)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteUser(u.user_id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
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
        </CardContent>
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
    </div>
  );
}
