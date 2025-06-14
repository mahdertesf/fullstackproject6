import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // --- Create Super Admin User ---
  const adminUsername = 'admin';
  const adminEmail = 'admin@cotbe.edu';
  const adminPassword = 'adminPass123!';

  let adminUser = await prisma.user.findUnique({
    where: { username: adminUsername },
  });

  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        username: adminUsername,
        email: adminEmail,
        password_hash: adminPassword,
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
    console.log(`Admin user "${adminUsername}" already exists.`);
    adminUser = await prisma.user.update({
      where: { user_id: adminUser.user_id },
      data: {
        is_super_admin: true,
        role: UserRole.Staff,
        password_hash: adminPassword,
        staff_profile: {
          upsert: {
            where: { staff_id: adminUser.user_id },
            create: { job_title: 'Portal Administrator' },
            update: { job_title: 'Portal Administrator' },
          },
        },
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
      update: {},
      create: deptData,
    });
    createdDepartments.push(department);
    console.log(`Created/Ensured department: ${department.name}`);
  }

  const firstDepartmentId = createdDepartments.length > 0 ? createdDepartments[0].department_id : undefined;
  if (!firstDepartmentId) {
    console.warn("No departments were created or found. Skipping user creation that depends on departments.");
  }

  // --- Create Semesters ---
  const currentYear = new Date().getFullYear();
  const semestersToCreate = [
    {
      name: `Fall ${currentYear}`,
      academic_year: currentYear,
      term: 'Fall',
      start_date: new Date(`${currentYear}-09-01`),
      end_date: new Date(`${currentYear}-12-20`),
      registration_start_date: new Date(`${currentYear}-08-15`),
      registration_end_date: new Date(`${currentYear}-09-10`),
      add_drop_start_date: new Date(`${currentYear}-09-01`),
      add_drop_end_date: new Date(`${currentYear}-09-15`),
    },
    {
      name: `Spring ${currentYear + 1}`,
      academic_year: currentYear + 1,
      term: 'Spring',
      start_date: new Date(`${currentYear + 1}-01-15`),
      end_date: new Date(`${currentYear + 1}-05-10`),
      registration_start_date: new Date(`${currentYear + 1}-01-01`),
      registration_end_date: new Date(`${currentYear + 1}-01-20`),
      add_drop_start_date: new Date(`${currentYear + 1}-01-15`),
      add_drop_end_date: new Date(`${currentYear + 1}-01-30`),
    },
  ];

  for (const semData of semestersToCreate) {
    const existingSemester = await prisma.semester.findFirst({
      where: { name: semData.name },
    });

    if (!existingSemester) {
      const semester = await prisma.semester.create({ data: semData });
      console.log(`Created semester: ${semester.name}`);
    } else {
      console.log(`Semester "${semData.name}" already exists.`);
    }
  }

  // --- Create example student, teacher, and staff users ---
  if (firstDepartmentId) {
    const usersToCreate = [
      {
        username: 'student1',
        email: 'student1@example.com',
        password_hash: 'studentPass123',
        role: UserRole.Student,
        first_name: 'Student',
        last_name: 'One',
        is_active: true,
        is_super_admin: false,
        department_id: firstDepartmentId,
      },
      {
        username: 'teacher1',
        email: 'teacher1@example.com',
        password_hash: 'teacherPass123',
        role: UserRole.Teacher,
        first_name: 'Teacher',
        last_name: 'One',
        is_active: true,
        is_super_admin: false,
        department_id: firstDepartmentId,
      },
      {
        username: 'staff1',
        email: 'staff1@example.com',
        password_hash: 'staffPass123',
        role: UserRole.Staff,
        first_name: 'Staff',
        last_name: 'One',
        is_active: true,
        is_super_admin: false,
      },
    ];

    for (const userData of usersToCreate) {
      let user = await prisma.user.findUnique({ where: { username: userData.username } });

      if (!user) {
        const profileData: any = {};
        if (userData.role === UserRole.Student) {
          profileData.student_profile = {
            create: { enrollment_date: new Date(), department_id: userData.department_id },
          };
        } else if (userData.role === UserRole.Teacher) {
          profileData.teacher_profile = {
            create: { department_id: userData.department_id },
          };
        } else if (userData.role === UserRole.Staff) {
          profileData.staff_profile = { create: { job_title: 'General Staff' } };
        }

        user = await prisma.user.create({
          data: {
            username: userData.username,
            email: userData.email,
            password_hash: userData.password_hash,
            role: userData.role,
            first_name: userData.first_name,
            last_name: userData.last_name,
            is_active: userData.is_active,
            is_super_admin: userData.is_super_admin,
            ...profileData,
          },
        });
        console.log(`Created user: ${user.username}`);
      } else {
        console.log(`User "${userData.username}" already exists.`);
      }
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
