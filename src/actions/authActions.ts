// src/actions/authActions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { UserProfile } from '@/types';
// import bcrypt from 'bcryptjs'; // TODO: Use bcrypt for password hashing in production

export async function loginUser(username: string, passwordAttempt: string): Promise<UserProfile> {
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      student_profile: true,
      teacher_profile: true,
      staff_profile: true,
    },
  });

  if (!user) {
    throw new Error('Invalid username or password.');
  }

  // IMPORTANT: Plaintext password comparison.
  // In a real application, NEVER store passwords in plaintext.
  // You should hash passwords upon user creation/update and compare hashes here.
  // Example using bcrypt (install bcryptjs: npm install bcryptjs @types/bcryptjs):
  // const isPasswordValid = await bcrypt.compare(passwordAttempt, user.password_hash);
  // if (!isPasswordValid) {
  //   throw new Error('Invalid username or password.');
  // }
  // For this prototype, we'll do a simple (and insecure) check.
  if (user.password_hash !== passwordAttempt) {
     throw new Error('Invalid username or password.');
  }

  if (!user.is_active) {
    throw new Error('This account is inactive. Please contact an administrator.');
  }
  
  // The UserProfile type should directly align with Prisma's User model + relations
  return user as UserProfile;
}

export async function getUserProfile(userId: number): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    include: {
      student_profile: true,
      teacher_profile: true,
      staff_profile: true,
    },
  });
  return user as UserProfile | null;
}

export async function updateUserProfile(userId: number, data: Partial<UserProfile> & {
  student_profile?: Partial<Omit<PrismaStudent, 'student_id' | 'user'>>;
  teacher_profile?: Partial<Omit<PrismaTeacher, 'teacher_id' | 'user'>>;
  staff_profile?: Partial<Omit<PrismaStaff, 'staff_id' | 'user'>>;
}): Promise<UserProfile> {
  const { student_profile, teacher_profile, staff_profile, ...userData } = data;

  const updatedUser = await prisma.user.update({
    where: { user_id: userId },
    data: {
      ...userData,
      student_profile: student_profile ? {
        upsert: { // Use upsert for profile to create if not exists, update if exists
          where: { student_id: userId },
          create: { ...student_profile, enrollment_date: student_profile.enrollment_date || new Date(), department_id: student_profile.department_id || 0 /* TODO: Handle default/required dept */ },
          update: { ...student_profile },
        }
      } : undefined,
      teacher_profile: teacher_profile ? {
        upsert: {
          where: { teacher_id: userId },
          create: { ...teacher_profile, department_id: teacher_profile.department_id || 0 /* TODO: Handle default/required dept */ },
          update: { ...teacher_profile },
        }
      } : undefined,
      staff_profile: staff_profile ? {
        upsert: {
          where: { staff_id: userId },
          create: { ...staff_profile },
          update: { ...staff_profile },
        }
      } : undefined,
    },
    include: {
      student_profile: true,
      teacher_profile: true,
      staff_profile: true,
    }
  });
  return updatedUser as UserProfile;
}
