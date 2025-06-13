
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
  student_id: number;
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
  teacher_id: number;
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
  staff_id: number;
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
  teacher_id: number;
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
  teacher?: Teacher; // Optional
  room?: Room; // Optional
}

export type RegistrationStatus = 'Registered' | 'Dropped' | 'Completed' | 'Waitlisted';

export interface Registration {
  registration_id: number;
  student_id: number;
  scheduled_course_id: number;
  registration_date: string;
  status: RegistrationStatus;
  final_grade?: string | null; // This will be the letter grade
  grade_points?: number | null;
  updated_at: string;
  student?: Student; // Optional
  scheduledCourse?: ScheduledCourse; // Optional
  overall_percentage?: number | null;
  final_letter_grade?: string | null;
}


export type MaterialType = 'File' | 'Link';

export interface CourseMaterial {
  material_id: number;
  scheduled_course_id: number;
  title: string;
  description?: string | null;
  material_type: MaterialType;
  file_path?: string | null;
  url?: string | null;
  uploaded_by: number; // teacher_id
  upload_timestamp: string;
  scheduledCourse?: ScheduledCourse; // Optional
  uploader?: Teacher; // Optional
}

export interface AuditLog {
  log_id: number;
  user_id?: number | null;
  action_type: string;
  target_entity_type?: string | null;
  target_entity_id?: string | null;
  timestamp: string;
  ip_address?: string | null;
  details?: string | null;
  user?: User; // Optional
}

export type AnnouncementStatus = 'Draft' | 'Scheduled' | 'Published' | 'Archived';

export interface Announcement {
  announcement_id: number;
  title: string;
  content: string;
  author_id: number;
  target_audience: string;
  desired_tone?: string | null;
  status: AnnouncementStatus;
  publish_date?: string | null;
  expiry_date?: string | null;
  department_id?: number | null;
  semester_id?: number | null;
  created_at: string;
  updated_at: string;
  author?: User; // Optional
  department?: Department; // Optional
  semester?: Semester; // Optional
}

// Combined user profile type for easier handling in profile page
export type UserProfile = (User & Partial<Student> & Partial<Teacher> & Partial<Staff>) & {
  isSuperAdmin?: boolean;
};

// For Grade Management
export interface Assessment {
  assessment_id: number;
  scheduled_course_id: number;
  name: string;
  max_score: number;
  assessment_type?: string | null; // e.g. Homework, Quiz, Exam
  created_at: string;
  updated_at: string;
}

export interface StudentAssessmentScore {
  student_assessment_score_id: number;
  registration_id: number; // Links to student's enrollment in the course
  assessment_id: number;
  score_achieved?: number | null;
  graded_timestamp?: string | null;
  feedback?: string | null;
  assessment?: Assessment; // Optional
  registration?: Registration; // Optional
}
