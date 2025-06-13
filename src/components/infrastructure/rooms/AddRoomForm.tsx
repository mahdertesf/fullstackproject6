// src/components/infrastructure/rooms/AddRoomForm.tsx

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
import { RoomFormDataSchema, type RoomFormData } from '@/lib/schemas';
import type { Building } from '@/types';
import { Loader2 } from 'lucide-react';

interface AddRoomFormProps {
  onSubmit: (data: RoomFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  buildings: Building[];
}

export default function AddRoomForm({ onSubmit, onCancel, isSubmitting, buildings }: AddRoomFormProps) {
  const form = useForm<RoomFormData>({
    resolver: zodResolver(RoomFormDataSchema),
    defaultValues: {
      building_id: undefined,
      room_number: '',
      capacity: 50,
      type: '',
    },
  });

  const handleSubmit = async (data: RoomFormData) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="building_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Building</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a building" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {buildings.map(building => (
                    <SelectItem key={building.building_id} value={String(building.building_id)}>
                      {building.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="room_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Room Number</FormLabel>
              <FormControl>
                <Input placeholder="e.g., A101, Lab 3" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacity</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="50" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Lecture Hall, Lab" {...field} />
                </FormControl>
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
            Create Room
          </Button>
        </div>
      </form>
    </Form>
  );
}
