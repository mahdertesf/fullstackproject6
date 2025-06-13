// src/app/(main)/teacher/my-courses/[scheduledCourseId]/grades/page.tsx

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { useAuthStore } from '@/store/authStore';
import { 
  mockScheduledCourses, 
  mockCourses, 
  mockSemesters, 
  mockRegistrations,
  mockUserProfiles,
  mockAssessments, // global mock
  mockStudentAssessmentScores // global mock
} from '@/lib/data';
import type { 
  ScheduledCourse, 
  Course, 
  Semester, 
  UserProfile, 
  Registration,
  Assessment,
  StudentAssessmentScore
} from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldAlert, PlusCircle, Edit, Trash2, Save, BookCopy, ListChecks } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import AddAssessmentForm from '@/components/grades/AddAssessmentForm';
import { type AssessmentFormData } from '@/lib/schemas';
import { Badge } from '@/components/ui/badge';

interface EnrichedScheduledCourse extends ScheduledCourse {
  courseDetails?: Course;
  semesterDetails?: Semester;
}

interface EnrichedRegistration extends Registration {
    studentProfile?: UserProfile;
}

// Helper function to calculate letter grade
const calculateLetterGrade = (percentage: number | null | undefined): string => {
  if (percentage === null || percentage === undefined) return 'N/A';
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
};

