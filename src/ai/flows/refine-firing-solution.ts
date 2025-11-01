
'use server';

/**
 * @fileOverview A flow that uses generative AI to generate a detailed firing solution report.
 *
 * - generateFiringSolutionReport - A function that creates the firing solution report using AI.
 * - FiringSolutionReportInput - The input type for the generateFiringSolutionReport function.
 * - FiringSolutionReportOutput - The return type for the generateFiringSolutionReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FiringSolutionReportInputSchema = z.object({
  weaponSystem: z
    .string()
    .describe('The specific NATO indirect fire weapon system (e.g., M777, 81mm Mortar).'),
  elevation: z.number().describe('Elevation of the weapon in meters.'),
  targetElevation: z.number().describe('Elevation of the target in meters.'),
  ammunitionType: z.string().describe('Type of ammunition being used.'),
  charge: z.string().describe('The charge or charge ring being used.'),
  projectileType: z.string().describe('The type of projectile being fired.'),
  meteorologicalData: z.string().describe('Meteorological data relevant to the firing solution.'),
  initialElevation: z.number().describe('Initial elevation firing solution in degrees.'),
  initialAzimuth: z.number().describe('Initial azimuth firing solution in degrees.'),
  timeOfFlight: z.number().describe('Time of flight of the projectile in seconds.'),
  range: z.number().describe('Range to the target in meters.'),
});
export type FiringSolutionReportInput = z.infer<typeof FiringSolutionReportInputSchema>;

const FiringSolutionReportOutputSchema = z.object({
  report: z.string().describe('The full, formatted firing solution report as a single string.'),
});
export type FiringSolutionReportOutput = z.infer<typeof FiringSolutionReportOutputSchema>;

export async function generateFiringSolutionReport(
  input: FiringSolutionReportInput
): Promise<FiringSolutionReportOutput> {
  return generateFiringSolutionReportFlow(input);
}

const generateFiringSolutionPrompt = ai.definePrompt({
  name: 'generateFiringSolutionPrompt',
  input: {schema: FiringSolutionReportInputSchema},
  output: {schema: FiringSolutionReportOutputSchema},
  prompt: `You are an expert in artillery and ballistics. You are given an initial firing solution and mission parameters. Your task is to generate a complete, professional firing solution report in the format provided below. Convert degrees to mils where appropriate (1 degree = 17.777... mils). For mortars, the charge is referred to as a Charge Ring.

**Format:**
Weapon System: [Weapon System]
Projectiles: [Projectile Type] [Ammunition Type]
Charge: [Charge or Charge Ring]
Range to Target: [Range in meters] meters
Grid Azimuth: [Azimuth in mils] mils
Quadrant Elevation (QE): [Elevation in mils] mils
Time of Flight (TOF): Approximately [Time of flight] seconds
Meteorological Corrections Applied: [Summarize relevant MET data]
Site Picture: [Note any significant elevation difference between weapon and target]

**Mission Data:**
Weapon System: {{{weaponSystem}}}
Weapon Elevation: {{{elevation}}} meters
Target Elevation: {{{targetElevation}}} meters
Ammunition Type: {{{ammunitionType}}}
Charge: {{{charge}}}
Projectile Type: {{{projectileType}}}
Meteorological Data: {{{meteorologicalData}}}
Initial Elevation: {{{initialElevation}}} degrees
Initial Azimuth: {{{initialAzimuth}}} degrees
Time of Flight: {{{timeOfFlight}}} seconds
Range: {{{range}}} meters

Generate the report based on the mission data. If the range is too short for effective indirect fire (e.g., under 2000m for howitzers, under 100m for mortars), state that a standard indirect fire solution cannot be generated and provide a theoretical direct fire solution instead, including bearing in degrees.`,
});

const generateFiringSolutionReportFlow = ai.defineFlow(
  {
    name: 'generateFiringSolutionReportFlow',
    inputSchema: FiringSolutionReportInputSchema,
    outputSchema: FiringSolutionReportOutputSchema,
  },
  async input => {
    const {output} = await generateFiringSolutionPrompt(input);
    return output!;
  }
);
