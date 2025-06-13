// src/components/courses/CourseDetailsView.tsx

import type { Course, Department, Prerequisite, UserProfile, Semester } from '@/types'; // Changed Teacher to UserProfile
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookText, Tag, Users, CalendarDays, Link2, Clock, MapPin } from 'lucide-react';
import { mockCourses as allMockCourses } from '@/lib/data'; // For prerequisites example

interface CourseDetailsViewProps {
  course: Course & { 
    department?: Department;
    prerequisites?: (Prerequisite & { prerequisiteCourse?: Course })[];
    scheduledInfo?: {
        teacher?: UserProfile; // Changed from Teacher to UserProfile
        semester?: Semester;
        days_of_week?: string | null;
        start_time?: string | null;
        end_time?: string | null;
        room_number?: string | null;
        building_name?: string | null;
    }
  };
}

const formatTime = (timeString: string | null | undefined) => {
  if (!timeString) return 'N/A';
  const [hours, minutes] = timeString.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function CourseDetailsView({ course }: CourseDetailsViewProps) {
  const prerequisitesDetails = course.prerequisites?.map(prereq => {
    const prereqCourse = allMockCourses.find(c => c.course_id === prereq.prerequisite_course_id);
    return prereqCourse ? `${prereqCourse.course_code} - ${prereqCourse.title}` : 'Unknown Prerequisite';
  });

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-muted/30">
        <div className="flex items-center gap-3 mb-2">
          <BookText className="h-10 w-10 text-primary" />
          <div>
            <CardTitle className="text-3xl font-headline">{course.title}</CardTitle>
            <CardDescription className="font-mono text-lg text-muted-foreground">{course.course_code}</CardDescription>
          </div>
        </div>
         <Badge variant="secondary" className="w-fit text-sm">{course.credits} Credits</Badge>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <section>
          <h3 className="text-xl font-semibold mb-2 font-headline text-primary">Description</h3>
          <p className="text-foreground/80 leading-relaxed">
            {course.description || 'No detailed description available for this course.'}
          </p>
        </section>

        <div className="grid md:grid-cols-2 gap-6">
            <section>
            <h3 className="text-xl font-semibold mb-2 font-headline text-primary">Department</h3>
            <div className="flex items-center gap-2 text-foreground/90">
                <Tag className="h-5 w-5 text-accent" />
                <span>{course.department?.name || 'N/A'}</span>
            </div>
            </section>

            {prerequisitesDetails && prerequisitesDetails.length > 0 && (
            <section>
                <h3 className="text-xl font-semibold mb-2 font-headline text-primary">Prerequisites</h3>
                <ul className="list-disc list-inside space-y-1 text-foreground/90">
                {prerequisitesDetails.map((prereq, index) => (
                    <li key={index} className="flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-accent"/> {prereq}
                    </li>
                ))}
                </ul>
            </section>
            )}
        </div>


        {course.scheduledInfo && (
          <section>
            <h3 className="text-2xl font-semibold mb-4 font-headline text-primary border-b pb-2">Current Offering Details</h3>
            <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
              {course.scheduledInfo.semester && (
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-medium">Semester</p>
                    <p className="text-foreground/80">{course.scheduledInfo.semester.name}</p>
                  </div>
                </div>
              )}
              {course.scheduledInfo.teacher && (
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-accent" />
                   <div>
                    <p className="font-medium">Instructor</p>
                    <p className="text-foreground/80">{course.scheduledInfo.teacher.first_name} {course.scheduledInfo.teacher.last_name}</p>
                  </div>
                </div>
              )}
              {course.scheduledInfo.days_of_week && (
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-medium">Schedule</p>
                    <p className="text-foreground/80">
                      {course.scheduledInfo.days_of_week}, {formatTime(course.scheduledInfo.start_time)} - {formatTime(course.scheduledInfo.end_time)}
                    </p>
                  </div>
                </div>
              )}
              {(course.scheduledInfo.room_number || course.scheduledInfo.building_name) && (
                 <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-accent" />
                   <div>
                    <p className="font-medium">Location</p>
                    <p className="text-foreground/80">
                        {course.scheduledInfo.building_name || 'N/A'}, Room {course.scheduledInfo.room_number || 'N/A'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
        
      </CardContent>
    </Card>
  );
}
