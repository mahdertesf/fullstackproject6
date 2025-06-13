// src/ai/flows/generate-announcement.ts
'use server';

/**
 * @fileOverview A flow for generating announcement titles and content using AI.
 *
 * - generateAnnouncement - A function that generates announcement content.
 * - GenerateAnnouncementInput - The input type for the generateAnnouncement function.
 * - GenerateAnnouncementOutput - The return type for the generateAnnouncement function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAnnouncementInputSchema = z.object({
  topic: z.string().describe('A brief topic for the announcement.'),
  desiredTone: z
    .string()
    .describe(
      'The desired tone of the announcement (e.g., Formal, Urgent, Friendly).' + 
      'This should match the `desired_tone` column of the Announcements table in the database.'
    ),
});
export type GenerateAnnouncementInput = z.infer<typeof GenerateAnnouncementInputSchema>;

const GenerateAnnouncementOutputSchema = z.object({
  title: z.string().describe('The generated title for the announcement.'),
  content: z.string().describe('The generated content for the announcement.'),
});
export type GenerateAnnouncementOutput = z.infer<typeof GenerateAnnouncementOutputSchema>;

export async function generateAnnouncement(
  input: GenerateAnnouncementInput
): Promise<GenerateAnnouncementOutput> {
  return generateAnnouncementFlow(input);
}

const announcementPrompt = ai.definePrompt({
  name: 'announcementPrompt',
  input: {schema: GenerateAnnouncementInputSchema},
  output: {schema: GenerateAnnouncementOutputSchema},
  prompt: `You are an AI assistant tasked with generating announcement titles and content for a university portal.

  Based on the provided topic and desired tone, generate a suitable title and content for the announcement.
  Ensure the announcement is clear, concise, and appropriate for the intended audience.

  Topic: {{{topic}}}
  Desired Tone: {{{desiredTone}}}

  Title: (Provide a suitable title here)
  Content: (Provide the announcement content here)
  `,
});

const generateAnnouncementFlow = ai.defineFlow(
  {
    name: 'generateAnnouncementFlow',
    inputSchema: GenerateAnnouncementInputSchema,
    outputSchema: GenerateAnnouncementOutputSchema,
  },
  async input => {
    const {output} = await announcementPrompt(input);
    return output!;
  }
);
