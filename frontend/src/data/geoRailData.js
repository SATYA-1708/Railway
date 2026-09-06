/**
 * RailFlow AI — Master Geographic Dataset for Indian Railways Leaflet Engine
 * Real WGS84 GPS Coordinates for stations, junction nodes, and track geometry.
 */

export const STATION_COORDINATES = {
  // Northern & Delhi Hub
  NDLS: { name: 'New Delhi', lat: 28.6431, lng: 77.2197, zone: 'NR', platforms: 16 },
  DLI: { name: 'Old Delhi', lat: 28.6606, lng: 77.2272, zone: 'NR', platforms: 16 },
  NZM: { name: 'Hazrat Nizamuddin', lat: 28.5888, lng: 77.2534, zone: 'NR', platforms: 7 },
  ANVT: { name: 'Anand Vihar Terminal', lat: 28.6500, lng: 77.3150, zone: 'NR', platforms: 7 },
  GZB: { name: 'Ghaziabad Jn', lat: 28.6534, lng: 77.4307, zone: 'NR', platforms: 6 },
  ALJN: { name: 'Aligarh Jn', lat: 27.8974, lng: 78.0880, zone: 'NCR', platforms: 7 },
  TDL: { name: 'Tundla Jn', lat: 27.2064, lng: 78.2415, zone: 'NCR', platforms: 5 },
  AGC: { name: 'Agra Cantt', lat: 27.1574, lng: 77.9904, zone: 'NCR', platforms: 6 },
  MTJ: { name: 'Mathura Jn', lat: 27.4924, lng: 77.6737, zone: 'NCR', platforms: 10 },
  GWL: { name: 'Gwalior Jn', lat: 26.2183, lng: 78.1828, zone: 'NCR', platforms: 4 },
  VGLJ: { name: 'V Lakshmibai Jhansi', lat: 25.4484, lng: 78.5685, zone: 'NCR', platforms: 8 },

  // Central / WCR Corridor
  BINA: { name: 'Bina Jn', lat: 24.1747, lng: 78.1866, zone: 'WCR', platforms: 5 },
  BPL: { name: 'Bhopal Jn', lat: 23.2599, lng: 77.4126, zone: 'WCR', platforms: 6 },
  RKMP: { name: 'Rani Kamlapati', lat: 23.2085, lng: 77.4384, zone: 'WCR', platforms: 5 },
  ET: { name: 'Itarsi Jn', lat: 22.6122, lng: 77.7618, zone: 'WCR', platforms: 8 },
  NGP: { name: 'Nagpur Jn', lat: 21.1524, lng: 79.0888, zone: 'CR', platforms: 8 },
  SEGM: { name: 'Sewagram Jn', lat: 20.7388, lng: 78.6014, zone: 'CR', platforms: 5 },
  CD: { name: 'Chandrapur', lat: 19.9572, lng: 79.2961, zone: 'CR', platforms: 3 },
  BPQ: { name: 'Balharshah', lat: 19.8519, lng: 79.3516, zone: 'CR', platforms: 5 },

  // South Central Corridor (SCR)
  SKZR: { name: 'Sirpur Kaghaznagar', lat: 19.3312, lng: 79.4827, zone: 'SCR', platforms: 3 },
  BPA: { name: 'Bellampalli', lat: 19.0686, lng: 79.4925, zone: 'SCR', platforms: 2 },
  MCI: { name: 'Manchiryal', lat: 18.8682, lng: 79.4589, zone: 'SCR', platforms: 3 },
  RDM: { name: 'Ramagundam', lat: 18.7611, lng: 79.4757, zone: 'SCR', platforms: 3 },
  PDPL: { name: 'Peddapalli Jn', lat: 18.6186, lng: 79.3789, zone: 'SCR', platforms: 3 },
  JMKT: { name: 'Jammikunta', lat: 18.2831, lng: 79.4703, zone: 'SCR', platforms: 2 },
  KZJ: { name: 'Kazipet Jn', lat: 17.9784, lng: 79.5218, zone: 'SCR', platforms: 4 },
  WL: { name: 'Warangal', lat: 17.9689, lng: 79.5941, zone: 'SCR', platforms: 3 },
  MABD: { name: 'Mahbubabad', lat: 17.5982, lng: 80.0034, zone: 'SCR', platforms: 2 },
  DKJ: { name: 'Dornakal Jn', lat: 17.4475, lng: 80.1492, zone: 'SCR', platforms: 4 },
  KMT: { name: 'Khammam', lat: 17.2473, lng: 80.1514, zone: 'SCR', platforms: 3 },
  MDR: { name: 'Madhira', lat: 16.9214, lng: 80.3708, zone: 'SCR', platforms: 2 },
  BZA: { name: 'Vijayawada Jn', lat: 16.5062, lng: 80.6480, zone: 'SCR', platforms: 10 },
  TEL: { name: 'Tenali Jn', lat: 16.2435, lng: 80.6402, zone: 'SCR', platforms: 6 },
  GNT: { name: 'Guntur Jn', lat: 16.3067, lng: 80.4365, zone: 'SCR', platforms: 7 },
  CLX: { name: 'Chirala', lat: 15.8246, lng: 80.3522, zone: 'SCR', platforms: 3 },
  OGL: { name: 'Ongole', lat: 15.5057, lng: 80.0499, zone: 'SCR', platforms: 3 },
  NLR: { name: 'Nellore', lat: 14.4426, lng: 79.9865, zone: 'SCR', platforms: 4 },
  GDR: { name: 'Gudur Jn', lat: 14.1463, lng: 79.8504, zone: 'SCR', platforms: 4 },
  MAS: { name: 'Chennai Central', lat: 13.0827, lng: 80.2707, zone: 'SR', platforms: 12 },

  // Coastal Andhra & Godavari Corridor
  EE: { name: 'Eluru', lat: 16.7107, lng: 81.0952, zone: 'SCR', platforms: 3 },
  TDD: { name: 'Tadepalligudem', lat: 16.8142, lng: 81.5273, zone: 'SCR', platforms: 3 },
  NDD: { name: 'Nidadavolu Jn', lat: 16.9103, lng: 81.6702, zone: 'SCR', platforms: 3 },
  BVRT: { name: 'Bhimavaram Town', lat: 16.5414, lng: 81.5233, zone: 'SCR', platforms: 2 },
  BVRM: { name: 'Bhimavaram Jn', lat: 16.5388, lng: 81.5300, zone: 'SCR', platforms: 3 },
  RJY: { name: 'Rajahmundry', lat: 17.0005, lng: 81.7800, zone: 'SCR', platforms: 3 },
  SLO: { name: 'Samalkot Jn', lat: 17.0531, lng: 82.1678, zone: 'SCR', platforms: 3 },
  ANV: { name: 'Annavaram', lat: 17.2796, lng: 82.4042, zone: 'SCR', platforms: 3 },
  TUNI: { name: 'Tuni', lat: 17.3562, lng: 82.5484, zone: 'SCR', platforms: 3 },
  AKP: { name: 'Anakapalle', lat: 17.6913, lng: 83.0039, zone: 'SCR', platforms: 3 },
  DVD: { name: 'Duvvada', lat: 17.7089, lng: 83.1539, zone: 'ECoR', platforms: 4 },
  VSKP: { name: 'Visakhapatnam', lat: 17.7231, lng: 83.2986, zone: 'ECoR', platforms: 8 },

  // Western Trunk Corridor (Mumbai-Delhi)
  MMCT: { name: 'Mumbai Central', lat: 18.9696, lng: 72.8193, zone: 'WR', platforms: 5 },
  BVI: { name: 'Borivali', lat: 19.2291, lng: 72.8574, zone: 'WR', platforms: 10 },
  ST: { name: 'Surat', lat: 21.2049, lng: 72.8406, zone: 'WR', platforms: 4 },
  BRC: { name: 'Vadodara Jn', lat: 22.3107, lng: 73.1812, zone: 'WR', platforms: 7 },
  RTM: { name: 'Ratlam Jn', lat: 23.3441, lng: 75.0396, zone: 'WR', platforms: 7 },
  KOTA: { name: 'Kota Jn', lat: 25.2217, lng: 75.8648, zone: 'WCR', platforms: 5 },
  SWM: { name: 'Sawai Madhopur', lat: 25.9928, lng: 76.3683, zone: 'WCR', platforms: 4 },
  MTJ_W: { name: 'Mathura Jn (West)', lat: 27.4924, lng: 77.6737, zone: 'NCR', platforms: 10 },

  // Eastern Grand Chord (Delhi-Howrah)
  CNB: { name: 'Kanpur Central', lat: 26.4547, lng: 80.3507, zone: 'NCR', platforms: 10 },
  LKO: { name: 'Lucknow Charbagh', lat: 26.8322, lng: 80.9234, zone: 'NR', platforms: 9 },
  PRYJ: { name: 'Prayagraj Jn', lat: 25.4475, lng: 81.8290, zone: 'NCR', platforms: 10 },
  BSB: { name: 'Varanasi Jn', lat: 25.3284, lng: 82.9863, zone: 'NR', platforms: 9 },
  DDU: { name: 'Pt. DD Upadhyaya', lat: 25.2818, lng: 83.1189, zone: 'ECR', platforms: 8 },
  PNBE: { name: 'Patna Jn', lat: 25.6022, lng: 85.1376, zone: 'ECR', platforms: 10 },
  GAYA: { name: 'Gaya Jn', lat: 24.8037, lng: 84.9996, zone: 'ECR', platforms: 9 },
  DHN: { name: 'Dhanbad Jn', lat: 23.7915, lng: 86.4297, zone: 'ECR', platforms: 8 },
  ASN: { name: 'Asansol Jn', lat: 23.6871, lng: 86.9746, zone: 'ER', platforms: 7 },
  HWH: { name: 'Howrah Jn', lat: 22.5839, lng: 88.3426, zone: 'ER', platforms: 23 },

  // Hyderabad Deccan & Secunderabad Hub
  SC: { name: 'Secunderabad Jn', lat: 17.4334, lng: 78.5017, zone: 'SCR', platforms: 10 },
  HYB: { name: 'Hyderabad Deccan', lat: 17.3927, lng: 78.4682, zone: 'SCR', platforms: 6 }
};

