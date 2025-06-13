

export type UserRole = 'Student' | 'Teacher' | 'Staff';

export interface User {
  user_id: number;
  username: string;
  password_hash: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Department {
  department_id: number;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Student {
  student_id: number; // This is the foreign key to User.user_id
  first_name: string;
  last_name: string;
  date_of_birth?: string | null;
  address?: string | null;
  phone_number?: string | null;
  department_id?: number | null;
  enrollment_date: string;
  updated_at: string;
  user?: User; // Optional: for joining with Users table
  department?: Department; // Optional: for joining
}

export interface Teacher {
  teacher_id: number; // This is the foreign key to User.user_id
  first_name: string;
  last_name: string;
  department_id: number;
  office_location?: string | null;
  phone_number?: string | null;
  updated_at: string;
  user?: User; // Optional
  department?: Department; // Optional
}

export interface Staff {
  staff_id: number; // This is the foreign key to User.user_id
  first_name: string;
  last_name: string;
  job_title?: string | null;
  phone_number?: string | null;
  updated_at: string;
  user?: User; // Optional
}

export interface Course {
  course_id: number;
  course_code: string;
  title: string;
  description?: string | null;
  credits: number;
  department_id: number;
  created_at: string;
  updated_at: string;
  department?: Department; // Optional
}

export interface Prerequisite {
  prerequisite_id: number;
  course_id: number;
  prerequisite_course_id: number;
  course?: Course; // Optional
  prerequisiteCourse?: Course; // Optional
}

export type SemesterTerm = 'Fall' | 'Spring' | 'Summer' | 'Winter';

export interface Semester {
  semester_id: number;
  name: string;
  academic_year: number;
  term: SemesterTerm;
  start_date: string;
  end_date: string;
  registration_start_date: string;
  registration_end_date: string;
  add_drop_start_date: string;
  add_drop_end_date: string;
  created_at: string;
  updated_at: string;
}

export interface Building {
  building_id: number;
  name: string;
  address?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Room {
  room_id: number;
  building_id: number;
  room_number: string;
  capacity: number;
  type?: string | null;
  created_at: string;
  updated_at: string;
  building?: Building; // Optional
}

export interface ScheduledCourse {
  scheduled_course_id: number;
  course_id: number;
  semester_id: number;
  teacher_id: number; // This corresponds to UserProfile.user_id for a teacher
  room_id?: number | null;
  section_number: string;
  max_capacity: number;
  current_enrollment: number;
  days_of_week?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  created_at: string;
  updated_at: string;
  course?: Course; // Optional
  semester?: Semester; // Optional
  teacher?: UserProfile; 
  room?: Room; // Optional
}

export type RegistrationStatus = 'Registered' | 'Dropped' | 'Completed' | 'Waitlisted';

export interface Registration {
  registration_id: number;
  student_id: number; // Corresponds to UserProfile.user_id for a student
  scheduled_course_id: number;
  registration_date: string;
  status: RegistrationStatus;
  final_grade?: string | null; 
  grade_points?: number | null; 
  updated_at: string;
  student?: UserProfile; 
  scheduledCourse?: ScheduledCourse; 
  overall_percentage?: number | null;
  final_letter_grade?: string | null;
}


export type MaterialType = 'File' | 'Link';

export interface CourseMaterial {
  material_id: number;
  scheduled_course_id: number; // Links material to a specific offering of a course
  title: string;
  description?: string | null;
  material_type: MaterialType;
  file_path?: string | null; // For 'File' type, path to the stored file
  url?: string | null;       // For 'Link' type, the actual URL
  uploaded_by: number; // User ID of the teacher who uploaded
  upload_timestamp: string;
  scheduledCourse?: ScheduledCourse; // Optional: for joining
  uploader?: UserProfile; // Optional: for joining
}

export interface AuditLog {
  log_id: number;
  user_id?: number | null; // Corresponds to UserProfile.user_id
  action_type: string;
  target_entity_type?: string | null;
  target_entity_id?: string | null;
  timestamp: string;
  ip_address?: string | null;
  details?: string | null;
  user?: UserProfile; 
}

export type AnnouncementStatus = 'Draft' | 'Scheduled' | 'Published' | 'Archived';
export type AnnouncementTone = 'Formal' | 'Urgent' | 'Friendly' | 'Informative' | 'Academic';
export type AnnouncementTargetAudience = 'Students' | 'Teachers' | 'Staff' | 'All Users';


export interface Announcement {
  announcement_id: number;
  title: string;
  content: string;
  author_id: number; // Corresponds to UserProfile.user_id
  target_audience: AnnouncementTargetAudience;
  desired_tone?: AnnouncementTone | null;
  status: AnnouncementStatus;
  publish_date?: string | null;
  expiry_date?: string | null;
  department_id?: number | null;
  semester_id?: number | null;
  created_at: string;
  updated_at: string;
  author?: UserProfile; 
  department?: Department; 
  semester?: Semester; 
  target_section_ids?: number[]; // For teacher announcements to specific sections
}

// Combined user profile type for easier handling in profile page and relationships
// It merges the base User with role-specific details.
// The 'student_id', 'teacher_id', 'staff_id' from original role tables are now effectively 'user_id'.
export type UserProfile = User & Partial<Omit<Student, 'student_id' | 'user' | 'department'>> & Partial<Omit<Teacher, 'teacher_id' | 'user' | 'department'>> & Partial<Omit<Staff, 'staff_id' | 'user'>> & {
  isSuperAdmin?: boolean; // Specific flag for the main admin
  profile_picture_url?: string; // Centralized profile picture
  // department_id might be present if student/teacher; already in Student/Teacher types
  // enrollment_date for students; already in Student type
};


// For Grade Management
export interface Assessment {
  assessment_id: number;
  scheduled_course_id: number;
  name: string;
  max_score: number;
  assessment_type?: string | null; 
  created_at: string;
  updated_at: string;
}

export interface StudentAssessmentScore {
  student_assessment_score_id: number;
  registration_id: number; 
  assessment_id: number;
  score_achieved?: number | null;
  graded_timestamp?: string | null;
  feedback?: string | null;
  assessment?: Assessment; 
  registration?: Registration; 
}

// Helper type for enriched registration data used in frontend components
export interface EnrichedRegistration extends Registration {
  studentProfile?: UserProfile; // The student user profile
  scheduledCourse?: ScheduledCourse; // The specific section/offering
  courseDetails?: Course; // Details of the course itself
  semesterDetails?: Semester; // Details of the semester
  assessments?: (Assessment & { studentScore?: StudentAssessmentScore })[]; // Assessments for the scheduled course with student's score
  materials?: CourseMaterial[]; // Course materials for this scheduled course
}

export interface TeacherSectionInfo {
  id: string; // scheduled_course_id
  name: string; // e.g., "SE301 - S1 (Spring 2024)"
}

