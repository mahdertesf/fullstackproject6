
// src/actions/authActions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { UserProfile } from '@/types';
import bcrypt from 'bcryptjs'; 
import type { Student as PrismaStudent, Teacher as PrismaTeacher, Staff as PrismaStaff } from '@prisma/client';


export async function loginUser(username: string, passwordAttempt: string): Promise<UserProfile> {
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      student_profile: { include: { department: true } },
      teacher_profile: { include: { department: true } },
      staff_profile: true,
    },
  });

  if (!user) {
    throw new Error('Invalid username or password.');
  }

  const isPasswordValid = await bcrypt.compare(passwordAttempt, user.password_hash);
  if (!isPasswordValid) {
    throw new Error('Invalid username or password.');
  }

  if (!user.is_active) {
    throw new Error('This account is inactive. Please contact an administrator.');
  }
  
  return user as UserProfile;
}

export async function getUserProfile(userId: number): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    include: {
      student_profile: { include: { department: true } },
      teacher_profile: { include: { department: true } },
      staff_profile: true,
    },
  });
  return user as UserProfile | null;
}

export async function updateUserProfile(userId: number, data: Partial<UserProfile> & {
  student_profile?: Partial<Omit<PrismaStudent, 'student_id' | 'user' | 'department_id'> & { department_id?: number }>; // Ensure department_id is number
  teacher_profile?: Partial<Omit<PrismaTeacher, 'teacher_id' | 'user' | 'department_id'> & { department_id?: number }>;
  staff_profile?: Partial<Omit<PrismaStaff, 'staff_id' | 'user'>>;
}): Promise<UserProfile> {
  const { student_profile, teacher_profile, staff_profile, ...userData } = data;

  const updatePayload: any = { ...userData };

  if (student_profile) {
    const studentUpdateData: any = { ...student_profile };
    // Only include department_id if it's a valid number
    if (typeof student_profile.department_id === 'number') {
      studentUpdateData.department_id = student_profile.department_id;
    } else {
      delete studentUpdateData.department_id; // Remove if not a number (e.g. undefined from form)
    }
    updatePayload.student_profile = {
      upsert: { 
        where: { student_id: userId },
        create: { 
          enrollment_date: student_profile.enrollment_date || new Date(), 
          department_id: typeof student_profile.department_id === 'number' ? student_profile.department_id : 0, // This default of 0 is problematic, should be handled by form
        },
        update: studentUpdateData,
      }
    };
  }

  if (teacher_profile) {
    const teacherUpdateData: any = { ...teacher_profile };
    if (typeof teacher_profile.department_id === 'number') {
      teacherUpdateData.department_id = teacher_profile.department_id;
    } else {
      delete teacherUpdateData.department_id;
    }
    updatePayload.teacher_profile = {
      upsert: {
        where: { teacher_id: userId },
        create: { 
            department_id: typeof teacher_profile.department_id === 'number' ? teacher_profile.department_id : 0, // Problematic default
            ...(teacherUpdateData.office_location && {office_location: teacherUpdateData.office_location})
        },
        update: teacherUpdateData,
      }
    };
  }
  
  if (staff_profile) {
    updatePayload.staff_profile = {
      upsert: {
        where: { staff_id: userId },
        create: { ...staff_profile },
        update: { ...staff_profile },
      }
    };
  }

  const updatedUser = await prisma.user.update({
    where: { user_id: userId },
    data: updatePayload,
    include: {
      student_profile: { include: { department: true } },
      teacher_profile: { include: { department: true } },
      staff_profile: true,
    }
  });
  return updatedUser as UserProfile;
}