/**
 * Real Multi-Point Railway Corridor Tracks
 */
export const RAIL_CORRIDOR_LINES = [
  // 1. GRAND TRUNK CORRIDOR (Delhi - Bhopal - Nagpur - Vijayawada - Chennai)
  {
    id: 'GRAND_TRUNK',
    name: 'Grand Trunk National Spine (Delhi ➔ Chennai)',
    color: '#06b6d4',
    dashArray: null,
    weight: 4,
    stations: [
      'NDLS', 'NZM', 'MTJ', 'AGC', 'GWL', 'VGLJ', 'BINA', 'BPL', 'ET',
      'NGP', 'SEGM', 'CD', 'BPQ', 'SKZR', 'BPA', 'MCI', 'RDM', 'PDPL',
      'JMKT', 'KZJ', 'WL', 'MABD', 'DKJ', 'KMT', 'MDR', 'BZA', 'TEL',
      'CLX', 'OGL', 'NLR', 'GDR', 'MAS'
    ]
  },

  // 2. WESTERN TRUNK CORRIDOR (Mumbai Central - Vadodara - Kota - Delhi)
  {
    id: 'WESTERN_TRUNK',
    name: 'Western High-Speed Trunk (Mumbai ➔ Delhi)',
    color: '#10b981',
    dashArray: null,
    weight: 4,
    stations: [
      'MMCT', 'BVI', 'ST', 'BRC', 'RTM', 'KOTA', 'SWM', 'MTJ', 'NDLS'
    ]
  },

  // 3. EASTERN GRAND CHORD (Delhi - Kanpur - Prayagraj - Pt. DDU - Howrah)
  {
    id: 'GRAND_CHORD',
    name: 'Eastern Grand Chord Trunk (Delhi ➔ Kolkata)',
    color: '#f59e0b',
    dashArray: null,
    weight: 4,
    stations: [
      'NDLS', 'GZB', 'ALJN', 'TDL', 'CNB', 'PRYJ', 'DDU', 'GAYA', 'DHN', 'ASN', 'HWH'
    ]
  },

  // 4. EAST COAST / GODAVARI CORRIDOR (Vijayawada - Rajahmundry - Vizag)
  {
    id: 'EAST_COAST',
    name: 'East Coast Mainline (Vijayawada ➔ Visakhapatnam)',
    color: '#3b82f6',
    dashArray: null,
    weight: 4,
    stations: [
      'BZA', 'EE', 'TDD', 'NDD', 'RJY', 'SLO', 'ANV', 'TUNI', 'AKP', 'DVD', 'VSKP'
    ]
  },

  // 5. HYDERABAD - SECUNDERABAD FEEDER BRANCH
  {
    id: 'HYB_FEEDER',
    name: 'Kazipet ➔ Secunderabad / Hyderabad Branch',
    color: '#a855f7',
    dashArray: '6, 6',
    weight: 3,
    stations: [
      'HYB', 'SC', 'KZJ'
    ]
  }
];

