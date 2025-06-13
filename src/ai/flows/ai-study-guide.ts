// src/ai/flows/ai-study-guide.ts
'use server';

/**
 * @fileOverview An AI study guide generator for students.
 *
 * - generateStudyGuide - A function that generates study guides.
 * - AiStudyGuideInput - The input type for the generateStudyGuide function.
 * - AiStudyGuideOutput - The return type for the generateStudyGuide function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiStudyGuideInputSchema = z.object({
  courseName: z.string().describe('The name of the course to generate a study guide for.'),
  topic: z.string().describe('The specific topic within the course to focus on.'),
  studentNeeds: z.string().describe('Specific requests to customize the study guide. e.g. summarize content, create different kinds of questions, and analyze to help me better understand the subject'),
});
export type AiStudyGuideInput = z.infer<typeof AiStudyGuideInputSchema>;

const AiStudyGuideOutputSchema = z.object({
  studyGuide: z.string().describe('The generated study guide content.'),
});
export type AiStudyGuideOutput = z.infer<typeof AiStudyGuideOutputSchema>;

export async function generateStudyGuide(input: AiStudyGuideInput): Promise<AiStudyGuideOutput> {
  return aiStudyGuideFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiStudyGuidePrompt',
  input: {schema: AiStudyGuideInputSchema},
  output: {schema: AiStudyGuideOutputSchema},
  prompt: `You are an AI study guide generator. You will generate a study guide for the student based on the course name, topic, and their specific learning needs.

Course Name: {{{courseName}}}
Topic: {{{topic}}}
Student Needs: {{{studentNeeds}}}

Study Guide:
`,
});

const aiStudyGuideFlow = ai.defineFlow(
  {
    name: 'aiStudyGuideFlow',
    inputSchema: AiStudyGuideInputSchema,
    outputSchema: AiStudyGuideOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

