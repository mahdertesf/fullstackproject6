
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

export const EditCourseSchema = z.object({
  course_code: z.string().min(3, "Course code must be at least 3 characters.").max(10, "Course code cannot exceed 10 characters."),
  title: z.string().min(5, "Title must be at least 5 characters."),
  description: z.string().optional(),
  credits: z.coerce.number().min(0, "Credits cannot be negative.").max(10, "Credits seem too high."),
  department_id: z.string({ required_error: "Department is required."}).min(1, "Department is required."),
});
export type EditCourseFormData = z.infer<typeof EditCourseSchema>;

export const NewSemesterSchema = z.object({
  name: z.string().min(3, "Semester name must be at least 3 characters."),
  academic_year: z.coerce.number()
    .min(new Date().getFullYear() - 5, `Year cannot be too far in the past.`)
    .max(new Date().getFullYear() + 5, `Year cannot be too far in the future.`),
  term: z.enum(['Fall', 'Spring', 'Summer', 'Winter'], { required_error: "Term is required."}),
  start_date: z.date({ required_error: "Start date is required."}),
  end_date: z.date({ required_error: "End date is required."}),
  registration_start_date: z.date({ required_error: "Registration start date is required."}),
  registration_end_date: z.date({ required_error: "Registration end date is required."}),
  add_drop_start_date: z.date({ required_error: "Add/Drop start date is required."}),
  add_drop_end_date: z.date({ required_error: "Add/Drop end date is required."}),
}).refine(data => data.end_date > data.start_date, {
  message: "End date must be after start date.",
  path: ["end_date"],
}).refine(data => data.registration_end_date > data.registration_start_date, {
  message: "Registration end date must be after registration start date.",
  path: ["registration_end_date"],
}).refine(data => data.add_drop_end_date > data.add_drop_start_date, {
  message: "Add/Drop end date must be after Add/Drop start date.",
  path: ["add_drop_end_date"],
}).refine(data => data.registration_start_date <= data.start_date, {
  message: "Registration start date must be on or before the semester start date.",
  path: ["registration_start_date"],
}).refine(data => data.add_drop_start_date >= data.start_date, {
  message: "Add/Drop period must start on or after the semester start date.",
  path: ["add_drop_start_date"],
});
export type NewSemesterFormData = z.infer<typeof NewSemesterSchema>;


export const ScheduleCourseSchema = z.object({
  course_id: z.string().min(1, "Course is required."),
  semester_id: z.string().min(1, "Semester is required."),
  teacher_id: z.string().min(1, "Teacher is required."),
  room_id: z.string().optional(),
  section_number: z.string().min(1, "Section number is required.").max(10, "Max 10 chars."),
  max_capacity: z.coerce.number().int().min(1, "Capacity must be at least 1.").max(500, "Capacity seems too high."),
  days_of_week: z.string().min(1, "Days are required (e.g., MWF, TTH).").max(15),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM e.g. 09:00)."),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM e.g. 10:30)."),
}).refine(data => {
  if (data.start_time && data.end_time) {
    return data.end_time > data.start_time;
  }
  return true;
}, {
  message: "End time must be after start time.",
  path: ["end_time"],
});
export type ScheduleCourseFormData = z.infer<typeof ScheduleCourseSchema>;

export const DepartmentSchema = z.object({
  name: z.string().min(3, "Department name must be at least 3 characters long.").max(100, "Department name must be 100 characters or less."),
  description: z.string().max(500, "Description must be 500 characters or less.").optional(),
});
export type DepartmentFormData = z.infer<typeof DepartmentSchema>;
