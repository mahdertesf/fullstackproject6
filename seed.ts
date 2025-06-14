
// seed.ts
import { PrismaClient, UserRole, SemesterTerm, MaterialType, AnnouncementTargetAudience, RegistrationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  console.log('Start seeding ...');

  // --- Create Departments ---
  const departmentsToCreate = [
    { name: 'Software Engineering', description: 'Department of Software Engineering and AI' },
    { name: 'Civil Engineering', description: 'Department of Civil and Environmental Engineering' },
    { name: 'Electrical & Computer Engineering', description: 'Department of Electrical and Computer Engineering' },
    { name: 'Mechanical Engineering', description: 'Department of Mechanical and Industrial Engineering' },
    { name: 'Biomedical Engineering', description: 'Department of Biomedical Engineering' },
    { name: 'Chemical Engineering', description: 'Department of Chemical and Materials Engineering' },
    { name: 'Architecture', description: 'School of Architecture and Urban Planning' },
  ];

  const createdDepartments = [];
  for (const deptData of departmentsToCreate) {
    const department = await prisma.department.upsert({
      where: { name: deptData.name },
      update: { description: deptData.description },
      create: deptData,
    });
    createdDepartments.push(department);
    console.log(`Created/Ensured department: ${department.name}`);
  }
  if (createdDepartments.length === 0) {
    console.error("No departments were created. Seeding cannot continue without departments.");
    return;
  }

  // --- Create Buildings & Rooms ---
  const buildingsToCreate = [
    { name: 'Block A - Engineering', address: 'Main Campus, North Wing' },
    { name: 'Block B - Technology', address: 'Main Campus, South Wing' },
    { name: 'Block C - Architecture', address: 'Arts Campus, West Wing' },
  ];
  const createdBuildings = [];
  for (const buildingData of buildingsToCreate) {
    const building = await prisma.building.upsert({
      where: { name: buildingData.name },
      update: {},
      create: buildingData,
    });
    createdBuildings.push(building);
    console.log(`Created/Ensured building: ${building.name}`);
  }

  const roomsToCreate = [
    { building_id: createdBuildings[0]?.building_id, room_number: 'A101', capacity: 100, type: 'Lecture Hall' },
    { building_id: createdBuildings[0]?.building_id, room_number: 'A102', capacity: 75, type: 'Lecture Hall' },
    { building_id: createdBuildings[0]?.building_id, room_number: 'A205', capacity: 30, type: 'Lab' },
    { building_id: createdBuildings[1]?.building_id, room_number: 'B310', capacity: 50, type: 'Classroom' },
    { building_id: createdBuildings[1]?.building_id, room_number: 'B312', capacity: 25, type: 'Lab - ECE' },
    { building_id: createdBuildings[2]?.building_id, room_number: 'C100', capacity: 60, type: 'Studio' },
    { building_id: createdBuildings[2]?.building_id, room_number: 'C205', capacity: 40, type: 'Classroom' },
  ];
  const createdRooms = [];
  for (const roomData of roomsToCreate) {
    if (!roomData.building_id) continue; // Skip if building not found
    const room = await prisma.room.upsert({
        where: { building_id_room_number: { building_id: roomData.building_id, room_number: roomData.room_number } },
        update: { capacity: roomData.capacity, type: roomData.type },
        create: roomData,
    });
    createdRooms.push(room);
    console.log(`Created/Ensured room: ${room.room_number} in Building ID ${room.building_id}`);
  }


  // --- Create Super Admin User ---
  const adminUsername = 'admin';
  const adminEmail = 'admin@cotbe.edu';
  const adminPasswordPlain = 'adminPass123!';
  const adminPasswordHashed = await bcrypt.hash(adminPasswordPlain, SALT_ROUNDS);

  let adminUser = await prisma.user.findUnique({ where: { username: adminUsername } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        username: adminUsername, email: adminEmail, password_hash: adminPasswordHashed, role: UserRole.Staff,
        first_name: 'Super', last_name: 'Admin', is_active: true, is_super_admin: true,
        staff_profile: { create: { job_title: 'Portal Administrator' } },
      },
    });
    console.log(`Created super admin user: ${adminUser.username}`);
  } else {
    adminUser = await prisma.user.update({
      where: { user_id: adminUser.user_id },
      data: { is_super_admin: true, role: UserRole.Staff, password_hash: adminPasswordHashed, staff_profile: { upsert: { where: { staff_id: adminUser.user_id }, create: { job_title: 'Portal Administrator' }, update: { job_title: 'Portal Administrator' }}}},
    });
    console.log(`Super admin user "${adminUsername}" already exists. Updated.`);
  }
  const createdUsers = [adminUser];


  // --- Create Staff, Teacher, and Student Users ---
  const usersToCreate = [
    // Staff
    { username: 'staff1', email: 'staff1@example.com', password_plain: 'staffPass123', role: UserRole.Staff, first_name: 'Bereket', last_name: 'Abebe', job_title: 'Registrar Officer' },
    { username: 'staff2', email: 'staff2@example.com', password_plain: 'staffPass123', role: UserRole.Staff, first_name: 'Sara', last_name: 'Taye', job_title: 'Admissions Coordinator' },
    // Teachers
    { username: 'teacher1', email: 'teacher1@example.com', password_plain: 'teacherPass123', role: UserRole.Teacher, first_name: 'Dr. Eleni', last_name: 'Gebre', departmentName: 'Software Engineering', office_location: 'A301' },
    { username: 'teacher2', email: 'teacher2@example.com', password_plain: 'teacherPass123', role: UserRole.Teacher, first_name: 'Prof. Kebede', last_name: 'Lemma', departmentName: 'Civil Engineering', office_location: 'B105' },
    { username: 'teacher3', email: 'teacher3@example.com', password_plain: 'teacherPass123', role: UserRole.Teacher, first_name: 'Dr. Aisha', last_name: 'Mohammed', departmentName: 'Electrical & Computer Engineering', office_location: 'B210' },
    // Students
    { username: 'student1', email: 'student1@example.com', password_plain: 'studentPass123', role: UserRole.Student, first_name: 'Lia', last_name: 'Tadesse', departmentName: 'Software Engineering' },
    { username: 'student2', email: 'student2@example.com', password_plain: 'studentPass123', role: UserRole.Student, first_name: 'Yonas', last_name: 'Haile', departmentName: 'Civil Engineering' },
    { username: 'student3', email: 'student3@example.com', password_plain: 'studentPass123', role: UserRole.Student, first_name: 'Fatuma', last_name: 'Ali', departmentName: 'Electrical & Computer Engineering' },
    { username: 'student4', email: 'student4@example.com', password_plain: 'studentPass123', role: UserRole.Student, first_name: 'Michael', last_name: 'Solomon', departmentName: 'Mechanical Engineering' },
    { username: 'student5', email: 'student5@example.com', password_plain: 'studentPass123', role: UserRole.Student, first_name: 'Hanna', last_name: 'Bekele', departmentName: 'Biomedical Engineering' },
    { username: 'student6', email: 'student6@example.com', password_plain: 'studentPass123', role: UserRole.Student, first_name: 'Daniel', last_name: 'Worku', departmentName: 'Software Engineering' },
  ];

  for (const userData of usersToCreate) {
    let user = await prisma.user.findUnique({ where: { username: userData.username } });
    const hashedPassword = await bcrypt.hash(userData.password_plain, SALT_ROUNDS);
    const department = createdDepartments.find(d => d.name === userData.departmentName);

    const userPayload: any = {
      username: userData.username, email: userData.email, password_hash: hashedPassword, role: userData.role,
      first_name: userData.first_name, last_name: userData.last_name, is_active: true, is_super_admin: false,
    };
    const profileCreatePayload: any = {};
    const profileUpdatePayload: any = {};

    if (userData.role === UserRole.Student && department) {
      profileCreatePayload.student_profile = { create: { enrollment_date: new Date(), department_id: department.department_id } };
      profileUpdatePayload.student_profile = { upsert: { where: { student_id: user?.user_id || -1 }, create: { enrollment_date: new Date(), department_id: department.department_id }, update: { department_id: department.department_id } } };
    } else if (userData.role === UserRole.Teacher && department) {
      profileCreatePayload.teacher_profile = { create: { department_id: department.department_id, office_location: userData.office_location } };
      profileUpdatePayload.teacher_profile = { upsert: { where: { teacher_id: user?.user_id || -1 }, create: { department_id: department.department_id, office_location: userData.office_location }, update: { department_id: department.department_id, office_location: userData.office_location } } };
    } else if (userData.role === UserRole.Staff) {
      profileCreatePayload.staff_profile = { create: { job_title: userData.job_title || 'General Staff' } };
      profileUpdatePayload.staff_profile = { upsert: { where: { staff_id: user?.user_id || -1 }, create: { job_title: userData.job_title || 'General Staff' }, update: { job_title: userData.job_title || 'General Staff' } } };
    }

    if (!user) {
      user = await prisma.user.create({ data: { ...userPayload, ...profileCreatePayload } });
      console.log(`Created user: ${user.username}`);
    } else {
      user = await prisma.user.update({ where: { user_id: user.user_id }, data: { ...userPayload, ...profileUpdatePayload } });
      console.log(`User "${userData.username}" already exists. Updated.`);
    }
    createdUsers.push(user);
  }

  // --- Create Courses ---
  const coursesToCreate = [
    { course_code: 'SE301', title: 'Software Design Patterns', description: 'Learn about common software design patterns.', credits: 3, departmentName: 'Software Engineering' },
    { course_code: 'SE302', title: 'Data Structures & Algorithms', description: 'Fundamental data structures and algorithms.', credits: 4, departmentName: 'Software Engineering' },
    { course_code: 'CV201', title: 'Statics', description: 'Introduction to engineering mechanics: statics.', credits: 3, departmentName: 'Civil Engineering' },
    { course_code: 'CV305', title: 'Structural Analysis I', description: 'Analysis of statically determinate structures.', credits: 4, departmentName: 'Civil Engineering' },
    { course_code: 'ECE201', title: 'Circuit Analysis I', description: 'Basic DC and AC circuit analysis.', credits: 4, departmentName: 'Electrical & Computer Engineering' },
    { course_code: 'ECE310', title: 'Digital Logic Design', description: 'Design and analysis of digital circuits.', credits: 3, departmentName: 'Electrical & Computer Engineering' },
    { course_code: 'ME202', title: 'Thermodynamics I', description: 'Principles of thermodynamics.', credits: 3, departmentName: 'Mechanical Engineering' },
    { course_code: 'BM301', title: 'Biomaterials', description: 'Introduction to biomaterials science.', credits: 3, departmentName: 'Biomedical Engineering' },
    { course_code: 'CH201', title: 'Chemical Process Principles', description: 'Fundamentals of chemical engineering processes.', credits: 4, departmentName: 'Chemical Engineering' },
    { course_code: 'AR101', title: 'Introduction to Architecture', description: 'Basic concepts and history of architecture.', credits: 3, departmentName: 'Architecture' },
    { course_code: 'MATH201', title: 'Calculus III', description: 'Multivariable calculus.', credits: 4, departmentName: 'Software Engineering' }, // Example of a math course often taken by SE
  ];
  const createdCourses = [];
  for (const courseData of coursesToCreate) {
    const department = createdDepartments.find(d => d.name === courseData.departmentName);
    if (!department) { console.warn(`Department ${courseData.departmentName} not found for course ${courseData.course_code}. Skipping.`); continue; }
    const course = await prisma.course.upsert({
      where: { course_code: courseData.course_code },
      update: { title: courseData.title, description: courseData.description, credits: courseData.credits, department_id: department.department_id },
      create: { ...courseData, department_id: department.department_id },
    });
    createdCourses.push(course);
    console.log(`Created/Ensured course: ${course.title}`);
  }

  // --- Create Prerequisites ---
  // Prerequisites: SE302 requires MATH201, CV305 requires CV201
  const se302 = createdCourses.find(c => c.course_code === 'SE302');
  const math201 = createdCourses.find(c => c.course_code === 'MATH201');
  const cv305 = createdCourses.find(c => c.course_code === 'CV305');
  const cv201 = createdCourses.find(c => c.course_code === 'CV201');

  if (se302 && math201) {
    await prisma.prerequisite.upsert({
      where: { course_id_prerequisite_course_id: { course_id: se302.course_id, prerequisite_course_id: math201.course_id } },
      update: {}, create: { course_id: se302.course_id, prerequisite_course_id: math201.course_id },
    });
    console.log(`Prerequisite: ${math201.course_code} for ${se302.course_code}`);
  }
  if (cv305 && cv201) {
    await prisma.prerequisite.upsert({
      where: { course_id_prerequisite_course_id: { course_id: cv305.course_id, prerequisite_course_id: cv201.course_id } },
      update: {}, create: { course_id: cv305.course_id, prerequisite_course_id: cv201.course_id },
    });
    console.log(`Prerequisite: ${cv201.course_code} for ${cv305.course_code}`);
  }


  // --- Create Semesters ---
  const currentYear = new Date().getFullYear();
  const semestersToCreate = [
    { name: `Spring ${currentYear}`, academic_year: currentYear, term: SemesterTerm.Spring, start_date: new Date(`${currentYear}-01-15`), end_date: new Date(`${currentYear}-05-10`), registration_start_date: new Date(`${currentYear}-01-01`), registration_end_date: new Date(`${currentYear}-01-20`), add_drop_start_date: new Date(`${currentYear}-01-15`), add_drop_end_date: new Date(`${currentYear}-01-30`) },
    { name: `Fall ${currentYear}`, academic_year: currentYear, term: SemesterTerm.Fall, start_date: new Date(`${currentYear}-09-01`), end_date: new Date(`${currentYear}-12-20`), registration_start_date: new Date(`${currentYear}-08-15`), registration_end_date: new Date(`${currentYear}-09-10`), add_drop_start_date: new Date(`${currentYear}-09-01`), add_drop_end_date: new Date(`${currentYear}-09-15`) },
    { name: `Spring ${currentYear + 1}`, academic_year: currentYear + 1, term: SemesterTerm.Spring, start_date: new Date(`${currentYear + 1}-01-15`), end_date: new Date(`${currentYear + 1}-05-10`), registration_start_date: new Date(`${currentYear + 1}-01-01`), registration_end_date: new Date(`${currentYear + 1}-01-20`), add_drop_start_date: new Date(`${currentYear + 1}-01-15`), add_drop_end_date: new Date(`${currentYear + 1}-01-30`) },
    { name: `Fall ${currentYear + 1}`, academic_year: currentYear + 1, term: SemesterTerm.Fall, start_date: new Date(`${currentYear + 1}-09-01`), end_date: new Date(`${currentYear + 1}-12-20`), registration_start_date: new Date(`${currentYear + 1}-08-15`), registration_end_date: new Date(`${currentYear + 1}-09-10`), add_drop_start_date: new Date(`${currentYear + 1}-09-01`), add_drop_end_date: new Date(`${currentYear + 1}-09-15`) },
  ];
  const createdSemesters = [];
  for (const semData of semestersToCreate) {
    const semester = await prisma.semester.upsert({
        where: { name: semData.name }, update: semData, create: semData
    });
    createdSemesters.push(semester);
    console.log(`Created/Updated semester: ${semester.name}`);
  }

  // --- Create Scheduled Courses ---
  const teacher1 = createdUsers.find(u => u.username === 'teacher1');
  const teacher2 = createdUsers.find(u => u.username === 'teacher2');
  const teacher3 = createdUsers.find(u => u.username === 'teacher3');

  const scheduledCoursesToCreate = [
    { courseCode: 'SE301', semesterName: `Fall ${currentYear}`, teacherId: teacher1?.user_id, roomId: createdRooms[0]?.room_id, section_number: 'S1', max_capacity: 50, days_of_week: 'MWF', start_time: '09:00', end_time: '09:50' },
    { courseCode: 'SE302', semesterName: `Fall ${currentYear}`, teacherId: teacher1?.user_id, roomId: createdRooms[1]?.room_id, section_number: 'S1', max_capacity: 40, days_of_week: 'TTH', start_time: '10:00', end_time: '11:20' },
    { courseCode: 'CV201', semesterName: `Fall ${currentYear}`, teacherId: teacher2?.user_id, roomId: createdRooms[3]?.room_id, section_number: 'C1', max_capacity: 60, days_of_week: 'MWF', start_time: '13:00', end_time: '13:50' },
    { courseCode: 'ECE201', semesterName: `Fall ${currentYear}`, teacherId: teacher3?.user_id, roomId: createdRooms[4]?.room_id, section_number: 'E1', max_capacity: 45, days_of_week: 'TTH', start_time: '14:00', end_time: '15:20' },
    { courseCode: 'MATH201', semesterName: `Fall ${currentYear}`, teacherId: teacher1?.user_id, roomId: createdRooms[0]?.room_id, section_number: 'M1', max_capacity: 50, days_of_week: 'MWF', start_time: '11:00', end_time: '11:50' },

    { courseCode: 'SE301', semesterName: `Spring ${currentYear + 1}`, teacherId: teacher1?.user_id, roomId: createdRooms[0]?.room_id, section_number: 'S1', max_capacity: 50, days_of_week: 'MWF', start_time: '09:00', end_time: '09:50' },
    { courseCode: 'CV305', semesterName: `Spring ${currentYear + 1}`, teacherId: teacher2?.user_id, roomId: createdRooms[3]?.room_id, section_number: 'C1', max_capacity: 35, days_of_week: 'TTH', start_time: '08:30', end_time: '09:50' },
    { courseCode: 'ECE310', semesterName: `Spring ${currentYear + 1}`, teacherId: teacher3?.user_id, roomId: createdRooms[4]?.room_id, section_number: 'E1', max_capacity: 30, days_of_week: 'MWF', start_time: '14:00', end_time: '14:50' },
  ];
  const createdScheduledCourses = [];
  for (const scData of scheduledCoursesToCreate) {
    const course = createdCourses.find(c => c.course_code === scData.courseCode);
    const semester = createdSemesters.find(s => s.name === scData.semesterName);
    if (!course || !semester || !scData.teacherId) { console.warn(`Missing data for scheduling ${scData.courseCode} in ${scData.semesterName}. Skipping.`); continue; }
    
    const newScheduledCourse = await prisma.scheduledCourse.upsert({
      where: { course_id_semester_id_section_number: { course_id: course.course_id, semester_id: semester.semester_id, section_number: scData.section_number}},
      update: { teacher_id: scData.teacherId, room_id: scData.roomId, max_capacity: scData.max_capacity, days_of_week: scData.days_of_week, start_time: new Date(`1970-01-01T${scData.start_time}:00Z`), end_time: new Date(`1970-01-01T${scData.end_time}:00Z`) },
      create: {
        course_id: course.course_id, semester_id: semester.semester_id, teacher_id: scData.teacherId, room_id: scData.roomId,
        section_number: scData.section_number, max_capacity: scData.max_capacity, days_of_week: scData.days_of_week,
        start_time: new Date(`1970-01-01T${scData.start_time}:00Z`), end_time: new Date(`1970-01-01T${scData.end_time}:00Z`), current_enrollment: 0,
      },
    });
    createdScheduledCourses.push(newScheduledCourse);
    console.log(`Scheduled: ${course.course_code} - ${newScheduledCourse.section_number} for ${semester.name}`);
  }

  // --- Create Registrations ---
  const student1 = createdUsers.find(u=>u.username === 'student1');
  const student2 = createdUsers.find(u=>u.username === 'student2');
  const student3 = createdUsers.find(u=>u.username === 'student3');
  const student6 = createdUsers.find(u=>u.username === 'student6');


  // Student 1: Takes MATH201 (prereq for SE302), SE301 in Fall currentYear. Then SE302 in Spring currentYear+1
  const math201_fall_curr = createdScheduledCourses.find(sc => sc.course_id === math201?.course_id && sc.semester_id === createdSemesters.find(s=>s.name===`Fall ${currentYear}`)?.semester_id);
  const se301_fall_curr = createdScheduledCourses.find(sc => sc.course_id === createdCourses.find(c=>c.course_code==='SE301')?.course_id && sc.semester_id === createdSemesters.find(s=>s.name===`Fall ${currentYear}`)?.semester_id);
  
  const se302_spring_next = createdScheduledCourses.find(sc => sc.course_id === se302?.course_id && sc.semester_id === createdSemesters.find(s=>s.name===`Spring ${currentYear + 1}`)?.semester_id);
  
  // Student 2: Takes CV201 (prereq for CV305) in Fall currentYear. Then CV305 in Spring currentYear+1
  const cv201_fall_curr = createdScheduledCourses.find(sc => sc.course_id === cv201?.course_id && sc.semester_id === createdSemesters.find(s=>s.name===`Fall ${currentYear}`)?.semester_id);
  const cv305_spring_next = createdScheduledCourses.find(sc => sc.course_id === cv305?.course_id && sc.semester_id === createdSemesters.find(s=>s.name===`Spring ${currentYear + 1}`)?.semester_id);


  const registrationsToCreate = [];
  if (student1 && math201_fall_curr) registrationsToCreate.push({ student_id: student1.user_id, scheduled_course_id: math201_fall_curr.scheduled_course_id, status: RegistrationStatus.Completed, final_letter_grade: 'A-', overall_percentage: 92.5 });
  if (student1 && se301_fall_curr) registrationsToCreate.push({ student_id: student1.user_id, scheduled_course_id: se301_fall_curr.scheduled_course_id, status: RegistrationStatus.Completed, final_letter_grade: 'B+', overall_percentage: 86.0 });
  if (student1 && se302_spring_next) registrationsToCreate.push({ student_id: student1.user_id, scheduled_course_id: se302_spring_next.scheduled_course_id, status: RegistrationStatus.Registered });
  
  if (student2 && cv201_fall_curr) registrationsToCreate.push({ student_id: student2.user_id, scheduled_course_id: cv201_fall_curr.scheduled_course_id, status: RegistrationStatus.Completed, final_letter_grade: 'A', overall_percentage: 95.0 });
  if (student2 && cv305_spring_next) registrationsToCreate.push({ student_id: student2.user_id, scheduled_course_id: cv305_spring_next.scheduled_course_id, status: RegistrationStatus.Registered });
  
  const ece201_fall_curr = createdScheduledCourses.find(sc => sc.course_id === createdCourses.find(c=>c.course_code==='ECE201')?.course_id && sc.semester_id === createdSemesters.find(s=>s.name===`Fall ${currentYear}`)?.semester_id);
  if (student3 && ece201_fall_curr) registrationsToCreate.push({ student_id: student3.user_id, scheduled_course_id: ece201_fall_curr.scheduled_course_id, status: RegistrationStatus.Completed, final_letter_grade: 'B', overall_percentage: 82.0 });

  if (student6 && math201_fall_curr) registrationsToCreate.push({ student_id: student6.user_id, scheduled_course_id: math201_fall_curr.scheduled_course_id, status: RegistrationStatus.Registered });
  if (student6 && se301_fall_curr) registrationsToCreate.push({ student_id: student6.user_id, scheduled_course_id: se301_fall_curr.scheduled_course_id, status: RegistrationStatus.Registered });


  for (const regData of registrationsToCreate) {
    const reg = await prisma.registration.upsert({
      where: { student_id_scheduled_course_id: { student_id: regData.student_id, scheduled_course_id: regData.scheduled_course_id } },
      update: { status: regData.status, final_letter_grade: regData.final_letter_grade, overall_percentage: regData.overall_percentage },
      create: regData,
    });
    // Increment enrollment count
    await prisma.scheduledCourse.update({
        where: { scheduled_course_id: regData.scheduled_course_id },
        data: { current_enrollment: { increment: 1 } }
    });
    console.log(`Registered student ID ${reg.student_id} for scheduled course ID ${reg.scheduled_course_id}`);

    // Add assessments and scores for completed courses
    if (reg.status === RegistrationStatus.Completed && reg.final_letter_grade) {
      const assessmentsForCourse = [
        { name: 'Midterm Exam', max_score: 100, score_achieved: Math.floor(Math.random() * 20 + 70) }, // Score between 70-90
        { name: 'Final Exam', max_score: 100, score_achieved: Math.floor(Math.random() * 25 + 70) }, // Score between 70-95
        { name: 'Project', max_score: 50, score_achieved: Math.floor(Math.random() * 15 + 30) }, // Score between 30-45
      ];
      for (const assData of assessmentsForCourse) {
        const assessment = await prisma.assessment.upsert({
          where: { scheduled_course_id_name: { scheduled_course_id: reg.scheduled_course_id, name: assData.name } },
          update: { max_score: assData.max_score },
          create: { scheduled_course_id: reg.scheduled_course_id, name: assData.name, max_score: assData.max_score, assessment_type: 'Graded' },
        });
        await prisma.studentAssessmentScore.upsert({
          where: { registration_id_assessment_id: { registration_id: reg.registration_id, assessment_id: assessment.assessment_id } },
          update: { score_achieved: assData.score_achieved },
          create: { registration_id: reg.registration_id, assessment_id: assessment.assessment_id, score_achieved: assData.score_achieved, graded_timestamp: new Date() },
        });
        console.log(`Added score for ${assessment.name} for registration ID ${reg.registration_id}`);
      }
    }
  }
  
  // --- Create Course Materials ---
  if (teacher1 && se301_fall_curr) {
    await prisma.courseMaterial.upsert({
      where: { scheduled_course_id_title: { scheduled_course_id: se301_fall_curr.scheduled_course_id, title: 'Lecture 1: Introduction to Design Patterns'}},
      update: {},
      create: {
        scheduled_course_id: se301_fall_curr.scheduled_course_id, uploaded_by_id: teacher1.user_id, title: 'Lecture 1: Introduction to Design Patterns',
        description: 'Slides for the first lecture.', material_type: MaterialType.File, file_path: '/mock/se301_lec1.pdf',
      }
    });
    await prisma.courseMaterial.upsert({
      where: { scheduled_course_id_title: { scheduled_course_id: se301_fall_curr.scheduled_course_id, title: 'Observer Pattern Tutorial'}},
      update: {},
      create: {
        scheduled_course_id: se301_fall_curr.scheduled_course_id, uploaded_by_id: teacher1.user_id, title: 'Observer Pattern Tutorial',
        description: 'External resource for Observer Pattern.', material_type: MaterialType.Link, url: 'https://refactoring.guru/design-patterns/observer',
      }
    });
    console.log(`Added materials for ${se301_fall_curr.course_id}`);
  }

  // --- Create Announcements ---
  if(adminUser) {
    await prisma.announcement.upsert({
        where: { title: 'Welcome to Fall Semester!' }, // Requires a unique constraint on title for upsert, or just create.
        update: {},
        create: {
            title: 'Welcome to Fall Semester!', content: `Welcome everyone to the Fall ${currentYear} semester! We wish you all the best in your studies. Please check your course schedules and portal announcements regularly.`,
            author_id: adminUser.user_id, status: 'Published', publish_date: new Date(), target_audience: AnnouncementTargetAudience.AllUsers, desired_tone: 'Friendly'
        }
    });
    console.log('Created welcome announcement.');
  }
  if(teacher1 && se301_fall_curr) {
     await prisma.announcement.create({ // Assuming announcements can have non-unique titles if not upserting
        data: {
            title: `SE301 - ${se301_fall_curr.section_number}: Project Update`,
            content: `Dear students of SE301 Section ${se301_fall_curr.section_number}, please note the project submission deadline has been extended by one week. The new deadline is October 15th.`,
            author_id: teacher1.user_id, status: 'Published', publish_date: new Date(), target_audience: AnnouncementTargetAudience.Students, desired_tone: 'Informative',
            targetSections: { create: [{ scheduled_course_id: se301_fall_curr.scheduled_course_id }]}
        }
    });
     console.log('Created SE301 project update announcement.');
  }


  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

