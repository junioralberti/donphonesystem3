
// This file is machine-generated - edit at your own risk.

'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting repair solutions based on a customer's problem description and phone model.
 *
 * - suggestRepairSolutions - A function that takes customer's problem description and phone model and returns potential solutions, parts needed, and estimated repair time.
 * - SuggestRepairSolutionsInput - The input type for the suggestRepairSolutions function.
 * - SuggestRepairSolutionsOutput - The return type for the suggestRepairSolutions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRepairSolutionsInputSchema = z.object({
  problemDescription: z.string().describe('A descrição do problema do celular fornecida pelo cliente.'),
  phoneModel: z.string().describe('O modelo do celular que precisa de reparo.'),
});
export type SuggestRepairSolutionsInput = z.infer<typeof SuggestRepairSolutionsInputSchema>;

const SuggestRepairSolutionsOutputSchema = z.object({
  suggestedSolutions: z.array(z.string()).describe('Uma lista de possíveis soluções para o problema.'),
  partsNeeded: z.array(z.string()).optional().describe('Uma lista de peças que podem ser necessárias para o reparo.'),
  estimatedRepairTime: z.string().optional().describe('Um tempo estimado de reparo para as soluções identificadas.'),
});
export type SuggestRepairSolutionsOutput = z.infer<typeof SuggestRepairSolutionsOutputSchema>;

export async function suggestRepairSolutions(input: SuggestRepairSolutionsInput): Promise<SuggestRepairSolutionsOutput> {
  return suggestRepairSolutionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRepairSolutionsPrompt',
  input: {schema: SuggestRepairSolutionsInputSchema},
  output: {schema: SuggestRepairSolutionsOutputSchema},
  prompt: `You are an expert phone repair technician with years of experience.
Given the following problem description and phone model, suggest potential solutions. If applicable, also provide a list of parts that might be needed and an estimated repair time.

Problem Description: {{{problemDescription}}}
Phone Model: {{{phoneModel}}}

Respond concisely. If certain information like parts or repair time isn't determinable, you can omit it.
Responda em Português do Brasil.`,
});

const suggestRepairSolutionsFlow = ai.defineFlow(
  {
    name: 'suggestRepairSolutionsFlow',
    inputSchema: SuggestRepairSolutionsInputSchema,
    outputSchema: SuggestRepairSolutionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

