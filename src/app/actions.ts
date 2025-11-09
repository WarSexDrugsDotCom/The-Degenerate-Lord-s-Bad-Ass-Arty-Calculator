
'use server';

import { generateFiringSolutionReport, FiringSolutionReportInput, FiringSolutionReportOutput } from '@/ai/flows/refine-firing-solution';

export async function getFiringSolutionReport(input: FiringSolutionReportInput): Promise<FiringSolutionReportOutput | { error: string }> {
  try {
    // All coordinate handling and calculations (range, azimuth) are now done on the client.
    // This server action only receives non-sensitive, relative data and passes it to the AI.
    const output = await generateFiringSolutionReport(input);
    return output;
  } catch (e: any) {
    // The 'input' object no longer contains sensitive coordinate data, making it safe to log for debugging.
    // This provides a "worked" or "didn't work" status without exposing private information.
    console.error('Error generating firing solution report. The following non-sensitive input was used:', input, e);
    return { error: e.message || 'An unknown error occurred while generating the solution report.' };
  }
}
