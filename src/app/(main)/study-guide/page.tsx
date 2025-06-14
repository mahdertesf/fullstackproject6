// src/app/(main)/study-guide/page.tsx
'use client';

import PageHeader from '@/components/shared/PageHeader';
import StudyGuideGeneratorForm from '@/components/study-guide/StudyGuideGeneratorForm';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState, startTransition } from 'react';
import { Layers, ShieldAlert, BookOpenText, FileText, Link as LinkIcon, Download, Wand2, Combine, MessageSquareQuote, HelpCircle, Loader2 } from 'lucide-react';
import type { UserProfile as AuthUserProfile, Semester, Course as ClientCourse, CourseMaterial as ClientCourseMaterial, Registration as ClientRegistration, ScheduledCourse as ClientScheduledCourse, MaterialType as ClientMaterialType } from '@/types';
import type { CourseMaterial as PrismaCourseMaterial, User as PrismaUser, ScheduledCourse as PrismaScheduledCourse, Course as PrismaCourse } from '@prisma/client'; // Prisma types
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { processCourseMaterial, type AiStudyGuideMaterialInput } from '@/ai/flows/ai-study-guide-material-flow';
import ReactMarkdown from 'react-markdown';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getStudentRegistrations, type EnrichedRegistration as ServerEnrichedRegistration } from '@/actions/studentActions';
import { getCourseMaterialsForScheduledCourse } from '@/actions/teacherActions';


interface StudentCourseWithMaterials {
  registration: ServerEnrichedRegistration;
  materials: PrismaCourseMaterial[];
}

interface SemesterGroupedCourses {
  semester: Semester; // Assuming Semester type from @/types is compatible with PrismaSemester
  courses: StudentCourseWithMaterials[];
}

export default function StudyGuideAndMaterialsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);
  const [groupedCoursesBySemester, setGroupedCoursesBySemester] = useState<SemesterGroupedCourses[]>([]);

  const [isAiMaterialActionLoading, setIsAiMaterialActionLoading] = useState(false);
  const [aiMaterialActionResult, setAiMaterialActionResult] = useState<string | null>(null);
  const [aiMaterialActionTitle, setAiMaterialActionTitle] = useState<string | null>(null);
  const [isAiResultDialogOpen, setIsAiResultDialogOpen] = useState(false);


  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'Student') {
      router.replace('/dashboard'); 
      return;
    }

    const fetchStudentData = async () => {
      setIsLoadingMaterials(true);
      try {
        const studentRegs = await getStudentRegistrations(user.user_id);
        
        const coursesWithDetailsPromises = studentRegs.map(async (reg) => {
          let materials: PrismaCourseMaterial[] = [];
          if (reg.scheduledCourse?.scheduled_course_id) {
            materials = await getCourseMaterialsForScheduledCourse(reg.scheduledCourse.scheduled_course_id);
          }
          return { registration: reg, materials };
        });

        const coursesWithDetails = await Promise.all(coursesWithDetailsPromises);

        const semesterMap = new Map<number, StudentCourseWithMaterials[]>();
        coursesWithDetails.forEach(courseItem => {
          // Ensure scheduledCourse and semester exist before proceeding
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
          // Ensure semester is correctly typed
          const semester = courses[0]?.registration.scheduledCourse?.semester as Semester | undefined; 
          return { semester: semester!, courses }; // Non-null assertion if sure semester always exists, else handle undefined
        }).filter(sg => sg.semester) // Filter out any groups where semester might be missing
        .sort((a, b) => new Date(b.semester.start_date).getTime() - new Date(a.semester.start_date).getTime());

        setGroupedCoursesBySemester(grouped);
      } catch (error) {
        console.error("Failed to load student materials:", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to load your course materials."});
      } finally {
        setIsLoadingMaterials(false);
      }
    };
    
    startTransition(() => { fetchStudentData(); });

  }, [user, router, toast]);

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

  const handleAiMaterialAction = async (
    actionType: 'Summarize' | 'GenerateQuestions' | 'ExplainDetails',
    material: PrismaCourseMaterial, // Use Prisma type
    courseName: string | undefined
  ) => {
    if (!courseName) {
      toast({ variant: 'destructive', title: 'Error', description: 'Course name is missing for AI action.' });
      return;
    }

    setIsAiMaterialActionLoading(true);
    setAiMaterialActionResult(null);
    setIsAiResultDialogOpen(true);
    let dialogTitle = '';
    switch (actionType) {
        case 'Summarize': dialogTitle = `AI Summary for "${material.title}"`; break;
        case 'GenerateQuestions': dialogTitle = `AI Questions for "${material.title}"`; break;
        case 'ExplainDetails': dialogTitle = `AI Explanation for "${material.title}"`; break;
    }
    setAiMaterialActionTitle(dialogTitle);

    try {
      const input: AiStudyGuideMaterialInput = {
        materialTitle: material.title,
        materialDescription: material.description || undefined,
        courseName: courseName,
        actionType: actionType,
        materialType: material.material_type as ClientMaterialType, // Cast Prisma enum to client enum
        materialPathOrUrl: material.material_type === 'File' ? material.file_path || undefined : material.url || undefined,
      };
      const result = await processCourseMaterial(input);
      if (result && result.generatedText) {
        setAiMaterialActionResult(result.generatedText);
        toast({ title: 'AI Processing Complete', description: `${actionType} action finished for "${material.title}".` });
      } else {
        setAiMaterialActionResult('Sorry, I was unable to process this material with the information provided. The AI could not generate a response.');
        toast({ variant: 'destructive', title: `AI ${actionType} Failed`, description: 'Could not generate a meaningful response for the material.' });
      }
    } catch (error) {
      console.error(`AI ${actionType} failed:`, error);
      setAiMaterialActionResult('Sorry, an unexpected error occurred while processing this material. Please try again.');
      toast({ variant: 'destructive', title: `AI ${actionType} Failed`, description: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsAiMaterialActionLoading(false);
    }
  };


  if (!user || user.role !== 'Student') {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">This feature is available for students only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Materials & AI Study Guide" 
        description="Access course materials and get personalized AI help."
        icon={Layers}
      />
      
      <StudyGuideGeneratorForm /> {/* This form uses mockCourses for selection. To make it fully dynamic, it would need to fetch courses available to the student. */}

      <Separator className="my-8" />

      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground font-headline mb-4">My Course Materials</h2>
        {isLoadingMaterials ? (
           <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-2">Loading your course materials...</span></div>
        ) : groupedCoursesBySemester.length > 0 ? (
          <Accordion type="multiple" defaultValue={groupedCoursesBySemester.map(sg => `semester-${sg.semester.semester_id}`)} className="w-full space-y-4">
            {groupedCoursesBySemester.map(({ semester, courses }) => (
              <AccordionItem key={semester.semester_id} value={`semester-${semester.semester_id}`} className="border bg-card rounded-lg shadow-sm">
                <AccordionTrigger className="p-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <BookOpenText className="h-6 w-6 text-primary" />
                    <div>
                      <h3 className="text-xl font-headline text-left">{semester.name}</h3>
                      <p className="text-sm text-muted-foreground text-left">{semester.academic_year} - {semester.term}</p>
                    </div>
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
                                      {material.material_type === 'File' && (
                                        <Button variant="outline" size="sm" onClick={() => handleMockDownload(material.file_path, material.title)}>
                                          <Download className="h-4 w-4"/>
                                        </Button>
                                      )}
                                      {material.material_type === 'Link' && material.url && (
                                        <Button variant="outline" size="sm" asChild>
                                          <a href={material.url} target="_blank" rel="noopener noreferrer"><LinkIcon className="h-4 w-4"/></a>
                                        </Button>
                                      )}
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <Wand2 className="h-4 w-4 text-primary" />
                                            <span className="sr-only">AI Actions</span>
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => handleAiMaterialAction('Summarize', material, courseItem.registration.scheduledCourse?.course?.title)}>
                                            <Combine className="mr-2 h-4 w-4" /> Summarize
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleAiMaterialAction('GenerateQuestions', material, courseItem.registration.scheduledCourse?.course?.title)}>
                                            <MessageSquareQuote className="mr-2 h-4 w-4" /> Generate Questions
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleAiMaterialAction('ExplainDetails', material, courseItem.registration.scheduledCourse?.course?.title)}>
                                            <HelpCircle className="mr-2 h-4 w-4" /> Explain Details
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No materials uploaded for this course section yet.</p>
                          )}
                        </CardContent>
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
              <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">You are not currently registered for any courses or no materials are available.</p>
              <p className="text-sm text-muted-foreground mt-2">Your course materials will appear here once you are registered and your instructor uploads them.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isAiResultDialogOpen} onOpenChange={setIsAiResultDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-headline">{aiMaterialActionTitle || 'AI Result'}</DialogTitle>
            <DialogDescription>
              Here's what the AI generated based on your request for the material.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] mt-4 pr-5">
            {isAiMaterialActionLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">AI is thinking...</p>
              </div>
            ) : (
              aiMaterialActionResult && (
                <ReactMarkdown 
                  className="prose prose-sm dark:prose-invert max-w-none"
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-xl font-bold my-3 font-headline" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-lg font-semibold my-2 font-headline" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-md font-semibold my-1 font-headline" {...props} />,
                    p: ({node, ...props}) => <p className="mb-2 leading-relaxed" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2" {...props} />,
                    li: ({node, ...props}) => <li className="mb-1" {...props} />,
                    code: ({node, inline, className, children, ...props}) => {
                      const match = /language-(\w+)/.exec(className || '')
                      return !inline && match ? (
                        <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded my-2 overflow-x-auto"><code className={className} {...props}>{children}</code></pre>
                      ) : (
                        <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>{children}</code>
                      )
                    }
                  }}
                >
                  {aiMaterialActionResult}
                </ReactMarkdown>
              )
            )}
          </ScrollArea>
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setIsAiResultDialogOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
