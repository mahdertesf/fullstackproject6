
// src/actions/userActions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { User, UserRole, UserProfile as FullUserProfile, Student, Teacher, Staff } from '@prisma/client'; // Using Prisma types directly
import type { NewUserFormData, EditUserFormData } from '@/lib/schemas';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

interface UserFilters {
  searchTerm?: string;
  role?: UserRole | 'all';
}

export async function getAllUsers(filters: UserFilters, currentUserId?: number, isCurrentUserSuperAdmin?: boolean): Promise<FullUserProfile[]> {
  const { searchTerm, role } = filters;
  const whereClause: any = {
    AND: [],
  };

  if (searchTerm) {
    whereClause.AND.push({
      OR: [
        { username: { contains: searchTerm } },
        { email: { contains: searchTerm } },
        { first_name: { contains: searchTerm } },
        { last_name: { contains: searchTerm } },
      ],
    });
  }

  if (role && role !== 'all') {
    whereClause.AND.push({ role: role });
  }
  
  // If current user is staff but not super admin, filter out other staff and super admins
  if (currentUserId && !isCurrentUserSuperAdmin) {
     const currentUserData = await prisma.user.findUnique({ where: { user_id: currentUserId } });
     if (currentUserData?.role === 'Staff') {
        whereClause.AND.push({
            NOT: {
                OR: [
                    { role: 'Staff' },
                    { is_super_admin: true }
                ]
            }
        });
     }
  }


  try {
    const users = await prisma.user.findMany({
      where: Object.keys(whereClause.AND).length > 0 ? whereClause : undefined,
      include: {
        student_profile: true,
        teacher_profile: true,
        staff_profile: true,
      },
      orderBy: {
        username: 'asc',
      },
    });
    return users as FullUserProfile[];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

export async function createUser(data: NewUserFormData, creatorRole?: UserRole, isCreatorSuperAdmin?: boolean): Promise<User> {
  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  // Prevent non-superadmin staff from creating Staff or SuperAdmin users
  if (creatorRole === 'Staff' && !isCreatorSuperAdmin && data.role === 'Staff') {
    throw new Error('Staff users cannot create other Staff accounts.');
  }
  
  let userToCreateData: any = {
    username: data.username,
    email: data.email,
    password_hash: hashedPassword,
    role: data.role,
    first_name: data.firstName,
    last_name: data.lastName,
    is_active: true,
    is_super_admin: data.role === 'Staff' && isCreatorSuperAdmin ? false : false, // Default new staff to not super admin
  };
  
  // Prepare profile data if role is Student, Teacher, or Staff
  if (data.role === 'Student') {
    userToCreateData.student_profile = {
      create: {
        enrollment_date: new Date(), 
        // department_id should be handled or made optional/nullable in schema or required in form
      },
    };
  } else if (data.role === 'Teacher') {
    userToCreateData.teacher_profile = {
      create: { 
        // department_id should be handled
      },
    };
  } else if (data.role === 'Staff') {
    userToCreateData.staff_profile = {
      create: { /* staff_id will be auto-set */ },
    };
  }

  try {
    const newUser = await prisma.user.create({
      data: userToCreateData,
      include: {
        student_profile: true,
        teacher_profile: true,
        staff_profile: true,
      }
    });
    // TODO: Audit log
    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    // Check for unique constraint violation (username or email)
    if ((error as any).code === 'P2002') {
      const target = (error as any).meta?.target;
      if (target && target.includes('username')) {
        throw new Error('Username already exists.');
      }
      if (target && target.includes('email')) {
        throw new Error('Email already registered.');
      }
    }
    throw new Error('Failed to create user.');
  }
}

export async function updateUser(userId: number, data: EditUserFormData, editorId: number): Promise<User> {
  const editor = await prisma.user.findUnique({ where: { user_id: editorId } });
  const userToEdit = await prisma.user.findUnique({ where: { user_id: userId } });

  if (!userToEdit) throw new Error('User not found.');

  // Permissions checks
  if (editor?.role === 'Staff' && !editor.is_super_admin) {
    if (userToEdit.role === 'Staff' || userToEdit.is_super_admin) {
      throw new Error('Staff cannot modify other Staff or Admin accounts.');
    }
    if (data.role === 'Staff') {
      throw new Error('Staff cannot promote users to Staff role.');
    }
  }
  if (userToEdit.is_super_admin && userId !== editorId && !editor?.is_super_admin) {
      throw new Error("Only a Super Admin can modify another Super Admin's basic details (not role/super_admin status).");
  }
  
  // Note: This function does NOT handle password changes. 
  // The EditUserFormData does not include password fields.
  // Password changes should be a separate, dedicated action.


  try {
    const updatedUser = await prisma.user.update({
      where: { user_id: userId },
      data: {
        username: data.username,
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        role: data.role,
        is_active: data.is_active,
        // is_super_admin handling needs careful consideration if it's part of EditUserFormData
      },
      include: {
        student_profile: true,
        teacher_profile: true,
        staff_profile: true,
      }
    });
    // TODO: Audit log
    return updatedUser;
  } catch (error) {
    console.error(`Error updating user ${userId}:`, error);
    if ((error as any).code === 'P2002') {
      const target = (error as any).meta?.target;
      if (target && target.includes('username')) {
        throw new Error('Username already exists for another user.');
      }
      if (target && target.includes('email')) {
        throw new Error('Email already registered by another user.');
      }
    }
    throw new Error('Failed to update user.');
  }
}

export async function deleteUser(userId: number, deleterId: number): Promise<void> {
  const deleter = await prisma.user.findUnique({ where: {user_id: deleterId}});
  const userToDelete = await prisma.user.findUnique({ where: { user_id: userId }});

  if (!userToDelete) throw new Error('User not found.');
  if (userId === deleterId) throw new Error('Cannot delete your own account.');

  if (deleter?.role === 'Staff' && !deleter.is_super_admin) {
    if (userToDelete.role === 'Staff' || userToDelete.is_super_admin) {
      throw new Error('Staff users cannot delete Staff or Admin accounts.');
    }
  }
  if (userToDelete.is_super_admin && !deleter?.is_super_admin){
      throw new Error('Only a Super Admin can delete another Super Admin account.');
  }


  try {
    // Need to handle cascading deletes or manually delete related profile data
    // if schema doesn't do it automatically or if you need specific cleanup.
    
    await prisma.user.delete({
      where: { user_id: userId },
    });
    // TODO: Audit log
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    // Check for foreign key constraint errors if related data isn't properly handled
    if ((error as any).code === 'P2003' || (error as any).code === 'P2014') {
        throw new Error ('Failed to delete user due to existing related records (e.g., course enrollments, announcements). Please reassign or remove them first.');
    }
    throw new Error('Failed to delete user.');
  }
}
