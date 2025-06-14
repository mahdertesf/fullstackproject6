// src/app/(main)/student/transcript/page.tsx
'use client';

import { useEffect, useState, useMemo, startTransition } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import type { UserProfile as AuthUserProfile } from '@/types'; // Auth Store Type
import type { Semester, Course as PrismaCourse, Registration as PrismaRegistration, StudentAssessmentScore, Assessment as PrismaAssessment, ScheduledCourse as PrismaScheduledCourse, User as PrismaUser, Room, Building } from '@prisma/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Activity, FileText, Link as LinkIcon, Download, ShieldAlert, Loader2 } from 'lucide-react';
import { calculateCGPA, calculateSGPA, getGradePointForLetter } from '@/lib/gpaUtils';
import { getStudentRegistrations, type EnrichedRegistration as ServerEnrichedRegistration } from '@/actions/studentActions'; // Use server action type
import { gradePointMapping } from '@/types'; // Use from types
import { useToast } from '@/hooks/use-toast';

interface SemesterGroup {
  semester: Semester;
  registrations: ServerEnrichedRegistration[]; // Use server's enriched type
  sgpa: number;
  totalCreditsAttempted: number;
  totalQualityPoints: number;
}

export default function StudentTranscriptPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [groupedSemesters, setGroupedSemesters] = useState<SemesterGroup[]>([]);
  const [cgpa, setCgpa] = useState(0);
  const [totalOverallCredits, setTotalOverallCredits] = useState(0);
  const [totalOverallQualityPoints, setTotalOverallQualityPoints] = useState(0);

  useEffect(() => {
    if (user && user.role === 'Student') {
      const fetchTranscriptData = async () => {
        setIsLoading(true);
        try {
          const studentRegs = await getStudentRegistrations(user.user_id);
          
          const semestersMap = new Map<number, ServerEnrichedRegistration[]>();
          studentRegs.forEach(reg => {
            if (reg.scheduledCourse?.semester) {
              const semesterId = reg.scheduledCourse.semester.semester_id;
              if (!semestersMap.has(semesterId)) {
                semestersMap.set(semesterId, []);
              }
              semestersMap.get(semesterId)?.push(reg);
            }
          });
          
          const semesterGroups: SemesterGroup[] = Array.from(semestersMap.entries()).map(([semesterId, regs]) => {
            const semester = regs[0]?.scheduledCourse?.semester!; // Assuming semester exists
            const { sgpa, totalCreditsAttempted, totalQualityPoints } = calculateSGPA(
              regs, 
              regs.map(r => r.scheduledCourse?.course).filter(Boolean) as PrismaCourse[], // Pass actual course data
              gradePointMapping
            );
            return { semester, registrations: regs, sgpa, totalCreditsAttempted, totalQualityPoints };
          }).filter(sg => sg.semester)
          .sort((a, b) => new Date(b.semester.start_date).getTime() - new Date(a.semester.start_date).getTime());

          setGroupedSemesters(semesterGroups);
          
          const cgpaResult = calculateCGPA(studentRegs, studentRegs.map(r => r.scheduledCourse?.course).filter(Boolean) as PrismaCourse[], gradePointMapping);
          setCgpa(cgpaResult.cgpa);
          setTotalOverallCredits(cgpaResult.totalCreditsAttempted);
          setTotalOverallQualityPoints(cgpaResult.totalQualityPoints);

        } catch (error) {
          toast({ variant: "destructive", title: "Error", description: "Failed to load transcript data."});
        } finally {
          setIsLoading(false);
        }
      };
      startTransition(() => { fetchTranscriptData(); });
    } else if (!user) {
      router.replace('/login');
    } else if (user?.role !== 'Student') {
      router.replace('/dashboard');
    }
  }, [user, router, toast]);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-8 w-8 animate-spin"/><span className="ml-2">Loading Transcript...</span></div>;
  }
  
  if (!user || user.role !== 'Student') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" /><h2 className="text-2xl font-bold mb-2">Access Denied</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Academic Transcript" description={`View your grades, GPA, and course history, ${user.first_name || user.username}.`} icon={GraduationCap}/>
      <Card className="shadow-md">
        <CardHeader><CardTitle className="text-2xl font-headline text-primary">Academic Summary</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-muted/50 rounded-lg"><p className="text-sm text-muted-foreground">CGPA</p><p className="text-3xl font-bold text-accent">{cgpa.toFixed(2)}</p></div>
          <div className="p-4 bg-muted/50 rounded-lg"><p className="text-sm text-muted-foreground">Total Credits</p><p className="text-3xl font-bold">{totalOverallCredits}</p></div>
          <div className="p-4 bg-muted/50 rounded-lg"><p className="text-sm text-muted-foreground">Total Quality Points</p><p className="text-3xl font-bold">{totalOverallQualityPoints.toFixed(2)}</p></div>
        </CardContent>
      </Card>

      {groupedSemesters.length > 0 ? (
        <Accordion type="multiple" className="w-full space-y-4" defaultValue={groupedSemesters.map(sg => `semester-${sg.semester.semester_id}`)}>
          {groupedSemesters.map(({ semester, registrations, sgpa, totalCreditsAttempted: semesterCredits }) => (
            <AccordionItem key={semester.semester_id} value={`semester-${semester.semester_id}`} className="border bg-card rounded-lg shadow-sm">
              <AccordionTrigger className="p-4 hover:no-underline">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full">
                  <div className="flex items-center gap-3"><Activity className="h-6 w-6 text-primary" /><div><h3 className="text-xl font-headline text-left">{semester.name}</h3><p className="text-sm text-muted-foreground text-left">{semester.academic_year} - {semester.term}</p></div></div>
                  <div className="mt-2 md:mt-0 text-left md:text-right"><p className="text-sm text-muted-foreground">SGPA: <span className="font-bold text-accent">{sgpa.toFixed(2)}</span></p><p className="text-xs text-muted-foreground">Credits: {semesterCredits}</p></div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-0">
                <div className="divide-y border-t">
                  {registrations.map(reg => (
                    <Card key={reg.registration_id} className="m-2 shadow-none border-0 rounded-none">
                      <CardHeader className="p-3">
                        <CardTitle className="text-md font-semibold">{reg.scheduledCourse?.course?.course_code} - {reg.scheduledCourse?.course?.title}</CardTitle>
                        <CardDescription>
                          Credits: {reg.scheduledCourse?.course?.credits} | Status: <Badge variant={reg.status === 'Completed' ? 'default' : 'secondary'} className={reg.status === 'Registered' ? 'bg-blue-100 text-blue-700' : ''}>{reg.status}</Badge>
                          {reg.status === 'Completed' && reg.final_letter_grade && (<> | Grade: <Badge variant={reg.final_letter_grade === 'F' ? 'destructive' : 'default'} className="font-bold">{reg.final_letter_grade} ({getGradePointForLetter(reg.final_letter_grade, gradePointMapping).toFixed(1)})</Badge></>)}
                        </CardDescription>
                      </CardHeader>
                      {reg.assessment_scores && reg.assessment_scores.length > 0 && (
                        <CardContent className="p-3"><Accordion type="single" collapsible className="w-full text-sm">
                            <AccordionItem value="assessments">
                              <AccordionTrigger className="py-2 text-muted-foreground hover:text-primary">View Assessments</AccordionTrigger>
                              <AccordionContent className="pt-2">
                                <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="text-right">Score</TableHead><TableHead className="text-right">Max</TableHead></TableRow></TableHeader>
                                  <TableBody>{reg.assessment_scores.map(asmScore => (
                                    <TableRow key={asmScore.assessment_id}><TableCell>{asmScore.assessment?.name}</TableCell><TableCell className="text-right">{asmScore.score_achieved ?? '-'}</TableCell><TableCell className="text-right">{asmScore.assessment?.max_score}</TableCell></TableRow>
                                  ))}</TableBody></Table></AccordionContent></AccordionItem></Accordion></CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (<Card><CardContent className="py-10 text-center"><GraduationCap className="mx-auto h-12 w-12 text-muted-foreground mb-4" /><p className="text-lg text-muted-foreground">No academic records found.</p></CardContent></Card>)}
    </div>
  );
}
