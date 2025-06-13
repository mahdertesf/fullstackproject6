'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StudyGuideGeneratorSchema, type StudyGuideGeneratorFormData } from '@/lib/schemas';
import { generateStudyGuide } from '@/ai/flows/ai-study-guide';
import { useState } from 'react';
import { Wand2, Loader2, BookOpenCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { mockCourses } from '@/lib/data'; // For course selection
import ReactMarkdown from 'react-markdown';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function StudyGuideGeneratorForm() {
  const { toast } = useToast();
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [generatedStudyGuide, setGeneratedStudyGuide] = useState<string | null>(null);

  const form = useForm<StudyGuideGeneratorFormData>({
    resolver: zodResolver(StudyGuideGeneratorSchema),
    defaultValues: {
      courseId: '',
      topic: '',
      studentNeeds: '',
    },
  });

  const handleGenerateStudyGuide = async (data: StudyGuideGeneratorFormData) => {
    setIsLoadingAi(true);
    setGeneratedStudyGuide(null); 
    try {
      const course = mockCourses.find(c => c.course_id === parseInt(data.courseId));
      if (!course) {
        toast({ variant: 'destructive', title: 'Error', description: 'Selected course not found.' });
        setIsLoadingAi(false);
        return;
      }

      const result = await generateStudyGuide({
        courseName: course.title,
        topic: data.topic,
        studentNeeds: data.studentNeeds,
      });
      setGeneratedStudyGuide(result.studyGuide);
      toast({
        title: 'Study Guide Generated',
        description: 'AI has created a study guide based on your input.',
      });
    } catch (error) {
      console.error('AI study guide generation failed:', error);
      toast({
        variant: 'destructive',
        title: 'AI Generation Failed',
        description: 'Could not generate study guide. Please try again.',
      });
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">AI Study Guide Generator</CardTitle>
          <CardDescription>Get personalized AI assistance for your studies. Select a course, topic, and specify your needs.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleGenerateStudyGuide)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Course</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a course" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockCourses.map(course => (
                          <SelectItem key={course.course_id} value={String(course.course_id)}>
                            {course.course_code} - {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specific Topic</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Data Structures, Thermodynamics basics" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="studentNeeds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What do you need help with?</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g., Summarize this topic, generate practice questions, explain complex concepts simply." 
                        {...field} 
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoadingAi} className="w-full bg-accent hover:bg-accent/90">
                {isLoadingAi ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Generate Study Guide
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {generatedStudyGuide && (
        <Card className="w-full max-w-2xl mx-auto mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-headline">
              <BookOpenCheck className="h-6 w-6 text-primary" /> Your AI Study Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] w-full rounded-md border p-4 bg-muted/20">
              <ReactMarkdown 
                className="prose prose-sm dark:prose-invert max-w-none"
                components={{
                  h1: ({node, ...props}) => <h1 className="text-2xl font-bold my-3 font-headline" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl font-semibold my-2 font-headline" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-lg font-semibold my-1 font-headline" {...props} />,
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
                {generatedStudyGuide}
              </ReactMarkdown>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
