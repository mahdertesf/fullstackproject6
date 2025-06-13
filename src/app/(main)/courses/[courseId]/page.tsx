'use client';

import { useParams } from 'next/navigation';
import PageHeader from '@/components/shared/PageHeader';
import CourseDetailsView from '@/components/courses/CourseDetailsView';
import { mockCourses, mockDepartments, mockPrerequisites, mockScheduledCourses, mockTeachers, mockSemesters, mockRooms, mockBuildings } from '@/lib/data';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CourseDetailsPage() {
  const params = useParams();
  const courseId = params.courseId ? parseInt(params.courseId as string) : null;

  // Find the course from mock data
  const course = mockCourses.find(c => c.course_id === courseId);

  if (!courseId || !course) {
    return (
      <div className="space-y-6">
        <PageHeader title="Course Not Found" description="The course you are looking for does not exist." />
        <Button asChild variant="outline">
          <Link href="/courses">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Catalog
          </Link>
        </Button>
      </div>
    );
  }

  // Enhance course with related data
  const department = mockDepartments.find(d => d.department_id === course.department_id);
  const prerequisites = mockPrerequisites
    .filter(p => p.course_id === course.course_id)
    .map(p => ({
      ...p,
      prerequisiteCourse: mockCourses.find(c => c.course_id === p.prerequisite_course_id)
    }));
  
  // Example: Find one scheduled instance of this course to display some offering details
  // In a real app, you might show all scheduled instances or a specific one based on context (e.g., student's registration)
  const exampleScheduledCourse = mockScheduledCourses.find(sc => sc.course_id === course.course_id);
  let scheduledInfo;
  if (exampleScheduledCourse) {
      const teacher = mockTeachers.find(t => t.teacher_id === exampleScheduledCourse.teacher_id);
      const semester = mockSemesters.find(s => s.semester_id === exampleScheduledCourse.semester_id);
      const room = mockRooms.find(r => r.room_id === exampleScheduledCourse.room_id);
      const building = room ? mockBuildings.find(b => b.building_id === room.building_id) : undefined;
      scheduledInfo = {
          teacher,
          semester,
          days_of_week: exampleScheduledCourse.days_of_week,
          start_time: exampleScheduledCourse.start_time,
          end_time: exampleScheduledCourse.end_time,
          room_number: room?.room_number,
          building_name: building?.name
      }
  }

  const courseWithDetails = {
    ...course,
    department,
    prerequisites,
    scheduledInfo
  };

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
      <CourseDetailsView course={courseWithDetails} />
    </div>
  );
}
