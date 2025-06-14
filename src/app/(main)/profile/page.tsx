// src/app/(main)/profile/page.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/authStore';
import { UserProfileSchema, type UserProfileFormData } from '@/lib/schemas';
import { UserCircle, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { updateUserProfile } from '@/actions/authActions';
import type { UserProfile as FullUserProfile, Student, Teacher, Staff } from '@prisma/client';


export default function ProfilePage() {
  const { user, setUser: setAuthUser } = useAuthStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<UserProfileFormData>({
    resolver: zodResolver(UserProfileSchema),
    // Initialize with empty strings or from user if available
    defaultValues: {
      email: user?.email || '',
      phone_number: user?.phone_number || '',
      address: user?.address || '',
      // Role-specific fields:
      office_location: user?.teacher_profile?.office_location || '',
      job_title: user?.staff_profile?.job_title || '',
    },
  });
  
  useEffect(() => {
    if (user) {
      form.reset({
        email: user.email || '',
        phone_number: user.phone_number || '',
        address: user.address || '',
        office_location: user.teacher_profile?.office_location || '',
        job_title: user.staff_profile?.job_title || '',
      });
    }
  }, [user, form]);


  if (!user) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-8 w-8 animate-spin"/> Loading profile...</div>;
  }

  const onSubmit = async (data: UserProfileFormData) => {
    if (!user) return;
    setIsLoading(true);

    const updateData: Partial<FullUserProfile> & {
        student_profile?: Partial<Omit<Student, 'student_id' | 'user'>>;
        teacher_profile?: Partial<Omit<Teacher, 'teacher_id' | 'user'>>;
        staff_profile?: Partial<Omit<Staff, 'staff_id' | 'user'>>;
    } = {
        email: data.email,
        phone_number: data.phone_number,
        address: data.address,
    };

    if (user.role === 'Teacher') {
        updateData.teacher_profile = { office_location: data.office_location };
    }
    if (user.role === 'Staff') {
        updateData.staff_profile = { job_title: data.job_title };
    }
    // Student profile might have other fields from student_profile table not on UserProfileSchema directly

    try {
      const updatedUser = await updateUserProfile(user.user_id, updateData);
      setAuthUser(updatedUser); // Update user in Zustand store
      toast({
        title: 'Profile Updated',
        description: 'Your profile information has been successfully updated.',
      });
    } catch (error) {
        console.error("Error updating profile:", error);
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: (error as Error).message || 'Could not update profile.',
        });
    } finally {
        setIsLoading(false);
    }
  };
  
  const getInitials = (name?: string | null, fallbackName?: string | null) => {
    const targetName = name || fallbackName;
    if (!targetName) return 'U';
    const names = targetName.split(' ');
    if (names.length > 1 && names[0] && names[names.length - 1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return targetName.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" description="View and update your personal information." icon={UserCircle} />
      
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.profile_picture_url || `https://placehold.co/100x100.png`} alt={user.username} data-ai-hint="profile avatar" />
              <AvatarFallback className="text-2xl">{getInitials(user.first_name && user.last_name ? `${user.first_name} ${user.last_name}`: user.username)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{user.first_name} {user.last_name}</CardTitle>
              <CardDescription>@{user.username} &bull; Role: {user.is_super_admin ? "Admin" : user.role}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your.email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+251 912 345 678" {...field} value={field.value || ''}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {(user.role === 'Student' || user.role === 'Teacher') && (
                 <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Your residential address" {...field} value={field.value || ''}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {user.role === 'Teacher' && (
                <FormField
                  control={form.control}
                  name="office_location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Office Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Block C, Room 102" {...field} value={field.value || ''}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {(user.role === 'Staff') && (
                <FormField
                  control={form.control}
                  name="job_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Registrar" {...field} value={field.value || ''}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
