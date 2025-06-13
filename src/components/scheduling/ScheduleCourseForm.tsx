
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
import { ScheduleCourseSchema, type ScheduleCourseFormData } from '@/lib/schemas';
import type { Course, Semester, Teacher, Room } from '@/types';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ScheduleCourseFormProps {
  onSubmit: (data: ScheduleCourseFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  courses: Course[];
  semesters: Semester[];
  teachers: Teacher[];
  rooms: Room[];
}

const NO_ROOM_VALUE = "none"; // Special value for no room selection

export default function ScheduleCourseForm({
  onSubmit,
  onCancel,
  isSubmitting,
  courses,
  semesters,
  teachers,
  rooms,
}: ScheduleCourseFormProps) {
  const form = useForm<ScheduleCourseFormData>({
    resolver: zodResolver(ScheduleCourseSchema),
    defaultValues: {
      course_id: undefined,
      semester_id: undefined,
      teacher_id: undefined,
      room_id: '', // Default to empty string, placeholder will show
      section_number: '',
      max_capacity: 50,
      days_of_week: '',
      start_time: '',
      end_time: '',
    },
  });

  const handleSubmit = async (data: ScheduleCourseFormData) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <ScrollArea className="h-[65vh] sm:h-auto sm:max-h-[75vh] pr-5">
          <div className="space-y-4 p-1">
            <FormField
              control={form.control}
              name="course_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {courses.map(course => (
                        <SelectItem key={course.course_id} value={String(course.course_id)}>
                          {course.course_code} - {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="semester_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Semester</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a semester" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {semesters.map(semester => (
                          <SelectItem key={semester.semester_id} value={String(semester.semester_id)}>
                            {semester.name}
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
                name="teacher_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teacher</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a teacher" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teachers.map(teacher => (
                          <SelectItem key={teacher.teacher_id} value={String(teacher.teacher_id)}>
                            {teacher.first_name} {teacher.last_name}
                          </SelectItem>
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
                name="room_id"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Room (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}> {/* Ensure value is controlled and defaults to empty string for placeholder */}
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a room" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value={NO_ROOM_VALUE}>No specific room</SelectItem>
                        {rooms.map(room => (
                            <SelectItem key={room.room_id} value={String(room.room_id)}>
                            {room.building?.name} - {room.room_number} (Cap: {room.capacity})
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
                  name="section_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., S1, A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            
            <FormField
              control={form.control}
              name="max_capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Capacity</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="days_of_week"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Days of Week</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., MWF, TTH" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time (HH:MM)</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time (HH:MM)</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
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
            Schedule Course
          </Button>
        </div>
      </form>
    </Form>
  );
}
