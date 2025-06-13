// src/components/semesters/EditSemesterForm.tsx

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
import { DatePicker } from '@/components/ui/date-picker'; 
import { NewSemesterSchema, type NewSemesterFormData } from '@/lib/schemas'; // Reusing schema for edit
import type { Semester, SemesterTerm } from '@/types';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect } from 'react';

interface EditSemesterFormProps {
  semesterToEdit: Semester;
  onSubmit: (data: NewSemesterFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const terms: SemesterTerm[] = ['Fall', 'Spring', 'Summer', 'Winter'];

export default function EditSemesterForm({ semesterToEdit, onSubmit, onCancel, isSubmitting }: EditSemesterFormProps) {
  const form = useForm<NewSemesterFormData>({
    resolver: zodResolver(NewSemesterSchema),
    defaultValues: {
      name: semesterToEdit.name,
      academic_year: semesterToEdit.academic_year,
      term: semesterToEdit.term,
      start_date: new Date(semesterToEdit.start_date), // Ensure string dates are converted to Date objects
      end_date: new Date(semesterToEdit.end_date),
      registration_start_date: new Date(semesterToEdit.registration_start_date),
      registration_end_date: new Date(semesterToEdit.registration_end_date),
      add_drop_start_date: new Date(semesterToEdit.add_drop_start_date),
      add_drop_end_date: new Date(semesterToEdit.add_drop_end_date),
    },
  });

  useEffect(() => {
    form.reset({
      name: semesterToEdit.name,
      academic_year: semesterToEdit.academic_year,
      term: semesterToEdit.term,
      start_date: new Date(semesterToEdit.start_date),
      end_date: new Date(semesterToEdit.end_date),
      registration_start_date: new Date(semesterToEdit.registration_start_date),
      registration_end_date: new Date(semesterToEdit.registration_end_date),
      add_drop_start_date: new Date(semesterToEdit.add_drop_start_date),
      add_drop_end_date: new Date(semesterToEdit.add_drop_end_date),
    });
  }, [semesterToEdit, form]);

  const handleSubmit = async (data: NewSemesterFormData) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <ScrollArea className="h-[60vh] sm:h-auto sm:max-h-[70vh] pr-5">
          <div className="space-y-4 p-1">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Semester Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Fall 2024" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="academic_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Year</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder={String(new Date().getFullYear())} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="term"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a term" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {terms.map(term => (
                          <SelectItem key={term} value={term}>{term}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Semester Start Date</FormLabel>
                    <DatePicker date={field.value} setDate={field.onChange} placeholder="Select start date" />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Semester End Date</FormLabel>
                    <DatePicker 
                      date={field.value} 
                      setDate={field.onChange} 
                      placeholder="Select end date"
                      disabled={(date) => date < (form.getValues("start_date") || new Date(0))}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <p className="text-sm font-medium text-foreground pt-2">Registration Period</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="registration_start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration Start</FormLabel>
                    <DatePicker date={field.value} setDate={field.onChange} placeholder="Select date"/>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="registration_end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration End</FormLabel>
                    <DatePicker 
                      date={field.value} 
                      setDate={field.onChange} 
                      placeholder="Select date"
                      disabled={(date) => date < (form.getValues("registration_start_date") || new Date(0))}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <p className="text-sm font-medium text-foreground pt-2">Add/Drop Period</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="add_drop_start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Add/Drop Start</FormLabel>
                    <DatePicker date={field.value} setDate={field.onChange} placeholder="Select date"/>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="add_drop_end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Add/Drop End</FormLabel>
                    <DatePicker 
                      date={field.value} 
                      setDate={field.onChange} 
                      placeholder="Select date"
                      disabled={(date) => date < (form.getValues("add_drop_start_date") || new Date(0))}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </ScrollArea>
        <div className="flex justify-end space-x-2 pt-6">
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

