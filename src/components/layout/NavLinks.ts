// src/components/layout/NavLinks.ts

import type { UserRole } from '@/types';
import type { LucideIcon } from 'lucide-react';
import { 
  Home, 
  BookOpen, 
  Users, 
  Building, 
  FileText, 
  Settings, 
  Speaker, 
  BarChart3, 
  GraduationCap, 
  Edit3, 
  Megaphone, 
  // ListChecks, // Icon for Audit Log, removed
  HardHat, 
  UserCircle, 
  Layers 
} from 'lucide-react';

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[] | 'all' | 'superadmin'; 
  children?: NavLink[]; 
}

export const navLinks: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home, roles: 'all' },
  { href: '/profile', label: 'My Profile', icon: UserCircle, roles: 'all' },
  { href: '/courses', label: 'Course Catalog', icon: BookOpen, roles: 'all' },
  { href: '/departments', label: 'Departments', icon: Building, roles: 'all' },
  
  // Student specific
  { href: '/student/my-schedule', label: 'My Schedule', icon: FileText, roles: ['Student'] },
  { href: '/student/register', label: 'Course Registration', icon: Edit3, roles: ['Student'] },
  { href: '/student/transcript', label: 'My Transcript', icon: GraduationCap, roles: ['Student'] },
  { href: '/study-guide', label: 'Materials & AI Guide', icon: Layers, roles: ['Student'] },

  // Teacher specific
  { href: '/teacher/my-courses', label: 'My Courses', icon: BookOpen, roles: ['Teacher'] },
  { href: '/teacher/announcements', label: 'Post Announcement', icon: Speaker, roles: ['Teacher']},
  { href: '/teacher/view-announcements', label: 'View Announcements', icon: Megaphone, roles: ['Teacher']},


  // Staff specific (Admin also gets these)
  { href: '/staff/user-management', label: 'Manage Users', icon: Users, roles: ['Staff'] },
  { href: '/staff/course-management', label: 'Manage Courses', icon: Settings, roles: ['Staff'] },
  { href: '/staff/semester-management', label: 'Manage Semesters', icon: BarChart3, roles: ['Staff'] },
  { href: '/staff/schedule-courses', label: 'Schedule Courses', icon: Edit3, roles: ['Staff'] },
  { href: '/announcements/create', label: 'Create Announcement', icon: Speaker, roles: ['Staff'] }, 

  // Admin specific (Super Admin)
  { href: '/admin/full-user-management', label: 'Full User Management', icon: Users, roles: 'superadmin' },
  { href: '/admin/department-management', label: 'Manage Departments', icon: Building, roles: 'superadmin' },
  { href: '/admin/infrastructure', label: 'Campus Infrastructure', icon: HardHat, roles: 'superadmin' },
  // { href: '/admin/audit-log', label: 'Audit Log', icon: ListChecks, roles: 'superadmin' }, // Audit Log link removed
  { href: '/admin/settings', label: 'Admin Settings', icon: Settings, roles: 'superadmin' },
];

export const getFilteredNavLinks = (role: UserRole, isSuperAdmin: boolean = false): NavLink[] => {
  return navLinks.filter(link => {
    if (link.roles === 'all') return true;
    if (isSuperAdmin && link.roles === 'superadmin') return true;
    if (isSuperAdmin && Array.isArray(link.roles) && link.roles.includes('Staff')) return true;
    return Array.isArray(link.roles) && link.roles.includes(role);
  }).map(link => ({
    ...link,
    children: link.children ? link.children.filter(childLink => {
      if (childLink.roles === 'all') return true;
      if (isSuperAdmin && childLink.roles === 'superadmin') return true;
      if (isSuperAdmin && Array.isArray(childLink.roles) && childLink.roles.includes('Staff')) return true;
      return Array.isArray(childLink.roles) && childLink.roles.includes(role);
    }) : undefined
  })).sort((a, b) => { 
      const order = [
        'Dashboard', 'My Profile', 
        'My Schedule', 'Course Catalog', 'Course Registration', 'My Transcript', 
        'Departments', 'Materials & AI Guide',
        'My Courses', 'Post Announcement', 'View Announcements', 
        'Create Announcement', 
        'Manage Users', 'Full User Management', 
        'Manage Courses', 'Manage Semesters', 'Schedule Courses', 
        'Manage Departments', 'Campus Infrastructure', /*'Audit Log',*/ 'Admin Settings' // Audit Log removed from sort order
      ];
      return order.indexOf(a.label) - order.indexOf(b.label);
  });
};
