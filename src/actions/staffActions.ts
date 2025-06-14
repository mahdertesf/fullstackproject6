// src/actions/staffActions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { UserRole } from '@prisma/client';

export interface StaffDashboardStats {
  upcomingScheduledCourses: number;
  recentStudentTeacherAccounts: number;
  // Add more stats as needed
}

export async function getStaffDashboardStats(): Promise<StaffDashboardStats> {
  try {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const upcomingScheduledCourses = await prisma.scheduledCourse.count({
      where: {
        semester: {
          start_date: {
            gte: new Date(),
            lt: nextMonth,
          },
        },
      },
    });

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentStudentTeacherAccounts = await prisma.user.count({
      where: {
        role: {
          in: ['Student', 'Teacher'] as UserRole[],
        },
        created_at: { // Assuming you have a created_at field on User model
          gte: oneWeekAgo,
        },
      },
    });
    
    return {
      upcomingScheduledCourses,
      recentStudentTeacherAccounts,
    };
  } catch (error) {
    console.error('Error fetching staff dashboard stats:', error);
    return {
      upcomingScheduledCourses: 0,
      recentStudentTeacherAccounts: 0,
    };
  }
}
