
'use server';

import { generateFiringSolutionReport, FiringSolutionReportInput, FiringSolutionReportOutput } from '@/ai/flows/refine-firing-solution';
import { getLatLonString } from '@/lib/arty';
import type { FormValues } from '@/lib/types';


export async function getFiringSolutionReport(input: FiringSolutionReportInput, formData: FormValues): Promise<FiringSolutionReportOutput | { error: string }> {
  try {
    // We construct the AI input here to ensure coordinates are always Lat/Lon,
    // protecting MGRS data from being logged if an error occurs.
    const aiInput: FiringSolutionReportInput = {
        ...input,
        weaponCoordinates: getLatLonString(formData.coordinateSystem, formData.weaponLat, formData.weaponLon, formData.weaponMgrs),
        targetCoordinates: getLatLonString(formData.coordinateSystem, formData.targetLat, formData.targetLon, formData.targetMgrs),
    };

    const output = await generateFiringSolutionReport(aiInput);
    return output;
  } catch (e: any) {
    // console.error(e); // Removed to prevent logging of sensitive data
    return { error: e.message || 'An unknown error occurred while generating the solution report.' };
  }
}
