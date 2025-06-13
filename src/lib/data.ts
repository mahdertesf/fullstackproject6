
import type { User, Department, Course, Student, Teacher, Staff, Semester, Announcement, ScheduledCourse, Registration, CourseMaterial, Assessment, UserProfile, Building, Room, Prerequisite, AuditLog, StudentAssessmentScore, AnnouncementTargetAudience } from '@/types';

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

export const mockStudentsData: Omit<Student, 'user' | 'department'>[] = [
  { student_id: 4, first_name: 'Abebe', last_name: 'Kebede', department_id: 1, enrollment_date: new Date().toISOString(), updated_at: new Date().toISOString(), phone_number: '0912345678', address: 'Addis Ababa' },
  { student_id: 5, first_name: 'Sara', last_name: 'Taye', department_id: 2, enrollment_date: new Date().toISOString(), updated_at: new Date().toISOString(), phone_number: '0987654321', address: 'Addis Ababa' },
  { student_id: 7, first_name: 'Frehiwot', last_name: 'Assefa', department_id: 1, enrollment_date: new Date().toISOString(), updated_at: new Date().toISOString(), phone_number: '0911111111', address: 'Adama' },
];

export const mockTeachersData: Omit<Teacher, 'user' | 'department'>[] = [
  { teacher_id: 3, first_name: 'Lemma', last_name: 'Guya', department_id: 1, office_location: 'Block C, Room 101', updated_at: new Date().toISOString(), phone_number: '0911223344'},
  { teacher_id: 6, first_name: 'Biruk', last_name: 'Samuel', department_id: 1, office_location: 'Block D, Room 202', updated_at: new Date().toISOString(), phone_number: '0922334455'},
];

export const mockStaffData: Omit<Staff, 'user'>[] = [
  { staff_id: 1, first_name: 'Super', last_name: 'Admin', job_title: 'Portal Administrator', updated_at: new Date().toISOString() },
  { staff_id: 2, first_name: 'Chala', last_name: 'Bulti', job_title: 'Academic Registrar', updated_at: new Date().toISOString() },
];

export const mockUserProfiles: UserProfile[] = mockUsers.map(user => {
  let profileData: Partial<UserProfile> = {};
  if (user.role === 'Student') {
    const studentInfo = mockStudentsData.find(s => s.student_id === user.user_id);
    if (studentInfo) profileData = { ...profileData, ...studentInfo, department_id: studentInfo.department_id };
  } else if (user.role === 'Teacher') {
    const teacherInfo = mockTeachersData.find(t => t.teacher_id === user.user_id);
     if (teacherInfo) profileData = { ...profileData, ...teacherInfo, department_id: teacherInfo.department_id };
  } else if (user.role === 'Staff') {
    const staffInfo = mockStaffData.find(s => s.staff_id === user.user_id);
    if (staffInfo) profileData = { ...profileData, ...staffInfo };
    if (user.username === 'admin') profileData.isSuperAdmin = true;
  }
  return { ...user, ...profileData };
});


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
  { room_id: 4, building_id: 2, room_number: 'T208', capacity: 30, type: 'Seminar Room', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), building: mockBuildings[1] },
];


