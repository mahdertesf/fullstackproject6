// src/lib/gpaUtils.ts

import type { EnrichedRegistration, Course } from '@/types';

export const getGradePointForLetter = (letterGrade: string | null | undefined, gradePointMapping: Record<string, number>): number => {
  if (!letterGrade || !(letterGrade in gradePointMapping)) {
    return 0; // Default to 0 if grade is not found or invalid
  }
  return gradePointMapping[letterGrade];
};

export const calculateTotalPointsForCourse = (
  letterGrade: string | null | undefined,
  credits: number,
  gradePointMapping: Record<string, number>
): number => {
  const gradePoint = getGradePointForLetter(letterGrade, gradePointMapping);
  return gradePoint * credits;
};


export const calculateSGPA = (
  registrationsForSemester: EnrichedRegistration[],
  coursesData: Course[],
  gradePointMapping: Record<string, number>
): { sgpa: number; totalCreditsAttempted: number; totalQualityPoints: number } => {
  let totalQualityPoints = 0;
  let totalCreditsAttempted = 0;

  registrationsForSemester.forEach(reg => {
    if (reg.status === 'Completed' && reg.final_letter_grade) {
      const course = coursesData.find(c => c.course_id === reg.scheduledCourse?.course_id);
      if (course) {
        const points = calculateTotalPointsForCourse(reg.final_letter_grade, course.credits, gradePointMapping);
        totalQualityPoints += points;
        totalCreditsAttempted += course.credits;
      }
    }
  });

  const sgpa = totalCreditsAttempted > 0 ? parseFloat((totalQualityPoints / totalCreditsAttempted).toFixed(2)) : 0;
  return { sgpa, totalCreditsAttempted, totalQualityPoints };
};

export const calculateCGPA = (
  allRegistrations: EnrichedRegistration[],
  coursesData: Course[],
  gradePointMapping: Record<string, number>
): { cgpa: number; totalCreditsAttempted: number; totalQualityPoints: number } => {
  let totalQualityPoints = 0;
  let totalCreditsAttempted = 0;

  allRegistrations.forEach(reg => {
    if (reg.status === 'Completed' && reg.final_letter_grade) {
      const course = coursesData.find(c => c.course_id === reg.scheduledCourse?.course_id);
      if (course) {
        const points = calculateTotalPointsForCourse(reg.final_letter_grade, course.credits, gradePointMapping);
        totalQualityPoints += points;
        totalCreditsAttempted += course.credits;
      }
    }
  });
  
  const cgpa = totalCreditsAttempted > 0 ? parseFloat((totalQualityPoints / totalCreditsAttempted).toFixed(2)) : 0;
  return { cgpa, totalCreditsAttempted, totalQualityPoints };
};
