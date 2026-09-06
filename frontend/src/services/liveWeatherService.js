/**
 * RailFlow AI — Real-Time Live Weather Ingestion Service
 * Powered by Open-Meteo Global Meteorological API (100% Free, Zero API Key)
 * Fetches real-time temperature, visibility, and atmospheric conditions for Indian Railway stations.
 */

import allStationCoords from '../data/allStationCoords.json';

// Major Indian Railways Station Coordinates (Lat, Long)
export const STATION_COORDINATES = {
  ...allStationCoords,
  // Core overrides
  'NDLS': { name: 'New Delhi', lat: 28.6139, lon: 77.2090 },
  'NZM': { name: 'Hazrat Nizamuddin', lat: 28.5880, lon: 77.2530 },
  'DLI': { name: 'Old Delhi', lat: 28.6610, lon: 77.2280 },
  'ANVT': { name: 'Anand Vihar', lat: 28.6500, lon: 77.3150 },
  'GZB': { name: 'Ghaziabad Jn', lat: 28.6692, lon: 77.4538 },
  'ALJN': { name: 'Aligarh Jn', lat: 27.8974, lon: 78.0880 },
  'TDL': { name: 'Tundla Jn', lat: 27.2070, lon: 78.2410 },
  'AGC': { name: 'Agra Cantt', lat: 27.1585, lon: 77.9908 },
  'MTJ': { name: 'Mathura Jn', lat: 27.4924, lon: 77.6737 },
  'CNB': { name: 'Kanpur Central', lat: 26.4539, lon: 80.3508 },
  'PRYJ': { name: 'Prayagraj Jn', lat: 25.4358, lon: 81.8463 },
  'BSB': { name: 'Varanasi Jn', lat: 25.3275, lon: 82.9863 },
  'DDU': { name: 'Pt. DD Upadhyaya', lat: 25.2780, lon: 83.1180 },
  'LKO': { name: 'Lucknow Charbagh', lat: 26.8322, lon: 80.9230 },
  'LJN': { name: 'Lucknow Jn', lat: 26.8310, lon: 80.9210 },
  'GKP': { name: 'Gorakhpur Jn', lat: 26.7570, lon: 83.3730 },
  'BE': { name: 'Bareilly Jn', lat: 28.3470, lon: 79.4140 },
  'MB': { name: 'Moradabad Jn', lat: 28.8380, lon: 78.7760 },
  'HW': { name: 'Haridwar Jn', lat: 29.9457, lon: 78.1642 },
  'DDN': { name: 'Dehradun', lat: 30.3165, lon: 78.0322 },
  'ASR': { name: 'Amritsar Jn', lat: 31.6340, lon: 74.8723 },
  'JAT': { name: 'Jammu Tawi', lat: 32.7060, lon: 74.8730 },
  'SVDK': { name: 'Shri Mata Vaishno Devi Katra', lat: 32.9910, lon: 74.9310 },
  'BTI': { name: 'Bhatinda Jn', lat: 30.2110, lon: 74.9450 },

  // Western & WCR
  'MMCT': { name: 'Mumbai Central', lat: 18.9696, lon: 72.8193 },
  'BVI': { name: 'Borivali', lat: 19.2290, lon: 72.8570 },
  'BDTS': { name: 'Bandra Terminus', lat: 19.0600, lon: 72.8400 },
  'ST': { name: 'Surat', lat: 21.2049, lon: 72.8411 },
  'BRC': { name: 'Vadodara Jn', lat: 22.3107, lon: 73.1812 },
  'ADI': { name: 'Ahmedabad Jn', lat: 23.0225, lon: 72.5714 },
  'RTM': { name: 'Ratlam Jn', lat: 23.3315, lon: 75.0367 },
  'NAD': { name: 'Nagda Jn', lat: 23.4500, lon: 75.4100 },
  'KOTA': { name: 'Kota Jn', lat: 25.2138, lon: 75.8648 },
  'SWM': { name: 'Sawai Madhopur', lat: 25.9920, lon: 76.3680 },
  'BPL': { name: 'Bhopal Jn', lat: 23.2599, lon: 77.4126 },
  'RKMP': { name: 'Rani Kamlapati', lat: 23.2120, lon: 77.4380 },
  'GWL': { name: 'Gwalior Jn', lat: 26.2183, lon: 78.1828 },
  'VGLJ': { name: 'V Lakshmibai Jhansi', lat: 25.4484, lon: 78.5685 },
  'JBP': { name: 'Jabalpur Jn', lat: 23.1815, lon: 79.9480 },

  // Eastern & ECR / NFR
  'HWH': { name: 'Howrah Jn', lat: 22.5850, lon: 88.3426 },
  'SDAH': { name: 'Sealdah', lat: 22.5670, lon: 88.3710 },
  'ASN': { name: 'Asansol Jn', lat: 23.6889, lon: 86.9661 },
  'DHN': { name: 'Dhanbad Jn', lat: 23.7957, lon: 86.4304 },
  'GAYA': { name: 'Gaya Jn', lat: 24.7914, lon: 85.0002 },
  'PNBE': { name: 'Patna Jn', lat: 25.6022, lon: 85.1376 },
  'RJPB': { name: 'Rajendra Nagar', lat: 25.5990, lon: 85.1610 },
  'KIR': { name: 'Katihar Jn', lat: 25.5390, lon: 87.5710 },
  'NJP': { name: 'New Jalpaiguri', lat: 26.6850, lon: 88.4410 },
  'GHY': { name: 'Guwahati', lat: 26.1820, lon: 91.7510 },
  'DBRG': { name: 'Dibrugarh', lat: 27.4728, lon: 94.9120 },
  'PURI': { name: 'Puri', lat: 19.8135, lon: 85.8312 },
  'BBS': { name: 'Bhubaneswar', lat: 20.2961, lon: 85.8245 },
  'BKSC': { name: 'Bokaro Steel City', lat: 23.6693, lon: 86.1511 },

  // Southern, SCR & CR
  'MAS': { name: 'MGR Chennai Central', lat: 13.0827, lon: 80.2707 },
  'MS': { name: 'Chennai Egmore', lat: 13.0780, lon: 80.2610 },
  'TBM': { name: 'Tambaram', lat: 12.9249, lon: 80.1000 },
  'SBC': { name: 'KSR Bengaluru', lat: 12.9774, lon: 77.5708 },
  'MYS': { name: 'Mysuru Jn', lat: 12.3110, lon: 76.6490 },
  'HYB': { name: 'Hyderabad Deccan', lat: 17.3920, lon: 78.4710 },
  'SC': { name: 'Secunderabad Jn', lat: 17.4344, lon: 78.5013 },
  'BZA': { name: 'Vijayawada Jn', lat: 16.5186, lon: 80.6200 },
  'VSKP': { name: 'Visakhapatnam', lat: 17.7231, lon: 83.2986 },
  'NGP': { name: 'Nagpur Jn', lat: 21.1528, lon: 79.0882 },
  'BSL': { name: 'Bhusaval Jn', lat: 21.0450, lon: 75.7870 },
  'MMR': { name: 'Manmad Jn', lat: 20.2520, lon: 74.4370 },
  'PUNE': { name: 'Pune Jn', lat: 18.5284, lon: 73.8739 },
  'CSMT': { name: 'Mumbai CSMT', lat: 18.9400, lon: 72.8350 },
  'TVC': { name: 'Thiruvananthapuram Central', lat: 8.4875, lon: 76.9525 },
  'ERS': { name: 'Ernakulam Jn', lat: 9.9670, lon: 76.2920 },
  'CBE': { name: 'Coimbatore Jn', lat: 11.0010, lon: 76.9620 },
  'MDU': { name: 'Madurai Jn', lat: 9.9252, lon: 78.1198 },
  'VSG': { name: 'Vasco-da-Gama', lat: 15.3980, lon: 73.8120 }
};

