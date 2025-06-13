// src/components/courses/EditCourseForm.tsx

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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EditCourseSchema, type EditCourseFormData } from '@/lib/schemas';
import type { Course, Department } from '@/types';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

interface CourseWithDepartmentName extends Course {
  departmentName: string;
}

interface EditCourseFormProps {
  courseToEdit: CourseWithDepartmentName;
  onSubmit: (data: EditCourseFormData) => Promise<void>;
  onCancel: () => void;
  departments: Department[];
  isSubmitting: boolean;
}

export default function EditCourseForm({ courseToEdit, onSubmit, onCancel, departments, isSubmitting }: EditCourseFormProps) {
  const form = useForm<EditCourseFormData>({
    resolver: zodResolver(EditCourseSchema),
    defaultValues: {
      course_code: courseToEdit.course_code,
      title: courseToEdit.title,
      description: courseToEdit.description || '',
      credits: courseToEdit.credits,
      department_id: String(courseToEdit.department_id),
    },
  });

  useEffect(() => {
    form.reset({
      course_code: courseToEdit.course_code,
      title: courseToEdit.title,
      description: courseToEdit.description || '',
      credits: courseToEdit.credits,
      department_id: String(courseToEdit.department_id),
    });
  }, [courseToEdit, form]);

  const handleSubmit = async (data: EditCourseFormData) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="course_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course Code</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., SE401" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Advanced Software Engineering" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="A brief description of the course..." {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="credits"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Credits</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="3" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="department_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
        </div>
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
