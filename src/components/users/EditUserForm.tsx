// src/components/users/EditUserForm.tsx

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { EditUserSchema, type EditUserFormData } from '@/lib/schemas';
import type { UserProfile, UserRole, Department } from '@/types'; // Added Department
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

interface EditUserFormProps {
  userToEdit: UserProfile;
  onSubmit: (data: EditUserFormData) => Promise<void>;
  onCancel: () => void;
  availableRoles: UserRole[];
  isSubmitting: boolean;
  currentUserRole?: UserRole;
  isCurrentUserSuperAdmin?: boolean;
  departments: Department[]; // Added departments
}

export default function EditUserForm({
  userToEdit,
  onSubmit,
  onCancel,
  availableRoles,
  isSubmitting,
  currentUserRole,
  isCurrentUserSuperAdmin,
  departments,
}: EditUserFormProps) {
  const form = useForm<EditUserFormData>({
    resolver: zodResolver(EditUserSchema),
    defaultValues: {
      username: userToEdit.username,
      email: userToEdit.email,
      firstName: userToEdit.first_name || '',
      lastName: userToEdit.last_name || '',
      role: userToEdit.role,
      department_id: userToEdit.student_profile?.department_id?.toString() || userToEdit.teacher_profile?.department_id?.toString() || undefined,
      is_active: userToEdit.is_active,
    },
  });

  const watchedRole = form.watch("role");

  useEffect(() => {
    form.reset({
      username: userToEdit.username,
      email: userToEdit.email,
      firstName: userToEdit.first_name || '',
      lastName: userToEdit.last_name || '',
      role: userToEdit.role,
      department_id: userToEdit.student_profile?.department_id?.toString() || userToEdit.teacher_profile?.department_id?.toString() || undefined,
      is_active: userToEdit.is_active,
    });
  }, [userToEdit, form]);

  const handleSubmit = async (data: EditUserFormData) => {
    await onSubmit(data);
  };

  const canChangeRole = isCurrentUserSuperAdmin || 
                        (currentUserRole === 'Staff' && userToEdit.role !== 'Staff');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., newuser01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="user@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  // If role changes away from Student/Teacher, clear department_id
                  if (value !== 'Student' && value !== 'Teacher') {
                    form.setValue('department_id', undefined);
                  }
                }} 
                defaultValue={field.value}
                disabled={!canChangeRole || (userToEdit.is_super_admin && !isCurrentUserSuperAdmin)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableRoles.map(role => (
                    <SelectItem key={role} value={role} disabled={userToEdit.is_super_admin && role !== userToEdit.role && !isCurrentUserSuperAdmin}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(!canChangeRole && !(userToEdit.is_super_admin && !isCurrentUserSuperAdmin)) && <p className="text-sm text-muted-foreground">Staff users cannot change the role of other Staff users.</p>}
              {(userToEdit.is_super_admin && !isCurrentUserSuperAdmin) && <p className="text-sm text-muted-foreground">Cannot change the role of a Super Admin.</p>}
              <FormMessage />
            </FormItem>
          )}
        />
        {(watchedRole === 'Student' || watchedRole === 'Teacher') && (
          <FormField
            control={form.control}
            name="department_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept.department_id} value={String(dept.department_id)}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
         <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Active Status</FormLabel
                ><p className="text-sm text-muted-foreground">
                  Inactive users cannot log in.
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={(userToEdit.is_super_admin && !isCurrentUserSuperAdmin)} // Only super admin can deactivate another super admin
                />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || (userToEdit.is_super_admin && !isCurrentUserSuperAdmin && userToEdit.user_id !== form.getValues().is_active === userToEdit.is_active )}
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