/**
 * WMO Weather Interpretation Codes to Plain English Description & Icons
 */
export function interpretWeatherCode(code) {
  switch (code) {
    case 0: return { text: 'Clear Sky', severity: 'clear', isFog: false };
    case 1: return { text: 'Mainly Clear', severity: 'clear', isFog: false };
    case 2: return { text: 'Partly Cloudy', severity: 'clear', isFog: false };
    case 3: return { text: 'Overcast Sky', severity: 'cloudy', isFog: false };
    case 45: return { text: 'Moderate Fog', severity: 'warning', isFog: true };
    case 48: return { text: 'Dense Freezing Fog', severity: 'critical', isFog: true };
    case 51:
    case 53:
    case 55: return { text: 'Light Drizzle', severity: 'rain', isFog: false };
    case 61:
    case 63: return { text: 'Moderate Rain', severity: 'rain', isFog: false };
    case 65: return { text: 'Heavy Monsoon Rain', severity: 'warning', isFog: false };
    case 71:
    case 73:
    case 75: return { text: 'Snowfall', severity: 'warning', isFog: false };
    case 80:
    case 81:
    case 82: return { text: 'Rain Showers', severity: 'rain', isFog: false };
    case 95:
    case 96:
    case 99: return { text: 'Thunderstorm', severity: 'critical', isFog: false };
    default: return { text: 'Clear Atmosphere', severity: 'clear', isFog: false };
  }
}

