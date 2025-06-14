// src/actions/studentActions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { Registration, ScheduledCourse, Course, User, Semester, Room, Building, StudentAssessmentScore, Assessment, Prerequisite as PrismaPrerequisite } from '@prisma/client';
import type { EnrichedRegistration as ClientEnrichedRegistration } from '@/types'; // Client-side enriched type

export type EnrichedRegistration = Registration & {
  scheduledCourse: (ScheduledCourse & {
    course: (Course & { prerequisitesRequired: (PrismaPrerequisite & { prerequisiteCourse: Course | null })[] }) | null;
    semester: Semester | null;
    teacher: User | null;
    room: (Room & { building: Building | null }) | null;
  }) | null;
  student: User | null;
  assessment_scores: (StudentAssessmentScore & { assessment: Assessment | null })[];
};


export async function getStudentRegistrations(studentId: number, semesterId?: number): Promise<EnrichedRegistration[]> {
  try {
    const registrations = await prisma.registration.findMany({
      where: {
        student_id: studentId,
        scheduledCourse: semesterId ? { semester_id: semesterId } : undefined,
      },
      include: {
        student: true,
        scheduledCourse: {
          include: {
            course: { include: { prerequisitesRequired: { include: { prerequisiteCourse: true } } } },
            semester: true,
            teacher: true,
            room: { include: { building: true } },
          },
        },
        assessment_scores: {
            include: {
                assessment: true
            }
        }
      },
      orderBy: {
        scheduledCourse: {
          semester: {
            start_date: 'desc',
          },
        },
      },
    });
    return registrations as EnrichedRegistration[];
  } catch (error) {
    console.error(`Error fetching registrations for student ${studentId}:`, error);
    return [];
  }
}

export async function registerStudentForCourse(studentId: number, scheduledCourseId: number): Promise<Registration> {
  try {
    // Check for existing registration
    const existingRegistration = await prisma.registration.findUnique({
      where: { student_id_scheduled_course_id: { student_id: studentId, scheduled_course_id: scheduledCourseId } },
    });
    if (existingRegistration) {
      if (existingRegistration.status === 'Registered') throw new Error('Already registered for this course section.');
      if (existingRegistration.status === 'Completed') throw new Error('Already completed this course section.');
      // Potentially handle re-registration if dropped, etc.
    }

    // Check prerequisites (simplified - assumes client-side already did some checks)
    // A more robust check would query completed courses for the student.

    // Check capacity
    const scheduledCourse = await prisma.scheduledCourse.findUnique({ where: { scheduled_course_id: scheduledCourseId } });
    if (!scheduledCourse) throw new Error('Scheduled course not found.');
    if (scheduledCourse.current_enrollment >= scheduledCourse.max_capacity) {
      throw new Error('Course section is full.');
    }

    // Create registration and increment enrollment
    const [, newRegistration] = await prisma.$transaction([
      prisma.scheduledCourse.update({
        where: { scheduled_course_id: scheduledCourseId },
        data: { current_enrollment: { increment: 1 } },
      }),
      prisma.registration.create({
        data: {
          student_id: studentId,
          scheduled_course_id: scheduledCourseId,
          status: 'Registered',
        },
      }),
    ]);
    // TODO: Audit log
    return newRegistration;
  } catch (error) {
    console.error('Error registering student for course:', error);
    if (error instanceof Error) throw error;
    throw new Error('Failed to register for course.');
  }
}

export async function dropStudentFromCourse(studentId: number, scheduledCourseId: number): Promise<Registration> {
  try {
    const registration = await prisma.registration.findUnique({
      where: { student_id_scheduled_course_id: { student_id: studentId, scheduled_course_id: scheduledCourseId } },
    });
    if (!registration || registration.status !== 'Registered') {
      throw new Error('Not currently registered for this course section or cannot be dropped.');
    }

    // Decrement enrollment and update registration status
    const [, updatedRegistration] = await prisma.$transaction([
      prisma.scheduledCourse.update({
        where: { scheduled_course_id: scheduledCourseId },
        data: { current_enrollment: { decrement: 1 } },
      }),
      prisma.registration.update({
        where: { registration_id: registration.registration_id },
        data: { status: 'Dropped' },
      }),
    ]);
     // TODO: Audit log
    return updatedRegistration;
  } catch (error) {
    console.error('Error dropping student from course:', error);
    if (error instanceof Error) throw error;
    throw new Error('Failed to drop course.');
  }
}

export async function getStudentCompletedCourseIds(studentId: number): Promise<number[]> {
  try {
    const completedRegistrations = await prisma.registration.findMany({
      where: {
        student_id: studentId,
        status: 'Completed',
        scheduledCourse: { // Ensure scheduledCourse is not null
          isNot: null 
        }
      },
      select: {
        scheduledCourse: {
          select: {
            course_id: true,
          },
        },
      },
    });
    // Filter out null scheduledCourse before mapping, although `isNot: null` should prevent it.
    return completedRegistrations
        .filter(reg => reg.scheduledCourse !== null) 
        .map(reg => reg.scheduledCourse!.course_id);
  } catch (error) {
    console.error(`Error fetching completed course IDs for student ${studentId}:`, error);
    return [];
  }
}
