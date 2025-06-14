
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
        { username: { contains: searchTerm, mode: 'insensitive' } }, // Added mode insensitive
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { first_name: { contains: searchTerm, mode: 'insensitive' } },
        { last_name: { contains: searchTerm, mode: 'insensitive' } },
      ],
    });
  }

  if (role && role !== 'all') {
    whereClause.AND.push({ role: role });
  }
  
  if (currentUserId && !isCurrentUserSuperAdmin) {
     const currentUserData = await prisma.user.findUnique({ where: { user_id: currentUserId } });
     if (currentUserData?.role === 'Staff') {
        whereClause.AND.push({
            NOT: {
                OR: [
                    { role: 'Staff' }, // Non-superadmin staff cannot see other staff
                    { is_super_admin: true } // Non-superadmin staff cannot see superadmins
                ]
            }
        });
     }
  }


  try {
    const users = await prisma.user.findMany({
      where: Object.keys(whereClause.AND).length > 0 ? whereClause : undefined,
      include: {
        student_profile: { include: { department: true }},
        teacher_profile: { include: { department: true }},
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

  if (creatorRole === 'Staff' && !isCreatorSuperAdmin && data.role === 'Staff') {
    throw new Error('Staff users cannot create other Staff accounts.');
  }
  
  const userToCreateData: any = {
    username: data.username,
    email: data.email,
    password_hash: hashedPassword,
    role: data.role,
    first_name: data.firstName,
    last_name: data.lastName,
    is_active: true,
    is_super_admin: data.role === 'Staff' && isCreatorSuperAdmin ? false : false, 
  };
  
  if (data.role === 'Student' && data.department_id) {
    userToCreateData.student_profile = {
      create: {
        enrollment_date: new Date(), 
        department_id: parseInt(data.department_id),
      },
    };
  } else if (data.role === 'Teacher' && data.department_id) {
    userToCreateData.teacher_profile = {
      create: { 
        department_id: parseInt(data.department_id),
      },
    };
  } else if (data.role === 'Staff') {
    userToCreateData.staff_profile = {
      create: { job_title: 'General Staff' }, // Default job title
    };
  } else if ((data.role === 'Student' || data.role === 'Teacher') && !data.department_id) {
    // This case should be prevented by schema validation if department_id is required
    throw new Error('Department ID is required for Student or Teacher role.');
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
    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
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
  
  const updateDataPayload: any = {
    username: data.username,
    email: data.email,
    first_name: data.firstName,
    last_name: data.lastName,
    role: data.role,
    is_active: data.is_active,
  };

  // Handle department changes for student/teacher profiles
  if ((data.role === 'Student' || data.role === 'Teacher') && data.department_id) {
    const departmentIdNum = parseInt(data.department_id);
    if (data.role === 'Student') {
      updateDataPayload.student_profile = {
        upsert: {
          where: { student_id: userId },
          create: { enrollment_date: new Date(), department_id: departmentIdNum },
          update: { department_id: departmentIdNum },
        },
      };
    } else if (data.role === 'Teacher') {
      updateDataPayload.teacher_profile = {
        upsert: {
          where: { teacher_id: userId },
          create: { department_id: departmentIdNum },
          update: { department_id: departmentIdNum },
        },
      };
    }
  } else if (data.role === 'Staff') { // Ensure staff profile exists if role changes to Staff
     updateDataPayload.staff_profile = {
        upsert: {
            where: { staff_id: userId },
            create: { job_title: 'General Staff' }, // Or fetch existing job title if preferred
            update: { job_title: userToEdit.staff_profile?.job_title || 'General Staff' },
        }
     }
     // If role changes FROM Student/Teacher TO Staff, we might want to nullify/disconnect old profile
     if (userToEdit.role === 'Student' && userToEdit.student_profile) {
        updateDataPayload.student_profile = { disconnect: true };
     }
     if (userToEdit.role === 'Teacher' && userToEdit.teacher_profile) {
        updateDataPayload.teacher_profile = { disconnect: true };
     }

  }


  try {
    const updatedUser = await prisma.user.update({
      where: { user_id: userId },
      data: updateDataPayload,
      include: {
        student_profile: true,
        teacher_profile: true,
        staff_profile: true,
      }
    });
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
    // Prisma cascades should handle related profile data if set up in schema.
    // If not, manual deletion of student_profile, teacher_profile, staff_profile might be needed first.
    // Example: await prisma.student.deleteMany({ where: { student_id: userId } });
    
    await prisma.user.delete({
      where: { user_id: userId },
    });
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    if ((error as any).code === 'P2003' || (error as any).code === 'P2014') {
        throw new Error ('Failed to delete user due to existing related records (e.g., course enrollments, announcements). Please reassign or remove them first.');
    }
    throw new Error('Failed to delete user.');
  }
}
