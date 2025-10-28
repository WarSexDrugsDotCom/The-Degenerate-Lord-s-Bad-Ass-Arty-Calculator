
'use server';

import { generateFiringSolutionReport, FiringSolutionReportInput, FiringSolutionReportOutput } from '@/ai/flows/refine-firing-solution';

export async function getFiringSolutionReport(input: FiringSolutionReportInput): Promise<FiringSolutionReportOutput | { error: string }> {
  try {
    const output = await generateFiringSolutionReport(input);
    return output;
  } catch (e: any) {
    console.error(e);
    return { error: e.message || 'An unknown error occurred while generating the solution report.' };
  }
}
