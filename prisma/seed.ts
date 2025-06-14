// prisma/seed.ts
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // --- Create Super Admin User ---
  const adminUsername = 'admin';
  const adminEmail = 'admin@cotbe.edu';
  // IMPORTANT: In a real application, ALWAYS HASH PASSWORDS before storing them.
  // For this seed script, we are using a plaintext password for simplicity.
  // Example using bcryptjs (install with `npm install bcryptjs @types/bcryptjs`):
  // const bcrypt = require('bcryptjs');
  // const hashedPassword = bcrypt.hashSync('adminPass123!', 10);
  const adminPassword = 'adminPass123!'; // Replace with a strong password if you intend to keep this user

  let adminUser = await prisma.user.findUnique({
    where: { username: adminUsername },
  });

  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        username: adminUsername,
        email: adminEmail,
        password_hash: adminPassword, // Store as plaintext for now; HASH IN PRODUCTION!
        role: UserRole.Staff,
        first_name: 'Super',
        last_name: 'Admin',
        is_active: true,
        is_super_admin: true,
        staff_profile: {
          create: {
            job_title: 'Portal Administrator',
            // Add other staff profile fields if necessary, ensuring they have defaults or are nullable
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
    // Optionally update the admin user if it exists, e.g., ensure is_super_admin is true
    adminUser = await prisma.user.update({
      where: { user_id: adminUser.user_id },
      data: {
        is_super_admin: true,
        role: UserRole.Staff, // Ensure role is Staff
        password_hash: adminPassword, // Re-set password if needed (HASH IN PRODUCTION)
        staff_profile: {
          upsert: { // Create staff profile if it doesn't exist, update if it does
            where: { staff_id: adminUser.user_id }, // Assuming staff_id is user_id
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

  // --- Create Departments (Example) ---
  const departmentsToCreate = [
    { name: 'Software Engineering', description: 'Department of Software Engineering' },
    { name: 'Civil Engineering', description: 'Department of Civil Engineering' },
    { name: 'Electrical Engineering', description: 'Department of Electrical and Computer Engineering' },
    { name: 'Mechanical Engineering', description: 'Department of Mechanical Engineering' },
    { name: 'Biomedical Engineering', description: 'Department of Biomedical Engineering' },
  ];

  for (const deptData of departmentsToCreate) {
    const department = await prisma.department.upsert({
      where: { name: deptData.name },
      update: {},
      create: deptData,
    });
    console.log(`Created/Ensured department: ${department.name}`);
  }
  
  // --- Create Semesters (Example) ---
  const currentYear = new Date().getFullYear();
  const semestersToCreate = [
    { name: `Fall ${currentYear}`, academic_year: currentYear, term: 'Fall', start_date: new Date(`${currentYear}-09-01`), end_date: new Date(`${currentYear}-12-20`), registration_start_date: new Date(`${currentYear}-08-15`), registration_end_date: new Date(`${currentYear}-09-10`), add_drop_start_date: new Date(`${currentYear}-09-01`), add_drop_end_date: new Date(`${currentYear}-09-15`) },
    { name: `Spring ${currentYear + 1}`, academic_year: currentYear + 1, term: 'Spring', start_date: new Date(`${currentYear + 1}-01-15`), end_date: new Date(`${currentYear + 1}-05-10`), registration_start_date: new Date(`${currentYear + 1}-01-01`), registration_end_date: new Date(`${currentYear + 1}-01-20`), add_drop_start_date: new Date(`${currentYear + 1}-01-15`), add_drop_end_date: new Date(`${currentYear + 1}-01-30`) },
  ];

  for (const semData of semestersToCreate) {
    const semester = await prisma.semester.upsert({
        where: { name: semData.name }, // Use a unique constraint if available, e.g., name
        update: {}, // No updates if it exists for this simple seed
        create: semData
    });
    console.log(`Created/Ensured semester: ${semester.name}`);
  }


  // --- Create example student, teacher, and staff users ---
  const usersToCreate = [
    { username: 'student1', email: 'student1@example.com', password_hash: 'studentPass123', role: UserRole.Student, first_name: 'Student', last_name: 'One', is_active: true, is_super_admin: false, department_id: 1 }, // Assuming Department ID 1 exists
    { username: 'teacher1', email: 'teacher1@example.com', password_hash: 'teacherPass123', role: UserRole.Teacher, first_name: 'Teacher', last_name: 'One', is_active: true, is_super_admin: false, department_id: 1 }, // Assuming Department ID 1 exists
    { username: 'staff1', email: 'staff1@example.com', password_hash: 'staffPass123', role: UserRole.Staff, first_name: 'Staff', last_name: 'One', is_active: true, is_super_admin: false },
  ];

  for (const userData of usersToCreate) {
    let user = await prisma.user.findUnique({ where: { username: userData.username } });
    if (!user) {
      const profileData: any = {};
      if (userData.role === UserRole.Student) {
        profileData.student_profile = { create: { enrollment_date: new Date(), department_id: userData.department_id } };
      } else if (userData.role === UserRole.Teacher) {
        profileData.teacher_profile = { create: { department_id: userData.department_id } };
      } else if (userData.role === UserRole.Staff) {
        profileData.staff_profile = { create: { job_title: 'General Staff' } };
      }

      user = await prisma.user.create({
        data: {
          username: userData.username,
          email: userData.email,
          password_hash: userData.password_hash, // HASH IN PRODUCTION!
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
