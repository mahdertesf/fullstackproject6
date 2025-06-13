import type { Course, Department } from '@/types';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookText, Tag, ArrowRight } from 'lucide-react';

interface CourseCardProps {
  course: Course & { department?: Department };
}

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <BookText className="h-8 w-8 text-primary mb-2" />
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-accent text-accent-foreground">
            {course.credits} Credits
          </span>
        </div>
        <CardTitle className="text-xl font-headline">{course.title}</CardTitle>
        <CardDescription className="font-mono text-sm text-muted-foreground">{course.course_code}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-foreground/80 line-clamp-3">
          {course.description || 'No description available.'}
        </p>
        {course.department && (
          <div className="mt-3 flex items-center text-xs text-muted-foreground">
            <Tag className="h-3 w-3 mr-1.5" />
            <span>{course.department.name}</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href={`/courses/${course.course_id}`}>
            View Details <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
