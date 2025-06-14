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

// For getAllCourses, we want to include the department name.
export interface CourseWithDepartment extends PrismaCourse {
  department: PrismaDepartment | null;
}

export async function getAllCoursesWithDetails(): Promise<CourseWithDepartment[]> {
  try {
    const courses = await prisma.course.findMany({
      include: {
        department: true, // Include the related department
      },
      orderBy: {
        title: 'asc',
      },
    });
    return courses as CourseWithDepartment[]; // Cast if structure matches
  } catch (error) {
    console.error('Error fetching courses with details:', error);
    return [];
  }
}

// For getCourseById, we need more detailed information
export interface DetailedCourse extends PrismaCourse {
  department: PrismaDepartment | null;
  prerequisitesRequired: (PrismaPrerequisite & {
    prerequisiteCourse: PrismaCourse | null; 
  })[];
  scheduledCourses: (PrismaScheduledCourse & {
    teacher: PrismaUser | null; // Teacher is a User
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
        prerequisitesRequired: { // These are prerequisites *for* this course
          include: {
            prerequisiteCourse: true, // The actual course that is a prerequisite
          },
        },
        scheduledCourses: { // Instances of this course being scheduled
          take: 3, // Limit to a few recent/upcoming offerings
          include: {
            teacher: true, // User who is the teacher
            semester: true,
            room: {
              include: {
                building: true,
              },
            },
          },
          orderBy: {
            semester: {
              start_date: 'desc', // Show most recent semesters first for scheduled instances
            },
          },
        },
      },
    });

    if (!course) return null;
    
    // Ensure the structure matches DetailedCourse, especially if Prisma's include is slightly different
    return course as DetailedCourse;
  } catch (error) {
    console.error(`Error fetching course ${courseId} with details:`, error);
    return null;
  }
}
