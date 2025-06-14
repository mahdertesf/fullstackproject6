// src/app/(main)/teacher/my-courses/[scheduledCourseId]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, startTransition } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { useAuthStore } from '@/store/authStore';
import type { ScheduledCourse as PrismaScheduledCourse, CourseMaterial as PrismaCourseMaterial, UserProfile as AuthUserProfile } from '@prisma/client'; // Use Prisma types directly
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpenText, ShieldAlert, PlusCircle, Trash2, FileText, Link as LinkIcon, Download, GraduationCap, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import UploadMaterialForm from '@/components/materials/UploadMaterialForm';
import { type CourseMaterialUploadFormData } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';
import { getScheduledCourseById, type EnrichedScheduledCourse } from '@/actions/scheduledCourseActions';
import { getCourseMaterialsForScheduledCourse, createCourseMaterial, deleteCourseMaterial } from '@/actions/teacherActions';
import { format } from 'date-fns';


export default function TeacherScheduledCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  
  const scheduledCourseId = params.scheduledCourseId ? parseInt(params.scheduledCourseId as string) : null;

  const [scheduledCourse, setScheduledCourse] = useState<EnrichedScheduledCourse | null>(null);
  const [courseMaterials, setCourseMaterials] = useState<PrismaCourseMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddMaterialDialogOpen, setIsAddMaterialDialogOpen] = useState(false);
  const [isSubmittingMaterial, setIsSubmittingMaterial] = useState(false);

  const fetchCourseData = async () => {
    if (!scheduledCourseId || !user) return;
    setIsLoading(true);
    try {
      const [scData, materialsData] = await Promise.all([
        getScheduledCourseById(scheduledCourseId),
        getCourseMaterialsForScheduledCourse(scheduledCourseId)
      ]);

      if (scData && scData.teacher_id === user.user_id) { // Verify teacher owns this course
        setScheduledCourse(scData);
        setCourseMaterials(materialsData);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Course not found or not assigned to you.' });
        router.push('/teacher/my-courses');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load course details.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role !== 'Teacher') {
      router.replace('/dashboard');
    } else if (scheduledCourseId && user) {
      startTransition(() => { fetchCourseData(); });
    }
  }, [user, scheduledCourseId, router]);


  const handleAddMaterialSubmit = async (data: CourseMaterialUploadFormData) => {
    if (!scheduledCourse || !user) return;
    setIsSubmittingMaterial(true);
    try {
      await createCourseMaterial(data, scheduledCourse.scheduled_course_id, user.user_id);
      toast({ title: 'Material Added', description: `"${data.title}" has been added.` });
      setIsAddMaterialDialogOpen(false);
      startTransition(() => { fetchCourseData(); }); // Re-fetch materials
    } catch (error) { toast({ variant: 'destructive', title: 'Error', description: (error as Error).message || 'Failed to add material.' });
    } finally { setIsSubmittingMaterial(false); }
  };

  const handleDeleteMaterial = async (materialId: number) => {
    const materialToDelete = courseMaterials.find(m => m.material_id === materialId);
    if (!materialToDelete || !confirm(`Delete material "${materialToDelete.title}"?`)) return;
    setIsSubmittingMaterial(true); // Use general submit state for deletion
    try {
      await deleteCourseMaterial(materialId);
      toast({ title: 'Material Deleted' });
      startTransition(() => { fetchCourseData(); }); // Re-fetch materials
    } catch (error) { toast({ variant: 'destructive', title: 'Error', description: (error as Error).message || 'Failed to delete material.' });
    } finally { setIsSubmittingMaterial(false); }
  };

  if (!user || user.role !== 'Teacher') {
    return <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center"><ShieldAlert className="w-16 h-16 text-destructive mb-4" /><h2 className="text-2xl font-bold mb-2">Access Denied</h2></div>;
  }
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-8 w-8 animate-spin"/><span className="ml-2">Loading Course Details...</span></div>;
  }
  if (!scheduledCourse) {
    return <PageHeader title="Course Not Found" icon={BookOpenText} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title={scheduledCourse.course?.title || 'Course Details'}
        description={`Manage materials for ${scheduledCourse.course?.course_code} - Sec ${scheduledCourse.section_number}`}
        icon={BookOpenText}
        action={<Button asChild variant="outline"><Link href="/teacher/my-courses"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link></Button>}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Course Information</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Semester:</strong> {scheduledCourse.semester?.name}</p>
            <p><strong>Instructor:</strong> {scheduledCourse.teacher?.first_name} {scheduledCourse.teacher?.last_name}</p>
            {scheduledCourse.room && (<p><strong>Location:</strong> {scheduledCourse.room.building?.name || 'N/A Bldg'}, Room {scheduledCourse.room.room_number}</p>)}
            <p><strong>Schedule:</strong> {scheduledCourse.days_of_week}, {scheduledCourse.start_time ? format(new Date(scheduledCourse.start_time), 'HH:mm') : 'N/A'} - {scheduledCourse.end_time ? format(new Date(scheduledCourse.end_time), 'HH:mm') : 'N/A'}</p>
          </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Course Actions</CardTitle></CardHeader>
            <CardContent className="flex flex-col space-y-3">
                 <Button asChild variant="default"><Link href={`/teacher/my-courses/${scheduledCourseId}/grades`}><GraduationCap className="mr-2 h-4 w-4" /> Manage Grades</Link></Button>
            </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Course Materials</CardTitle>
          <Dialog open={isAddMaterialDialogOpen} onOpenChange={setIsAddMaterialDialogOpen}>
            <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" /> Add Material</Button></DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader><DialogTitle>Add New Material</DialogTitle><DialogDescription>Upload file or link.</DialogDescription></DialogHeader>
              <UploadMaterialForm onSubmit={handleAddMaterialSubmit} onCancel={() => setIsAddMaterialDialogOpen(false)} isSubmitting={isSubmittingMaterial}/>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {courseMaterials.length > 0 ? (
            <div className="space-y-4">
              {courseMaterials.map(material => (
                <Card key={material.material_id} className="shadow-sm">
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2">{material.material_type === 'File' ? <FileText className="h-5 w-5 text-primary" /> : <LinkIcon className="h-5 w-5 text-primary" />}{material.title}</CardTitle><CardDescription>{material.description || 'No description.'}</CardDescription></CardHeader>
                  <CardContent>
                    {material.material_type === 'File' && material.file_path && (<p className="text-sm text-muted-foreground">Path: {material.file_path}</p>)}
                    {material.material_type === 'Link' && material.url && (<a href={material.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">{material.url}</a>)}
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    {material.material_type === 'File' && (<Button variant="outline" size="sm" onClick={() => toast({title: "Mock Download", description: `Would download ${material.file_path}`})}><Download className="mr-2 h-4 w-4" /> Download</Button>)}
                    {material.material_type === 'Link' && material.url && (<Button variant="outline" size="sm" asChild><a href={material.url} target="_blank" rel="noopener noreferrer"><LinkIcon className="mr-2 h-4 w-4" /> Open</a></Button>)}
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteMaterial(material.material_id)} disabled={isSubmittingMaterial}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (<p className="text-muted-foreground text-center py-4">No course materials uploaded.</p>)}
        </CardContent>
      </Card>
    </div>
  );
}
