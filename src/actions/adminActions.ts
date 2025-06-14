// src/actions/adminActions.ts
'use server';

import { prisma } from '@/lib/prisma';
// AuditLog related imports removed

export interface DashboardStats {
  totalUsers: number;
  activeCourses: number; // This might mean distinct courses scheduled in current/upcoming semesters
  // Add more stats as needed
}

export async function getAdminDashboardStats(): Promise<DashboardStats> {
  try {
    const totalUsers = await prisma.user.count();
    
    const activeScheduledCourses = await prisma.scheduledCourse.findMany({
      where: {
        semester: {
          end_date: { gte: new Date() } 
        }
      },
      distinct: ['course_id']
    });
    const activeCourses = activeScheduledCourses.length;

    return {
      totalUsers,
      activeCourses,
    };
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    return { totalUsers: 0, activeCourses: 0 };
  }
}

// AuditLog related functions (getAuditLogs, getUniqueActionTypes, PaginatedAuditLogs, AuditLogFilters) have been removed.
// Function to create audit log entries would also be removed if it existed here.