export const mockAnnouncements: Announcement[] = [
  { announcement_id: 1, title: 'Welcome to Fall 2023!', content: 'We are excited to welcome all new and returning students to the Fall 2023 semester.', author_id: 1, target_audience: 'All Users', desired_tone: 'Friendly', status: 'Published', publish_date: '2023-08-20T10:00:00', department_id: null, semester_id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { announcement_id: 2, title: 'Midterm Registration Deadline', content: 'Please be reminded that the deadline for midterm registration is approaching.', author_id: 2, target_audience: 'Students', desired_tone: 'Urgent', status: 'Published', publish_date: '2024-03-01T00:00:00', department_id: null, semester_id: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const mockScheduledCourses: ScheduledCourse[] = [
    { scheduled_course_id: 1, course_id: 1, semester_id: 2, teacher_id: 3, room_id: 1, section_number: 'S1', max_capacity: 50, current_enrollment: 25, days_of_week: 'MWF', start_time: '09:00:00', end_time: '09:50:00', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), course: mockCourses[0], semester: mockSemesters[1], teacher: mockUserProfiles.find(t=>t.user_id===3), room: mockRooms[0] },
    { scheduled_course_id: 2, course_id: 5, semester_id: 2, teacher_id: 3, room_id: 3, section_number: 'S1', max_capacity: 40, current_enrollment: 30, days_of_week: 'TTH', start_time: '14:00:00', end_time: '15:20:00', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), course: mockCourses[4], semester: mockSemesters[1], teacher: mockUserProfiles.find(t=>t.user_id===3), room: mockRooms[2] },
    { scheduled_course_id: 3, course_id: 6, semester_id: 2, teacher_id: 6, room_id: 2, section_number: 'S1', max_capacity: 35, current_enrollment: 15, days_of_week: 'MWF', start_time: '10:00:00', end_time: '10:50:00', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), course: mockCourses[5], semester: mockSemesters[1], teacher: mockUserProfiles.find(t=>t.user_id===6), room: mockRooms[1] },
    { scheduled_course_id: 4, course_id: 1, semester_id: 2, teacher_id: 3, room_id: 4, section_number: 'S2', max_capacity: 30, current_enrollment: 10, days_of_week: 'TTH', start_time: '10:00:00', end_time: '11:20:00', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), course: mockCourses[0], semester: mockSemesters[1], teacher: mockUserProfiles.find(t=>t.user_id===3), room: mockRooms[3] },
    { scheduled_course_id: 5, course_id: 2, semester_id: 2, teacher_id: 6, room_id: 1, section_number: 'S1', max_capacity: 60, current_enrollment: 40, days_of_week: 'MWF', start_time: '13:00:00', end_time: '13:50:00', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), course: mockCourses[1], semester: mockSemesters[1], teacher: mockUserProfiles.find(t=>t.user_id===6), room: mockRooms[0] },
    // Fall 2023 courses for past records
    { scheduled_course_id: 6, course_id: 1, semester_id: 1, teacher_id: 3, room_id: 1, section_number: 'S1', max_capacity: 50, current_enrollment: 48, days_of_week: 'MWF', start_time: '09:00:00', end_time: '09:50:00', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), course: mockCourses[0], semester: mockSemesters[0], teacher: mockUserProfiles.find(t=>t.user_id===3), room: mockRooms[0] },
    { scheduled_course_id: 7, course_id: 3, semester_id: 1, teacher_id: 6, room_id: 3, section_number: 'S1', max_capacity: 40, current_enrollment: 35, days_of_week: 'TTH', start_time: '14:00:00', end_time: '15:20:00', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), course: mockCourses[2], semester: mockSemesters[0], teacher: mockUserProfiles.find(t=>t.user_id===6), room: mockRooms[2] },
];

