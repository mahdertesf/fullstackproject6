
'use client';

import { useState, useMemo, useEffect } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card } from '@/components/ui/card'; // Added Card import
import { mockUserProfiles } from '@/lib/data';
import type { UserProfile, UserRole } from '@/types';
import { Users, Edit, Trash2, PlusCircle, Search, Filter, MoreHorizontal, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

const ITEMS_PER_PAGE = 10; // Example, can be adjusted

export default function UserManagementPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1); // For future pagination

  useEffect(() => {
    if (user && user.role !== 'Staff' && !user.isSuperAdmin) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const filteredUsers = useMemo(() => {
    return mockUserProfiles.filter(u => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        u.username.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower) ||
        (u.first_name && u.first_name.toLowerCase().includes(searchLower)) ||
        (u.last_name && u.last_name.toLowerCase().includes(searchLower));

      const matchesRole = selectedRole === 'all' ? true : u.role === selectedRole;
      
      // SuperAdmins can see all users, Staff can see Students and Teachers
      if (user?.isSuperAdmin) return matchesSearch && matchesRole;
      if (user?.role === 'Staff') {
        return matchesSearch && matchesRole && (u.role === 'Student' || u.role === 'Teacher');
      }
      return false; // Should be caught by useEffect redirect
    });
  }, [searchTerm, selectedRole, user]);

  // Basic pagination (can be expanded)
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleEditUser = (userId: number) => {
    console.log(`Edit user: ${userId}`);
    // Implement edit functionality, e.g., navigate to an edit page or open a modal
  };

  const handleDeleteUser = (userId: number) => {
    console.log(`Delete user: ${userId}`);
    // Implement delete functionality with confirmation
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
        title="User Management"
        description="Manage student and teacher accounts."
        icon={Users}
        action={
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New User
          </Button>
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
      </Card>
      {/* Basic Pagination (can be improved) */}
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

