// src/components/courses/CourseDetailsView.tsx

import type { DetailedCourse } from '@/actions/courseActions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookText, Tag, Users, CalendarDays, Link2, Clock, MapPin, Info } from 'lucide-react';
import Link from 'next/link';

interface CourseDetailsViewProps {
  course: DetailedCourse;
}

const formatTime = (timeString: string | null | undefined) => {
  if (!timeString) return 'N/A';
  // Assuming timeString is already in HH:MM:SS or HH:MM format from DB
  const [hours, minutes] = timeString.split(':');
  if (isNaN(parseInt(hours)) || isNaN(parseInt(minutes))) return 'Invalid Time';
  
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function CourseDetailsView({ course }: CourseDetailsViewProps) {
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

            {course.prerequisitesRequired && course.prerequisitesRequired.length > 0 && (
            <section>
                <h3 className="text-xl font-semibold mb-2 font-headline text-primary">Prerequisites</h3>
                <ul className="list-disc list-inside space-y-1 text-foreground/90">
                {course.prerequisitesRequired.map((prereq) => (
                    <li key={prereq.prerequisite_id} className="flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-accent"/> 
                        {prereq.prerequisiteCourse ? (
                             <Link href={`/courses/${prereq.prerequisiteCourse.course_id}`} className="hover:underline text-primary">
                                {prereq.prerequisiteCourse.course_code} - {prereq.prerequisiteCourse.title}
                             </Link>
                        ) : (
                            'Unknown Prerequisite Course'
                        )}
                    </li>
                ))}
                </ul>
            </section>
            )}
        </div>


        {course.scheduledCourses && course.scheduledCourses.length > 0 && (
          <section>
            <h3 className="text-2xl font-semibold mb-4 font-headline text-primary border-b pb-2">Recent Scheduled Offerings</h3>
            <div className="space-y-4">
              {course.scheduledCourses.map(sc => (
                <Card key={sc.scheduled_course_id} className="bg-background/70">
                  <CardHeader className="pb-3 pt-4 px-4">
                    <CardTitle className="text-lg">Section {sc.section_number} - {sc.semester?.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm px-4 pb-4">
                     {sc.teacher && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>Instructor: {sc.teacher.first_name} {sc.teacher.last_name}</span>
                        </div>
                      )}
                    {sc.days_of_week && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{sc.days_of_week}, {formatTime(sc.start_time)} - {formatTime(sc.end_time)}</span>
                      </div>
                    )}
                    {sc.room && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{sc.room.building?.name || 'N/A Bldg'}, Room {sc.room.room_number}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <span>Capacity: {sc.current_enrollment} / {sc.max_capacity}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
        
      </CardContent>
    </Card>
  );
}
