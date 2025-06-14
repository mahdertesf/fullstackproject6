// src/app/(main)/courses/[courseId]/page.tsx
import PageHeader from '@/components/shared/PageHeader';
import CourseDetailsView from '@/components/courses/CourseDetailsView';
import { getCourseByIdWithDetails, type DetailedCourse } from '@/actions/courseActions';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface CourseDetailsPageProps {
  params: {
    courseId: string;
  };
}

export default async function CourseDetailsPage({ params }: CourseDetailsPageProps) {
  const courseIdNum = parseInt(params.courseId, 10);

  if (isNaN(courseIdNum)) {
    notFound(); // Or redirect to a generic error page / courses page
  }

  const course: DetailedCourse | null = await getCourseByIdWithDetails(courseIdNum);

  if (!course) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title={course.title} 
        description={`Detailed information for ${course.course_code}`}
        icon={BookOpen}
        action={
            <Button asChild variant="outline">
              <Link href="/courses">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Catalog
              </Link>
            </Button>
        }
      />
      <CourseDetailsView course={course} />
    </div>
  );
}
