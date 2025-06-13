
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

const AiStudyGuideMaterialInputSchema = z.object({
  materialTitle: z.string().describe('The title of the course material.'),
  materialDescription: z.string().optional().describe('The description of the course material, if available.'),
  courseName: z.string().describe('The name of the course this material belongs to.'),
  actionType: z.enum(['Summarize', 'GenerateQuestions', 'ExplainDetails'])
    .describe('The AI action to perform: Summarize, GenerateQuestions, or ExplainDetails.'),
  materialType: z.enum(['File', 'Link']).describe('The type of the course material.'),
  materialPathOrUrl: z.string().optional().describe('The file path (for File type) or URL (for Link type) of the material.'),
});
export type AiStudyGuideMaterialInput = z.infer<typeof AiStudyGuideMaterialInputSchema>;

// Schema for the augmented input that the prompt will receive
const AiStudyGuideMaterialPromptAugmentedInputSchema = AiStudyGuideMaterialInputSchema.extend({
  isMaterialTypeLink: z.boolean().describe('True if the material type is Link.'),
  isActionTypeSummarize: z.boolean().describe('True if the action type is Summarize.'),
  isActionTypeGenerateQuestions: z.boolean().describe('True if the action type is GenerateQuestions.'),
  isActionTypeExplainDetails: z.boolean().describe('True if the action type is ExplainDetails.'),
});
type AiStudyGuideMaterialPromptAugmentedInput = z.infer<typeof AiStudyGuideMaterialPromptAugmentedInputSchema>;


const AiStudyGuideMaterialOutputSchema = z.object({
  generatedText: z.string().describe('The AI-generated text based on the requested action.'),
});
export type AiStudyGuideMaterialOutput = z.infer<typeof AiStudyGuideMaterialOutputSchema>;

export async function processCourseMaterial(input: AiStudyGuideMaterialInput): Promise<AiStudyGuideMaterialOutput> {
  return aiStudyGuideMaterialFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiStudyGuideMaterialPrompt',
  input: {schema: AiStudyGuideMaterialPromptAugmentedInputSchema}, // Use augmented schema
  output: {schema: AiStudyGuideMaterialOutputSchema},
  prompt: `You are an AI study assistant for a university student.
The student is studying the course: "{{courseName}}".
They are working with a course material.

Material Title: "{{materialTitle}}"
{{#if materialDescription}}
Material Description: "{{materialDescription}}"
{{/if}}
Material Type: {{materialType}}
{{#if materialPathOrUrl}}
  {{#if isMaterialTypeLink}}
Source Link: {{materialPathOrUrl}}
  {{else}}
(This is a file, its content is not directly available to you, the AI. Base your response on the title, description, and your general knowledge of the topic in the context of the course.)
  {{/if}}
{{/if}}

The student wants you to perform the following action: {{actionType}}.

Please use your general knowledge about the topic "{{materialTitle}}" as it relates to the course "{{courseName}}".
If the material is a Link, consider what such a resource typically covers.

{{#if isActionTypeSummarize}}
  {{#if isMaterialTypeLink}}
    Based on the title, description, and your general knowledge of what a resource like "{{materialTitle}}" (from {{materialPathOrUrl}}) typically covers for the course "{{courseName}}", please provide a concise summary of the likely key topics and concepts.
  {{else}}
    Based on the title and description of the material "{{materialTitle}}" for the course "{{courseName}}", and your general knowledge, please provide a concise summary of the likely key topics and concepts.
  {{/if}}
  Response:
{{else if isActionTypeGenerateQuestions}}
  {{#if isMaterialTypeLink}}
    Considering a resource like "{{materialTitle}}" (from {{materialPathOrUrl}}) for the course "{{courseName}}", generate 3-5 potential exam or study questions based on the typical content of such a resource.
  {{else}}
    Based on the title and description of the material "{{materialTitle}}" for the course "{{courseName}}", and your general knowledge of its likely content, generate 3-5 potential exam or study questions.
  {{/if}}
  Response:
{{else if isActionTypeExplainDetails}}
  {{#if isMaterialTypeLink}}
    For a resource like "{{materialTitle}}" (from {{materialPathOrUrl}}) relevant to the course "{{courseName}}", explain any complex concepts or provide further details that would typically be important for understanding it.
  {{else}}
    Based on the title and description of the material "{{materialTitle}}" for the course "{{courseName}}", and your general knowledge, explain any complex concepts or provide further details that would typically be important for understanding it.
  {{/if}}
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
    inputSchema: AiStudyGuideMaterialInputSchema, // Flow input remains the original schema
    outputSchema: AiStudyGuideMaterialOutputSchema,
  },
  async (input: AiStudyGuideMaterialInput) => { // Flow receives the original input type
    const augmentedInput: AiStudyGuideMaterialPromptAugmentedInput = {
      ...input,
      isMaterialTypeLink: input.materialType === 'Link',
      isActionTypeSummarize: input.actionType === 'Summarize',
      isActionTypeGenerateQuestions: input.actionType === 'GenerateQuestions',
      isActionTypeExplainDetails: input.actionType === 'ExplainDetails',
    };
    const {output} = await prompt(augmentedInput); // Pass augmented input to the prompt
    if (!output?.generatedText) {
        // If the output is empty or doesn't conform, provide a fallback response.
        return { generatedText: "I received your request, but I couldn't generate a specific response for this material with the provided information. Please ensure the title and description are clear, or try a different material." };
    }
    return output;
  }
);

