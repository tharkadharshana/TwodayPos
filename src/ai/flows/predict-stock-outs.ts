'use server';

/**
 * @fileOverview An AI agent that predicts stock outs and suggests reorders.
 *
 * - predictStockOuts - A function that handles the stock out prediction process.
 * - PredictStockOutsInput - The input type for the predictStockOuts function.
 * - PredictStockOutsOutput - The return type for the predictStockOuts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictStockOutsInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  salesVelocity: z.number().describe('The average sales velocity of the product per day.'),
  currentStock: z.number().describe('The current stock level of the product.'),
  historicalTrends: z
    .string()
    .describe(
      'A description of the historical sales trends of the product, including any seasonality or promotions.'
    ),
  supplierLeadTime: z
    .number()
    .optional()
    .describe('The lead time from the supplier in days, if available.'),
});
export type PredictStockOutsInput = z.infer<typeof PredictStockOutsInputSchema>;

const PredictStockOutsOutputSchema = z.object({
  stockOutPrediction:
    z.string().describe('When the product is predicted to stock out, and the reasoning behind it.'),
  reorderSuggestion: z
    .string()
    .describe('A suggestion for how much of the product to reorder and when.'),
});
export type PredictStockOutsOutput = z.infer<typeof PredictStockOutsOutputSchema>;

export async function predictStockOuts(input: PredictStockOutsInput): Promise<PredictStockOutsOutput> {
  return predictStockOutsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictStockOutsPrompt',
  input: {schema: PredictStockOutsInputSchema},
  output: {schema: PredictStockOutsOutputSchema},
  prompt: `You are an expert inventory manager. Given the following information about a product, predict when it will stock out and suggest a reorder quantity and timing.

Product Name: {{{productName}}}
Sales Velocity (per day): {{{salesVelocity}}}
Current Stock: {{{currentStock}}}
Historical Trends: {{{historicalTrends}}}
Supplier Lead Time (days): {{#if supplierLeadTime}}{{{supplierLeadTime}}}{{else}}Unknown{{/if}}

Stock Out Prediction:`,
});

const predictStockOutsFlow = ai.defineFlow(
  {
    name: 'predictStockOutsFlow',
    inputSchema: PredictStockOutsInputSchema,
    outputSchema: PredictStockOutsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
