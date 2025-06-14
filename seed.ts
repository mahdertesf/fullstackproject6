
// seed.ts
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main() {
  console.log('Start seeding ...');

  // --- Create Super Admin User ---
  const adminUsername = 'admin';
  const adminEmail = 'admin@cotbe.edu';
  const adminPasswordPlain = 'adminPass123!'; 
  const adminPasswordHashed = await bcrypt.hash(adminPasswordPlain, SALT_ROUNDS);

  let adminUser = await prisma.user.findUnique({
    where: { username: adminUsername },
  });

  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        username: adminUsername,
        email: adminEmail,
        password_hash: adminPasswordHashed,
        role: UserRole.Staff,
        first_name: 'Super',
        last_name: 'Admin',
        is_active: true,
        is_super_admin: true,
        staff_profile: {
          create: {
            job_title: 'Portal Administrator',
          },
        },
      },
      include: {
        staff_profile: true,
      },
    });
    console.log(`Created super admin user: ${adminUser.username} with ID: ${adminUser.user_id}`);
  } else {
    console.log(`Admin user "${adminUsername}" already exists. Ensuring it is super admin and password is set.`);
    adminUser = await prisma.user.update({
      where: { user_id: adminUser.user_id },
      data: {
        is_super_admin: true,
        role: UserRole.Staff, 
        password_hash: adminPasswordHashed, 
        staff_profile: {
          upsert: { 
            where: { staff_id: adminUser.user_id }, 
            create: { job_title: 'Portal Administrator' },
            update: { job_title: 'Portal Administrator' },
          }
        }
      },
       include: {
        staff_profile: true,
      },
    });
     console.log(`Updated super admin user: ${adminUser.username}.`);
  }

  // --- Create Departments ---
  const departmentsToCreate = [
    { name: 'Software Engineering', description: 'Department of Software Engineering' },
    { name: 'Civil Engineering', description: 'Department of Civil Engineering' },
    { name: 'Electrical Engineering', description: 'Department of Electrical and Computer Engineering' },
    { name: 'Mechanical Engineering', description: 'Department of Mechanical Engineering' },
    { name: 'Biomedical Engineering', description: 'Department of Biomedical Engineering' },
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
  
  const firstDepartmentId = createdDepartments.length > 0 ? createdDepartments[0].department_id : undefined;
  if (!firstDepartmentId) {
    console.warn("No departments were created or found. Some subsequent seeds might fail (e.g., users needing a department).");
  }


  // --- Create Semesters ---
  const currentYear = new Date().getFullYear();
  const semestersToCreate = [
    { name: `Fall ${currentYear}`, academic_year: currentYear, term: 'Fall', start_date: new Date(`${currentYear}-09-01`), end_date: new Date(`${currentYear}-12-20`), registration_start_date: new Date(`${currentYear}-08-15`), registration_end_date: new Date(`${currentYear}-09-10`), add_drop_start_date: new Date(`${currentYear}-09-01`), add_drop_end_date: new Date(`${currentYear}-09-15`) },
    { name: `Spring ${currentYear + 1}`, academic_year: currentYear + 1, term: 'Spring', start_date: new Date(`${currentYear + 1}-01-15`), end_date: new Date(`${currentYear + 1}-05-10`), registration_start_date: new Date(`${currentYear + 1}-01-01`), registration_end_date: new Date(`${currentYear + 1}-01-20`), add_drop_start_date: new Date(`${currentYear + 1}-01-15`), add_drop_end_date: new Date(`${currentYear + 1}-01-30`) },
  ];

  for (const semData of semestersToCreate) {
    const semester = await prisma.semester.upsert({
        where: { name: semData.name }, 
        update: semData, 
        create: semData
    });
    console.log(`Created/Updated semester: ${semester.name}`);
  }


  // --- Create example student, teacher, and staff users ---
  const usersToCreate = [
    { username: 'student1', email: 'student1@example.com', password_plain: 'studentPass123', role: UserRole.Student, first_name: 'Student', last_name: 'One', is_active: true, is_super_admin: false, department_id: firstDepartmentId },
    { username: 'teacher1', email: 'teacher1@example.com', password_plain: 'teacherPass123', role: UserRole.Teacher, first_name: 'Teacher', last_name: 'One', is_active: true, is_super_admin: false, department_id: firstDepartmentId },
    { username: 'staff1', email: 'staff1@example.com', password_plain: 'staffPass123', role: UserRole.Staff, first_name: 'Staff', last_name: 'One', is_active: true, is_super_admin: false },
  ];

  for (const userData of usersToCreate) {
    let user = await prisma.user.findUnique({ where: { username: userData.username } });
    const hashedPassword = await bcrypt.hash(userData.password_plain, SALT_ROUNDS);
    
    const profileDataCreate: any = {};
    const profileDataUpdate: any = {};

    if (userData.role === UserRole.Student) {
      if (!userData.department_id) {
        console.warn(`Skipping student ${userData.username} due to missing department_id.`);
        continue;
      }
      profileDataCreate.student_profile = { create: { enrollment_date: new Date(), department_id: userData.department_id } };
      profileDataUpdate.student_profile = { upsert: { 
        where: { student_id: user?.user_id || -1 }, 
        create: { enrollment_date: new Date(), department_id: userData.department_id },
        update: { department_id: userData.department_id } 
      }};
    } else if (userData.role === UserRole.Teacher) {
      if (!userData.department_id) {
        console.warn(`Skipping teacher ${userData.username} due to missing department_id.`);
        continue;
      }
      profileDataCreate.teacher_profile = { create: { department_id: userData.department_id } };
      profileDataUpdate.teacher_profile = { upsert: {
        where: { teacher_id: user?.user_id || -1 },
        create: { department_id: userData.department_id },
        update: { department_id: userData.department_id }
      }};
    } else if (userData.role === UserRole.Staff) {
      profileDataCreate.staff_profile = { create: { job_title: 'General Staff' } };
      profileDataUpdate.staff_profile = { upsert: {
        where: { staff_id: user?.user_id || -1 },
        create: { job_title: 'General Staff' },
        update: { job_title: 'General Staff' }
      }};
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          username: userData.username,
          email: userData.email,
          password_hash: hashedPassword,
          role: userData.role,
          first_name: userData.first_name,
          last_name: userData.last_name,
          is_active: userData.is_active,
          is_super_admin: userData.is_super_admin,
          ...profileDataCreate,
        },
      });
      console.log(`Created user: ${user.username}`);
    } else {
      // Update existing user, ensure profile exists and password is set
      user = await prisma.user.update({
        where: { username: userData.username },
        data: {
          email: userData.email,
          password_hash: hashedPassword,
          role: userData.role,
          first_name: userData.first_name,
          last_name: userData.last_name,
          is_active: userData.is_active,
          is_super_admin: userData.is_super_admin,
          ...profileDataUpdate,
        },
      });
      console.log(`User "${userData.username}" already exists. Updated.`);
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
