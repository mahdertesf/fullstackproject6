
import type { User, Department, Course, Student, Teacher, Staff, Semester, Announcement, ScheduledCourse, Registration, CourseMaterial, Assessment, UserProfile, Building, Room, Prerequisite, AuditLog, StudentAssessmentScore } from '@/types';

export const mockUsers: User[] = [
  { user_id: 1, username: 'admin', password_hash: 'hashed_password', email: 'admin@cotbe.edu', role: 'Staff', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { user_id: 2, username: 'staff1', password_hash: 'hashed_password', email: 'staff1@cotbe.edu', role: 'Staff', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { user_id: 3, username: 'teacher1', password_hash: 'hashed_password', email: 'teacher1@cotbe.edu', role: 'Teacher', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { user_id: 4, username: 'student1', password_hash: 'hashed_password', email: 'student1@cotbe.edu', role: 'Student', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { user_id: 5, username: 'student2', password_hash: 'hashed_password', email: 'student2@cotbe.edu', role: 'Student', is_active: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { user_id: 6, username: 'teacher2', password_hash: 'hashed_password', email: 'teacher2@cotbe.edu', role: 'Teacher', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { user_id: 7, username: 'student3', password_hash: 'hashed_password', email: 'student3@cotbe.edu', role: 'Student', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const mockDepartments: Department[] = [
  { department_id: 1, name: 'Software Engineering', description: 'Department of Software Engineering studies.', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { department_id: 2, name: 'Civil Engineering', description: 'Department of Civil Engineering.', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { department_id: 3, name: 'Electrical Engineering', description: 'Focuses on electrical systems and electronics.', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { department_id: 4, name: 'Mechanical Engineering', description: 'Deals with design and manufacturing of mechanical systems.', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const mockCourses: Course[] = [
  { course_id: 1, course_code: 'SE301', title: 'Introduction to Programming', description: 'Basics of programming using Python.', credits: 3, department_id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { course_id: 2, course_code: 'CE205', title: 'Structural Analysis', description: 'Analysis of structural components.', credits: 4, department_id: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { course_id: 3, course_code: 'EE201', title: 'Circuit Theory', description: 'Fundamentals of electrical circuits.', credits: 3, department_id: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { course_id: 4, course_code: 'ME303', title: 'Thermodynamics', description: 'Principles of heat and energy transfer.', credits: 4, department_id: 4, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { course_id: 5, course_code: 'SE450', title: 'Web Development', description: 'Full-stack web application development.', credits: 3, department_id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { course_id: 6, course_code: 'SE320', title: 'Data Structures and Algorithms', description: 'Fundamental data structures and algorithm analysis.', credits: 4, department_id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const mockPrerequisites: Prerequisite[] = [
  { prerequisite_id: 1, course_id: 5, prerequisite_course_id: 1 }, // SE450 requires SE301
  { prerequisite_id: 2, course_id: 2, prerequisite_course_id: 3 }, // CE205 requires EE201 (example)
  { prerequisite_id: 3, course_id: 6, prerequisite_course_id: 1 }, // SE320 requires SE301
];

export const mockStudents: Student[] = [
  { student_id: 4, first_name: 'Abebe', last_name: 'Kebede', department_id: 1, enrollment_date: new Date().toISOString(), updated_at: new Date().toISOString(), phone_number: '0912345678', address: 'Addis Ababa' },
  { student_id: 5, first_name: 'Sara', last_name: 'Taye', department_id: 2, enrollment_date: new Date().toISOString(), updated_at: new Date().toISOString(), phone_number: '0987654321', address: 'Addis Ababa' },
  { student_id: 7, first_name: 'Frehiwot', last_name: 'Assefa', department_id: 1, enrollment_date: new Date().toISOString(), updated_at: new Date().toISOString(), phone_number: '0911111111', address: 'Adama' },
];

export const mockTeachers: Teacher[] = [
  { teacher_id: 3, first_name: 'Lemma', last_name: 'Guya', department_id: 1, office_location: 'Block C, Room 101', updated_at: new Date().toISOString(), phone_number: '0911223344'},
  { teacher_id: 6, first_name: 'Biruk', last_name: 'Samuel', department_id: 1, office_location: 'Block D, Room 202', updated_at: new Date().toISOString(), phone_number: '0922334455'},
];

export const mockStaff: Staff[] = [
  { staff_id: 1, first_name: 'Super', last_name: 'Admin', job_title: 'Portal Administrator', updated_at: new Date().toISOString() },
  { staff_id: 2, first_name: 'Chala', last_name: 'Bulti', job_title: 'Academic Registrar', updated_at: new Date().toISOString() },
];

export const mockUserProfiles: UserProfile[] = [
    { ...mockUsers[0], ...mockStaff[0], isSuperAdmin: true },
    { ...mockUsers[1], ...mockStaff[1] },
    { ...mockUsers[2], ...mockTeachers[0] },
    { ...mockUsers[3], ...mockStudents[0] },
    { ...mockUsers[4], ...mockStudents[1] },
    { ...mockUsers[5], ...mockTeachers[1] },
    { ...mockUsers[6], ...mockStudents[2] },
];


export const mockSemesters: Semester[] = [
  { semester_id: 1, name: 'Fall 2023', academic_year: 2023, term: 'Fall', start_date: '2023-09-01', end_date: '2023-12-20', registration_start_date: '2023-08-15T09:00:00', registration_end_date: '2023-08-30T17:00:00', add_drop_start_date: '2023-09-01T09:00:00', add_drop_end_date: '2023-09-10T17:00:00', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { semester_id: 2, name: 'Spring 2024', academic_year: 2024, term: 'Spring', start_date: '2024-01-15', end_date: '2024-05-10', registration_start_date: '2023-12-01T09:00:00', registration_end_date: '2023-12-20T17:00:00', add_drop_start_date: '2024-01-15T09:00:00', add_drop_end_date: '2024-01-25T17:00:00', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const mockBuildings: Building[] = [
  { building_id: 1, name: 'Engineering Block A', address: 'Main Campus, North Wing', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { building_id: 2, name: 'Technology Hall', address: 'Main Campus, South Wing', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const mockRooms: Room[] = [
  { room_id: 1, building_id: 1, room_number: 'A101', capacity: 60, type: 'Lecture Hall', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), building: mockBuildings[0] },
  { room_id: 2, building_id: 1, room_number: 'A102', capacity: 40, type: 'Lab', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), building: mockBuildings[0] },
  { room_id: 3, building_id: 2, room_number: 'T205', capacity: 50, type: 'Classroom', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), building: mockBuildings[1] },
];


export const mockAnnouncements: Announcement[] = [
  { announcement_id: 1, title: 'Welcome to Fall 2023!', content: 'We are excited to welcome all new and returning students to the Fall 2023 semester.', author_id: 1, target_audience: 'All Users', desired_tone: 'Friendly', status: 'Published', publish_date: '2023-08-20T10:00:00', department_id: null, semester_id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { announcement_id: 2, title: 'Midterm Registration Deadline', content: 'Please be reminded that the deadline for midterm registration is approaching.', author_id: 2, target_audience: 'Students', desired_tone: 'Urgent', status: 'Published', publish_date: '2024-03-01T00:00:00', department_id: null, semester_id: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const mockScheduledCourses: ScheduledCourse[] = [
    { scheduled_course_id: 1, course_id: 1, semester_id: 2, teacher_id: 3, room_id: 1, section_number: 'S1', max_capacity: 50, current_enrollment: 25, days_of_week: 'MWF', start_time: '09:00:00', end_time: '09:50:00', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), course: mockCourses[0], semester: mockSemesters[1], teacher: mockTeachers[0], room: mockRooms[0] },
    { scheduled_course_id: 2, course_id: 5, semester_id: 2, teacher_id: 3, room_id: 3, section_number: 'S1', max_capacity: 40, current_enrollment: 30, days_of_week: 'TTH', start_time: '14:00:00', end_time: '15:20:00', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), course: mockCourses[4], semester: mockSemesters[1], teacher: mockTeachers[0], room: mockRooms[2] },
    { scheduled_course_id: 3, course_id: 6, semester_id: 2, teacher_id: 6, room_id: 2, section_number: 'S1', max_capacity: 35, current_enrollment: 15, days_of_week: 'MWF', start_time: '10:00:00', end_time: '10:50:00', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), course: mockCourses[5], semester: mockSemesters[1], teacher: mockTeachers[1], room: mockRooms[1] },
];

export const mockRegistrations: Registration[] = [
    { registration_id: 1, student_id: 4, scheduled_course_id: 1, registration_date: new Date().toISOString(), status: 'Registered', updated_at: new Date().toISOString(), student: mockStudents[0], scheduledCourse: mockScheduledCourses[0], overall_percentage: null, final_letter_grade: null },
    { registration_id: 2, student_id: 4, scheduled_course_id: 2, registration_date: new Date().toISOString(), status: 'Registered', updated_at: new Date().toISOString(), student: mockStudents[0], scheduledCourse: mockScheduledCourses[1], overall_percentage: null, final_letter_grade: null },
    { registration_id: 3, student_id: 5, scheduled_course_id: 1, registration_date: new Date().toISOString(), status: 'Completed', final_grade: 'A', grade_points: 4.0, updated_at: new Date().toISOString(), student: mockStudents[1], scheduledCourse: mockScheduledCourses[0], overall_percentage: 92, final_letter_grade: 'A' },
    { registration_id: 4, student_id: 7, scheduled_course_id: 1, registration_date: new Date().toISOString(), status: 'Registered', updated_at: new Date().toISOString(), student: mockStudents[2], scheduledCourse: mockScheduledCourses[0], overall_percentage: null, final_letter_grade: null },
    { registration_id: 5, student_id: 7, scheduled_course_id: 3, registration_date: new Date().toISOString(), status: 'Registered', updated_at: new Date().toISOString(), student: mockStudents[2], scheduledCourse: mockScheduledCourses[2], overall_percentage: null, final_letter_grade: null },
];

export const mockCourseMaterials: CourseMaterial[] = [
    { material_id: 1, scheduled_course_id: 1, title: 'Lecture 1 Slides', description: 'Introduction to Programming Concepts', material_type: 'File', file_path: '/materials/se301_lecture1.pdf', uploaded_by: 3, upload_timestamp: new Date().toISOString(), scheduledCourse: mockScheduledCourses[0], uploader: mockTeachers[0] },
    { material_id: 2, scheduled_course_id: 1, title: 'Python Official Tutorial', description: 'Link to official Python tutorial.', material_type: 'Link', url: 'https://docs.python.org/3/tutorial/', uploaded_by: 3, upload_timestamp: new Date().toISOString(), scheduledCourse: mockScheduledCourses[0], uploader: mockTeachers[0] },
];


export const mockAuditLogs: AuditLog[] = [
  {
    log_id: 1,
    user_id: 1, // admin
    action_type: 'USER_LOGIN',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    ip_address: '192.168.1.10',
    details: 'User admin logged in successfully.',
    user: mockUserProfiles.find(u => u.user_id === 1)
  },
  {
    log_id: 2,
    user_id: 2, // staff1
    action_type: 'COURSE_CREATED',
    target_entity_type: 'Course',
    target_entity_id: 'CS101',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    ip_address: '203.0.113.45',
    details: 'Course "Introduction to Computer Science" (CS101) created.',
    user: mockUserProfiles.find(u => u.user_id === 2)
  },
  {
    log_id: 3,
    user_id: 1, // admin
    action_type: 'USER_UPDATED',
    target_entity_type: 'User',
    target_entity_id: '4', // student1
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    ip_address: '192.168.1.10',
    details: 'Profile for user student1 (ID: 4) updated. Email changed.',
    user: mockUserProfiles.find(u => u.user_id === 1)
  },
  {
    log_id: 4,
    user_id: null, // System action
    action_type: 'SYSTEM_BACKUP',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    details: 'Automated system backup completed successfully.',
  },
  {
    log_id: 5,
    user_id: 3, // teacher1
    action_type: 'ANNOUNCEMENT_POSTED',
    target_entity_type: 'Announcement',
    target_entity_id: 'ANN003',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    ip_address: '198.51.100.2',
    details: 'Teacher teacher1 posted announcement "Midterm Grades Available".',
    user: mockUserProfiles.find(u => u.user_id === 3)
  },
   {
    log_id: 6,
    user_id: 1,
    action_type: 'DEPARTMENT_DELETED',
    target_entity_type: 'Department',
    target_entity_id: 'ARCH',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    ip_address: '192.168.1.12',
    details: 'Department "Architecture" (ARCH) was deleted.',
    user: mockUserProfiles.find(u => u.user_id === 1)
  },
  {
    log_id: 7,
    user_id: 4, // student1
    action_type: 'COURSE_REGISTRATION',
    target_entity_type: 'Course',
    target_entity_id: 'SE450',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    ip_address: '172.16.0.5',
    details: 'Student student1 registered for course "Web Development" (SE450).',
    user: mockUserProfiles.find(u => u.user_id === 4)
  },
  {
    log_id: 8,
    user_id: 2, // staff1
    action_type: 'USER_LOGIN_FAILED',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    ip_address: '203.0.113.45',
    details: 'Failed login attempt for username: staff1_typo.',
    user: mockUserProfiles.find(u => u.user_id === 2) // Or null if user is not identified by username
  },
];

// Grade Management Mock Data
export const mockAssessments: Assessment[] = [
  { assessment_id: 1, scheduled_course_id: 1, name: 'Homework 1', max_score: 20, assessment_type: 'Homework', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { assessment_id: 2, scheduled_course_id: 1, name: 'Midterm Exam', max_score: 30, assessment_type: 'Exam', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { assessment_id: 3, scheduled_course_id: 1, name: 'Final Project', max_score: 50, assessment_type: 'Project', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { assessment_id: 4, scheduled_course_id: 2, name: 'Quiz 1', max_score: 10, assessment_type: 'Quiz', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { assessment_id: 5, scheduled_course_id: 2, name: 'Final Exam', max_score: 90, assessment_type: 'Exam', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const mockStudentAssessmentScores: StudentAssessmentScore[] = [
  // Scores for student1 (registration_id: 1) in SE301 (scheduled_course_id: 1)
  { student_assessment_score_id: 1, registration_id: 1, assessment_id: 1, score_achieved: 18 },
  { student_assessment_score_id: 2, registration_id: 1, assessment_id: 2, score_achieved: 25 },
  { student_assessment_score_id: 3, registration_id: 1, assessment_id: 3, score_achieved: 45 },
  // Scores for student3 (registration_id: 4) in SE301 (scheduled_course_id: 1)
  { student_assessment_score_id: 4, registration_id: 4, assessment_id: 1, score_achieved: 15 },
  { student_assessment_score_id: 5, registration_id: 4, assessment_id: 2, score_achieved: 20 },
  // student1 (registration_id: 2) in SE450 (scheduled_course_id: 2)
  { student_assessment_score_id: 6, registration_id: 2, assessment_id: 4, score_achieved: 8 },
];
