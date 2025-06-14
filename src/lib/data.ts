// src/lib/data.ts
// This file is now deprecated as the application uses a database.
// It is kept for reference or for potential seeding scripts but should not be imported by components.

// To create a seed script, you might create `prisma/seed.ts` and use Prisma Client.
// Example:
/*
import { PrismaClient, UserRole, SemesterTerm, MaterialType, AnnouncementStatus, AnnouncementTargetAudience, RegistrationStatus } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Seed users
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      password_hash: 'admin123', // IMPORTANT: Hash this in a real seed script!
      email: 'admin@cotbe.edu',
      role: UserRole.Staff,
      is_super_admin: true,
      first_name: 'Super',
      last_name: 'Admin',
      staff_profile: {
        create: {
          job_title: 'Portal Administrator',
        }
      }
    },
  });
  // ... add more users, departments, courses etc.
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
*/

export {}; // Ensures this file is treated as a module if it's empty.
