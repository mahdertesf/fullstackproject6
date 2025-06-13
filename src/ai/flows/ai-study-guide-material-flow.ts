
'use server';
/**
 * @fileOverview An AI agent to process course materials (summarize, generate questions, explain).
 *
 * - processCourseMaterial - A function that handles AI actions on course materials.
 * - AiStudyGuideMaterialInput - The input type for the processCourseMaterial function.
 * - AiStudyGuideMaterialOutput - The return type for the processCourseMaterial function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const AiStudyGuideMaterialInputSchema = z.object({
  materialTitle: z.string().describe('The title of the course material.'),
  materialDescription: z.string().optional().describe('The description of the course material, if available.'),
  courseName: z.string().describe('The name of the course this material belongs to.'),
  actionType: z.enum(['Summarize', 'GenerateQuestions', 'ExplainDetails'])
    .describe('The AI action to perform: Summarize, GenerateQuestions, or ExplainDetails.'),
});
export type AiStudyGuideMaterialInput = z.infer<typeof AiStudyGuideMaterialInputSchema>;

export const AiStudyGuideMaterialOutputSchema = z.object({
  generatedText: z.string().describe('The AI-generated text based on the requested action.'),
});
export type AiStudyGuideMaterialOutput = z.infer<typeof AiStudyGuideMaterialOutputSchema>;

export async function processCourseMaterial(input: AiStudyGuideMaterialInput): Promise<AiStudyGuideMaterialOutput> {
  return aiStudyGuideMaterialFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiStudyGuideMaterialPrompt',
  input: {schema: AiStudyGuideMaterialInputSchema},
  output: {schema: AiStudyGuideMaterialOutputSchema},
  prompt: `You are an AI study assistant for a university student.
The student is studying the course: "{{courseName}}".
They are looking at a course material titled: "{{materialTitle}}".
{{#if materialDescription}}
The material is described as: "{{materialDescription}}".
{{/if}}

The student wants you to perform the following action: {{actionType}}.

{{#if (eq actionType "Summarize")}}
Please provide a concise summary of this material, focusing on key concepts relevant to the course.
Response:
{{else if (eq actionType "GenerateQuestions")}}
Please generate 3-5 potential exam or study questions based on this material. Ensure the questions are relevant to the course content.
Response:
{{else if (eq actionType "ExplainDetails")}}
Please explain any complex concepts or provide further details about this material that might be important for understanding it within the context of the course.
Response:
{{else}}
The requested action is unclear. Please clarify if you want a summary, questions, or detailed explanation.
Response:
{{/if}}
`,
});

const aiStudyGuideMaterialFlow = ai.defineFlow(
  {
    name: 'aiStudyGuideMaterialFlow',
    inputSchema: AiStudyGuideMaterialInputSchema,
    outputSchema: AiStudyGuideMaterialOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
