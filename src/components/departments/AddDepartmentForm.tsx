
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
import { DepartmentSchema, type DepartmentFormData } from '@/lib/schemas';
import { Loader2 } from 'lucide-react';

interface AddDepartmentFormProps {
  onSubmit: (data: DepartmentFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function AddDepartmentForm({ onSubmit, onCancel, isSubmitting }: AddDepartmentFormProps) {
  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(DepartmentSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const handleSubmit = async (data: DepartmentFormData) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Software Engineering" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="A brief description of the department..." {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create Department
          </Button>
        </div>
      </form>
    </Form>
  );
}
