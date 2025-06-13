
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

export const UserProfileSchema = z.object({
  email: z.string().email().optional(),
  phone_number: z.string().optional(),
  address: z.string().optional(),
  office_location: z.string().optional(), // For teachers
  job_title: z.string().optional(), // For staff
});
export type UserProfileFormData = z.infer<typeof UserProfileSchema>;

export const NewUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters."),
  email: z.string().email("Invalid email address."),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['Student', 'Teacher', 'Staff'], { required_error: "Role is required." }),
  password: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters."),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // Path to field to display error
});
export type NewUserFormData = z.infer<typeof NewUserSchema>;

export const EditUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters."),
  email: z.string().email("Invalid email address."),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['Student', 'Teacher', 'Staff'], { required_error: "Role is required." }),
  is_active: z.boolean().default(true),
});
export type EditUserFormData = z.infer<typeof EditUserSchema>;

export const NewCourseSchema = z.object({
  course_code: z.string().min(3, "Course code must be at least 3 characters.").max(10, "Course code cannot exceed 10 characters."),
  title: z.string().min(5, "Title must be at least 5 characters."),
  description: z.string().optional(),
  credits: z.coerce.number().min(0, "Credits cannot be negative.").max(10, "Credits seem too high."),
  department_id: z.string({ required_error: "Department is required."}).min(1, "Department is required."),
});
export type NewCourseFormData = z.infer<typeof NewCourseSchema>;