export default function TeacherManageGradesPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  
  const scheduledCourseId = params.scheduledCourseId ? parseInt(params.scheduledCourseId as string) : null;

  const [scheduledCourse, setScheduledCourse] = useState<EnrichedScheduledCourse | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [registeredStudents, setRegisteredStudents] = useState<EnrichedRegistration[]>([]);
  const [studentScores, setStudentScores] = useState<Record<number, Record<number, string>>>({}); // { [registrationId]: { [assessmentId]: "score_string" } }
  
  const [isAddAssessmentDialogOpen, setIsAddAssessmentDialogOpen] = useState(false);
  const [isSubmittingAssessment, setIsSubmittingAssessment] = useState(false);
  const [isSavingGrades, setIsSavingGrades] = useState(false);

  // Effect to ensure only teachers can access
  useEffect(() => {
    if (user && user.role !== 'Teacher') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  // Effect to load course details, assessments, and registered students
  useEffect(() => {
    if (scheduledCourseId && user && user.role === 'Teacher') {
      const foundScheduledCourse = mockScheduledCourses.find(sc => sc.scheduled_course_id === scheduledCourseId && sc.teacher_id === user.user_id);
      if (foundScheduledCourse) {
        const courseDetails = mockCourses.find(c => c.course_id === foundScheduledCourse.course_id);
        const semesterDetails = mockSemesters.find(s => s.semester_id === foundScheduledCourse.semester_id);
        setScheduledCourse({ ...foundScheduledCourse, courseDetails, semesterDetails });

        // Load assessments for this course
        const courseAssessments = mockAssessments.filter(a => a.scheduled_course_id === scheduledCourseId);
        setAssessments(courseAssessments);

        // Load registered students and their existing scores
        const students = mockRegistrations
          .filter(reg => reg.scheduled_course_id === scheduledCourseId)
          .map(reg => {
            const studentProfile = mockUserProfiles.find(up => up.user_id === reg.student_id);
            return { ...reg, studentProfile };
          });
        setRegisteredStudents(students);
        
        // Pre-fill scores
        const initialScores: Record<number, Record<number, string>> = {};
        students.forEach(reg => {
          initialScores[reg.registration_id] = {};
          courseAssessments.forEach(ass => {
            const scoreEntry = mockStudentAssessmentScores.find(sas => sas.registration_id === reg.registration_id && sas.assessment_id === ass.assessment_id);
            initialScores[reg.registration_id][ass.assessment_id] = scoreEntry?.score_achieved?.toString() || '';
          });
        });
        setStudentScores(initialScores);

      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Scheduled course not found or not assigned to you.' });
        router.push('/teacher/my-courses');
      }
    }
  }, [scheduledCourseId, user, router, toast]);

  const handleAddAssessmentSubmit = async (data: AssessmentFormData) => {
    if (!scheduledCourseId) return;
    setIsSubmittingAssessment(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call

    const newAssessmentId = Math.max(0, ...mockAssessments.map(a => a.assessment_id)) + 1;
    const newAssessment: Assessment = {
      assessment_id: newAssessmentId,
      scheduled_course_id: scheduledCourseId,
      name: data.name,
      max_score: data.max_score,
      assessment_type: data.assessment_type || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockAssessments.push(newAssessment); // Add to global mock for demo persistence
    setAssessments(prev => [...prev, newAssessment]);
    
    toast({ title: 'Assessment Added', description: `"${data.name}" has been added.` });
    setIsSubmittingAssessment(false);
    setIsAddAssessmentDialogOpen(false);
  };

  const handleScoreChange = (registrationId: number, assessmentId: number, value: string) => {
    setStudentScores(prev => ({
      ...prev,
      [registrationId]: {
        ...prev[registrationId],
        [assessmentId]: value,
      },
    }));
  };

  const calculateStudentGrades = useCallback((regId: number) => {
    let totalAchieved = 0;
    let totalMaxPossible = 0;
    
    assessments.forEach(assessment => {
      const scoreStr = studentScores[regId]?.[assessment.assessment_id] || '0';
      const scoreNum = parseFloat(scoreStr);
      if (!isNaN(scoreNum) && scoreNum >=0 && scoreNum <= assessment.max_score) {
        totalAchieved += scoreNum;
      }
      totalMaxPossible += assessment.max_score;
    });

    const overallPercentage = totalMaxPossible > 0 ? (totalAchieved / totalMaxPossible) * 100 : 0;
    const finalLetterGrade = calculateLetterGrade(overallPercentage);

    return {
      totalAchieved,
      totalMaxPossible,
      overallPercentage: parseFloat(overallPercentage.toFixed(2)),
      finalLetterGrade
    };
  }, [assessments, studentScores]);


  const handleSaveAllGrades = async () => {
    setIsSavingGrades(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API save

    registeredStudents.forEach(reg => {
        const { overallPercentage, finalLetterGrade } = calculateStudentGrades(reg.registration_id);
        
        // Update mockRegistrations
        const regIndex = mockRegistrations.findIndex(r => r.registration_id === reg.registration_id);
        if (regIndex > -1) {
            mockRegistrations[regIndex].overall_percentage = overallPercentage;
            mockRegistrations[regIndex].final_letter_grade = finalLetterGrade;
            mockRegistrations[regIndex].updated_at = new Date().toISOString();
        }

        // Update mockStudentAssessmentScores
        assessments.forEach(assessment => {
            const scoreStr = studentScores[reg.registration_id]?.[assessment.assessment_id];
            const scoreNum = scoreStr !== undefined && scoreStr !== '' ? parseFloat(scoreStr) : null;

            let scoreEntryIndex = mockStudentAssessmentScores.findIndex(
                sas => sas.registration_id === reg.registration_id && sas.assessment_id === assessment.assessment_id
            );

            if (scoreNum !== null) {
                if (scoreEntryIndex > -1) {
                    mockStudentAssessmentScores[scoreEntryIndex].score_achieved = scoreNum;
                    mockStudentAssessmentScores[scoreEntryIndex].graded_timestamp = new Date().toISOString();
                } else {
                    mockStudentAssessmentScores.push({
                        student_assessment_score_id: Math.max(0, ...mockStudentAssessmentScores.map(s => s.student_assessment_score_id)) + 1,
                        registration_id: reg.registration_id,
                        assessment_id: assessment.assessment_id,
                        score_achieved: scoreNum,
                        graded_timestamp: new Date().toISOString(),
                    });
                }
            } else if (scoreEntryIndex > -1) { // if score is null/empty and entry exists, remove or mark as null
                 mockStudentAssessmentScores[scoreEntryIndex].score_achieved = null;
                 mockStudentAssessmentScores[scoreEntryIndex].graded_timestamp = new Date().toISOString();
            }
        });
    });
    
    // Force re-render of student list to show updated grades if necessary (though local calculation should handle UI)
    setRegisteredStudents(prev => prev.map(rs => {
        const { overallPercentage, finalLetterGrade } = calculateStudentGrades(rs.registration_id);
        return {...rs, overall_percentage: overallPercentage, final_letter_grade: finalLetterGrade };
    }));


    toast({ title: 'Grades Saved (Mock)', description: 'All student grades and assessment scores have been updated.' });
    setIsSavingGrades(false);
  };
  
  const handleDeleteAssessment = (assessmentId: number) => {
    // Also remove related scores from mockStudentAssessmentScores
    const scoresToRemove = mockStudentAssessmentScores.filter(sas => sas.assessment_id === assessmentId);
    scoresToRemove.forEach(score => {
        const index = mockStudentAssessmentScores.indexOf(score);
        if (index > -1) mockStudentAssessmentScores.splice(index, 1);
    });
    // Remove from mockAssessments
    const assessmentIndex = mockAssessments.findIndex(a => a.assessment_id === assessmentId);
    if (assessmentIndex > -1) mockAssessments.splice(assessmentIndex, 1);

    setAssessments(prev => prev.filter(a => a.assessment_id !== assessmentId));
    // Clear scores for this assessment from local state
    setStudentScores(prevScores => {
        const newScores = { ...prevScores };
        Object.keys(newScores).forEach(regId => {
            const numRegId = parseInt(regId);
            if (newScores[numRegId]) {
                delete newScores[numRegId][assessmentId];
            }
        });
        return newScores;
    });
    toast({ title: "Assessment Deleted", description: "The assessment and associated scores have been removed." });
  };


  if (!user || user.role !== 'Teacher') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to access this page.</p>
      </div>
    );
  }

  if (!scheduledCourse) {
    return <PageHeader title="Loading Gradebook..." icon={ListChecks} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Gradebook: ${scheduledCourse.courseDetails?.title || 'Course'}`}
        description={`${scheduledCourse.courseDetails?.course_code} - Section ${scheduledCourse.section_number} (${scheduledCourse.semesterDetails?.name})`}
        icon={ListChecks}
        action={
          <Button asChild variant="outline">
            <Link href={`/teacher/my-courses/${scheduledCourseId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Course Details
            </Link>
          </Button>
        }
      />

      {/* Assessments Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><BookCopy className="h-5 w-5 text-primary"/>Assessments</CardTitle>
          <Dialog open={isAddAssessmentDialogOpen} onOpenChange={setIsAddAssessmentDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Add Assessment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Assessment</DialogTitle>
                <DialogDescription>Define an assessment for this course.</DialogDescription>
              </DialogHeader>
              <AddAssessmentForm 
                onSubmit={handleAddAssessmentSubmit} 
                onCancel={() => setIsAddAssessmentDialogOpen(false)}
                isSubmitting={isSubmittingAssessment}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {assessments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Max Score</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessments.map(assessment => (
                  <TableRow key={assessment.assessment_id}>
                    <TableCell>{assessment.name}</TableCell>
                    <TableCell>{assessment.max_score}</TableCell>
                    <TableCell>{assessment.assessment_type || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteAssessment(assessment.assessment_id)} title="Delete Assessment">
                        <Trash2 className="h-4 w-4 text-destructive"/>
                      </Button>
                       {/* Edit button can be added here later */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">No assessments defined yet. Click "Add Assessment" to start.</p>
          )}
        </CardContent>
      </Card>

      {/* Student Grades Table */}
      {assessments.length > 0 && registeredStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Student Grades</CardTitle>
            <CardDescription>Enter scores for each student and assessment. Grades are calculated automatically.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Student Name</TableHead>
                  <TableHead className="min-w-[100px]">Student ID</TableHead>
                  {assessments.map(assessment => (
                    <TableHead key={assessment.assessment_id} className="min-w-[120px] text-center">
                      {assessment.name} <span className="text-xs text-muted-foreground">(/{assessment.max_score})</span>
                    </TableHead>
                  ))}
                  <TableHead className="min-w-[100px] text-center">Total %</TableHead>
                  <TableHead className="min-w-[80px] text-center">Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registeredStudents.map(reg => {
                  const { overallPercentage, finalLetterGrade } = calculateStudentGrades(reg.registration_id);
                  return (
                    <TableRow key={reg.registration_id}>
                      <TableCell>{reg.studentProfile?.first_name} {reg.studentProfile?.last_name}</TableCell>
                      <TableCell>{reg.studentProfile?.username}</TableCell>
                      {assessments.map(assessment => (
                        <TableCell key={assessment.assessment_id}>
                          <Input
                            type="number"
                            min="0"
                            max={assessment.max_score}
                            value={studentScores[reg.registration_id]?.[assessment.assessment_id] || ''}
                            onChange={(e) => handleScoreChange(reg.registration_id, assessment.assessment_id, e.target.value)}
                            className="max-w-[80px] text-center mx-auto"
                            placeholder="-"
                          />
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-medium">{overallPercentage.toFixed(2)}%</TableCell>
                      <TableCell className="text-center font-bold">
                        <Badge variant={finalLetterGrade === 'F' ? 'destructive' : 'secondary'}>{finalLetterGrade}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveAllGrades} disabled={isSavingGrades} className="ml-auto">
              {isSavingGrades ? <Save className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save All Grades (Mock)
            </Button>
          </CardFooter>
        </Card>
      )}
       {assessments.length > 0 && registeredStudents.length === 0 && (
         <Card><CardContent><p className="text-muted-foreground text-center py-4">No students are currently registered for this section.</p></CardContent></Card>
       )}

    </div>
  );
}