/**
 * Fetch Live Real-Time Weather from Open-Meteo API
 */
export async function fetchLiveWeather(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,visibility,wind_speed_10m&timezone=Asia%2FKolkata`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Weather network error');
    
    const data = await response.json();
    const curr = data.current || data.current_weather || {};
    
    const weatherInfo = interpretWeatherCode(curr.weather_code ?? curr.weathercode ?? 0);
    
    let visibilityKm = 10.0;
    if (curr.visibility !== undefined) {
      visibilityKm = Number((curr.visibility / 1000).toFixed(1));
    } else if (data.hourly && data.hourly.visibility && data.hourly.visibility.length > 0) {
      const visMeters = data.hourly.visibility[0] || 10000;
      visibilityKm = Number((visMeters / 1000).toFixed(1));
    } else if (weatherInfo.isFog) {
      visibilityKm = 1.2;
    }

    let fogDelayMin = 0;
    let weatherReason = null;

    if (visibilityKm < 1.5 || (curr.weather_code ?? curr.weathercode) === 48) {
      fogDelayMin = 18;
      weatherReason = {
        type: 'weather_fog',
        severity: 'warning',
        title: 'Dense Fog Alert along Route (Live Sensor)',
        description: `Live visibility is ${visibilityKm} km. Loco pilot operating under safety speed cap of 60 km/h.`,
        plainText: `Dense fog (${visibilityKm} km visibility) is requiring reduced, cautious speeds.`
      };
    } else if (visibilityKm < 3.5 || curr.weathercode === 45) {
      fogDelayMin = 7;
      weatherReason = {
        type: 'weather_fog',
        severity: 'info',
        title: 'Moderate Mist & Reduced Visibility (Live Sensor)',
        description: `Live visibility is ${visibilityKm} km. Safe headway maintained.`,
        plainText: `Moderate mist ahead is causing a slight 7-minute speed reduction.`
      };
    } else if (curr.weathercode >= 65) {
      fogDelayMin = 10;
      weatherReason = {
        type: 'weather_rain',
        severity: 'info',
        title: 'Heavy Rainfall in Section',
        description: `Wet rail adhesion speed reduction in force.`,
        plainText: `Heavy rain in the section is causing train to run at safe cautionary speed.`
      };
    }

    return {
      success: true,
      source: 'Open-Meteo Global Meteorological Engine',
      temperatureC: Math.round(curr.temperature || 26),
      windSpeedKm: Math.round(curr.windspeed || 8),
      visibilityKm: Math.max(0.5, visibilityKm),
      condition: weatherInfo.text,
      isFog: weatherInfo.isFog || visibilityKm < 2.0,
      fogDelayMin,
      weatherReason,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  } catch (err) {
    console.warn('Live weather fetch fallback:', err);
    return {
      success: false,
      source: 'Default Meteorological Model',
      temperatureC: 28,
      windSpeedKm: 6,
      visibilityKm: 8.5,
      condition: 'Clear Sky',
      isFog: false,
      fogDelayMin: 0,
      weatherReason: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }
}

/**
 * Resolve Station Coordinates by Code or Name
 */
export function getCoordinatesForStation(stationCodeOrName) {
  if (!stationCodeOrName) return STATION_COORDINATES['NDLS'];

  const clean = stationCodeOrName.toUpperCase().trim();
  
  // 1. Direct Code Match
  if (STATION_COORDINATES[clean]) {
    return STATION_COORDINATES[clean];
  }

  // 2. Extract code inside parentheses e.g. "Ambala Cantt (UMB)"
  if (clean.includes('(') && clean.includes(')')) {
    const inside = clean.split('(')[1].split(')')[0].trim();
    if (STATION_COORDINATES[inside]) {
      return STATION_COORDINATES[inside];
    }
  }

  // 3. Exact Station Name Match
  for (const [code, info] of Object.entries(STATION_COORDINATES)) {
    if (info.name && info.name.toUpperCase() === clean) {
      return info;
    }
  }

  // 4. Word boundary / Prefix name match
  for (const [code, info] of Object.entries(STATION_COORDINATES)) {
    if (info.name && (clean.startsWith(info.name.toUpperCase()) || info.name.toUpperCase().startsWith(clean))) {
      return info;
    }
  }

  // Default to New Delhi (Central Reference)
  return STATION_COORDINATES['NDLS'];
}
