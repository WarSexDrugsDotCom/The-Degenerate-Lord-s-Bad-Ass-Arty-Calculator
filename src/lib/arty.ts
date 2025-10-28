import type { z } from 'zod';
import type { FiringSolution, FormSchema } from './types';

const GRAVITY = 9.80665; // m/s^2

// Map weapon systems to muzzle velocities (in m/s) for a standard round.
const MUZZLE_VELOCITIES: Record<string, number> = {
  'M777 Howitzer': 827,
  'AS-90': 827,
  'M109 Paladin': 827,
  'CAESAR': 930,
};

/**
 * Calculates the distance between two lat/lon points in meters (Haversine formula).
 * @param coord1 "lat, lon"
 * @param coord2 "lat, lon"
 * @returns distance in meters
 */
export function getDistance(coord1: string, coord2: string): number {
    const [lat1, lon1] = coord1.split(',').map(s => parseFloat(s.trim()));
    const [lat2, lon2] = coord2.split(',').map(s => parseFloat(s.trim()));

    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
        // Return a simulated range if coordinates are not valid numbers
        return (Math.random() * 20000) + 10000;
    }

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
}


/**
 * Simulates a ballistic calculation.
 * This is a simplified model for demonstration purposes and does not represent
 * a real-world, accurate firing solution. It uses basic physics in a vacuum.
 *
 * @param data - The form input data.
 * @returns A plausible but simulated firing solution.
 */
export function calculateFiringSolution(data: z.infer<typeof FormSchema>): FiringSolution {
  const muzzleVelocity = MUZZLE_VELOCITIES[data.weaponSystem] || 827;
  
  // 1. Calculate Range from coordinates
  const range = getDistance(data.weaponCoordinates, data.targetCoordinates);

  // 2. Simulate Azimuth
  // Again, would be calculated from coordinates.
  const azimuth = ((parseInt(data.targetCoordinates.slice(-2)) / 100) * 360);

  // 3. Calculate Elevation (using simple vacuum ballistic equation)
  // angle = 0.5 * asin(g*x / v^2)
  const angleRad = 0.5 * Math.asin((GRAVITY * range) / (muzzleVelocity ** 2));
  
  // Handle cases where range is too far for the given velocity
  if (isNaN(angleRad)) {
    throw new Error('Target is out of range for the selected weapon system and charge.');
  }

  const elevation = angleRad * (180 / Math.PI); // Convert to degrees

  // 4. Calculate Time of Flight
  // t = x / (v * cos(theta))
  const timeOfFlight = range / (muzzleVelocity * Math.cos(angleRad));

  return {
    elevation: elevation + Math.random() * 0.5, // Add some randomness
    azimuth: azimuth + Math.random() * 0.5, // Add some randomness
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

  const windSpeed = (Math.random() * 15 + 5).toFixed(1); // 5-20 kph
  const windDir = Math.floor(Math.random() * 360);
  const temp = (Math.random() * 20 + 5).toFixed(1); // 5-25 C
  const pressure = (Math.random() * 50 + 980).toFixed(1); // 980-1030 hPa

  return `
Coordinates: ${coordinates}
Temperature: ${temp}°C
Pressure: ${pressure} hPa
Wind: ${windSpeed} kph from ${windDir}°
`;
}


/**
 * Fetches elevation data from Open Topo Data API.
 * @param coordinates - The coordinates to fetch elevation for (e.g., "40.7128, -74.0060").
 * @returns A promise that resolves to the elevation in meters.
 */
export async function fetchElevationData(coordinates: string): Promise<number> {
  try {
    const [lat, lon] = coordinates.split(',').map(s => s.trim());
    if (!lat || !lon) {
      throw new Error('Invalid coordinates for elevation fetch.');
    }
    const response = await fetch(`https://api.opentopodata.org/v1/ned10m?locations=${lat},${lon}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch elevation data: ${response.statusText}`);
    }
    const data = await response.json();
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw new Error('Could not retrieve elevation from API response.');
    }
    return Math.round(data.results[0].elevation);
  } catch (error) {
    console.error("Error fetching elevation data:", error);
    throw new Error("Could not fetch elevation data. Please enter it manually.");
  }
}
