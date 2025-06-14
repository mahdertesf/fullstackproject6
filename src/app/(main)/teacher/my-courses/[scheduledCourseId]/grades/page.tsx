// src/app/(main)/teacher/my-courses/[scheduledCourseId]/grades/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback, startTransition } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { useAuthStore } from '@/store/authStore';
import type { ScheduledCourse as PrismaScheduledCourse, Course as PrismaCourse, Semester as PrismaSemester, UserProfile as AuthUserProfile, Registration as PrismaRegistration, Assessment as PrismaAssessment, StudentAssessmentScore as PrismaStudentAssessmentScore, User as PrismaUser } from '@prisma/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldAlert, PlusCircle, Edit, Trash2, Save, BookCopy, ListChecks, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import AddAssessmentForm from '@/components/grades/AddAssessmentForm';
import { type AssessmentFormData } from '@/lib/schemas';
import { Badge } from '@/components/ui/badge';
import { getScheduledCourseById, type EnrichedScheduledCourse as ServerEnrichedScheduledCourse } from '@/actions/scheduledCourseActions';
import { getAssessmentsForScheduledCourse, createAssessment, deleteAssessment, getRegistrationsWithScoresForScheduledCourse, saveStudentScores } from '@/actions/teacherActions';
import { gradePointMapping } from '@/types'; // Use from types
import { calculateCGPA, calculateSGPA, getGradePointForLetter } from '@/lib/gpaUtils'; // GPA utilities

type FullEnrichedRegistration = PrismaRegistration & {
    student: PrismaUser | null;
    assessment_scores: (PrismaStudentAssessmentScore & { assessment: PrismaAssessment | null })[];
};

const calculateLetterGrade = (percentage: number | null | undefined): string => {
  if (percentage === null || percentage === undefined) return 'N/A';
  if (percentage >= 90) return 'A';
  if (percentage >= 85) return 'A-';
  if (percentage >= 80) return 'B+';
  if (percentage >= 75) return 'B';
  if (percentage >= 70) return 'B-';
  if (percentage >= 65) return 'C+';
  if (percentage >= 60) return 'C';
  if (percentage >= 55) return 'C-';
  if (percentage >= 50) return 'D';
  return 'F';
};


