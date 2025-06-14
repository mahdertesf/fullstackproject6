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
  AnnouncementTargetSection as PrismaAnnouncementTargetSection
} from '@prisma/client';

// Re-export Prisma types or create new ones that extend them if needed
export type User = PrismaUser;
export type Department = PrismaDepartment;
export type Course = PrismaCourse;
export type Student = PrismaStudent;
export type Teacher = PrismaTeacher;
export type Staff = PrismaStaff;
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


export type UserRole = 'Student' | 'Teacher' | 'Staff';
export type SemesterTerm = 'Fall' | 'Spring' | 'Summer' | 'Winter';
export type RegistrationStatus = 'Registered' | 'Dropped' | 'Completed' | 'Waitlisted';
export type MaterialType = 'File' | 'Link';
export type AnnouncementStatus = 'Draft' | 'Scheduled' | 'Published' | 'Archived';
export type AnnouncementTone = 'Formal' | 'Urgent' | 'Friendly' | 'Informative' | 'Academic';
export type AnnouncementTargetAudience = 'Students' | 'Teachers' | 'Staff' | 'All Users';


// Combined user profile type for easier handling in profile page and relationships
// User model in Prisma now has direct relations for student_profile, teacher_profile, staff_profile
// So UserProfile can be derived from PrismaUser with its relations included.
export type UserProfile = PrismaUser & {
  student_profile?: PrismaStudent | null;
  teacher_profile?: PrismaTeacher | null;
  staff_profile?: PrismaStaff | null;
  isSuperAdmin?: boolean; // This might be a specific field on User or StaffProfile
  profile_picture_url?: string | null; 
};

// Helper type for enriched registration data used in frontend components
// This might need adjustment based on how relations are included in Prisma queries
export interface EnrichedRegistration extends PrismaRegistration {
  student?: UserProfile; // Assuming student relation on Registration points to User
  scheduledCourse?: PrismaScheduledCourse & {
    course?: PrismaCourse;
    semester?: PrismaSemester;
    teacher?: UserProfile; // Assuming teacher relation points to User
    room?: PrismaRoom & { building?: PrismaBuilding };
  };
  assessments?: (PrismaAssessment & { 
    studentAssessmentScores?: PrismaStudentAssessmentScore[]; // Student's score for THIS registration
  })[];
  materials?: PrismaCourseMaterial[];
}


export interface TeacherSectionInfo {
  id: string; // scheduled_course_id
  name: string; // e.g., "SE301 - S1 (Spring 2024)"
}
