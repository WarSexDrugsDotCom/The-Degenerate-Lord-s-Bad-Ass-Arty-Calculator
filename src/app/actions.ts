
'use server';

import { generateFiringSolutionReport, FiringSolutionReportInput, FiringSolutionReportOutput } from '@/ai/flows/refine-firing-solution';

export async function getFiringSolutionReport(input: FiringSolutionReportInput): Promise<FiringSolutionReportOutput | { error: string }> {
  try {
    // All coordinate handling and calculations (range, azimuth) are now done on the client.
    // This server action only receives non-sensitive, relative data and passes it to the AI.
    const output = await generateFiringSolutionReport(input);
    return output;
  } catch (e: any) {
    // The 'input' object no longer contains sensitive coordinate data, so it is safer to log in case of an error.
    console.error('Error generating firing solution report for input:', input, e);
    return { error: e.message || 'An unknown error occurred while generating the solution report.' };
  }
}
