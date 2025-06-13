
'use client';

import { useEffect, useState, useMemo } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { 
  mockRegistrations, 
  mockCourses, 
  mockSemesters, 
  mockAssessments, 
  mockStudentAssessmentScores, 
  mockCourseMaterials, 
  gradePointMapping,
  mockScheduledCourses,
  mockUserProfiles
} from '@/lib/data';
import type { 
  EnrichedRegistration, 
  UserProfile, 
  Semester, 
  Course,
  Assessment,
  StudentAssessmentScore,
  CourseMaterial
} from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, BookOpenText, FileText, Link as LinkIcon, Download, ShieldAlert, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { calculateCGPA, calculateSGPA, getGradePointForLetter } from '@/lib/gpaUtils';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';


interface SemesterGroup {
  semester: Semester;
  registrations: EnrichedRegistration[];
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
      const studentUser = user as UserProfile;
      const studentRegistrations = mockRegistrations.filter(reg => reg.student_id === studentUser.user_id);

      const enrichedRegs: EnrichedRegistration[] = studentRegistrations.map(reg => {
        const scheduledCourse = mockScheduledCourses.find(sc => sc.scheduled_course_id === reg.scheduled_course_id);
        const courseDetails = scheduledCourse ? mockCourses.find(c => c.course_id === scheduledCourse.course_id) : undefined;
        const semesterDetails = scheduledCourse ? mockSemesters.find(s => s.semester_id === scheduledCourse.semester_id) : undefined;
        
        const courseAssessments = scheduledCourse 
          ? mockAssessments.filter(a => a.scheduled_course_id === scheduledCourse.scheduled_course_id)
          : [];

        const assessmentsWithScores = courseAssessments.map(assessment => {
          const studentScore = mockStudentAssessmentScores.find(
            sas => sas.registration_id === reg.registration_id && sas.assessment_id === assessment.assessment_id
          );
          return { ...assessment, studentScore };
        });
        
        const materials = scheduledCourse 
          ? mockCourseMaterials.filter(cm => cm.scheduled_course_id === scheduledCourse.scheduled_course_id) 
          : [];

        return {
          ...reg,
          studentProfile: studentUser,
          scheduledCourse,
          courseDetails,
          semesterDetails,
          assessments: assessmentsWithScores,
          materials,
        };
      });

      const semestersMap = new Map<number, EnrichedRegistration[]>();
      enrichedRegs.forEach(reg => {
        if (reg.semesterDetails) {
          const semesterId = reg.semesterDetails.semester_id;
          if (!semestersMap.has(semesterId)) {
            semestersMap.set(semesterId, []);
          }
          semestersMap.get(semesterId)?.push(reg);
        }
      });
      
      const semesterGroups: SemesterGroup[] = Array.from(semestersMap.entries()).map(([semesterId, regs]) => {
        const semester = mockSemesters.find(s => s.semester_id === semesterId)!;
        const { sgpa, totalCreditsAttempted, totalQualityPoints } = calculateSGPA(regs, mockCourses, gradePointMapping);
        return { semester, registrations: regs, sgpa, totalCreditsAttempted, totalQualityPoints };
      }).sort((a, b) => new Date(b.semester.start_date).getTime() - new Date(a.semester.start_date).getTime()); // Sort by most recent semester first

      setGroupedSemesters(semesterGroups);
      
      const cgpaResult = calculateCGPA(enrichedRegs, mockCourses, gradePointMapping);
      setCgpa(cgpaResult.cgpa);
      setTotalOverallCredits(cgpaResult.totalCreditsAttempted);
      setTotalOverallQualityPoints(cgpaResult.totalQualityPoints);

