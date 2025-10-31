import { z } from 'zod';
import type { FiringSolutionReportOutput } from '@/ai/flows/refine-firing-solution';

const latLonSchema = z.object({
  coordinateSystem: z.literal('latlon'),
  weaponLat: z.coerce.number().min(-90, 'Invalid Latitude').max(90, 'Invalid Latitude'),
  weaponLon: z.coerce.number().min(-180, 'Invalid Longitude').max(180, 'Invalid Longitude'),
  targetLat: z.coerce.number().min(-90, 'Invalid Latitude').max(90, 'Invalid Latitude'),
  targetLon: z.coerce.number().min(-180, 'Invalid Longitude').max(180, 'Invalid Longitude'),
  weaponMgrs: z.string().optional(),
  targetMgrs: z.string().optional(),
});

const mgrsSchema = z.object({
    coordinateSystem: z.literal('mgrs'),
    weaponLat: z.coerce.number().optional(),
    weaponLon: z.coerce.number().optional(),
    targetLat: z.coerce.number().optional(),
    targetLon: z.coerce.number().optional(),
    weaponMgrs: z.string().min(1, 'MGRS is required.'),
    targetMgrs: z.string().min(1, 'MGRS is required.'),
});

export const FormSchema = z.object({
    weaponSystem: z.string().min(1, "Weapon system is required."),
    elevation: z.coerce.number().min(0, "Elevation must be a positive number."),
    targetElevation: z.coerce.number().min(0, "Target elevation must be a positive number."),
    ammunitionType: z.string().min(1, "Ammunition type is required."),
    charge: z.string().min(1, "Charge is required."),
    projectileType: z.string().min(1, "Projectile type is required."),
    meteorologicalData: z.string().min(1, "Meteorological data is required."),
    refineWithAI: z.boolean(),
  }).and(z.discriminatedUnion('coordinateSystem', [latLonSchema, mgrsSchema]));

export type FormValues = z.infer<typeof FormSchema>;

export interface FiringSolution {
  elevation: number;
  azimuth: number;
  timeOfFlight: number;
  range: number;
}

export type FiringSolutionReport = FiringSolutionReportOutput;
