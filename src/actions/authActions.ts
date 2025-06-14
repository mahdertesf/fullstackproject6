// src/actions/authActions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { UserProfile } from '@/types'; // Assuming UserProfile correctly includes relations

export async function loginUser(username: string, passwordAttempt: string): Promise<UserProfile> {
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      student_profile: true,
      teacher_profile: true,
      staff_profile: true,
    },
  });

  if (!user) {
    throw new Error('Invalid username or password.');
  }

  // IMPORTANT: Plaintext password comparison.
  // In a real application, NEVER store passwords in plaintext.
  // You should hash passwords upon user creation/update and compare hashes here.
  // Example using a hypothetical password check:
  // const isPasswordValid = await bcrypt.compare(passwordAttempt, user.password_hash);
  // For this prototype, we'll do a simple (and insecure) check if the password_hash field matches the attempt.
  // This assumes passwords in the DB are stored as plaintext for this mock-to-fullstack transition.
  // If your mock data has 'hashed_password' as a placeholder, this will likely always fail unless you
  // seed the DB with users where password_hash is the actual password.
  
  // For the purpose of this transition and assuming password_hash is actually the plain password for now:
  if (user.password_hash !== passwordAttempt) {
    // If you are using the mock data as is, where password_hash is "hashed_password",
    // you might want to temporarily change this to a simpler check for testing, e.g.,
    // if (user.password_hash !== "hashed_password" && passwordAttempt !== "password123") { // for a generic test password
    // Or, ensure your database has users with passwords that can be matched directly.
    throw new Error('Invalid username or password.');
  }

  if (!user.is_active) {
    throw new Error('This account is inactive. Please contact an administrator.');
  }
  
  // Construct UserProfile. isSuperAdmin might be determined by a specific role or a flag on StaffProfile.
  // For now, let's assume a staff user named 'admin' is superadmin.
  const userProfile: UserProfile = {
    ...user,
    // isSuperAdmin: user.role === 'Staff' && user.username === 'admin', // Example logic
    isSuperAdmin: user.role === 'Staff' && !!user.staff_profile?.is_super_admin, // Prefer a flag if available
  };

  return userProfile;
}