      setIsLoading(false);
    } else if (!user) {
      router.replace('/login');
    } else if (user.role !== 'Student') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  if (isLoading) {
    return <PageHeader title="Loading Transcript..." icon={GraduationCap} />;
  }
  
  if (!user || user.role !== 'Student') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">This page is for students only.</p>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <PageHeader 
        title="My Academic Transcript"
        description={`View your grades, GPA, and course history, ${user.first_name || user.username}.`}
        icon={GraduationCap}
      />

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary">Academic Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Cumulative GPA (CGPA)</p>
            <p className="text-3xl font-bold text-accent">{cgpa.toFixed(2)}</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Credits Attempted</p>
            <p className="text-3xl font-bold">{totalOverallCredits}</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Quality Points</p>
            <p className="text-3xl font-bold">{totalOverallQualityPoints.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      {groupedSemesters.length > 0 ? (
        <Accordion type="multiple" className="w-full space-y-4">
          {groupedSemesters.map(({ semester, registrations, sgpa, totalCreditsAttempted: semesterCredits }) => (
            <AccordionItem key={semester.semester_id} value={`semester-${semester.semester_id}`} className="border bg-card rounded-lg shadow-sm">
              <AccordionTrigger className="p-4 hover:no-underline">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full">
                  <div className="flex items-center gap-3">
                     <Activity className="h-6 w-6 text-primary" />
                    <div>
                        <h3 className="text-xl font-headline text-left">{semester.name}</h3>
                        <p className="text-sm text-muted-foreground text-left">{semester.academic_year} - {semester.term}</p>
                    </div>
                  </div>
                  <div className="mt-2 md:mt-0 text-left md:text-right">
                    <p className="text-sm text-muted-foreground">SGPA: <span className="font-bold text-accent">{sgpa.toFixed(2)}</span></p>
                    <p className="text-xs text-muted-foreground">Credits: {semesterCredits}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-0">
                <div className="divide-y border-t">
                  {registrations.map(reg => (
                    <Card key={reg.registration_id} className="m-2 shadow-none border-0 rounded-none">
                      <CardHeader className="p-3">
                        <CardTitle className="text-md font-semibold">{reg.courseDetails?.course_code} - {reg.courseDetails?.title}</CardTitle>
                        <CardDescription>
                          Credits: {reg.courseDetails?.credits} | 
                          Status: <Badge variant={reg.status === 'Completed' ? 'default' : 'secondary'} className={reg.status === 'Registered' ? 'bg-blue-100 text-blue-700' : ''}>{reg.status}</Badge>
                          {reg.status === 'Completed' && reg.final_letter_grade && (
                            <> | Grade: <Badge variant={reg.final_letter_grade === 'F' ? 'destructive' : 'default'} className="font-bold">{reg.final_letter_grade} ({getGradePointForLetter(reg.final_letter_grade, gradePointMapping).toFixed(1)})</Badge></>
                          )}
                        </CardDescription>
                      </CardHeader>
                      { (reg.assessments && reg.assessments.length > 0) || (reg.materials && reg.materials.length > 0) ? (
                        <CardContent className="p-3">
                          <Accordion type="single" collapsible className="w-full text-sm">
                            {reg.assessments && reg.assessments.length > 0 && (
                              <AccordionItem value="assessments">
                                <AccordionTrigger className="py-2 text-muted-foreground hover:text-primary">View Assessments</AccordionTrigger>
                                <AccordionContent className="pt-2">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead className="text-right">Score</TableHead>
                                        <TableHead className="text-right">Max Score</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {reg.assessments.map(asm => (
                                        <TableRow key={asm.assessment_id}>
                                          <TableCell>{asm.name}</TableCell>
                                          <TableCell className="text-right">{asm.studentScore?.score_achieved ?? '-'}</TableCell>
                                          <TableCell className="text-right">{asm.max_score}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </AccordionContent>
                              </AccordionItem>
                            )}
                            {reg.materials && reg.materials.length > 0 && (
                              <AccordionItem value="materials">
                                <AccordionTrigger className="py-2 text-muted-foreground hover:text-primary">Course Materials</AccordionTrigger>
                                <AccordionContent className="pt-2 space-y-2">
                                  {reg.materials.map(material => (
                                    <div key={material.material_id} className="p-2 border rounded-md flex justify-between items-center bg-background/50">
                                      <div>
                                        <p className="font-medium text-foreground flex items-center gap-1">
                                          {material.material_type === 'File' ? <FileText className="h-4 w-4"/> : <LinkIcon className="h-4 w-4"/>}
                                          {material.title}
                                        </p>
                                        {material.description && <p className="text-xs text-muted-foreground">{material.description}</p>}
                                      </div>
                                      {material.material_type === 'File' ? (
                                        <Button variant="outline" size="sm" onClick={() => toast({title: "Mock Download", description: `Would download ${material.file_path}`})}>
                                          <Download className="h-4 w-4"/>
                                        </Button>
                                      ) : (
                                        <Button variant="outline" size="sm" asChild>
                                          <a href={material.url || '#'} target="_blank" rel="noopener noreferrer"><LinkIcon className="h-4 w-4"/></a>
                                        </Button>
                                      )}
                                      {/* AI Action Buttons/Dropdown will go here in Phase 2 */}
                                    </div>
                                  ))}
                                </AccordionContent>
                              </AccordionItem>
                            )}
                          </Accordion>
                        </CardContent>
                      ): (
                        <CardContent className="p-3 text-sm text-muted-foreground">No assessments or materials available for this course section.</CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">No academic records found.</p>
            <p className="text-sm text-muted-foreground mt-2">Your grades and course history will appear here once available.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
