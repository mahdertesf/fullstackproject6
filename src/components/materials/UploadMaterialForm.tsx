// src/components/materials/UploadMaterialForm.tsx

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
import { CourseMaterialUploadSchema, type CourseMaterialUploadFormData } from '@/lib/schemas';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react'; // Added useEffect here

interface UploadMaterialFormProps {
  onSubmit: (data: CourseMaterialUploadFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function UploadMaterialForm({ onSubmit, onCancel, isSubmitting }: UploadMaterialFormProps) {
  const [materialType, setMaterialType] = useState<'File' | 'Link' | undefined>(undefined);

  const form = useForm<CourseMaterialUploadFormData>({
    resolver: zodResolver(CourseMaterialUploadSchema),
    defaultValues: {
      title: '',
      description: '',
      material_type: undefined,
      file_path: '',
      url: '',
    },
  });

  const watchedMaterialType = form.watch("material_type");

  // Effect to sync local state with form state if it changes
  useEffect(() => {
    setMaterialType(watchedMaterialType);
  }, [watchedMaterialType]);


  const handleSubmit = async (data: CourseMaterialUploadFormData) => {
    // Clear irrelevant field based on type before submitting
    const finalData = { ...data };
    if (data.material_type === 'File') {
      finalData.url = '';
    } else if (data.material_type === 'Link') {
      finalData.file_path = '';
    }
    await onSubmit(finalData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Material Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Lecture 1 Slides, Python Tutorial" {...field} />
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
                <Textarea placeholder="A brief description of the material..." {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="material_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Material Type</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  // setMaterialType is handled by the useEffect watching watchedMaterialType
                }} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select material type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="File">File (Mock Path)</SelectItem>
                  <SelectItem value="Link">Link (URL)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {materialType === 'File' && (
          <FormField
            control={form.control}
            name="file_path"
            render={({ field }) => (
              <FormItem>
                <FormLabel>File Path (Mock)</FormLabel>
                <FormControl>
                  {/* In a real app, this would be a file input component */}
                  <Input placeholder="/path/to/your/file.pdf" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {materialType === 'Link' && (
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL</FormLabel>
                <FormControl>
                  <Input type="url" placeholder="https://example.com/resource" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Add Material
          </Button>
        </div>
      </form>
    </Form>
  );
}
