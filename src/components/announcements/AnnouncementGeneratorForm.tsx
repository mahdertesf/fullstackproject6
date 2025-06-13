
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnnouncementGeneratorSchema, type AnnouncementGeneratorFormData } from '@/lib/schemas';
import { generateAnnouncement } from '@/ai/flows/generate-announcement';
import { useState, useEffect } from 'react';
import { Wand2, Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { AnnouncementTargetAudience, AnnouncementTone, UserRole, TeacherSectionInfo } from '@/types';
import { mockAnnouncements } from '@/lib/data'; // For mock submission

const desiredTones: AnnouncementTone[] = ['Formal', 'Urgent', 'Friendly', 'Informative', 'Academic'];
const allTargetAudiences: AnnouncementTargetAudience[] = ['Students', 'Teachers', 'Staff', 'All Users'];

interface AnnouncementGeneratorFormProps {
  userRole: UserRole;
  availableSections?: TeacherSectionInfo[]; // For teachers
}

export default function AnnouncementGeneratorForm({ userRole, availableSections = [] }: AnnouncementGeneratorFormProps) {
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
      targetAudience: userRole === 'Teacher' ? 'Students' : 'All Users',
      selectedSections: [],
    },
  });
  
  useEffect(() => {
    // If the role changes, reset the target audience if needed
    if (userRole === 'Teacher') {
      form.setValue('targetAudience', 'Students');
    } else {
      // For Staff/Admin, default to 'All Users' or let them pick
      if (form.getValues('targetAudience') === 'Students' && userRole !== 'Teacher') {
         form.setValue('targetAudience', 'All Users');
      }
    }
  }, [userRole, form]);


  const handleGenerateAnnouncement = async () => {
    const formData = form.getValues();
    // Manually set targetAudience for teachers if it's not in the form
    const effectiveTargetAudience = userRole === 'Teacher' ? 'Students' : formData.targetAudience;

    if (!effectiveTargetAudience && userRole !== 'Teacher') {
        form.setError('targetAudience', { type: 'manual', message: 'Target audience is required.' });
        return;
    }
    if (userRole === 'Teacher' && (!formData.selectedSections || formData.selectedSections.length === 0)) {
        form.setError('selectedSections', { type: 'manual', message: 'Please select at least one section.' });
        return;
    }
    
    const validationResult = AnnouncementGeneratorSchema.safeParse({
      ...formData,
      targetAudience: effectiveTargetAudience, // Use the determined audience
    });

    if (!validationResult.success) {
      console.error("Form validation errors:", validationResult.error.flatten().fieldErrors);
      // Trigger validation for all fields to show messages
      form.trigger();
      return;
    }
    
    setIsLoadingAi(true);
    try {
      const aiInputData = {
        ...validationResult.data,
        targetAudience: effectiveTargetAudience!,
        sections: userRole === 'Teacher' && validationResult.data.selectedSections 
          ? validationResult.data.selectedSections
              .map(id => availableSections.find(s => s.id === id)?.name)
              .filter(Boolean) as string[]
          : undefined,
      };

      const result = await generateAnnouncement(aiInputData);
      setGeneratedTitle(result.title);
      setGeneratedContent(result.content);
      toast({
        title: 'Announcement Generated',
        description: 'AI has drafted a title and content for your announcement.',
      });
    } catch (error) {
      console.error('AI generation failed:', error);
      toast({
        variant: 'destructive',
        title: 'AI Generation Failed',
        description: 'Could not generate announcement. Please try again.',
      });
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleSubmitGenerated = async () => {
    setIsSubmitting(true);
    const formData = form.getValues();
    const finalTargetAudience = userRole === 'Teacher' ? 'Students' : formData.targetAudience;
    
    // Mock submission logic
    const newAnnouncementId = Math.max(0, ...mockAnnouncements.map(a => a.announcement_id)) + 1;
    mockAnnouncements.push({
      announcement_id: newAnnouncementId,
      title: generatedTitle,
      content: generatedContent,
      author_id: 1, // Mock author ID
      target_audience: finalTargetAudience!,
      desired_tone: formData.desiredTone,
      status: 'Published',
      publish_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      target_section_ids: userRole === 'Teacher' && formData.selectedSections ? formData.selectedSections.map(id => parseInt(id)) : undefined,
    });

    console.log('Submitting announcement:', { 
      title: generatedTitle, 
      content: generatedContent, 
      tone: formData.desiredTone,
      targetAudience: finalTargetAudience,
      selectedSections: userRole === 'Teacher' ? formData.selectedSections : undefined,
    });
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    toast({
      title: 'Announcement Submitted (Mock)',
      description: 'Your announcement has been notionally submitted.',
    });
    setGeneratedTitle('');
    setGeneratedContent('');
    form.reset({
        topic: '',
        desiredTone: 'Friendly',
        targetAudience: userRole === 'Teacher' ? 'Students' : 'All Users',
        selectedSections: [],
    });
    setIsSubmitting(false);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">AI Announcement Generator</CardTitle>
        <CardDescription>Let AI help you craft the perfect announcement. Enter a topic, desired tone, and target audience.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <CardContent className="space-y-6">
          <FormField
            control={form.control}
            name="topic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Announcement Topic</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Midterm registration deadline reminder" {...field} />
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
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a tone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {desiredTones.map(tone => (
                        <SelectItem key={tone} value={tone}>{tone}</SelectItem>
                      ))}
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
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select target audience" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allTargetAudiences.map(audience => (
                          <SelectItem key={audience} value={audience}>{audience}</SelectItem>
                        ))}
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
                  <div className="mb-4">
                    <FormLabel className="text-base">Select Sections for Announcement</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Choose which of your sections will receive this announcement.
                    </p>
                  </div>
                  <ScrollArea className="h-40 rounded-md border p-2">
                    {availableSections.map((section) => (
                      <FormField
                        key={section.id}
                        control={form.control}
                        name="selectedSections"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={section.id}
                              className="flex flex-row items-start space-x-3 space-y-0 py-2 hover:bg-muted/50 rounded-sm px-2"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(section.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), section.id])
                                      : field.onChange(
                                          (field.value || []).filter(
                                            (value) => value !== section.id
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal text-sm">
                                {section.name}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {userRole === 'Teacher' && (!availableSections || availableSections.length === 0) && (
            <p className="text-sm text-muted-foreground">You do not have any sections assigned to make announcements to.</p>
          )}


          <Button type="button" onClick={handleGenerateAnnouncement} disabled={isLoadingAi || (userRole === 'Teacher' && availableSections.length === 0)} className="w-full bg-accent hover:bg-accent/90">
            {isLoadingAi ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Generate with AI
          </Button>

          {generatedTitle && (
            <FormItem>
              <FormLabel>Generated Title</FormLabel>
              <Input value={generatedTitle} readOnly className="bg-muted/50" />
            </FormItem>
          )}
          {generatedContent && (
            <FormItem>
              <FormLabel>Generated Content</FormLabel>
              <Textarea value={generatedContent} readOnly rows={8} className="bg-muted/50" />
            </FormItem>
          )}
        </CardContent>
        {generatedTitle && generatedContent && (
          <CardFooter>
            <Button type="button" onClick={handleSubmitGenerated} disabled={isSubmitting || (userRole === 'Teacher' && availableSections.length === 0)} className="w-full">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Submit Announcement (Mock)
            </Button>
          </CardFooter>
        )}
      </Form>
    </Card>
  );
}
