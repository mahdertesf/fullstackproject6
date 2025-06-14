// src/actions/teacherActions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { CourseMaterial as PrismaCourseMaterial, Assessment as PrismaAssessment, StudentAssessmentScore as PrismaStudentAssessmentScore, Registration as PrismaRegistration, User as PrismaUser, ScheduledCourse as PrismaScheduledCourse, Course as PrismaCourse, Semester as PrismaSemester } from '@prisma/client';
import type { CourseMaterialUploadFormData, AssessmentFormData } from '@/lib/schemas';
import type { EnrichedRegistration } from './studentActions'; // Use the enriched type from studentActions

// Course Materials
export async function getCourseMaterialsForScheduledCourse(scheduledCourseId: number): Promise<PrismaCourseMaterial[]> {
  try {
    return await prisma.courseMaterial.findMany({
      where: { scheduled_course_id: scheduledCourseId },
      orderBy: { upload_timestamp: 'desc' },
    });
  } catch (error) {
    console.error(`Error fetching materials for scheduled course ${scheduledCourseId}:`, error);
    return [];
  }
}

export async function createCourseMaterial(data: CourseMaterialUploadFormData, scheduledCourseId: number, uploadedById: number): Promise<PrismaCourseMaterial> {
  try {
    const newMaterial = await prisma.courseMaterial.create({
      data: {
        scheduled_course_id: scheduledCourseId,
        title: data.title,
        description: data.description,
        material_type: data.material_type, // Prisma enum
        file_path: data.material_type === 'File' ? data.file_path : null,
        url: data.material_type === 'Link' ? data.url : null,
        uploaded_by_id: uploadedById,
      },
    });
    // TODO: Audit log
    return newMaterial;
  } catch (error) {
    console.error('Error creating course material:', error);
    throw new Error('Failed to add course material.');
  }
}

export async function deleteCourseMaterial(materialId: number): Promise<void> {
  try {
    await prisma.courseMaterial.delete({
      where: { material_id: materialId },
    });
    // TODO: Audit log
  } catch (error) {
    console.error(`Error deleting course material ${materialId}:`, error);
    throw new Error('Failed to delete course material.');
  }
}

// Assessments & Grades
export async function getAssessmentsForScheduledCourse(scheduledCourseId: number): Promise<PrismaAssessment[]> {
    try {
        return await prisma.assessment.findMany({
            where: { scheduled_course_id: scheduledCourseId },
            orderBy: { name: 'asc' }
        });
    } catch (error) {
        console.error(`Error fetching assessments for scheduled course ${scheduledCourseId}:`, error);
        return [];
    }
}

export async function createAssessment(data: AssessmentFormData, scheduledCourseId: number): Promise<PrismaAssessment> {
    try {
        const newAssessment = await prisma.assessment.create({
            data: {
                scheduled_course_id: scheduledCourseId,
                name: data.name,
                max_score: data.max_score,
                assessment_type: data.assessment_type || null,
            }
        });
        // TODO: Audit log
        return newAssessment;
    } catch (error) {
        console.error('Error creating assessment:', error);
        throw new Error('Failed to create assessment.');
    }
}

export async function deleteAssessment(assessmentId: number): Promise<void> {
    try {
        // First delete related student scores
        await prisma.studentAssessmentScore.deleteMany({
            where: { assessment_id: assessmentId }
        });
        // Then delete the assessment
        await prisma.assessment.delete({
            where: { assessment_id: assessmentId }
        });
        // TODO: Audit log
    } catch (error) {
        console.error(`Error deleting assessment ${assessmentId}:`, error);
        throw new Error('Failed to delete assessment.');
    }
}

export async function getRegistrationsWithScoresForScheduledCourse(scheduledCourseId: number): Promise<EnrichedRegistration[]> {
    try {
        const registrations = await prisma.registration.findMany({
            where: { scheduled_course_id: scheduledCourseId },
            include: {
                student: true, // User model for student details
                assessment_scores: {
                    include: {
                        assessment: true,
                    },
                },
                // No need to include scheduledCourse again here if we're already scoped to it
            },
            orderBy: { student: { last_name: 'asc' } }
        });
        return registrations as EnrichedRegistration[];
    } catch (error) {
        console.error(`Error fetching registrations with scores for scheduled course ${scheduledCourseId}:`, error);
        return [];
    }
}

export async function saveStudentScores(
  scoresToSave: { registrationId: number; assessmentId: number; score: number | null }[],
  finalGradesToUpdate: { registrationId: number; overallPercentage: number | null; finalLetterGrade: string | null }[]
): Promise<void> {
  try {
    await prisma.$transaction(async (tx) => {
      for (const scoreData of scoresToSave) {
        if (scoreData.score !== null) {
          await tx.studentAssessmentScore.upsert({
            where: { registration_id_assessment_id: { registration_id: scoreData.registrationId, assessment_id: scoreData.assessmentId } },
            update: { score_achieved: scoreData.score, graded_timestamp: new Date() },
            create: {
              registration_id: scoreData.registrationId,
              assessment_id: scoreData.assessmentId,
              score_achieved: scoreData.score,
              graded_timestamp: new Date(),
            },
          });
        } else { // If score is null, it means to clear it or mark as not graded
          await tx.studentAssessmentScore.updateMany({
            where: { registration_id: scoreData.registrationId, assessment_id: scoreData.assessmentId },
            data: { score_achieved: null } // Or handle deletion if that's preferred
          });
        }
      }

      for (const gradeData of finalGradesToUpdate) {
        await tx.registration.update({
          where: { registration_id: gradeData.registrationId },
          data: {
            overall_percentage: gradeData.overallPercentage,
            final_letter_grade: gradeData.finalLetterGrade,
            // grade_points would be calculated based on letter grade and course credits
            updated_at: new Date(),
          }
        });
      }
    });
    // TODO: Audit log for multiple grade updates
  } catch (error) {
    console.error('Error saving student scores and grades:', error);
    throw new Error('Failed to save grades.');
  }
}

export async function getTeacherSections(teacherId: number): Promise<{ id: string, name: string }[]> {
  try {
    const scheduledCourses = await prisma.scheduledCourse.findMany({
      where: { teacher_id: teacherId },
      include: {
        course: { select: { course_code: true, title: true } },
        semester: { select: { name: true } },
      },
      orderBy: [{ semester: { start_date: 'desc' } }, { course: { course_code: 'asc' } }],
    });

    return scheduledCourses.map(sc => ({
      id: String(sc.scheduled_course_id),
      name: `${sc.course?.course_code || 'N/A'} - ${sc.section_number} (${sc.semester?.name || 'N/A Semester'})`,
    }));
  } catch (error) {
    console.error('Error fetching teacher sections:', error);
    return [];
  }
}
