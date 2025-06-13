
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnnouncementGeneratorSchema, type AnnouncementGeneratorFormData } from '@/lib/schemas';
import { generateAnnouncement } from '@/ai/flows/generate-announcement';
import { useState } from 'react';
import { Wand2, Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { AnnouncementTargetAudience, AnnouncementTone } from '@/types';


const desiredTones: AnnouncementTone[] = ['Formal', 'Urgent', 'Friendly', 'Informative', 'Academic'];
const targetAudiences: AnnouncementTargetAudience[] = ['Students', 'Teachers', 'Staff', 'All Users'];

export default function AnnouncementGeneratorForm() {
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
      targetAudience: 'All Users',
    },
  });

  const handleGenerateAnnouncement = async () => {
    const formData = form.getValues();
    const validationResult = AnnouncementGeneratorSchema.safeParse(formData);
    if (!validationResult.success) {
      form.trigger();
      return;
    }

    setIsLoadingAi(true);
    try {
      const result = await generateAnnouncement(validationResult.data);
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
    console.log('Submitting announcement:', { 
      title: generatedTitle, 
      content: generatedContent, 
      tone: formData.desiredTone,
      targetAudience: formData.targetAudience 
    });
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    toast({
      title: 'Announcement Submitted (Mock)',
      description: 'Your announcement has been notionally submitted.',
    });
    setGeneratedTitle('');
    setGeneratedContent('');
    form.reset();
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
            <FormField
              control={form.control}
              name="targetAudience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Audience</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target audience" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {targetAudiences.map(audience => (
                        <SelectItem key={audience} value={audience}>{audience}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button type="button" onClick={handleGenerateAnnouncement} disabled={isLoadingAi} className="w-full bg-accent hover:bg-accent/90">
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
            <Button type="button" onClick={handleSubmitGenerated} disabled={isSubmitting} className="w-full">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Submit Announcement (Mock)
            </Button>
          </CardFooter>
        )}
      </Form>
    </Card>
  );
}
