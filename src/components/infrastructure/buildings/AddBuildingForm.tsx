
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
import { BuildingFormDataSchema, type BuildingFormData } from '@/lib/schemas';
import { Loader2 } from 'lucide-react';

interface AddBuildingFormProps {
  onSubmit: (data: BuildingFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function AddBuildingForm({ onSubmit, onCancel, isSubmitting }: AddBuildingFormProps) {
  const form = useForm<BuildingFormData>({
    resolver: zodResolver(BuildingFormDataSchema),
    defaultValues: {
      name: '',
      address: '',
    },
  });

  const handleSubmit = async (data: BuildingFormData) => {
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
              <FormLabel>Building Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Main Engineering Hall" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., 123 University Ave, Main Campus" {...field} rows={3} />
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
            Create Building
          </Button>
        </div>
      </form>
    </Form>
  );
}
