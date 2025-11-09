import type { z } from 'zod';
import type { FiringSolution, FormValues } from './types';
import mgrs from 'mgrs';

const GRAVITY = 9.80665; // m/s^2

interface WeaponData {
    muzzleVelocities: Record<string, number>;
    ammo: string[];
    projectiles: string[];
    charges: string[];
    chargeLabel: string;
}

export const WEAPON_SYSTEMS: Record<string, WeaponData> = {
    'M777 Howitzer': {
        muzzleVelocities: { 'Green': 381, 'White': 563, 'Red': 827 },
        ammo: ['M795 HE', 'M549 HERA', 'Excalibur'],
        projectiles: ['Standard', 'Base Bleed', 'Rocket Assisted'],
        charges: ['Green', 'White', 'Red'],
        chargeLabel: 'Charge'
    },
    'AS-90': {
        muzzleVelocities: { 'Green': 381, 'White': 563, 'Red': 827 },
        ammo: ['L15 HE', 'M107 HE'],
        projectiles: ['Standard', 'Base Bleed'],
        charges: ['Green', 'White', 'Red'],
        chargeLabel: 'Charge'
    },
    'M109 Paladin': {
        muzzleVelocities: { 'Green': 381, 'White': 563, 'Red': 827 },
        ammo: ['M795 HE', 'M549 HERA'],
        projectiles: ['Standard', 'Rocket Assisted'],
        charges: ['Green', 'White', 'Red'],
        chargeLabel: 'Charge'
    },
    'CAESAR': {
        muzzleVelocities: { 'Charge 1': 350, 'Charge 2': 550, 'Charge 3': 930 },
        ammo: ['LU 211 HE-BB', 'OE 155 F1'],
        projectiles: ['Standard', 'Base Bleed'],
        charges: ['Charge 1', 'Charge 2', 'Charge 3'],
        chargeLabel: 'Charge'
    },
    '60mm Mortar': {
        muzzleVelocities: { 'Ring 0': 70, 'Ring 1': 100, 'Ring 2': 130, 'Ring 3': 150 },
        ammo: ['M720 HE', 'M888 HE'],
        projectiles: ['Standard'],
        charges: ['Ring 0', 'Ring 1', 'Ring 2', 'Ring 3'],
        chargeLabel: 'Charge Ring'
    },
    '81mm Mortar': {
        muzzleVelocities: { 'Ring 0': 80, 'Ring 1': 120, 'Ring 2': 160, 'Ring 3': 200, 'Ring 4': 240, 'Ring 5': 270 },
        ammo: ['M821 HE', 'M889A1 HE'],
        projectiles: ['Standard'],
        charges: ['Ring 0', 'Ring 1', 'Ring 2', 'Ring 3', 'Ring 4', 'Ring 5'],
        chargeLabel: 'Charge Ring'
    },
    '120mm Mortar': {
        muzzleVelocities: { 'Ring 1': 122, 'Ring 2': 174, 'Ring 3': 223, 'Ring 4': 267 },
        ammo: ['M934 HE', 'M929 Smoke'],
        projectiles: ['Standard'],
        charges: ['Ring 1', 'Ring 2', 'Ring 3', 'Ring 4'],
        chargeLabel: 'Charge Ring'
    },
};

/**
 * Validates and parses a coordinate string.
 * @param coordString "lat, lon"
 * @returns [lat: number, lon: number]
 * @throws Error if format is invalid
 */
function parseCoordinates(coordString: string): [number, number] {
    const parts = coordString.split(',').map(s => s.trim());
    if (parts.length !== 2) {
        throw new Error('Invalid coordinate format. Use "lat, lon".');
    }
    const lat = parseFloat(parts[0]);
    const lon = parseFloat(parts[1]);
    if (isNaN(lat) || isNaN(lon)) {
        throw new Error('Invalid coordinate format. Latitude and Longitude must be numbers.');
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        throw new Error('Invalid coordinate values. Latitude must be -90 to 90, Longitude -180 to 180.');
    }
    return [lat, lon];
}

/**
 * Converts MGRS to a Lat/Lon string, or validates a Lat/Lon string.
 * @param system The coordinate system used ('latlon' or 'mgrs').
 * @param latlon The Lat/Lon string.
 * @param mgrsStr The MGRS string.
 * @returns A validated "lat, lon" string.
 */
export function getLatLonString(system: 'latlon' | 'mgrs' | 'manual', lat: number | undefined, lon: number | undefined, mgrsStr: string | undefined): string | null {
    if (system === 'manual') return null;

    if (system === 'mgrs') {
        if (!mgrsStr) throw new Error('MGRS coordinates are required.');
        try {
            const [lon, lat] = mgrs.toPoint(mgrsStr);
            return `${lat}, ${lon}`;
        } catch (e) {
            throw new Error('Invalid MGRS coordinate string.');
        }
    }
    
    if (typeof lat === 'undefined' || typeof lon === 'undefined') {
        throw new Error('Latitude and Longitude are required.');
    }
    const latlonStr = `${lat}, ${lon}`;
    parseCoordinates(latlonStr); // This will throw an error if invalid
    return latlonStr;
}


/**
 * Calculates the distance between two lat/lon points in meters (Haversine formula).
 * @param coord1 "lat, lon"
 * @param coord2 "lat, lon"
 * @returns distance in meters
 */
