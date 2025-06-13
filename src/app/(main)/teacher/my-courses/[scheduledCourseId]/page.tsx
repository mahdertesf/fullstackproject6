
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { useAuthStore } from '@/store/authStore';
import { mockScheduledCourses, mockCourses, mockSemesters, mockTeachers, mockRooms, mockBuildings, mockCourseMaterials } from '@/lib/data';
import type { ScheduledCourse, Course, Semester, Teacher, Room, Building, UserProfile, CourseMaterial } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpenText, ShieldAlert, PlusCircle, Trash2, FileText, Link as LinkIcon, Download } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import UploadMaterialForm from '@/components/materials/UploadMaterialForm';
import { type CourseMaterialUploadFormData } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';


interface EnrichedScheduledCourse extends ScheduledCourse {
  courseDetails?: Course;
  semesterDetails?: Semester;
  teacherDetails?: Teacher;
  roomDetails?: Room & { buildingDetails?: Building };
}

export default function TeacherScheduledCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  
  const scheduledCourseId = params.scheduledCourseId ? parseInt(params.scheduledCourseId as string) : null;

  const [scheduledCourse, setScheduledCourse] = useState<EnrichedScheduledCourse | null>(null);
  const [courseMaterials, setCourseMaterials] = useState<CourseMaterial[]>([]);
  const [isAddMaterialDialogOpen, setIsAddMaterialDialogOpen] = useState(false);
  const [isSubmittingMaterial, setIsSubmittingMaterial] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'Teacher') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (scheduledCourseId) {
      const foundScheduledCourse = mockScheduledCourses.find(sc => sc.scheduled_course_id === scheduledCourseId);
      if (foundScheduledCourse) {
        const courseDetails = mockCourses.find(c => c.course_id === foundScheduledCourse.course_id);
        const semesterDetails = mockSemesters.find(s => s.semester_id === foundScheduledCourse.semester_id);
        const teacherDetails = mockTeachers.find(t => t.teacher_id === foundScheduledCourse.teacher_id);
        const roomDetails = foundScheduledCourse.room_id ? mockRooms.find(r => r.room_id === foundScheduledCourse.room_id) : undefined;
        const buildingDetails = roomDetails?.building_id ? mockBuildings.find(b => b.building_id === roomDetails.building_id) : undefined;

        setScheduledCourse({
          ...foundScheduledCourse,
          courseDetails,
          semesterDetails,
          teacherDetails,
          roomDetails: roomDetails ? { ...roomDetails, buildingDetails } : undefined,
        });

        // Load materials for this course
        const materials = mockCourseMaterials.filter(m => m.scheduled_course_id === scheduledCourseId);
        setCourseMaterials(materials);

      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Scheduled course not found.' });
        router.push('/teacher/my-courses');
      }
    }
  }, [scheduledCourseId, router, toast]);


  const handleAddMaterialSubmit = async (data: CourseMaterialUploadFormData) => {
    if (!scheduledCourse || !user) return;
    setIsSubmittingMaterial(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newMaterialId = Math.max(0, ...mockCourseMaterials.map(m => m.material_id)) + 1;
    const newMaterial: CourseMaterial = {
      material_id: newMaterialId,
      scheduled_course_id: scheduledCourse.scheduled_course_id,
      title: data.title,
      description: data.description || null,
      material_type: data.material_type,
      file_path: data.material_type === 'File' ? data.file_path : null,
      url: data.material_type === 'Link' ? data.url : null,
      uploaded_by: user.user_id, // Assuming teacher_id is user_id for mock
      upload_timestamp: new Date().toISOString(),
    };

    mockCourseMaterials.push(newMaterial); // Add to global mock data for persistence in demo
    setCourseMaterials(prev => [...prev, newMaterial]);
    
    toast({
      title: 'Material Added (Mock)',
      description: `"${data.title}" has been added to the course.`,
    });
    setIsSubmittingMaterial(false);
    setIsAddMaterialDialogOpen(false);
  };

  const handleDeleteMaterial = (materialId: number) => {
    const materialToDelete = courseMaterials.find(m => m.material_id === materialId);
    if (!materialToDelete) return;

    // Mock deletion
    const indexInGlobal = mockCourseMaterials.findIndex(m => m.material_id === materialId);
    if (indexInGlobal > -1) {
        mockCourseMaterials.splice(indexInGlobal, 1);
    }
    setCourseMaterials(prev => prev.filter(m => m.material_id !== materialId));
    toast({ title: 'Material Deleted (Mock)', description: `Material "${materialToDelete.title}" has been removed.` });
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
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
            <PageHeader title="Loading Course Details..." icon={BookOpenText} />
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title={scheduledCourse.courseDetails?.title || 'Course Details'}
        description={`Manage materials and view details for ${scheduledCourse.courseDetails?.course_code} - Section ${scheduledCourse.section_number}`}
        icon={BookOpenText}
        action={
          <Button asChild variant="outline">
            <Link href="/teacher/my-courses">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Courses
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Course Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Semester:</strong> {scheduledCourse.semesterDetails?.name}</p>
          <p><strong>Instructor:</strong> {user.first_name} {user.last_name}</p>
          {scheduledCourse.roomDetails && (
            <p><strong>Location:</strong> {scheduledCourse.roomDetails.buildingDetails?.name || 'N/A Building'}, Room {scheduledCourse.roomDetails.room_number}</p>
          )}
          <p><strong>Schedule:</strong> {scheduledCourse.days_of_week}, {scheduledCourse.start_time?.substring(0,5)} - {scheduledCourse.end_time?.substring(0,5)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Course Materials</CardTitle>
          <Dialog open={isAddMaterialDialogOpen} onOpenChange={setIsAddMaterialDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Material
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Course Material</DialogTitle>
                <DialogDescription>
                  Upload a file (mock) or provide a link for your students.
                </DialogDescription>
              </DialogHeader>
              <UploadMaterialForm
                onSubmit={handleAddMaterialSubmit}
                onCancel={() => setIsAddMaterialDialogOpen(false)}
                isSubmitting={isSubmittingMaterial}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {courseMaterials.length > 0 ? (
            <div className="space-y-4">
              {courseMaterials.map(material => (
                <Card key={material.material_id} className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {material.material_type === 'File' ? <FileText className="h-5 w-5 text-primary" /> : <LinkIcon className="h-5 w-5 text-primary" />}
                      {material.title}
                    </CardTitle>
                    <CardDescription>{material.description || 'No description.'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {material.material_type === 'File' && material.file_path && (
                      <p className="text-sm text-muted-foreground">Path: {material.file_path}</p>
                    )}
                    {material.material_type === 'Link' && material.url && (
                      <a href={material.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
                        {material.url}
                      </a>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    {material.material_type === 'File' && (
                        <Button variant="outline" size="sm" onClick={() => toast({title: "Mock Download", description: `Would download ${material.file_path}`})}>
                            <Download className="mr-2 h-4 w-4" /> Download (Mock)
                        </Button>
                    )}
                     {material.material_type === 'Link' && material.url && (
                        <Button variant="outline" size="sm" asChild>
                            <a href={material.url} target="_blank" rel="noopener noreferrer">
                                <LinkIcon className="mr-2 h-4 w-4" /> Open Link
                            </a>
                        </Button>
                    )}
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteMaterial(material.material_id)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No course materials uploaded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