export default function TeacherManageGradesPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  
  const scheduledCourseId = params.scheduledCourseId ? parseInt(params.scheduledCourseId as string) : null;

  const [scheduledCourse, setScheduledCourse] = useState<ServerEnrichedScheduledCourse | null>(null);
  const [assessments, setAssessments] = useState<PrismaAssessment[]>([]);
  const [registeredStudents, setRegisteredStudents] = useState<FullEnrichedRegistration[]>([]);
  const [studentScores, setStudentScores] = useState<Record<number, Record<number, string>>>({}); 
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAddAssessmentDialogOpen, setIsAddAssessmentDialogOpen] = useState(false);
  const [isSubmittingAssessment, setIsSubmittingAssessment] = useState(false);
  const [isSavingGrades, setIsSavingGrades] = useState(false);

  const fetchData = async () => {
    if (!scheduledCourseId || !user) return;
    setIsLoading(true);
    try {
      const [scData, assessmentsData, studentsData] = await Promise.all([
        getScheduledCourseById(scheduledCourseId),
        getAssessmentsForScheduledCourse(scheduledCourseId),
        getRegistrationsWithScoresForScheduledCourse(scheduledCourseId)
      ]);

      if (scData && scData.teacher_id === user.user_id) {
        setScheduledCourse(scData);
        setAssessments(assessmentsData);
        setRegisteredStudents(studentsData as FullEnrichedRegistration[]); // Cast assuming server returns enriched type
        
        const initialScores: Record<number, Record<number, string>> = {};
        studentsData.forEach(reg => {
          initialScores[reg.registration_id] = {};
          assessmentsData.forEach(ass => {
            const scoreEntry = reg.assessment_scores.find(sas => sas.assessment_id === ass.assessment_id);
            initialScores[reg.registration_id][ass.assessment_id] = scoreEntry?.score_achieved?.toString() || '';
          });
        });
        setStudentScores(initialScores);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Course not found or not assigned.' });
        router.push('/teacher/my-courses');
      }
    } catch (error) { toast({ variant: 'destructive', title: 'Error', description: 'Failed to load gradebook data.' });
    } finally { setIsLoading(false); }
  };

  useEffect(() => {
    if (user && user.role !== 'Teacher') router.replace('/dashboard');
    else if (scheduledCourseId && user) startTransition(() => { fetchData(); });
  }, [user, scheduledCourseId, router]);

  const handleAddAssessmentSubmit = async (data: AssessmentFormData) => {
    if (!scheduledCourseId) return;
    setIsSubmittingAssessment(true);
    try {
      await createAssessment(data, scheduledCourseId);
      toast({ title: 'Assessment Added' });
      setIsAddAssessmentDialogOpen(false);
      startTransition(() => { fetchData(); });
    } catch (error) { toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    } finally { setIsSubmittingAssessment(false); }
  };
  const handleDeleteAssessmentSubmit = async (assessmentId: number) => {
    if (!confirm('Are you sure? This will delete the assessment and all associated scores.')) return;
    setIsSubmittingAssessment(true); // Reuse state
    try {
      await deleteAssessment(assessmentId);
      toast({ title: 'Assessment Deleted' });
      startTransition(() => { fetchData(); });
    } catch (error) { toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    } finally { setIsSubmittingAssessment(false); }
  };


  const handleScoreChange = (registrationId: number, assessmentId: number, value: string) => {
    setStudentScores(prev => ({ ...prev, [registrationId]: { ...prev[registrationId], [assessmentId]: value }}));
  };

  const calculateStudentGrades = useCallback((regId: number) => {
    let totalAchieved = 0; let totalMaxPossible = 0;
    assessments.forEach(assessment => {
      const scoreStr = studentScores[regId]?.[assessment.assessment_id] || '0';
      const scoreNum = parseFloat(scoreStr);
      if (!isNaN(scoreNum) && scoreNum >=0 && scoreNum <= assessment.max_score) totalAchieved += scoreNum;
      totalMaxPossible += assessment.max_score;
    });
    const overallPercentage = totalMaxPossible > 0 ? (totalAchieved / totalMaxPossible) * 100 : 0;
    const finalLetterGrade = calculateLetterGrade(overallPercentage);
    return { overallPercentage: parseFloat(overallPercentage.toFixed(2)), finalLetterGrade };
  }, [assessments, studentScores]);

  const handleSaveAllGrades = async () => {
    setIsSavingGrades(true);
    try {
      const scoresToUpdate = registeredStudents.flatMap(reg => 
        assessments.map(ass => ({
          registrationId: reg.registration_id,
          assessmentId: ass.assessment_id,
          score: studentScores[reg.registration_id]?.[ass.assessment_id] ? parseFloat(studentScores[reg.registration_id][ass.assessment_id]) : null
        }))
      );
      const finalGrades = registeredStudents.map(reg => {
        const { overallPercentage, finalLetterGrade } = calculateStudentGrades(reg.registration_id);
        return { registrationId: reg.registration_id, overallPercentage, finalLetterGrade };
      });
      await saveStudentScores(scoresToUpdate, finalGrades);
      toast({ title: 'Grades Saved Successfully' });
      startTransition(() => { fetchData(); }); // Re-fetch to confirm
    } catch (error) { toast({ variant: 'destructive', title: 'Error', description: (error as Error).message || 'Failed to save grades.' });
    } finally { setIsSavingGrades(false); }
  };
  
  if (!user || user.role !== 'Teacher') {
    return <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center"><ShieldAlert className="w-16 h-16 text-destructive mb-4" /><h2 className="text-2xl font-bold mb-2">Access Denied</h2></div>;
  }
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-8 w-8 animate-spin"/><span className="ml-2">Loading Gradebook...</span></div>;
  }
  if (!scheduledCourse) return <PageHeader title="Course Not Found" icon={ListChecks} />;

  return (
    <div className="space-y-6">
      <PageHeader title={`Gradebook: ${scheduledCourse.course?.title || 'Course'}`} description={`${scheduledCourse.course?.course_code} - Sec ${scheduledCourse.section_number} (${scheduledCourse.semester?.name})`} icon={ListChecks} action={<Button asChild variant="outline"><Link href={`/teacher/my-courses/${scheduledCourseId}`}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link></Button>}/>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><BookCopy className="h-5 w-5 text-primary"/>Assessments</CardTitle>
          <Dialog open={isAddAssessmentDialogOpen} onOpenChange={setIsAddAssessmentDialogOpen}>
            <DialogTrigger asChild><Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Add Assessment</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Add New Assessment</DialogTitle></DialogHeader><AddAssessmentForm onSubmit={handleAddAssessmentSubmit} onCancel={() => setIsAddAssessmentDialogOpen(false)} isSubmitting={isSubmittingAssessment}/></DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {assessments.length > 0 ? (<Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Max Score</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>{assessments.map(ass => (<TableRow key={ass.assessment_id}><TableCell>{ass.name}</TableCell><TableCell>{ass.max_score}</TableCell><TableCell>{ass.assessment_type || 'N/A'}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDeleteAssessmentSubmit(ass.assessment_id)} title="Delete" disabled={isSubmittingAssessment}><Trash2 className="h-4 w-4 text-destructive"/></Button></TableCell></TableRow>))}</TableBody></Table>
          ) : (<p className="text-muted-foreground text-center py-4">No assessments defined yet.</p>)}
        </CardContent>
      </Card>

      {assessments.length > 0 && registeredStudents.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Student Grades</CardTitle><CardDescription>Enter scores. Grades are calculated automatically.</CardDescription></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead className="min-w-[150px]">Student</TableHead><TableHead className="min-w-[100px]">ID</TableHead>
                {assessments.map(ass => (<TableHead key={ass.assessment_id} className="min-w-[120px] text-center">{ass.name} <span className="text-xs text-muted-foreground">(/{ass.max_score})</span></TableHead>))}
                <TableHead className="min-w-[100px] text-center">Total %</TableHead><TableHead className="min-w-[80px] text-center">Grade</TableHead></TableRow></TableHeader>
              <TableBody>{registeredStudents.map(reg => {
                  const { overallPercentage, finalLetterGrade } = calculateStudentGrades(reg.registration_id);
                  return (<TableRow key={reg.registration_id}>
                    <TableCell>{reg.student?.first_name} {reg.student?.last_name}</TableCell><TableCell>{reg.student?.username}</TableCell>
                    {assessments.map(ass => (<TableCell key={ass.assessment_id}><Input type="number" min="0" max={ass.max_score} value={studentScores[reg.registration_id]?.[ass.assessment_id] || ''} onChange={e => handleScoreChange(reg.registration_id, ass.assessment_id, e.target.value)} className="max-w-[80px] text-center mx-auto" placeholder="-"/> </TableCell>))}
                    <TableCell className="text-center font-medium">{overallPercentage.toFixed(2)}%</TableCell><TableCell className="text-center font-bold"><Badge variant={finalLetterGrade === 'F' ? 'destructive' : 'secondary'}>{finalLetterGrade}</Badge></TableCell></TableRow>);
                })}</TableBody></Table>
          </CardContent>
          <CardFooter><Button onClick={handleSaveAllGrades} disabled={isSavingGrades} className="ml-auto">{isSavingGrades ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save All Grades</Button></CardFooter>
        </Card>
      )}
       {assessments.length > 0 && registeredStudents.length === 0 && (<Card><CardContent><p className="text-muted-foreground text-center py-4">No students registered.</p></CardContent></Card>)}
    </div>
  );
}
