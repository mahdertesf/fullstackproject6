// src/actions/userActions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { User, UserRole, UserProfile as FullUserProfile, Student, Teacher, Staff } from '@prisma/client'; // Using Prisma types directly
import type { NewUserFormData, EditUserFormData } from '@/lib/schemas';
// import bcrypt from 'bcryptjs'; // TODO: For password hashing

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
  // const hashedPassword = await bcrypt.hash(data.password, 10); // TODO: Use bcrypt
  const hashedPassword = data.password; // Insecure placeholder

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
        // student_id will be auto-set to user_id by Prisma relation
        enrollment_date: new Date(), 
        // department_id: 0, // TODO: Student needs a department, how to set this at creation?
                          // For now, this will cause an error if department_id is not nullable or has no default.
                          // Assuming department_id on Student can be null or has a default for this example.
                          // Or it should be part of the NewUserFormData specific for students.
                          // Temporarily allowing it to be null for now, will need schema adjustment or form update.
      },
    };
  } else if (data.role === 'Teacher') {
    userToCreateData.teacher_profile = {
      create: { 
        // teacher_id will be auto-set
        // department_id: 0, // TODO: Teacher needs a department.
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
  
  // Prevent deactivating/changing role of self if super admin trying to demote/deactivate THEMSELVES
  if (userToEdit.is_super_admin && userId === editorId && (data.role !== 'Staff' || !data.is_active)) {
     // Allow super admin to change their own details (name, email) but not easily demote/deactivate self.
     // This specific check might need refinement based on exact business rules for self-modification.
     // For now, allow a super admin to change their own active status or role if desired.
  }


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
        // is_super_admin: (userToEdit.is_super_admin && userId === editorId) ? userToEdit.is_super_admin : (data.role === 'Staff' && editor?.is_super_admin ? (data.is_super_admin ?? false) : false),
        // ^ Logic for is_super_admin needs careful thought. If it's set on user profile, it's simpler.
        // Assuming is_super_admin is directly on User model and only editable by another super admin.
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
    // For Student, Teacher, Staff profiles, if they use user_id as @id and have a relation,
    // Prisma might handle this based on `onDelete` rules in relations.
    // If they are separate tables with foreign keys, explicit deletion might be needed if `onDelete` is not `Cascade`.
    
    // Example: if student/teacher/staff profiles need manual deletion first:
    // if (userToDelete.role === 'Student' && userToDelete.student_profile) await prisma.student.delete({ where: { student_id: userId }});
    // if (userToDelete.role === 'Teacher' && userToDelete.teacher_profile) await prisma.teacher.delete({ where: { teacher_id: userId }});
    // if (userToDelete.role === 'Staff' && userToDelete.staff_profile) await prisma.staff.delete({ where: { staff_id: userId }});

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
