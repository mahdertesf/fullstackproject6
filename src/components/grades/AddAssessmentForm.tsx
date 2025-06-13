// src/components/grades/AddAssessmentForm.tsx

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
import { AssessmentSchema, type AssessmentFormData } from '@/lib/schemas';
import { Loader2 } from 'lucide-react';

interface AddAssessmentFormProps {
  onSubmit: (data: AssessmentFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function AddAssessmentForm({ onSubmit, onCancel, isSubmitting }: AddAssessmentFormProps) {
  const form = useForm<AssessmentFormData>({
    resolver: zodResolver(AssessmentSchema),
    defaultValues: {
      name: '',
      max_score: 100,
      assessment_type: '',
    },
  });

  const handleSubmit = async (data: AssessmentFormData) => {
    await onSubmit(data);
    form.reset(); 
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assessment Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Midterm Exam, Homework 1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="max_score"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Score</FormLabel>
              <FormControl>
                <Input type="number" placeholder="100" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="assessment_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Exam, Quiz, Project" {...field} />
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
            Add Assessment
          </Button>
        </div>
      </form>
    </Form>
  );
}
