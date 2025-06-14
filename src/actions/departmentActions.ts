// src/actions/departmentActions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { Department } from '@prisma/client';
import type { DepartmentFormData } from '@/lib/schemas';

export async function getAllDepartments(): Promise<Department[]> {
  try {
    const departments = await prisma.department.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return departments;
  } catch (error) {
    console.error('Error fetching departments:', error);
    return []; 
  }
}

export async function getDepartmentById(departmentId: number): Promise<Department | null> {
  try {
    return await prisma.department.findUnique({
      where: { department_id: departmentId },
    });
  } catch (error) {
    console.error(`Error fetching department ${departmentId}:`, error);
    return null;
  }
}

export async function createDepartment(data: DepartmentFormData): Promise<Department> {
  try {
    const newDepartment = await prisma.department.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });
    // TODO: Add audit log entry
    return newDepartment;
  } catch (error) {
    console.error('Error creating department:', error);
    throw new Error('Failed to create department.');
  }
}

export async function updateDepartment(departmentId: number, data: DepartmentFormData): Promise<Department> {
  try {
    const updatedDepartment = await prisma.department.update({
      where: { department_id: departmentId },
      data: {
        name: data.name,
        description: data.description,
      },
    });
    // TODO: Add audit log entry
    return updatedDepartment;
  } catch (error) {
    console.error(`Error updating department ${departmentId}:`, error);
    throw new Error('Failed to update department.');
  }
}

export async function deleteDepartment(departmentId: number): Promise<void> {
  try {
    // Check for related entities (courses, students, teachers) before deleting
    const coursesCount = await prisma.course.count({ where: { department_id: departmentId }});
    // Add similar checks for students, teachers if they directly link to department
    // and if Prisma schema doesn't handle cascading deletes or restricted deletes appropriately.
    if (coursesCount > 0) {
      throw new Error('Cannot delete department with associated courses. Please reassign or delete them first.');
    }
    await prisma.department.delete({
      where: { department_id: departmentId },
    });
    // TODO: Add audit log entry
  } catch (error) {
    console.error(`Error deleting department ${departmentId}:`, error);
    if (error instanceof Error && error.message.includes('Cannot delete department with associated courses')) {
        throw error;
    }
    throw new Error('Failed to delete department.');
  }
}
