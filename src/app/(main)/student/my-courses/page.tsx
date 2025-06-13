// src/app/(main)/student/my-courses/page.tsx

'use client';

import { useEffect, useState, useMemo } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { 
  mockRegistrations, 
  mockCourses, 
  mockSemesters, 
  mockCourseMaterials,
  mockScheduledCourses,
  mockUserProfiles
} from '@/lib/data';
import type { 
  UserProfile, 
  Semester, 
  Course,
  CourseMaterial,
  Registration,
  ScheduledCourse
} from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Layers, ShieldAlert, BookOpenText, FileText, Link as LinkIcon, Download, Wand2, MoreVertical, HelpCircle, MessageSquareQuote, Combine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface StudentCourseWithMaterials {
  registration: Registration;
  scheduledCourse?: ScheduledCourse;
  courseDetails?: Course;
  semesterDetails?: Semester;
  materials: CourseMaterial[];
  teacherDetails?: UserProfile;
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
      const studentUser = user as UserProfile;
      const studentRegistrations = mockRegistrations.filter(reg => reg.student_id === studentUser.user_id);

      const coursesWithDetails: StudentCourseWithMaterials[] = studentRegistrations.map(reg => {
        const scheduledCourse = mockScheduledCourses.find(sc => sc.scheduled_course_id === reg.scheduled_course_id);
        const courseDetails = scheduledCourse ? mockCourses.find(c => c.course_id === scheduledCourse.course_id) : undefined;
        const semesterDetails = scheduledCourse ? mockSemesters.find(s => s.semester_id === scheduledCourse.semester_id) : undefined;
        const teacherDetails = scheduledCourse ? mockUserProfiles.find(u => u.user_id === scheduledCourse.teacher_id) : undefined;
        
        const materials = scheduledCourse 
          ? mockCourseMaterials.filter(cm => cm.scheduled_course_id === scheduledCourse.scheduled_course_id) 
          : [];

        return {
          registration: reg,
          scheduledCourse,
          courseDetails,
          semesterDetails,
          materials,
          teacherDetails,
        };
      }).filter(item => item.courseDetails && item.semesterDetails); // Ensure core details are present

      const semesterMap = new Map<number, StudentCourseWithMaterials[]>();
      coursesWithDetails.forEach(courseItem => {
        if (courseItem.semesterDetails) {
          const semesterId = courseItem.semesterDetails.semester_id;
          if (!semesterMap.has(semesterId)) {
            semesterMap.set(semesterId, []);
          }
          semesterMap.get(semesterId)?.push(courseItem);
        }
      });
      
      const grouped: SemesterGroupedCourses[] = Array.from(semesterMap.entries()).map(([semesterId, courses]) => {
        const semester = mockSemesters.find(s => s.semester_id === semesterId)!;
        return { semester, courses };
      }).sort((a, b) => new Date(b.semester.start_date).getTime() - new Date(a.semester.start_date).getTime()); // Sort by most recent semester first

      setGroupedCoursesBySemester(grouped);
      setIsLoading(false);
    } else if (!user) {
      router.replace('/login');
    } else if (user && user.role !== 'Student') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const handleAiAction = (action: string, materialTitle: string) => {
    toast({
      title: `AI Action (Mock): ${action}`,
      description: `Performing "${action}" on material "${materialTitle}". This would call an AI flow.`,
    });
  };

  if (isLoading) {
    return <PageHeader title="Loading My Courses..." icon={Layers} />;
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
        title="My Courses & Materials"
        description="Access materials for your registered courses."
        icon={Layers}
      />

      {groupedCoursesBySemester.length > 0 ? (
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
                          <Link href={`/courses/${courseItem.courseDetails?.course_id}`} className="hover:underline text-primary">
                            {courseItem.courseDetails?.course_code} - {courseItem.courseDetails?.title}
                          </Link>
                        </CardTitle>
                        <CardDescription>
                          Instructor: {courseItem.teacherDetails?.first_name} {courseItem.teacherDetails?.last_name || 'N/A'}
                           | Section: {courseItem.scheduledCourse?.section_number}
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
                                      <Button variant="outline" size="sm" onClick={() => toast({title: "Mock Download", description: `Would download ${material.file_path}`})}>
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
                                        <DropdownMenuItem onClick={() => handleAiAction('Summarize', material.title)}>
                                          <Combine className="mr-2 h-4 w-4" /> Summarize
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleAiAction('Generate Questions', material.title)}>
                                          <MessageSquareQuote className="mr-2 h-4 w-4" /> Generate Questions
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleAiAction('Explain Details', material.title)}>
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
  );
}
