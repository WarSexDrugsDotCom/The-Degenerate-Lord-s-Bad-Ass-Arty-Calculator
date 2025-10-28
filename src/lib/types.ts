import { z } from 'zod';
import type { FiringSolutionReportOutput } from '@/ai/flows/refine-firing-solution';

export const FormSchema = z.object({
  weaponSystem: z.string().min(1, "Weapon system is required."),
  targetCoordinates: z.string().min(1, "Target coordinates are required."),
  weaponCoordinates: z.string().min(1, "Weapon coordinates are required."),
  elevation: z.coerce.number().min(0, "Elevation must be a positive number."),
  targetElevation: z.coerce.number().min(0, "Target elevation must be a positive number."),
  ammunitionType: z.string().min(1, "Ammunition type is required."),
  charge: z.string().min(1, "Charge is required."),
  projectileType: z.string().min(1, "Projectile type is required."),
  meteorologicalData: z.string().min(1, "Meteorological data is required."),
  refineWithAI: z.boolean(),
});

export interface FiringSolution {
  elevation: number;
  azimuth: number;
  timeOfFlight: number;
  range: number;
}

export type FiringSolutionReport = FiringSolutionReportOutput;
