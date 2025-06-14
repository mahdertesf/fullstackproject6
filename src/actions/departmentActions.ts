// src/actions/departmentActions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { Department } from '@prisma/client';

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
    // In a real app, you might want to throw a more specific error
    // or return an empty array/error object for the frontend to handle.
    return []; 
  }
}
