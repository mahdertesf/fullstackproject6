// src/actions/scheduledCourseActions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { ScheduledCourse, Course, Semester, User as TeacherUser, Room } from '@prisma/client';
import type { ScheduleCourseFormData } from '@/lib/schemas';

export type EnrichedScheduledCourse = ScheduledCourse & {
  course: Course | null;
  semester: Semester | null;
  teacher: TeacherUser | null; // Teacher is a User
  room: (Room & { building: { name: string | null } | null }) | null;
};

export async function getAllScheduledCourses(): Promise<EnrichedScheduledCourse[]> {
  try {
    return await prisma.scheduledCourse.findMany({
      include: {
        course: true,
        semester: true,
        teacher: true,
        room: { include: { building: { select: { name: true } } } },
      },
      orderBy: [{ semester: { start_date: 'desc' } }, { course: { title: 'asc' } }],
    });
  } catch (error) {
    console.error('Error fetching scheduled courses:', error);
    return [];
  }
}

export async function getScheduledCoursesByTeacher(teacherId: number): Promise<EnrichedScheduledCourse[]> {
    try {
        return await prisma.scheduledCourse.findMany({
            where: { teacher_id: teacherId },
            include: {
                course: true,
                semester: true,
                teacher: true, // This will be the teacher themselves
                room: { include: { building: true } },
            },
            orderBy: [{ semester: { start_date: 'desc' } }, { course: { title: 'asc' } }],
        });
    } catch (error) {
        console.error(`Error fetching scheduled courses for teacher ${teacherId}:`, error);
        return [];
    }
}


export async function getScheduledCourseById(id: number): Promise<EnrichedScheduledCourse | null> {
    try {
        return await prisma.scheduledCourse.findUnique({
            where: { scheduled_course_id: id },
            include: {
                course: true,
                semester: true,
                teacher: true,
                room: { include: { building: true } },
            },
        });
    } catch (error) {
        console.error(`Error fetching scheduled course ${id}:`, error);
        return null;
    }
}


export async function createScheduledCourse(data: ScheduleCourseFormData): Promise<ScheduledCourse> {
  try {
    const newScheduledCourse = await prisma.scheduledCourse.create({
      data: {
        course_id: parseInt(data.course_id),
        semester_id: parseInt(data.semester_id),
        teacher_id: parseInt(data.teacher_id),
        room_id: data.room_id && data.room_id !== 'none' ? parseInt(data.room_id) : null,
        section_number: data.section_number,
        max_capacity: data.max_capacity,
        days_of_week: data.days_of_week,
        start_time: data.start_time ? new Date(`1970-01-01T${data.start_time}:00Z`) : null, // Store as DateTime, extract time part for TIME type
        end_time: data.end_time ? new Date(`1970-01-01T${data.end_time}:00Z`) : null,
        current_enrollment: 0,
      },
    });
    // TODO: Audit log
    return newScheduledCourse;
  } catch (error) {
    console.error('Error creating scheduled course:', error);
    throw new Error('Failed to schedule course.');
  }
}

export async function updateScheduledCourse(id: number, data: ScheduleCourseFormData): Promise<ScheduledCourse> {
  try {
    const updatedScheduledCourse = await prisma.scheduledCourse.update({
      where: { scheduled_course_id: id },
      data: {
        course_id: parseInt(data.course_id),
        semester_id: parseInt(data.semester_id),
        teacher_id: parseInt(data.teacher_id),
        room_id: data.room_id && data.room_id !== 'none' ? parseInt(data.room_id) : null,
        section_number: data.section_number,
        max_capacity: data.max_capacity,
        days_of_week: data.days_of_week,
        start_time: data.start_time ? new Date(`1970-01-01T${data.start_time}:00Z`) : null,
        end_time: data.end_time ? new Date(`1970-01-01T${data.end_time}:00Z`) : null,
      },
    });
    // TODO: Audit log
    return updatedScheduledCourse;
  } catch (error) {
    console.error(`Error updating scheduled course ${id}:`, error);
    throw new Error('Failed to update scheduled course.');
  }
}

export async function deleteScheduledCourse(id: number): Promise<void> {
  try {
    // Check for registrations before deleting
    const registrationsCount = await prisma.registration.count({ where: { scheduled_course_id: id }});
    if (registrationsCount > 0) {
        throw new Error('Cannot delete scheduled course with existing student registrations. Please unenroll students first.');
    }
    await prisma.scheduledCourse.delete({
      where: { scheduled_course_id: id },
    });
    // TODO: Audit log
  } catch (error) {
    console.error(`Error deleting scheduled course ${id}:`, error);
    if (error instanceof Error && error.message.includes('Cannot delete scheduled course with existing student registrations')) {
        throw error;
    }
    throw new Error('Failed to delete scheduled course.');
  }
}

export async function getAvailableScheduledCoursesForRegistration(semesterId: number, studentDepartmentId?: number): Promise<EnrichedScheduledCourse[]> {
  try {
    return await prisma.scheduledCourse.findMany({
      where: {
        semester_id: semesterId,
        course: studentDepartmentId ? { department_id: studentDepartmentId } : undefined,
        // Further filtering (like capacity, prerequisites) will be handled client-side or in a more complex query
      },
      include: {
        course: { include: { department: true, prerequisitesRequired: { include: { prerequisiteCourse: true }} } },
        semester: true,
        teacher: true,
        room: { include: { building: true } },
      },
      orderBy: [{ course: { course_code: 'asc' } }, { section_number: 'asc' }],
    });
  } catch (error) {
    console.error('Error fetching available courses for registration:', error);
    return [];
  }
}
