// src/types/index.ts
import type { 
  User as PrismaUser, 
  Department as PrismaDepartment, 
  Course as PrismaCourse, 
  Student as PrismaStudent, 
  Teacher as PrismaTeacher, 
  Staff as PrismaStaff, 
  Semester as PrismaSemester, 
  Announcement as PrismaAnnouncement, 
  ScheduledCourse as PrismaScheduledCourse, 
  Registration as PrismaRegistration, 
  CourseMaterial as PrismaCourseMaterial, 
  Assessment as PrismaAssessment,
  Building as PrismaBuilding,
  Room as PrismaRoom,
  Prerequisite as PrismaPrerequisite,
  AuditLog as PrismaAuditLog,
  StudentAssessmentScore as PrismaStudentAssessmentScore,
  AnnouncementTargetSection as PrismaAnnouncementTargetSection,
  UserRole as PrismaUserRole,
  SemesterTerm as PrismaSemesterTerm,
  RegistrationStatus as PrismaRegistrationStatus,
  MaterialType as PrismaMaterialType,
  AnnouncementStatus as PrismaAnnouncementStatus,
  AnnouncementTargetAudience as PrismaAnnouncementTargetAudience
} from '@prisma/client';

// Re-export Prisma types
export type User = PrismaUser;
export type Department = PrismaDepartment;
export type Course = PrismaCourse;
export type Student = PrismaStudent; // Represents the student profile data
export type Teacher = PrismaTeacher; // Represents the teacher profile data
export type Staff = PrismaStaff;     // Represents the staff profile data
export type Semester = PrismaSemester;
export type Announcement = PrismaAnnouncement;
export type ScheduledCourse = PrismaScheduledCourse;
export type Registration = PrismaRegistration;
export type CourseMaterial = PrismaCourseMaterial;
export type Assessment = PrismaAssessment;
export type Building = PrismaBuilding;
export type Room = PrismaRoom;
export type Prerequisite = PrismaPrerequisite;
export type AuditLog = PrismaAuditLog;
export type StudentAssessmentScore = PrismaStudentAssessmentScore;
export type AnnouncementTargetSection = PrismaAnnouncementTargetSection;

// Re-export Enums or use Prisma's directly in components
export type UserRole = PrismaUserRole;
export type SemesterTerm = PrismaSemesterTerm;
export type RegistrationStatus = PrismaRegistrationStatus;
export type MaterialType = PrismaMaterialType;
export type AnnouncementStatus = PrismaAnnouncementStatus;
export type AnnouncementTargetAudience = PrismaAnnouncementTargetAudience;


// UserProfile now includes profile relations and an optional isSuperAdmin flag
export type UserProfile = PrismaUser & {
  student_profile?: PrismaStudent | null;
  teacher_profile?: PrismaTeacher | null;
  staff_profile?: PrismaStaff | null;
  // isSuperAdmin flag is directly on User model in Prisma
  profile_picture_url?: string | null; 
};

// EnrichedRegistration for frontend use where relations are included
export type EnrichedRegistration = PrismaRegistration & {
  student?: UserProfile; 
  scheduledCourse?: PrismaScheduledCourse & {
    course?: PrismaCourse;
    semester?: PrismaSemester;
    teacher?: UserProfile; 
    room?: PrismaRoom & { building?: PrismaBuilding };
  };
  assessment_scores?: (PrismaStudentAssessmentScore & { assessment?: PrismaAssessment })[];
};

export interface TeacherSectionInfo {
  id: string; // scheduled_course_id as string
  name: string; // e.g., "SE301 - S1 (Spring 2024)"
}

export const gradePointMapping: Record<string, number> = {
  'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0,
};