export const mockRegistrations: Registration[] = [
    // Student 1 (Abebe, user_id: 4)
    // Spring 2024
    { registration_id: 1, student_id: 4, scheduled_course_id: 1, registration_date: new Date().toISOString(), status: 'Registered', updated_at: new Date().toISOString(), student: mockUserProfiles.find(s => s.user_id === 4), scheduledCourse: mockScheduledCourses[0], overall_percentage: null, final_letter_grade: null, grade_points: null },
    { registration_id: 2, student_id: 4, scheduled_course_id: 2, registration_date: new Date().toISOString(), status: 'Registered', updated_at: new Date().toISOString(), student: mockUserProfiles.find(s => s.user_id === 4), scheduledCourse: mockScheduledCourses[1], overall_percentage: null, final_letter_grade: null, grade_points: null },
    // Fall 2023 (Completed)
    { registration_id: 8, student_id: 4, scheduled_course_id: 6, registration_date: new Date(2023, 8, 5).toISOString(), status: 'Completed', updated_at: new Date(2023, 11, 20).toISOString(), student: mockUserProfiles.find(s => s.user_id === 4), scheduledCourse: mockScheduledCourses[5], overall_percentage: 85, final_letter_grade: 'B', grade_points: 3.0 * (mockCourses.find(c=>c.course_id===mockScheduledCourses[5].course_id)?.credits || 0) },
    { registration_id: 9, student_id: 4, scheduled_course_id: 7, registration_date: new Date(2023, 8, 5).toISOString(), status: 'Completed', updated_at: new Date(2023, 11, 20).toISOString(), student: mockUserProfiles.find(s => s.user_id === 4), scheduledCourse: mockScheduledCourses[6], overall_percentage: 92, final_letter_grade: 'A', grade_points: 4.0 * (mockCourses.find(c=>c.course_id===mockScheduledCourses[6].course_id)?.credits || 0) },


    // Student 2 (Sara, user_id: 5) - Inactive user but has past records
    // Fall 2023 (Completed)
    { registration_id: 3, student_id: 5, scheduled_course_id: 6, registration_date: new Date(2023, 8, 6).toISOString(), status: 'Completed', updated_at: new Date(2023, 11, 20).toISOString(), student: mockUserProfiles.find(s => s.user_id === 5), scheduledCourse: mockScheduledCourses[5], overall_percentage: 78, final_letter_grade: 'C', grade_points: 2.0 * (mockCourses.find(c=>c.course_id===mockScheduledCourses[5].course_id)?.credits || 0) },
    // Spring 2024
    { registration_id: 10, student_id: 5, scheduled_course_id: 4, registration_date: new Date().toISOString(), status: 'Registered', updated_at: new Date().toISOString(), student: mockUserProfiles.find(s => s.user_id === 5), scheduledCourse: mockScheduledCourses[3], overall_percentage: null, final_letter_grade: null, grade_points: null },


    // Student 3 (Frehiwot, user_id: 7)
    // Spring 2024
    { registration_id: 4, student_id: 7, scheduled_course_id: 1, registration_date: new Date().toISOString(), status: 'Registered', updated_at: new Date().toISOString(), student: mockUserProfiles.find(s => s.user_id === 7), scheduledCourse: mockScheduledCourses[0], overall_percentage: null, final_letter_grade: null, grade_points: null },
    { registration_id: 5, student_id: 7, scheduled_course_id: 3, registration_date: new Date().toISOString(), status: 'Registered', updated_at: new Date().toISOString(), student: mockUserProfiles.find(s => s.user_id === 7), scheduledCourse: mockScheduledCourses[2], overall_percentage: null, final_letter_grade: null, grade_points: null },
    { registration_id: 7, student_id: 7, scheduled_course_id: 5, registration_date: new Date().toISOString(), status: 'Registered', updated_at: new Date().toISOString(), student: mockUserProfiles.find(s => s.user_id === 7), scheduledCourse: mockScheduledCourses[4], overall_percentage: null, final_letter_grade: null, grade_points: null },
    // Fall 2023 (Completed)
    { registration_id: 11, student_id: 7, scheduled_course_id: 6, registration_date: new Date(2023, 8, 7).toISOString(), status: 'Completed', updated_at: new Date(2023, 11, 20).toISOString(), student: mockUserProfiles.find(s => s.user_id === 7), scheduledCourse: mockScheduledCourses[5], overall_percentage: 65, final_letter_grade: 'D', grade_points: 1.0 * (mockCourses.find(c=>c.course_id===mockScheduledCourses[5].course_id)?.credits || 0) },
];