function findStationCoord(codeOrName) {
  if (!codeOrName) return null;
  const str = String(codeOrName).trim().toUpperCase();
  if (STATION_COORDINATES[str]) return STATION_COORDINATES[str];

  // Try matching by name
  for (const stn of Object.values(STATION_COORDINATES)) {
    if (stn.name.toUpperCase().includes(str) || str.includes(stn.name.toUpperCase())) {
      return stn;
    }
  }
  return null;
}

/**
 * Compute real/interpolated GPS position along a train's route timeline
 */
export function getTrainGeoLocation(train) {
  if (!train) return { lat: 28.6431, lng: 77.2197, heading: 0, currentStationName: 'New Delhi' };

  // Explicit live coordinates from API/telemetry
  if (typeof train.currentLat === 'number' && typeof train.currentLng === 'number' && train.currentLat !== 0) {
    return {
      lat: Number(train.currentLat.toFixed(4)),
      lng: Number(train.currentLng.toFixed(4)),
      heading: train.heading || 0,
      fromName: train.from,
      toName: train.to,
      section: train.activeSection || `${train.from} ➔ ${train.to}`
    };
  }

  const route = Array.isArray(train.routeTimeline) ? train.routeTimeline : [];
  const statusStr = typeof train.status === 'string' ? train.status.toLowerCase() : '';
  const isYetToStart = Boolean(
    train.isYetToStart ||
    (train.currentSpeed === 0 && (statusStr.includes('yet') || statusStr.includes('origin') || statusStr.includes('board'))) ||
    (!train.lastStation && train.currentSpeed === 0)
  );

  // If train is yet to start at origin, pin directly to origin coordinates
  if (isYetToStart && route.length > 0) {
    const origin = route[0];
    const originCoord = findStationCoord(origin.code) || findStationCoord(origin.name) || findStationCoord(train.from) || STATION_COORDINATES.VSKP;
    return {
      lat: originCoord.lat,
      lng: originCoord.lng,
      heading: 0,
      fromName: origin.name || train.from,
      toName: route[1]?.name || train.to,
      section: `Stationary at Origin (${origin.name || train.from})`
    };
  }

  // Next and last passed stations
  const nextStn = route.find(s => s.status === 'NEXT') || route[1] || route[0] || {};
  const lastStn = [...route].reverse().find(s => s.status === 'DEPARTED') || route[0] || {};

  const nextCode = nextStn?.code || train.nextStation?.match(/\(([^)]+)\)/)?.[1] || train.nextStation;
  const lastCode = lastStn?.code || train.lastStation?.match(/\(([^)]+)\)/)?.[1] || train.lastStation || train.from;

  const c1 = findStationCoord(lastCode) || findStationCoord(train.from) || STATION_COORDINATES.VSKP;
  const c2 = findStationCoord(nextCode) || findStationCoord(train.to) || STATION_COORDINATES.NDLS;

  const fraction = train.currentSpeed > 0 ? 0.5 : 0.05;
  const lat = c1.lat + (c2.lat - c1.lat) * fraction;
  const lng = c1.lng + (c2.lng - c1.lng) * fraction;

  return {
    lat: Number(lat.toFixed(4)),
    lng: Number(lng.toFixed(4)),
    heading: 0,
    fromName: lastStn?.name || train.from,
    toName: nextStn?.name || train.to,
    section: `${lastStn?.name || 'Passed'} ➔ ${nextStn?.name || 'Next'}`
  };
}
