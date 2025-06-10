'use server';
/**
 * @fileOverview AI flow for providing smart reorder suggestions based on sales data.
 *
 * - getSmartReorderSuggestions - A function that generates reorder suggestions.
 * - SmartReorderSuggestionsInput - The input type for the getSmartReorderSuggestions function.
 * - SmartReorderSuggestionsOutput - The return type for the getSmartReorderSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartReorderSuggestionsInputSchema = z.object({
  productId: z.string().describe('The ID of the product to reorder.'),
  productName: z.string().describe('The name of the product.'),
  currentStock: z.number().describe('The current stock level of the product.'),
  salesVelocity: z
    .number()
    .describe(
      'The average number of units sold per day/week/month, depending on the timeFrame.'
    ),
  historicalSalesData: z
    .string()
    .describe(
      'JSON string of historical sales data, including dates and quantities sold.'
    ),
  timeFrame: z
    .enum(['daily', 'weekly', 'monthly'])
    .describe('The time frame for sales velocity calculation.'),
  supplierLeadTimeDays: z
    .number()
    .optional()
    .describe(
      'The number of days it takes for the supplier to deliver the product after an order is placed. If not available, the system should still provide a suggestion without considering lead time.'
    ),
});

export type SmartReorderSuggestionsInput = z.infer<
  typeof SmartReorderSuggestionsInputSchema
>;

const SmartReorderSuggestionsOutputSchema = z.object({
  reorderQuantity: z
    .number()
    .describe(
      'The suggested quantity to reorder, based on sales velocity, historical trends, and supplier lead time.'
    ),
  lowStockAlert: z
    .boolean()
    .describe(
      'Whether a low stock alert should be triggered based on current stock levels and sales velocity.'
    ),
  reasoning: z
    .string()
    .describe(
      'Explanation of how reorder quantity was determined, the considerations made, and assumptions used.'
    ),
});

export type SmartReorderSuggestionsOutput = z.infer<
  typeof SmartReorderSuggestionsOutputSchema
>;

export async function getSmartReorderSuggestions(
  input: SmartReorderSuggestionsInput
): Promise<SmartReorderSuggestionsOutput> {
  return smartReorderSuggestionsFlow(input);
}

const smartReorderSuggestionsPrompt = ai.definePrompt({
  name: 'smartReorderSuggestionsPrompt',
  input: {schema: SmartReorderSuggestionsInputSchema},
  output: {schema: SmartReorderSuggestionsOutputSchema},
  prompt: `You are an AI assistant designed to help store managers determine optimal reorder quantities for products to prevent stockouts.

  Based on the provided data, analyze the sales velocity, historical sales trends, and supplier lead time (if available) to suggest an appropriate reorder quantity.

  Consider these factors when determining the reorder quantity:
  - Sales Velocity: The rate at which the product is selling.
  - Historical Sales Data: Any seasonal trends or sales spikes that may affect demand.
  - Supplier Lead Time: The time it takes to receive the product after placing an order. If not available, make your best suggestion without it.
  - Safety Stock: Maintain a small safety stock to buffer against unexpected demand surges.

  Determine if a low stock alert should be triggered based on current stock and sales velocity. A low stock alert should be triggered if the current stock is only enough to cover sales for a few days (e.g., 3-7 days, depending on the product). If a timeFrame of weekly is provided, use weeks instead of days.

  Provide a clear explanation of how you arrived at the reorder quantity, the considerations you made, and any assumptions you used.

  Here is the product information:
  Product ID: {{{productId}}}
  Product Name: {{{productName}}}
  Current Stock: {{{currentStock}}}
  Sales Velocity ({{{timeFrame}}}): {{{salesVelocity}}}
  Historical Sales Data: {{{historicalSalesData}}}
  Supplier Lead Time (days): {{#if supplierLeadTimeDays}}{{{supplierLeadTimeDays}}}{{else}}Not Available{{/if}}

  Respond with the reorder quantity, low stock alert status, and your reasoning, in JSON format:
  {
  "reorderQuantity": number,
  "lowStockAlert": boolean,
  "reasoning": string
  }
  `,
});

const smartReorderSuggestionsFlow = ai.defineFlow(
  {
    name: 'smartReorderSuggestionsFlow',
    inputSchema: SmartReorderSuggestionsInputSchema,
    outputSchema: SmartReorderSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await smartReorderSuggestionsPrompt(input);
    return output!;
  }
);
