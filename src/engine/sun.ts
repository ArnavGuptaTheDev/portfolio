import { getTimes } from 'suncalc';
import { FIXED_STARTS, PHASES, type PhaseId } from './phases';

export interface Windows {
  starts: Record<PhaseId, number>;
  /** Minutes after local midnight. */
  sunrise: number;
  sunset: number;
  source: 'suncalc' | 'fixed';
}

// Rough coordinates for common zones. Accuracy to a few degrees is plenty:
// we only want sunrise/sunset within ~15 minutes.
const ZONES: Record<string, [number, number]> = {
  'Asia/Kolkata': [26.8, 80.9], 'Asia/Calcutta': [26.8, 80.9], 'Asia/Kathmandu': [27.7, 85.3],
  'Asia/Dhaka': [23.8, 90.4], 'Asia/Karachi': [24.9, 67], 'Asia/Colombo': [6.9, 79.9],
  'Asia/Dubai': [25.2, 55.3], 'Asia/Riyadh': [24.7, 46.7], 'Asia/Tehran': [35.7, 51.4],
  'Asia/Singapore': [1.35, 103.8], 'Asia/Kuala_Lumpur': [3.1, 101.7], 'Asia/Bangkok': [13.8, 100.5],
  'Asia/Jakarta': [-6.2, 106.8], 'Asia/Manila': [14.6, 121], 'Asia/Ho_Chi_Minh': [10.8, 106.7],
  'Asia/Shanghai': [31.2, 121.5], 'Asia/Hong_Kong': [22.3, 114.2], 'Asia/Taipei': [25, 121.5],
  'Asia/Seoul': [37.6, 127], 'Asia/Tokyo': [35.7, 139.7], 'Asia/Jerusalem': [31.8, 35.2],
  'Europe/London': [51.5, -0.1], 'Europe/Dublin': [53.3, -6.3], 'Europe/Lisbon': [38.7, -9.1],
  'Europe/Madrid': [40.4, -3.7], 'Europe/Paris': [48.9, 2.35], 'Europe/Brussels': [50.8, 4.35],
  'Europe/Amsterdam': [52.4, 4.9], 'Europe/Berlin': [52.5, 13.4], 'Europe/Zurich': [47.4, 8.5],
  'Europe/Rome': [41.9, 12.5], 'Europe/Vienna': [48.2, 16.4], 'Europe/Prague': [50.1, 14.4],
  'Europe/Warsaw': [52.2, 21], 'Europe/Stockholm': [59.3, 18.1], 'Europe/Oslo': [59.9, 10.8],
  'Europe/Copenhagen': [55.7, 12.6], 'Europe/Helsinki': [60.2, 24.9], 'Europe/Athens': [38, 23.7],
  'Europe/Istanbul': [41, 29], 'Europe/Kiev': [50.5, 30.5], 'Europe/Kyiv': [50.5, 30.5], 'Europe/Moscow': [55.8, 37.6],
  'Africa/Cairo': [30, 31.2], 'Africa/Lagos': [6.5, 3.4], 'Africa/Nairobi': [-1.3, 36.8],
  'Africa/Johannesburg': [-26.2, 28], 'Africa/Casablanca': [33.6, -7.6],
  'America/New_York': [40.7, -74], 'America/Toronto': [43.7, -79.4], 'America/Chicago': [41.9, -87.6],
  'America/Denver': [39.7, -105], 'America/Phoenix': [33.4, -112], 'America/Los_Angeles': [34.1, -118.2],
  'America/Vancouver': [49.3, -123.1], 'America/Anchorage': [61.2, -149.9], 'America/Mexico_City': [19.4, -99.1],
  'America/Bogota': [4.7, -74.1], 'America/Lima': [-12, -77], 'America/Santiago': [-33.4, -70.7],
  'America/Sao_Paulo': [-23.5, -46.6], 'America/Argentina/Buenos_Aires': [-34.6, -58.4],
  'Pacific/Honolulu': [21.3, -157.9], 'Pacific/Auckland': [-36.8, 174.8],
  'Australia/Sydney': [-33.9, 151.2], 'Australia/Melbourne': [-37.8, 145], 'Australia/Brisbane': [-27.5, 153],
  'Australia/Perth': [-31.95, 115.9], 'Australia/Adelaide': [-34.9, 138.6],
};

const REGION_LAT: Record<string, number> = {
  Europe: 50, America: 35, Asia: 28, Africa: 5, Australia: -30, Pacific: -15, Atlantic: 35, Indian: -10,
};

export function guessCoords(timeZone?: string, offsetMinutes?: number): [number, number] | null {
  if (!timeZone) return null;
  if (ZONES[timeZone]) return ZONES[timeZone];
  const lat = REGION_LAT[timeZone.split('/')[0]];
  if (lat === undefined || offsetMinutes === undefined) return null;
  // The zone's UTC offset puts its longitude within ~15°.
  return [lat, (-offsetMinutes / 60) * 15];
}

const minutesOf = (d: Date) => d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
const wrap = (m: number) => ((m % 1440) + 1440) % 1440;

export function fixedWindows(): Windows {
  return { starts: { ...FIXED_STARTS }, sunrise: 6 * 60, sunset: 18 * 60 + 40, source: 'fixed' };
}

/**
 * Stretches the six windows around today's real sun:
 * dawn = sunrise ±60m, golden hour starts 2.5h before sunset, dusk runs to
 * ~50m after sunset (end of nautical twilight), midnight starts 45m before
 * solar midnight. Falls back to the fixed table in polar day/night or when
 * any window would collapse below 30 minutes.
 */
export function computeWindows(date: Date, coords: [number, number] | null): Windows {
  if (!coords) return fixedWindows();
  const noonish = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const t = getTimes(noonish, coords[0], coords[1]);
  const { sunrise, sunset, solarNoon, nadir } = t;
  if (!sunrise || !sunset || [sunrise, sunset, solarNoon, nadir].some((d) => Number.isNaN(d.getTime()))) return fixedWindows();

  return windowsFromSun(minutesOf(sunrise), minutesOf(sunset), minutesOf(solarNoon), minutesOf(nadir));
}

export function windowsFromSun(sunrise: number, sunset: number, noon: number, nadir: number): Windows {
  const starts: Record<PhaseId, number> = {
    dawn: wrap(sunrise - 60),
    morning: wrap(sunrise + 60),
    day: wrap(noon - 60),
    dusk: wrap(sunset - 150),
    night: wrap(sunset + 50),
    midnight: wrap(nadir - 45),
  };

  let total = 0;
  for (let i = 0; i < PHASES.length; i++) {
    const len = wrap(starts[PHASES[(i + 1) % PHASES.length]] - starts[PHASES[i]]);
    if (len < 30) return fixedWindows();
    total += len;
  }
  if (Math.round(total) !== 1440) return fixedWindows();
  return { starts, sunrise, sunset, source: 'suncalc' };
}
