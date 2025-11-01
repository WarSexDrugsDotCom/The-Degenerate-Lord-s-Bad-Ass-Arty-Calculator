
'use server';

import { generateFiringSolutionReport, FiringSolutionReportInput, FiringSolutionReportOutput } from '@/ai/flows/refine-firing-solution';
import { getLatLonString, getDistance, getAzimuth } from '@/lib/arty';
import type { FormValues } from '@/lib/types';


export async function getFiringSolutionReport(input: Omit<FiringSolutionReportInput, 'range' | 'initialAzimuth'>, formData: FormValues): Promise<FiringSolutionReportOutput | { error: string }> {
  try {
    const weaponCoords = getLatLonString(formData.coordinateSystem, formData.weaponLat, formData.weaponLon, formData.weaponMgrs);
    const targetCoords = getLatLonString(formData.coordinateSystem, formData.targetLat, formData.targetLon, formData.targetMgrs);
    
    const range = getDistance(weaponCoords, targetCoords);
    const azimuth = getAzimuth(weaponCoords, targetCoords);

    const aiInput: FiringSolutionReportInput = {
        ...input,
        range: range,
        initialAzimuth: azimuth,
    };

    const output = await generateFiringSolutionReport(aiInput);
    return output;
  } catch (e: any) {
    // console.error(e); // Removed to prevent logging of sensitive data
    return { error: e.message || 'An unknown error occurred while generating the solution report.' };
  }
}
