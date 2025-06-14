// src/components/announcements/AnnouncementGeneratorForm.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnnouncementGeneratorSchema, type AnnouncementGeneratorFormData } from '@/lib/schemas';
import { generateAnnouncement as genkitGenerateAnnouncement } from '@/ai/flows/generate-announcement';
import { createAnnouncement } from '@/actions/announcementActions'; // DB action
import { useState, useEffect } from 'react';
import { Wand2, Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { UserRole, AnnouncementTargetAudience as PrismaAudience } from '@prisma/client';
import type { TeacherSectionInfo } from '@/types';


const desiredTones: PrismaAudience[] = ['Formal', 'Urgent', 'Friendly', 'Informative', 'Academic']; // Assuming these match enum, adjust if not
const allTargetAudiences: PrismaAudience[] = ['Students', 'Teachers', 'Staff', 'AllUsers'];

interface AnnouncementGeneratorFormProps {
  userRole: UserRole;
  authorId: number;
  availableSections?: TeacherSectionInfo[]; 
}

export default function AnnouncementGeneratorForm({ userRole, authorId, availableSections = [] }: AnnouncementGeneratorFormProps) {
  const { toast } = useToast();
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');

  const form = useForm<AnnouncementGeneratorFormData>({
    resolver: zodResolver(AnnouncementGeneratorSchema),
    defaultValues: {
      topic: '',
      desiredTone: 'Friendly',
      targetAudience: userRole === 'Teacher' ? 'Students' : 'AllUsers',
      selectedSections: [],
    },
  });
  
  useEffect(() => {
    if (userRole === 'Teacher') {
      form.setValue('targetAudience', 'Students');
    } else {
      if (form.getValues('targetAudience') === 'Students' && userRole !== 'Teacher') {
         form.setValue('targetAudience', 'AllUsers');
      }
    }
  }, [userRole, form]);


  const handleGenerateWithAI = async () => {
    const formData = form.getValues();
    const effectiveTargetAudience = userRole === 'Teacher' ? 'Students' : formData.targetAudience;

    if (!effectiveTargetAudience && userRole !== 'Teacher') {
        form.setError('targetAudience', { type: 'manual', message: 'Target audience is required.' });
        return;
    }
    if (userRole === 'Teacher' && (!formData.selectedSections || formData.selectedSections.length === 0)) {
        form.setError('selectedSections', { type: 'manual', message: 'Please select at least one section for teacher announcements.' });
        return;
    }
    
    const validationResult = AnnouncementGeneratorSchema.safeParse({
      ...formData,
      targetAudience: effectiveTargetAudience as PrismaAudience,
    });

    if (!validationResult.success) {
      form.trigger();
      return;
    }
    
    setIsLoadingAi(true);
    try {
      const aiInputData = {
        ...validationResult.data,
        targetAudience: effectiveTargetAudience! as PrismaAudience,
        sections: userRole === 'Teacher' && validationResult.data.selectedSections 
          ? validationResult.data.selectedSections
              .map(id => availableSections.find(s => s.id === id)?.name)
              .filter(Boolean) as string[]
          : undefined,
      };

      const result = await genkitGenerateAnnouncement(aiInputData);
      setGeneratedTitle(result.title);
      setGeneratedContent(result.content);
      form.setValue('topic', result.title); // Update topic with AI title
      toast({ title: 'Announcement Generated', description: 'AI has drafted a title and content.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'AI Generation Failed', description: (error as Error).message || 'Could not generate content.' });
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleSubmitToDB = async () => {
    setIsSubmitting(true);
    const formData = form.getValues();
    const finalData = {
      ...formData,
      topic: generatedTitle || formData.topic, // Use AI title if available
      content: generatedContent, // Must have AI content to submit this way
      targetAudience: (userRole === 'Teacher' ? 'Students' : formData.targetAudience) as PrismaAudience,
    };

    if(!finalData.content) {
      toast({variant: 'destructive', title: 'Missing Content', description: 'Please generate content with AI before submitting.'});
      setIsSubmitting(false);
      return;
    }
    
    try {
      await createAnnouncement(finalData, authorId, availableSections);
      toast({ title: 'Announcement Submitted', description: 'Your announcement has been saved.' });
      setGeneratedTitle('');
      setGeneratedContent('');
      form.reset({ topic: '', desiredTone: 'Friendly', targetAudience: userRole === 'Teacher' ? 'Students' : 'AllUsers', selectedSections: [] });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: (error as Error).message || 'Could not submit announcement.'});
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">AI Announcement Generator</CardTitle>
        <CardDescription>Let AI help you craft the perfect announcement.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <CardContent className="space-y-6">
          <FormField
            control={form.control}
            name="topic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Announcement Topic/Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Midterm registration deadline" {...field} value={generatedTitle || field.value} onChange={(e) => { field.onChange(e); if(generatedTitle) setGeneratedTitle(e.target.value);}}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="desiredTone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Desired Tone</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a tone" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {desiredTones.map(tone => (<SelectItem key={tone} value={tone}>{tone}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {userRole !== 'Teacher' && (
              <FormField
                control={form.control}
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Audience</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select audience" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {allTargetAudiences.map(audience => (<SelectItem key={audience} value={audience}>{audience}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {userRole === 'Teacher' && availableSections && availableSections.length > 0 && (
            <FormField
              control={form.control}
              name="selectedSections"
              render={() => (
                <FormItem>
                  <div className="mb-4"><FormLabel className="text-base">Select Sections</FormLabel>
                    <p className="text-sm text-muted-foreground">Choose sections for this announcement.</p>
                  </div>
                  <ScrollArea className="h-40 rounded-md border p-2">
                    {availableSections.map((section) => (
                      <FormField key={section.id} control={form.control} name="selectedSections"
                        render={({ field }) => (
                          <FormItem key={section.id} className="flex flex-row items-start space-x-3 space-y-0 py-2 hover:bg-muted/50 rounded-sm px-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(section.id)}
                                onCheckedChange={(checked) => field.onChange(checked ? [...(field.value || []), section.id] : (field.value || []).filter(v => v !== section.id))}
                              />
                            </FormControl>
                            <FormLabel className="font-normal text-sm">{section.name}</FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
           {userRole === 'Teacher' && (!availableSections || availableSections.length === 0) && (
             <p className="text-sm text-muted-foreground py-2 px-1 border rounded-md bg-muted/50">You currently have no sections assigned. Please contact administration if this is an error.</p>
           )}

          <Button type="button" onClick={handleGenerateWithAI} disabled={isLoadingAi || (userRole === 'Teacher' && availableSections.length === 0)} className="w-full bg-accent hover:bg-accent/90">
            {isLoadingAi ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Generate with AI
          </Button>

          {generatedContent && (
            <FormItem>
              <FormLabel>Generated Content</FormLabel>
              <Textarea value={generatedContent} onChange={(e) => setGeneratedContent(e.target.value)} rows={8} className="bg-muted/50" />
            </FormItem>
          )}
        </CardContent>
        {generatedContent && (
          <CardFooter>
            <Button type="button" onClick={handleSubmitToDB} disabled={isSubmitting || (userRole === 'Teacher' && availableSections.length === 0)} className="w-full">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Submit Announcement
            </Button>
          </CardFooter>
        )}
      </Form>
    </Card>
  );
}
