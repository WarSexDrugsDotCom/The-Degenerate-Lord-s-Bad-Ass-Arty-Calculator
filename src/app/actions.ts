
'use server';

import { refineFiringSolution, RefineFiringSolutionInput, RefineFiringSolutionOutput } from '@/ai/flows/refine-firing-solution';

export async function getRefinedSolution(input: RefineFiringSolutionInput): Promise<RefineFiringSolutionOutput | { error: string }> {
  try {
    const output = await refineFiringSolution(input);
    return output;
  } catch (e: any) {
    console.error(e);
    return { error: e.message || 'An unknown error occurred while refining the solution.' };
  }
}
