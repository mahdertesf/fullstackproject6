// src/app/(main)/student/my-courses/page.tsx
'use client';

import { useEffect, useState, useMemo, startTransition } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import type { UserProfile, Semester, Course, CourseMaterial, Registration, ScheduledCourse as PrismaScheduledCourse, User as PrismaUser, StudentAssessmentScore, Assessment } from '@prisma/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Layers, ShieldAlert, BookOpenText, FileText, Link as LinkIcon, Download, Wand2, MoreVertical, HelpCircle, MessageSquareQuote, Combine, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { getStudentRegistrations, type EnrichedRegistration as ServerEnrichedRegistration } from '@/actions/studentActions';
import { getCourseMaterialsForScheduledCourse } from '@/actions/teacherActions'; // Assuming teachers upload materials, students fetch them this way.

// Client-side enriched type for display
interface StudentCourseWithMaterials {
  registration: ServerEnrichedRegistration; // Use the server's enriched type
  materials: CourseMaterial[];
}

interface SemesterGroupedCourses {
  semester: Semester;
  courses: StudentCourseWithMaterials[];
}

export default function StudentMyCoursesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [groupedCoursesBySemester, setGroupedCoursesBySemester] = useState<SemesterGroupedCourses[]>([]);

  useEffect(() => {
    if (user && user.role === 'Student') {
      const fetchStudentData = async () => {
        setIsLoading(true);
        try {
          const studentRegs = await getStudentRegistrations(user.user_id);
          
          const coursesWithDetailsPromises = studentRegs.map(async (reg) => {
            let materials: CourseMaterial[] = [];
            if (reg.scheduledCourse?.scheduled_course_id) {
              materials = await getCourseMaterialsForScheduledCourse(reg.scheduledCourse.scheduled_course_id);
            }
            return { registration: reg, materials };
          });

          const coursesWithDetails = await Promise.all(coursesWithDetailsPromises);

          const semesterMap = new Map<number, StudentCourseWithMaterials[]>();
          coursesWithDetails.forEach(courseItem => {
            if (courseItem.registration.scheduledCourse?.semester) {
              const semesterId = courseItem.registration.scheduledCourse.semester.semester_id;
              if (!semesterMap.has(semesterId)) {
                semesterMap.set(semesterId, []);
              }
              semesterMap.get(semesterId)?.push(courseItem);
            }
          });
          
          const grouped: SemesterGroupedCourses[] = Array.from(semesterMap.entries()).map(([semesterId, courses]) => {
            // Find the semester details from the first course item, assuming all courses in this group share the same semester
            const semester = courses[0]?.registration.scheduledCourse?.semester; 
            return { semester: semester!, courses }; // Non-null assertion, ensure semester exists
          }).filter(sg => sg.semester) // Filter out any groups where semester might be missing
          .sort((a, b) => new Date(b.semester.start_date).getTime() - new Date(a.semester.start_date).getTime());

          setGroupedCoursesBySemester(grouped);
        } catch (error) {
          toast({ variant: "destructive", title: "Error", description: "Failed to load your courses and materials."});
        } finally {
          setIsLoading(false);
        }
      };
      startTransition(() => { fetchStudentData(); });
    } else if (!user) {
      router.replace('/login');
    } else if (user && user.role !== 'Student') {
      router.replace('/dashboard');
    }
  }, [user, router, toast]);

  const handleAiAction = (action: string, materialTitle: string) => {
    toast({
      title: `AI Action (Mock): ${action}`,
      description: `Performing "${action}" on material "${materialTitle}". This would call an AI flow.`,
    });
  };
  
  const handleMockDownload = (filePath: string | null | undefined, materialTitle: string) => {
    if (!filePath) {
      toast({ variant: 'destructive', title: 'Download Error', description: 'File path is missing.' });
      return;
    }
    toast({ title: 'Mock Download Initiated', description: `Simulating download for: ${materialTitle}` });
    const link = document.createElement('a');
    link.href = filePath; 
    link.setAttribute('download', materialTitle.replace(/[^a-zA-Z0-9_.-]/g, '_') + '.pdf'); 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-8 w-8 animate-spin"/><span className="ml-2">Loading My Courses...</span></div>;
  }
  
  if (!user || user.role !== 'Student') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Courses & Materials" description="Access materials for your registered courses." icon={Layers} />
      {groupedCoursesBySemester.length > 0 ? (
        <Accordion type="multiple" defaultValue={groupedCoursesBySemester.map(sg => `semester-${sg.semester.semester_id}`)} className="w-full space-y-4">
          {groupedCoursesBySemester.map(({ semester, courses }) => (
            <AccordionItem key={semester.semester_id} value={`semester-${semester.semester_id}`} className="border bg-card rounded-lg shadow-sm">
              <AccordionTrigger className="p-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <BookOpenText className="h-6 w-6 text-primary" />
                  <div><h3 className="text-xl font-headline text-left">{semester.name}</h3><p className="text-sm text-muted-foreground text-left">{semester.academic_year} - {semester.term}</p></div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-0">
                <div className="divide-y border-t">
                  {courses.map(courseItem => (
                    <Card key={courseItem.registration.registration_id} className="m-2 shadow-none border-0 rounded-none">
                      <CardHeader className="p-3">
                        <CardTitle className="text-md font-semibold">
                          <Link href={`/courses/${courseItem.registration.scheduledCourse?.course?.course_id}`} className="hover:underline text-primary">
                            {courseItem.registration.scheduledCourse?.course?.course_code} - {courseItem.registration.scheduledCourse?.course?.title}
                          </Link>
                        </CardTitle>
                        <CardDescription>
                          Instructor: {courseItem.registration.scheduledCourse?.teacher?.first_name} {courseItem.registration.scheduledCourse?.teacher?.last_name || 'N/A'}
                           | Section: {courseItem.registration.scheduledCourse?.section_number}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-3">
                        {courseItem.materials.length > 0 ? (
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium text-muted-foreground">Course Materials:</h4>
                            <ul className="space-y-2">
                              {courseItem.materials.map(material => (
                                <li key={material.material_id} className="flex items-center justify-between p-2 border rounded-md bg-background/50 hover:bg-muted/50 transition-colors">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {material.material_type === 'File' ? <FileText className="h-5 w-5 text-accent shrink-0" /> : <LinkIcon className="h-5 w-5 text-accent shrink-0" />}
                                    <div className="truncate">
                                      <p className="text-sm font-medium text-foreground truncate" title={material.title}>{material.title}</p>
                                      {material.description && <p className="text-xs text-muted-foreground truncate" title={material.description}>{material.description}</p>}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {material.material_type === 'File' && (<Button variant="outline" size="sm" onClick={() => handleMockDownload(material.file_path, material.title)}><Download className="h-4 w-4"/></Button>)}
                                    {material.material_type === 'Link' && material.url && (<Button variant="outline" size="sm" asChild><a href={material.url} target="_blank" rel="noopener noreferrer"><LinkIcon className="h-4 w-4"/></a></Button>)}
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Wand2 className="h-4 w-4 text-primary" /><span className="sr-only">AI</span></Button></DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleAiAction('Summarize', material.title)}><Combine className="mr-2 h-4 w-4" /> Summarize</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleAiAction('Generate Questions', material.title)}><MessageSquareQuote className="mr-2 h-4 w-4" /> Questions</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleAiAction('Explain Details', material.title)}><HelpCircle className="mr-2 h-4 w-4" /> Explain</DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (<p className="text-sm text-muted-foreground">No materials uploaded.</p>)}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <Card><CardContent className="py-10 text-center"><Layers className="mx-auto h-12 w-12 text-muted-foreground mb-4" /><p className="text-lg text-muted-foreground">No courses or materials available.</p></CardContent></Card>
      )}
    </div>
  );
}
