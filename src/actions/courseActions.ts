// src/actions/courseActions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { 
  Course as PrismaCourse, 
  Department as PrismaDepartment, 
  Prerequisite as PrismaPrerequisite, 
  ScheduledCourse as PrismaScheduledCourse, 
  User as PrismaUser, 
  Semester as PrismaSemester, 
  Room as PrismaRoom, 
  Building as PrismaBuilding 
} from '@prisma/client';
import type { NewCourseFormData, EditCourseFormData } from '@/lib/schemas';

export interface CourseWithDepartment extends PrismaCourse {
  department: PrismaDepartment | null;
}

export async function getAllCoursesWithDetails(): Promise<CourseWithDepartment[]> {
  try {
    const courses = await prisma.course.findMany({
      include: {
        department: true,
      },
      orderBy: {
        title: 'asc',
      },
    });
    return courses as CourseWithDepartment[];
  } catch (error) {
    console.error('Error fetching courses with details:', error);
    return [];
  }
}

export interface DetailedCourse extends PrismaCourse {
  department: PrismaDepartment | null;
  prerequisitesRequired: (PrismaPrerequisite & {
    prerequisiteCourse: PrismaCourse | null; 
  })[];
  scheduledCourses: (PrismaScheduledCourse & {
    teacher: PrismaUser | null;
    semester: PrismaSemester | null;
    room: (PrismaRoom & {
      building: PrismaBuilding | null;
    }) | null;
  })[];
}

export async function getCourseByIdWithDetails(courseId: number): Promise<DetailedCourse | null> {
  try {
    const course = await prisma.course.findUnique({
      where: { course_id: courseId },
      include: {
        department: true,
        prerequisitesRequired: { 
          include: {
            prerequisiteCourse: true, 
          },
        },
        scheduledCourses: { 
          take: 3, 
          include: {
            teacher: true, 
            semester: true,
            room: {
              include: {
                building: true,
              },
            },
          },
          orderBy: {
            semester: {
              start_date: 'desc', 
            },
          },
        },
      },
    });

    if (!course) return null;
    return course as DetailedCourse;
  } catch (error) {
    console.error(`Error fetching course ${courseId} with details:`, error);
    return null;
  }
}

export async function createCourse(data: NewCourseFormData): Promise<PrismaCourse> {
  try {
    const newCourse = await prisma.course.create({
      data: {
        course_code: data.course_code,
        title: data.title,
        description: data.description,
        credits: data.credits,
        department_id: parseInt(data.department_id),
      },
    });
    // TODO: Audit log
    return newCourse;
  } catch (error) {
    console.error('Error creating course:', error);
    throw new Error('Failed to create course.');
  }
}

export async function updateCourse(courseId: number, data: EditCourseFormData): Promise<PrismaCourse> {
  try {
    const updatedCourse = await prisma.course.update({
      where: { course_id: courseId },
      data: {
        course_code: data.course_code,
        title: data.title,
        description: data.description,
        credits: data.credits,
        department_id: parseInt(data.department_id),
      },
    });
    // TODO: Audit log
    return updatedCourse;
  } catch (error) {
    console.error(`Error updating course ${courseId}:`, error);
    throw new Error('Failed to update course.');
  }
}

export async function deleteCourse(courseId: number): Promise<void> {
  try {
    // Check for related scheduled courses or prerequisites before deleting
    const scheduledCount = await prisma.scheduledCourse.count({ where: { course_id: courseId }});
    const prereqForCount = await prisma.prerequisite.count({ where: { course_id: courseId }});
    const isPrereqCount = await prisma.prerequisite.count({ where: { prerequisite_course_id: courseId }});

    if (scheduledCount > 0 || prereqForCount > 0 || isPrereqCount > 0) {
      let message = 'Cannot delete course. It is currently ';
      if (scheduledCount > 0) message += `scheduled in ${scheduledCount} instance(s). `;
      if (prereqForCount > 0) message += `a prerequisite for other courses. `;
      if (isPrereqCount > 0) message += `required by other courses. `;
      message += 'Please resolve these dependencies first.';
      throw new Error(message);
    }

    await prisma.course.delete({
      where: { course_id: courseId },
    });
    // TODO: Audit log
  } catch (error) {
    console.error(`Error deleting course ${courseId}:`, error);
     if (error instanceof Error && error.message.startsWith('Cannot delete course.')) {
        throw error;
    }
    throw new Error('Failed to delete course.');
  }
}
