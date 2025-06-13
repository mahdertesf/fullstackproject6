import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});
export type LoginFormData = z.infer<typeof LoginSchema>;

export const AnnouncementGeneratorSchema = z.object({
  topic: z.string().min(3, { message: "Topic must be at least 3 characters long." }),
  desiredTone: z.enum(['Formal', 'Urgent', 'Friendly', 'Informative', 'Academic']), // Expand as needed from DB
});
export type AnnouncementGeneratorFormData = z.infer<typeof AnnouncementGeneratorSchema>;


export const StudyGuideGeneratorSchema = z.object({
  courseId: z.string().min(1, { message: "Please select a course." }),
  topic: z.string().min(3, { message: "Topic must be at least 3 characters long." }),
  studentNeeds: z.string().min(10, { message: "Please describe your needs (at least 10 characters)." })
});
export type StudyGuideGeneratorFormData = z.infer<typeof StudyGuideGeneratorSchema>;

// Add more schemas as needed for other forms: Profile, Course Creation, etc.
export const UserProfileSchema = z.object({
  email: z.string().email().optional(),
  phone_number: z.string().optional(),
  address: z.string().optional(),
  office_location: z.string().optional(), // For teachers
  job_title: z.string().optional(), // For staff
  // Add other common fields or use discriminated unions for role-specific fields
});
export type UserProfileFormData = z.infer<typeof UserProfileSchema>;
