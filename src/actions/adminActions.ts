// src/actions/adminActions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { AuditLog, User } from '@prisma/client';

export interface DashboardStats {
  totalUsers: number;
  activeCourses: number; // This might mean distinct courses scheduled in current/upcoming semesters
  // Add more stats as needed
}

export async function getAdminDashboardStats(): Promise<DashboardStats> {
  try {
    const totalUsers = await prisma.user.count();
    
    // Example: Count distinct courses that are scheduled in current or future semesters
    // This is a simplified version. A more accurate count might need complex date logic.
    const activeScheduledCourses = await prisma.scheduledCourse.findMany({
      where: {
        semester: {
          // Assuming 'current' means end_date is in the future
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

interface AuditLogFilters {
  searchTerm?: string;
  actionType?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedAuditLogs {
  logs: (AuditLog & { user: { username: string } | null })[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export async function getAuditLogs(filters: AuditLogFilters): Promise<PaginatedAuditLogs> {
  const { searchTerm, actionType, page = 1, pageSize = 15 } = filters;
  const skip = (page - 1) * pageSize;

  const whereClause: any = { AND: [] };
  if (searchTerm) {
    whereClause.AND.push({
      OR: [
        { user: { username: { contains: searchTerm } } },
        { action_type: { contains: searchTerm } },
        { target_entity_type: { contains: searchTerm } },
        { target_entity_id: { contains: searchTerm } },
        { details: { contains: searchTerm } },
        { ip_address: { contains: searchTerm } },
      ],
    });
  }
  if (actionType && actionType !== 'all') {
    whereClause.AND.push({ action_type: actionType });
  }
  
  const finalWhere = whereClause.AND.length > 0 ? whereClause : {};

  try {
    const logs = await prisma.auditLog.findMany({
      where: finalWhere,
      include: {
        user: { select: { username: true } },
      },
      orderBy: { timestamp: 'desc' },
      skip,
      take: pageSize,
    });

    const totalCount = await prisma.auditLog.count({ where: finalWhere });
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      logs: logs as (AuditLog & { user: { username: string } | null })[],
      totalCount,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return { logs: [], totalCount: 0, totalPages: 0, currentPage: 1 };
  }
}

export async function getUniqueActionTypes(): Promise<string[]> {
    try {
        const distinctActions = await prisma.auditLog.findMany({
            distinct: ['action_type'],
            select: { action_type: true },
            orderBy: { action_type: 'asc' }
        });
        return distinctActions.map(a => a.action_type);
    } catch (error) {
        console.error('Error fetching unique action types:', error);
        return [];
    }
}

// TODO: Function to create audit log entries
// export async function createAuditLogEntry(
//   userId: number | null, 
//   actionType: string, 
//   details?: string, 
//   ipAddress?: string, 
//   targetEntityType?: string, 
//   targetEntityId?: string
// ): Promise<void> { ... }