export const mockCourseMaterials: CourseMaterial[] = [
    { material_id: 1, scheduled_course_id: 1, title: 'Lecture 1 Slides - SE301 S1', description: 'Introduction to Programming Concepts', material_type: 'File', file_path: '/materials/se301_s1_lecture1.pdf', uploaded_by: 3, upload_timestamp: new Date().toISOString() },
    { material_id: 2, scheduled_course_id: 1, title: 'Python Official Tutorial - SE301 S1', description: 'Link to official Python tutorial.', material_type: 'Link', url: 'https://docs.python.org/3/tutorial/', uploaded_by: 3, upload_timestamp: new Date().toISOString() },
    { material_id: 3, scheduled_course_id: 2, title: 'Intro to HTML & CSS - SE450 S1', description: 'Basic structure and styling.', material_type: 'File', file_path: '/materials/se450_s1_html_css.pdf', uploaded_by: 3, upload_timestamp: new Date().toISOString() },
    { material_id: 4, scheduled_course_id: 6, title: 'Old Lecture Notes - SE301 S1 Fall23', description: 'Archived notes from Fall 2023.', material_type: 'File', file_path: '/materials/se301_s1_fall23_notes.pdf', uploaded_by: 3, upload_timestamp: new Date(2023,9,1).toISOString() },
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
  // SE301 S1 (scheduled_course_id: 1)
  { assessment_id: 1, scheduled_course_id: 1, name: 'Homework 1', max_score: 20, assessment_type: 'Homework', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { assessment_id: 2, scheduled_course_id: 1, name: 'Midterm Exam', max_score: 30, assessment_type: 'Exam', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { assessment_id: 3, scheduled_course_id: 1, name: 'Final Project', max_score: 50, assessment_type: 'Project', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  // SE450 S1 (scheduled_course_id: 2)
  { assessment_id: 4, scheduled_course_id: 2, name: 'Quiz 1', max_score: 10, assessment_type: 'Quiz', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { assessment_id: 5, scheduled_course_id: 2, name: 'Final Exam', max_score: 90, assessment_type: 'Exam', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  // SE301 Section S2 (scheduled_course_id: 4)
  { assessment_id: 6, scheduled_course_id: 4, name: 'S2 Homework 1', max_score: 15, assessment_type: 'Homework', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { assessment_id: 7, scheduled_course_id: 4, name: 'S2 Midterm', max_score: 35, assessment_type: 'Exam', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  // CE205 Section S1 (scheduled_course_id: 5)
  { assessment_id: 8, scheduled_course_id: 5, name: 'Analysis Assignment 1', max_score: 25, assessment_type: 'Assignment', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { assessment_id: 9, scheduled_course_id: 5, name: 'Structural Design Project', max_score: 75, assessment_type: 'Project', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  // SE301 S1 Fall23 (scheduled_course_id: 6) - For student past grades
  { assessment_id: 10, scheduled_course_id: 6, name: 'Fall23 HW1', max_score: 20, assessment_type: 'Homework', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { assessment_id: 11, scheduled_course_id: 6, name: 'Fall23 Midterm', max_score: 30, assessment_type: 'Exam', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { assessment_id: 12, scheduled_course_id: 6, name: 'Fall23 Final', max_score: 50, assessment_type: 'Project', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  // EE201 S1 Fall23 (scheduled_course_id: 7) - For student past grades
  { assessment_id: 13, scheduled_course_id: 7, name: 'Fall23 Circuit Quiz', max_score: 40, assessment_type: 'Quiz', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { assessment_id: 14, scheduled_course_id: 7, name: 'Fall23 Circuit Final', max_score: 60, assessment_type: 'Exam', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const mockStudentAssessmentScores: StudentAssessmentScore[] = [
  // Scores for student1 (registration_id: 1) in SE301 S1 Spring 24 (scheduled_course_id: 1)
  { student_assessment_score_id: 1, registration_id: 1, assessment_id: 1, score_achieved: 18 },
  { student_assessment_score_id: 2, registration_id: 1, assessment_id: 2, score_achieved: 25 },
  { student_assessment_score_id: 3, registration_id: 1, assessment_id: 3, score_achieved: 45 },
  // Scores for student3 (registration_id: 4) in SE301 S1 Spring 24 (scheduled_course_id: 1)
  { student_assessment_score_id: 4, registration_id: 4, assessment_id: 1, score_achieved: 15 },
  { student_assessment_score_id: 5, registration_id: 4, assessment_id: 2, score_achieved: 20 },
  // student1 (registration_id: 2) in SE450 S1 Spring 24 (scheduled_course_id: 2)
  { student_assessment_score_id: 6, registration_id: 2, assessment_id: 4, score_achieved: 8 },
  // Scores for student2 (Sara Taye, registration_id: 10) in SE301 S2 Spring 24 (scheduled_course_id: 4)
  { student_assessment_score_id: 7, registration_id: 10, assessment_id: 6, score_achieved: 12 }, // S2 Homework 1
  { student_assessment_score_id: 8, registration_id: 10, assessment_id: 7, score_achieved: 30 }, // S2 Midterm
  // Scores for student3 (Frehiwot Assefa, registration_id: 7) in CE205 S1 Spring 24 (scheduled_course_id: 5)
  { student_assessment_score_id: 9, registration_id: 7, assessment_id: 8, score_achieved: 22 }, // Analysis Assignment 1
  { student_assessment_score_id: 10, registration_id: 7, assessment_id: 9, score_achieved: 65 },// Structural Design Project
  // Scores for student1 (Abebe, registration_id: 8) in SE301 S1 Fall23 (scheduled_course_id: 6) -> 85% (B)
  { student_assessment_score_id: 11, registration_id: 8, assessment_id: 10, score_achieved: 17 }, // 17/20
  { student_assessment_score_id: 12, registration_id: 8, assessment_id: 11, score_achieved: 25 }, // 25/30
  { student_assessment_score_id: 13, registration_id: 8, assessment_id: 12, score_achieved: 43 }, // 43/50 Total: 85/100
  // Scores for student1 (Abebe, registration_id: 9) in EE201 S1 Fall23 (scheduled_course_id: 7) -> 92% (A)
  { student_assessment_score_id: 14, registration_id: 9, assessment_id: 13, score_achieved: 38 }, // 38/40
  { student_assessment_score_id: 15, registration_id: 9, assessment_id: 14, score_achieved: 54 }, // 54/60 Total: 92/100
  // Scores for student2 (Sara, registration_id: 3) in SE301 S1 Fall23 (scheduled_course_id: 6) -> 78% (C)
  { student_assessment_score_id: 16, registration_id: 3, assessment_id: 10, score_achieved: 15 }, // 15/20
  { student_assessment_score_id: 17, registration_id: 3, assessment_id: 11, score_achieved: 23 }, // 23/30
  { student_assessment_score_id: 18, registration_id: 3, assessment_id: 12, score_achieved: 40 }, // 40/50 Total: 78/100
  // Scores for student3 (Frehiwot, registration_id: 11) in SE301 S1 Fall23 (scheduled_course_id: 6) -> 65% (D)
  { student_assessment_score_id: 19, registration_id: 11, assessment_id: 10, score_achieved: 12 }, // 12/20
  { student_assessment_score_id: 20, registration_id: 11, assessment_id: 11, score_achieved: 18 }, // 18/30
  { student_assessment_score_id: 21, registration_id: 11, assessment_id: 12, score_achieved: 35 }, // 35/50 Total: 65/100
];


export const gradePointMapping: Record<string, number> = {
  'A': 4.0,
  'A-': 3.7,
  'B+': 3.3,
  'B': 3.0,
  'B-': 2.7,
  'C+': 2.3,
  'C': 2.0,
  'C-': 1.7,
  'D+': 1.3,
  'D': 1.0,
  'F': 0.0,
};
    