export function getDistance(coord1: string | null, coord2: string | null): number | null {
    if (!coord1 || !coord2) return null;
    try {
        const [lat1, lon1] = parseCoordinates(coord1);
        const [lat2, lon2] = parseCoordinates(coord2);

        const R = 6371e3; // metres
        const φ1 = lat1 * Math.PI/180; // φ, λ in radians
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        const d = R * c; // in metres
        return d;
    } catch (e: any) {
        // If parsing fails, re-throw the specific error from parseCoordinates
        if (e.message.startsWith('Invalid coordinate')) {
            throw e;
        }
        // For other unexpected errors, return a simulated range.
        return (Math.random() * 20000) + 2000;
    }
}

/**
 * Calculates the initial bearing (azimuth) from coord1 to coord2.
 * @param coord1 "lat, lon"
 * @param coord2 "lat, lon"
 * @returns Azimuth in degrees.
 */
export function getAzimuth(coord1: string | null, coord2: string | null): number | null {
    if (!coord1 || !coord2) return null;
    const [lat1, lon1] = parseCoordinates(coord1);
    const [lat2, lon2] = parseCoordinates(coord2);

    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const λ1 = lon1 * Math.PI / 180;
    const λ2 = lon2 * Math.PI / 180;

    const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
    const θ = Math.atan2(y, x);
    const bearing = (θ * 180 / Math.PI + 360) % 360; // in degrees
    return bearing;
}


/**
 * Simulates a ballistic calculation.
 * This is a simplified model for demonstration purposes and does not represent
 * a real-world, accurate firing solution. It uses basic physics in a vacuum.
 *
 * @param data - The form input data.
 * @returns A plausible but simulated firing solution.
 */
export function calculateFiringSolution(data: FormValues): FiringSolution {
  const weaponData = WEAPON_SYSTEMS[data.weaponSystem];
  if (!weaponData) {
      throw new Error(`Invalid weapon system: ${data.weaponSystem}`);
  }

  const muzzleVelocity = weaponData.muzzleVelocities[data.charge];
  if (!muzzleVelocity) {
      throw new Error(`Invalid charge "${data.charge}" for weapon system "${data.weaponSystem}"`);
  }

  let range: number | null;
  let azimuth: number | null;

  if (data.coordinateSystem === 'manual') {
    range = data.manualRange;
    azimuth = data.manualAzimuth;
  } else {
    const weaponCoords = getLatLonString(data.coordinateSystem, data.weaponLat, data.weaponLon, data.weaponMgrs);
    const targetCoords = getLatLonString(data.coordinateSystem, data.targetLat, data.targetLon, data.targetMgrs);
    range = getDistance(weaponCoords, targetCoords);
    azimuth = getAzimuth(weaponCoords, targetCoords);
  }

  if (range === null || azimuth === null) {
    throw new Error('Could not determine range and azimuth from the provided inputs.');
  }

  // Calculate Elevation (using simple vacuum ballistic equation)
  // angle = 0.5 * asin(g*x / v^2)
  const angleRad = 0.5 * Math.asin((GRAVITY * range) / (muzzleVelocity ** 2));
  
  // Handle cases where range is too far for the given velocity
  if (isNaN(angleRad)) {
    throw new Error('Target is out of range for the selected weapon system and charge.');
  }

  const elevation = angleRad * (180 / Math.PI); // Convert to degrees

  // Calculate Time of Flight
  // t = x / (v * cos(theta))
  const timeOfFlight = range / (muzzleVelocity * Math.cos(angleRad));

  return {
    elevation: elevation,
    azimuth: azimuth,
    timeOfFlight: timeOfFlight,
    range: range,
  };
}


/**
 * Simulates fetching weather data from an online source.
 * @param coordinates - The coordinates to fetch weather for.
 * @returns A promise that resolves to a string of mock weather data.
 */
export async function fetchWeatherData(coordinates: string): Promise<string> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Validate coordinates before creating the string.
  const [lat, lon] = parseCoordinates(coordinates);

  const windSpeed = (Math.random() * 15 + 5).toFixed(1); // 5-20 kph
  const windDir = Math.floor(Math.random() * 360);
  const temp = (Math.random() * 20 + 5).toFixed(1); // 5-25 C
  const pressure = (Math.random() * 50 + 980).toFixed(1); // 980-1030 hPa

  return `
Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}
Temperature: ${temp}°C
Pressure: ${pressure} hPa
Wind: ${windSpeed} kph from ${windDir}°
`;
}


/**
 * Fetches elevation data from OpenMeteo API.
 * @param coordinates - The coordinates to fetch elevation for (e.g., "40.7128, -74.0060").
 * @returns A promise that resolves to the elevation in meters.
 */
export async function fetchElevationData(coordinates: string): Promise<number> {
  try {
    const [lat, lon] = parseCoordinates(coordinates);
    
    const response = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`);
    if (!response.ok) {
        // Provide a more specific error for failed API calls
        const errorBody = await response.text();
        throw new Error(`API Error (${response.status}): ${errorBody || response.statusText}`);
    }
    const data = await response.json();
    if (!data.elevation || data.elevation.length === 0) {
      throw new Error('Could not retrieve elevation from API response.');
    }
    return Math.round(data.elevation[0]);
  } catch (error) {
    // Re-throw the error so it can be caught and displayed in the UI
    if (error instanceof Error) {
        throw error;
    }
    // Fallback for unknown error types
    throw new Error('An unknown error occurred while fetching elevation.');
  }
}
