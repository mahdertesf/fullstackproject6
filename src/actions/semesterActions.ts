// src/actions/semesterActions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { Semester } from '@prisma/client';
import type { NewSemesterFormData } from '@/lib/schemas'; // Assuming this matches structure

export async function getAllSemesters(): Promise<Semester[]> {
  try {
    return await prisma.semester.findMany({
      orderBy: { start_date: 'desc' },
    });
  } catch (error) {
    console.error('Error fetching semesters:', error);
    return [];
  }
}

export async function createSemester(data: NewSemesterFormData): Promise<Semester> {
  try {
    const newSemester = await prisma.semester.create({
      data: {
        name: data.name,
        academic_year: data.academic_year,
        term: data.term,
        start_date: data.start_date,
        end_date: data.end_date,
        registration_start_date: data.registration_start_date,
        registration_end_date: data.registration_end_date,
        add_drop_start_date: data.add_drop_start_date,
        add_drop_end_date: data.add_drop_end_date,
      },
    });
    // TODO: Audit log
    return newSemester;
  } catch (error) {
    console.error('Error creating semester:', error);
    throw new Error('Failed to create semester.');
  }
}

export async function updateSemester(semesterId: number, data: NewSemesterFormData): Promise<Semester> {
  try {
    const updatedSemester = await prisma.semester.update({
      where: { semester_id: semesterId },
      data: {
        name: data.name,
        academic_year: data.academic_year,
        term: data.term,
        start_date: data.start_date,
        end_date: data.end_date,
        registration_start_date: data.registration_start_date,
        registration_end_date: data.registration_end_date,
        add_drop_start_date: data.add_drop_start_date,
        add_drop_end_date: data.add_drop_end_date,
      },
    });
    // TODO: Audit log
    return updatedSemester;
  } catch (error) {
    console.error(`Error updating semester ${semesterId}:`, error);
    throw new Error('Failed to update semester.');
  }
}

export async function deleteSemester(semesterId: number): Promise<void> {
  try {
    // Check for scheduled courses in this semester
    const scheduledCoursesCount = await prisma.scheduledCourse.count({ where: { semester_id: semesterId }});
    if (scheduledCoursesCount > 0) {
      throw new Error('Cannot delete semester with scheduled courses. Please remove or reassign them first.');
    }
    await prisma.semester.delete({
      where: { semester_id: semesterId },
    });
    // TODO: Audit log
  } catch (error) {
    console.error(`Error deleting semester ${semesterId}:`, error);
    if (error instanceof Error && error.message.includes('Cannot delete semester with scheduled courses')) {
        throw error;
    }
    throw new Error('Failed to delete semester.');
  }
}

export async function getSemestersOpenForRegistration(): Promise<Semester[]> {
  const now = new Date();
  try {
    return await prisma.semester.findMany({
      where: {
        registration_start_date: { lte: now },
        registration_end_date: { gte: now },
      },
      orderBy: { start_date: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching open semesters:', error);
    return [];
  }
}
