/**
 * RailFlow AI — High-Fidelity Railway Simulation & Dynamic ETA Data Engine
 * Models realistic Indian Railways train operations, topological track blocks,
 * dynamic ETA recalculation, and platform conflict detection.
 */

export const CORRIDORS = [
  {
    id: 'VSKP-NDLS',
    name: 'Grand Trunk Express Corridor',
    from: 'Visakhapatnam (VSKP)',
    to: 'New Delhi (NDLS)',
    stations: [
      { code: 'VSKP', name: 'Visakhapatnam', km: 0, platforms: 8, defaultDwell: 0 },
      { code: 'DVD', name: 'Duvvada', km: 18, platforms: 4, defaultDwell: 2 },
      { code: 'BZA', name: 'Vijayawada Jn', km: 350, platforms: 10, defaultDwell: 15 },
      { code: 'WL', name: 'Warangal', km: 557, platforms: 3, defaultDwell: 2 },
      { code: 'BPQ', name: 'Balharshah', km: 800, platforms: 5, defaultDwell: 5 },
      { code: 'NGP', name: 'Nagpur Jn', km: 1022, platforms: 8, defaultDwell: 5 },
      { code: 'BPL', name: 'Bhopal Jn', km: 1412, platforms: 6, defaultDwell: 10 },
      { code: 'VGLJ', name: 'V Lakshmibai Jhansi', km: 1704, platforms: 8, defaultDwell: 5 },
      { code: 'GWL', name: 'Gwalior Jn', km: 1802, platforms: 4, defaultDwell: 2 },
      { code: 'AGC', name: 'Agra Cantt', km: 1920, platforms: 6, defaultDwell: 2 },
      { code: 'NDLS', name: 'New Delhi', km: 2099, platforms: 16, defaultDwell: 0 }
    ]
  },
  {
    id: 'NDLS-BCT',
    name: 'Western High-Density Corridor',
    from: 'Mumbai Central (MMCT)',
    to: 'New Delhi (NDLS)',
    stations: [
      { code: 'MMCT', name: 'Mumbai Central', km: 0, platforms: 5, defaultDwell: 0 },
      { code: 'ST', name: 'Surat', km: 263, platforms: 4, defaultDwell: 5 },
      { code: 'BRC', name: 'Vadodara Jn', km: 392, platforms: 6, defaultDwell: 8 },
      { code: 'RTM', name: 'Ratlam Jn', km: 653, platforms: 7, defaultDwell: 10 },
      { code: 'KOTA', name: 'Kota Jn', km: 920, platforms: 5, defaultDwell: 10 },
      { code: 'NDLS', name: 'New Delhi', km: 1386, platforms: 16, defaultDwell: 0 }
    ]
  },
  {
    id: 'NDLS-DDU',
    name: 'Northern Grand Chord Corridor',
    from: 'New Delhi (NDLS)',
    to: 'Pt. DD Upadhyaya (DDU)',
    stations: [
      { code: 'NDLS', name: 'New Delhi', km: 0, platforms: 16, defaultDwell: 0 },
      { code: 'ALJN', name: 'Aligarh Jn', km: 131, platforms: 7, defaultDwell: 3 },
      { code: 'TDL', name: 'Tundla Jn', km: 209, platforms: 5, defaultDwell: 4 },
      { code: 'CNB', name: 'Kanpur Central', km: 440, platforms: 10, defaultDwell: 10 },
      { code: 'PRYJ', name: 'Prayagraj Jn', km: 635, platforms: 10, defaultDwell: 8 },
      { code: 'DDU', name: 'Pt. DD Upadhyaya', km: 790, platforms: 8, defaultDwell: 0 }
    ]
  },
  {
    id: 'VSKP-HYB',
    name: 'Godavari / South Central Corridor',
    from: 'Visakhapatnam (VSKP)',
    to: 'Hyderabad Deccan (HYB)',
    stations: [
      { code: 'VSKP', name: 'Visakhapatnam', km: 0, platforms: 8, defaultDwell: 0 },
      { code: 'RJY', name: 'Rajahmundry', km: 218, platforms: 3, defaultDwell: 2 },
      { code: 'BZA', name: 'Vijayawada Jn', km: 367, platforms: 10, defaultDwell: 15 },
      { code: 'WL', name: 'Warangal', km: 574, platforms: 3, defaultDwell: 2 },
      { code: 'KZJ', name: 'Kazipet Jn', km: 584, platforms: 4, defaultDwell: 2 },
      { code: 'SC', name: 'Secunderabad Jn', km: 701, platforms: 10, defaultDwell: 5 },
      { code: 'HYB', name: 'Hyderabad Deccan', km: 710, platforms: 6, defaultDwell: 0 }
    ]
  }
];

export const INITIAL_TRAINS = [
  {
    number: '12951',
    name: 'Mumbai Rajdhani Express',
    type: 'Rajdhani / Premium',
    priority: 1, // 1 = Highest
    from: 'Mumbai Central (MMCT)',
    to: 'New Delhi (NDLS)',
    corridorId: 'NDLS-BCT',
    scheduledDeparture: '17:00',
    scheduledArrival: '08:32',
    currentKm: 785, // Between Ratlam and Kota
    currentSpeed: 118,
    maxSpeed: 130,
    baseDelayMin: 7,
    status: 'Running',
    lastStation: 'Ratlam Jn (RTM)',
    nextStation: 'Kota Jn (KOTA)',
    scheduledNextArrival: '18:45',
    assignedPlatform: 3,
    precedingTrainAhead: {
      name: 'Freight 58-BOXN (Coal Rake)',
      distanceKm: 14,
      speedKm: 48,
    },
    weather: {
      condition: 'Clear Sky',
      visibilityKm: 8,
      temperatureC: 28,
      fogImpact: 0,
    },
    activeSection: 'RTM-KOTA Block Section 14 (ABS Auto Signal)',
    signals: [
      { id: 'S-782', aspect: 'GREEN', km: 782 },
      { id: 'S-790', aspect: 'DOUBLE_YELLOW', km: 790 },
      { id: 'S-798', aspect: 'YELLOW', km: 798 },
      { id: 'S-804', aspect: 'RED', km: 804 }
    ],
    routeTimeline: [
      { code: 'MMCT', name: 'Mumbai Central', scheduled: '17:00', actual: '17:00', status: 'DEPARTED', platform: 1 },
      { code: 'ST', name: 'Surat', scheduled: '19:42', actual: '19:45', status: 'DEPARTED', platform: 1 },
      { code: 'BRC', name: 'Vadodara Jn', scheduled: '21:05', actual: '21:10', status: 'DEPARTED', platform: 2 },
      { code: 'RTM', name: 'Ratlam Jn', scheduled: '00:35', actual: '00:42', status: 'DEPARTED', platform: 5 },
      { code: 'KOTA', name: 'Kota Jn', scheduled: '18:45', predicted: '18:52', status: 'NEXT', platform: 3, confidenceLow: '18:49', confidenceHigh: '18:56' },
      { code: 'NDLS', name: 'New Delhi', scheduled: '08:32', predicted: '08:41', status: 'UPCOMING', platform: 2, confidenceLow: '08:36', confidenceHigh: '08:46' }
    ],
    delayReasons: [
      {
        type: 'traffic_ahead',
        severity: 'warning',
        icon: 'AlertTriangle',
        title: 'Train ahead is moving slowly',
        description: 'Freight rake 58-BOXN is moving at 48 km/h on the same track 14 km ahead. Speed reduced to maintain safety headway.',
        plainText: 'A slower freight train ahead is causing our train to reduce speed.'
      },
      {
        type: 'junction_density',
        severity: 'info',
        icon: 'Clock',
        title: 'Heavy traffic near upcoming junction',
        description: 'Approaching Kota Junction outer interlocking. Siding priority clearance in progress for line clear grant.',
        plainText: 'Moderate platform queue at Kota station is causing a 4-minute delay.'
      }
    ],
    alerts: [
      {
        id: 'alt-1',
        time: 'Just now',
        type: 'ETA_UPDATED',
        title: 'ETA Updated',
        oldEta: '18:48',
        newEta: '18:52',
        reason: 'Slower train ahead causing slight deceleration near Kota outer.',
        impact: '+4 min'
      },
      {
        id: 'alt-2',
        time: '12 mins ago',
        type: 'PLATFORM_ASSIGNED',
        title: 'Platform Assigned at Kota Jn',
        platform: 'Platform 3',
        reason: 'Station master locked Platform 3 for smooth passenger deboarding.',
        impact: 'On Schedule'
      },
      {
        id: 'alt-3',
        time: '35 mins ago',
        type: 'DELAY_INCREASED',
        title: 'Delay Adjusted (+5m)',
        reason: 'Temporary Speed Restriction (TSR 75 km/h) on Chambal bridge section.',
        impact: '+5 min'
      }
    ]
  },
  {
    number: '22436',
    name: 'Vande Bharat Express',
    type: 'Vande Bharat / Semi-High Speed',
    priority: 1,
    from: 'New Delhi (NDLS)',
    to: 'Varanasi Jn (BSB)',
    corridorId: 'NDLS-DDU',
    scheduledDeparture: '06:00',
    scheduledArrival: '14:00',
    currentKm: 380, // Near Kanpur
    currentSpeed: 126,
    maxSpeed: 130,
    baseDelayMin: 0,
    status: 'Running',
    lastStation: 'Tundla Jn (TDL)',
    nextStation: 'Kanpur Central (CNB)',
    scheduledNextArrival: '10:10',
    assignedPlatform: 1,
    precedingTrainAhead: null,
    weather: {
      condition: 'Clear Sky',
      visibilityKm: 10,
      temperatureC: 24,
      fogImpact: 0,
    },
    activeSection: 'TDL-CNB High-Speed Dedicated Line 1',
    signals: [
      { id: 'S-370', aspect: 'GREEN', km: 370 },
      { id: 'S-380', aspect: 'GREEN', km: 380 },
      { id: 'S-390', aspect: 'GREEN', km: 390 },
      { id: 'S-400', aspect: 'GREEN', km: 400 }
    ],
    routeTimeline: [
      { code: 'NDLS', name: 'New Delhi', scheduled: '06:00', actual: '06:00', status: 'DEPARTED', platform: 16 },
      { code: 'CNB', name: 'Kanpur Central', scheduled: '10:10', predicted: '10:10', status: 'NEXT', platform: 1, confidenceLow: '10:08', confidenceHigh: '10:12' },
      { code: 'PRYJ', name: 'Prayagraj Jn', scheduled: '12:15', predicted: '12:15', status: 'UPCOMING', platform: 6, confidenceLow: '12:13', confidenceHigh: '12:18' },
      { code: 'BSB', name: 'Varanasi Jn', scheduled: '14:00', predicted: '14:00', status: 'UPCOMING', platform: 1, confidenceLow: '13:58', confidenceHigh: '14:03' }
    ],
    delayReasons: [
      {
        type: 'on_time',
        severity: 'success',
        icon: 'CheckCircle',
        title: 'Running at Optimal Priority Speed',
        description: 'Automatic Block Signaling clear ahead with full green aspects across the division.',
        plainText: 'Your train has a clear track ahead and is running perfectly on time.'
      }
    ],
    alerts: [
      {
        id: 'alt-vb-1',
        time: '5 mins ago',
        type: 'CLEAR_TRACK',
        title: 'Priority Clearance Granted',
        reason: 'Green line clear granted for non-stop run through Panki Outer.',
        impact: 'On Time'
      }
    ]
  },
  {
    number: '12418',
    name: 'Prayagraj Superfast Express',
    type: 'Superfast Mail/Express',
    priority: 3,
    from: 'New Delhi (NDLS)',
    to: 'Prayagraj Jn (PRYJ)',
    corridorId: 'NDLS-DDU',
    scheduledDeparture: '22:10',
    scheduledArrival: '07:00',
    currentKm: 420, // 20km before Kanpur
    currentSpeed: 72,
    maxSpeed: 110,
    baseDelayMin: 22,
    status: 'Delayed',
    lastStation: 'Aligarh Jn (ALJN)',
    nextStation: 'Kanpur Central (CNB)',
    scheduledNextArrival: '04:15',
    assignedPlatform: 3,
    precedingTrainAhead: {
      name: 'Passenger 04118 (Local Shuttle)',
      distanceKm: 8,
      speedKm: 40,
    },
    weather: {
      condition: 'Moderate Fog',
      visibilityKm: 1.5,
      temperatureC: 16,
      fogImpact: 15,
    },
    activeSection: 'Panki–CNB Suburban Block Section 3',
    signals: [
      { id: 'S-415', aspect: 'YELLOW', km: 415 },
      { id: 'S-420', aspect: 'YELLOW', km: 420 },
      { id: 'S-425', aspect: 'DOUBLE_YELLOW', km: 425 },
      { id: 'S-430', aspect: 'RED', km: 430 }
    ],
    routeTimeline: [
      { code: 'NDLS', name: 'New Delhi', scheduled: '22:10', actual: '22:10', status: 'DEPARTED', platform: 14 },
      { code: 'ALJN', name: 'Aligarh Jn', scheduled: '23:55', actual: '00:15', status: 'DEPARTED', platform: 3 },
      { code: 'CNB', name: 'Kanpur Central', scheduled: '04:15', predicted: '04:37', status: 'NEXT', platform: 3, confidenceLow: '04:34', confidenceHigh: '04:41' },
      { code: 'PRYJ', name: 'Prayagraj Jn', scheduled: '07:00', predicted: '07:26', status: 'UPCOMING', platform: 1, confidenceLow: '07:20', confidenceHigh: '07:32' }
    ],
    delayReasons: [
      {
        type: 'weather_fog',
        severity: 'warning',
        icon: 'CloudFog',
        title: 'Reduced visibility due to weather',
        description: 'Morning fog layer between Aligarh and Kanpur capped driver speed limit to 75 km/h.',
        plainText: 'Heavy morning fog along the track requires safe reduced operating speeds.'
      },
      {
        type: 'slower_train',
        severity: 'warning',
        icon: 'TrendingDown',
        title: 'Train ahead is moving slowly',
        description: 'Preceding local shuttle passenger train halting at wayside suburban stations ahead.',
        plainText: 'A slower local train ahead on the same line is causing step-down signal caution.'
      }
    ],
    alerts: [
      {
        id: 'alt-p-1',
        time: 'Just now',
        type: 'ETA_UPDATED',
        title: 'Arrival Rescheduled to 04:37 AM',
        oldEta: '04:25',
        newEta: '04:37',
        reason: 'Speed reduced due to fog caution orders and local train ahead.',
        impact: '+12 min'
      }
    ]
  },
  {
    number: '12002',
    name: 'Bhopal Shatabdi Express',
    type: 'Shatabdi Express',
    priority: 2,
    from: 'New Delhi (NDLS)',
    to: 'Rani Kamlapati (RKMP)',
    corridorId: 'NDLS-BCT',
    scheduledDeparture: '06:00',
    scheduledArrival: '14:40',
    currentKm: 195, // Near Agra / Tundla
    currentSpeed: 128,
    maxSpeed: 130,
    baseDelayMin: 4,
    status: 'Running',
    lastStation: 'Mathura Jn (MTJ)',
    nextStation: 'Agra Cantt (AGC)',
    scheduledNextArrival: '07:50',
    assignedPlatform: 1,
    precedingTrainAhead: null,
    weather: {
      condition: 'Clear',
      visibilityKm: 9,
      temperatureC: 22,
      fogImpact: 0,
    },
    activeSection: 'MTJ-AGC Automatic Signaled High-Speed Line',
    signals: [
      { id: 'S-190', aspect: 'GREEN', km: 190 },
      { id: 'S-198', aspect: 'GREEN', km: 198 },
      { id: 'S-205', aspect: 'DOUBLE_YELLOW', km: 205 }
    ],
    routeTimeline: [
      { code: 'NDLS', name: 'New Delhi', scheduled: '06:00', actual: '06:00', status: 'DEPARTED', platform: 1 },
      { code: 'MTJ', name: 'Mathura Jn', scheduled: '07:19', actual: '07:22', status: 'DEPARTED', platform: 1 },
      { code: 'AGC', name: 'Agra Cantt', scheduled: '07:50', predicted: '07:54', status: 'NEXT', platform: 1, confidenceLow: '07:52', confidenceHigh: '07:57' },
      { code: 'GWL', name: 'Gwalior Jn', scheduled: '09:23', predicted: '09:27', status: 'UPCOMING', platform: 2, confidenceLow: '09:24', confidenceHigh: '09:30' },
      { code: 'RKMP', name: 'Rani Kamlapati', scheduled: '14:40', predicted: '14:45', status: 'UPCOMING', platform: 1, confidenceLow: '14:41', confidenceHigh: '14:49' }
    ],
    delayReasons: [
      {
        type: 'station_dwell',
        severity: 'info',
        icon: 'Clock',
        title: 'Slight extra waiting at previous station',
        description: '3 minutes extra boarding time during passenger rush at Mathura Jn.',
        plainText: 'Slight delay of 3 minutes due to heavy boarding at Mathura station.'
      }
    ],
    alerts: [
      {
        id: 'alt-s-1',
        time: '8 mins ago',
        type: 'ETA_UPDATED',
        title: 'Expected Arrival: 07:54 AM (+4m)',
        reason: 'Recalculated based on Mathura departure time.',
        impact: '+4 min'
      }
    ]
  }
];

export const INITIAL_PLATFORM_STATUS = {
  BZA: [
    { platform: 1, status: 'OCCUPIED', train: '12615 Grand Trunk Express', arrivalTime: '01:50', departureTime: '02:00' },
    { platform: 2, status: 'AVAILABLE', train: null, arrivalTime: '-', departureTime: '-' },
    { platform: 3, status: 'CONFLICT_RISK', train: '20805 AP Express & 12841 Coromandel', arrivalTime: '03:40 & 03:45', conflictTrains: ['20805', '12841'], overlapMins: 8 },
    { platform: 4, status: 'AVAILABLE', train: null, arrivalTime: '-', departureTime: '-' },
    { platform: 5, status: 'OCCUPIED', train: '12711 Pinakini Express', arrivalTime: '06:10', departureTime: '06:20' },
    { platform: 6, status: 'AVAILABLE', train: null, arrivalTime: '-', departureTime: '-' },
    { platform: 7, status: 'OCCUPIED', train: '17201 Golconda Express', arrivalTime: '07:00', departureTime: '07:15' },
    { platform: 8, status: 'AVAILABLE', train: null, arrivalTime: '-', departureTime: '-' },
    { platform: 9, status: 'OCCUPIED', train: '07865 Machilipatnam Passenger', arrivalTime: '08:30', departureTime: '08:45' },
    { platform: 10, status: 'AVAILABLE', train: null, arrivalTime: '-', departureTime: '-' },
  ],
  BPL: [
    { platform: 1, status: 'OCCUPIED', train: '12002 Bhopal Shatabdi', arrivalTime: '14:12', departureTime: '14:15' },
    { platform: 2, status: 'CONFLICT_RISK', train: '20805 AP Express & 12951 Rajdhani', arrivalTime: '20:30 & 20:35', conflictTrains: ['20805', '12951'], overlapMins: 6 },
    { platform: 3, status: 'AVAILABLE', train: null, arrivalTime: '-', departureTime: '-' },
    { platform: 4, status: 'OCCUPIED', train: '12626 Kerala Express', arrivalTime: '05:20', departureTime: '05:25' },
    { platform: 5, status: 'AVAILABLE', train: null, arrivalTime: '-', departureTime: '-' },
    { platform: 6, status: 'AVAILABLE', train: null, arrivalTime: '-', departureTime: '-' }
  ],
  NDLS: [
    { platform: 1, status: 'OCCUPIED', train: '12002 Bhopal Shatabdi', arrivalTime: '05:50', departureTime: '06:00' },
    { platform: 2, status: 'OCCUPIED', train: '12951 Mumbai Rajdhani', arrivalTime: '08:32', departureTime: '09:15' },
    { platform: 3, status: 'CONFLICT_RISK', train: '20805 AP Express & 12615 GT Express', arrivalTime: '05:40 & 05:48', conflictTrains: ['20805', '12615'], overlapMins: 10 },
    { platform: 4, status: 'AVAILABLE', train: null, arrivalTime: '-', departureTime: '-' },
    { platform: 5, status: 'OCCUPIED', train: '22436 Vande Bharat Express', arrivalTime: '05:40', departureTime: '06:00' },
    { platform: 6, status: 'OCCUPIED', train: '12004 Lucknow Shatabdi', arrivalTime: '06:10', departureTime: '06:25' },
    { platform: 7, status: 'AVAILABLE', train: null, arrivalTime: '-', departureTime: '-' },
    { platform: 8, status: 'OCCUPIED', train: '12425 Jammu Rajdhani', arrivalTime: '05:05', departureTime: '05:15' },
    { platform: 9, status: 'AVAILABLE', train: null, arrivalTime: '-', departureTime: '-' },
    { platform: 10, status: 'OCCUPIED', train: '64511 Delhi-Ghaziabad EMU', arrivalTime: '07:20', departureTime: '07:30' },
    { platform: 11, status: 'AVAILABLE', train: null, arrivalTime: '-', departureTime: '-' },
    { platform: 12, status: 'OCCUPIED', train: '12418 Prayagraj Express', arrivalTime: '21:50', departureTime: '22:10' },
    { platform: 13, status: 'AVAILABLE', train: null, arrivalTime: '-', departureTime: '-' },
    { platform: 14, status: 'OCCUPIED', train: '12301 Howrah Rajdhani', arrivalTime: '09:55', departureTime: '10:05' },
    { platform: 15, status: 'OCCUPIED', train: '12381 Poorva Express', arrivalTime: '06:00', departureTime: '06:15' },
    { platform: 16, status: 'OCCUPIED', train: '12011 Kalka Shatabdi', arrivalTime: '07:40', departureTime: '07:50' }
  ],
  KOTA: [
    { platform: 1, status: 'AVAILABLE', train: null, arrivalTime: '-', departureTime: '-' },
    { platform: 2, status: 'OCCUPIED', train: '12402 Nanda Devi Exp', arrivalTime: '18:10', departureTime: '18:30' },
    { platform: 3, status: 'CONFLICT_RISK', train: '12951 Rajdhani & 12002 Exp', arrivalTime: '18:52 & 18:47', conflictTrains: ['12951', '12002'], overlapMins: 5 },
    { platform: 4, status: 'AVAILABLE', train: null, arrivalTime: '-', departureTime: '-' },
    { platform: 5, status: 'AVAILABLE', train: null, arrivalTime: '-', departureTime: '-' }
  ],
  CNB: [
    { platform: 1, status: 'OCCUPIED', train: '22436 Vande Bharat', arrivalTime: '10:08', departureTime: '10:10' },
    { platform: 2, status: 'OCCUPIED', train: '12301 Howrah Rajdhani', arrivalTime: '04:40', departureTime: '04:45' },
    { platform: 3, status: 'OCCUPIED', train: '12418 Prayagraj Exp', arrivalTime: '03:50', departureTime: '03:55' },
    { platform: 4, status: 'AVAILABLE', train: null, arrivalTime: '-', departureTime: '-' },
    { platform: 5, status: 'AVAILABLE', train: null, arrivalTime: '-', departureTime: '-' },
    { platform: 6, status: 'AVAILABLE', train: null, arrivalTime: '-', departureTime: '-' },
    { platform: 7, status: 'OCCUPIED', train: '12555 Gorakhdham Express', arrivalTime: '21:30', departureTime: '21:40' },
    { platform: 8, status: 'AVAILABLE', train: null, arrivalTime: '-', departureTime: '-' },
    { platform: 9, status: 'AVAILABLE', train: null, arrivalTime: '-', departureTime: '-' },
    { platform: 10, status: 'AVAILABLE', train: null, arrivalTime: '-', departureTime: '-' }
  ]
};

/**
 * Recalculate Dynamic ETA and plain-language delay reason
 * when simulated operational conditions change.
 *
 * NOTE: This is a frontend-only simulation heuristic for the XAI Sandbox.
 * It operates on static mock data and does NOT call the live backend
 * /api/simulate endpoint. For production use, replace with a backend call.
 */
export function recalculateDynamicEta(train, overrides = {}) {
  const isTrainOnTime = (train.baseDelayMin || 0) <= 0;
  const defaultPreceding = isTrainOnTime ? 75 : (train.precedingTrainAhead ? train.precedingTrainAhead.speedKm : 50);
  const defaultTraffic = isTrainOnTime ? 'LOW' : 'MODERATE';
  const defaultWeather = train.weather?.visibilityKm || 8;

  const {
    precedingSpeedKm = defaultPreceding,
    trafficDensity = defaultTraffic, // 'LOW', 'MODERATE', 'HEAVY'
    weatherVisibility = defaultWeather,
    stationDwellExtraMin = 0
  } = overrides;

  let delayDelta = 0;
  let newDelayReasons = [];

  const trainName = train.name || `Express #${train.number}`;
  const nextStn = train.nextStation || 'upcoming station';

  // 1. Check preceding train speed impact
  if (precedingSpeedKm < 40) {
    delayDelta += 9;
    newDelayReasons.push({
      type: 'slower_train',
      severity: 'critical',
      icon: 'AlertTriangle',
      title: `Preceding rake crawling at ${precedingSpeedKm} km/h ahead of #${train.number}`,
      description: `Slow freight/local rake in ${train.activeSection || 'Block Section'} enforces restricted headway.`,
      plainText: `A slow-moving rake ahead (${precedingSpeedKm} km/h) is causing cautionary signal aspects before ${nextStn}.`
    });
  } else if (precedingSpeedKm < 60) {
    delayDelta += 4;
    newDelayReasons.push({
      type: 'slower_train',
      severity: 'warning',
      icon: 'TrendingDown',
      title: `Preceding train moving at safe headway (${precedingSpeedKm} km/h)`,
      description: `Moderate signal compression; #${train.number} operating under double-yellow approach.`,
      plainText: `A slower train ahead on the same line is forcing safe deceleration into ${nextStn}.`
    });
  }

  // 2. Check traffic density impact
  if (trafficDensity === 'HEAVY') {
    delayDelta += 6;
    newDelayReasons.push({
      type: 'junction_density',
      severity: 'warning',
      icon: 'Clock',
      title: `Heavy track congestion approaching ${nextStn}`,
      description: `Multiple converging lines queuing for interlocking route clearance at ${nextStn}.`,
      plainText: `Heavy train traffic near ${nextStn} yard is causing an interlocking queue.`
    });
  }

  // 3. Check weather / fog impact
  if (weatherVisibility < 2) {
    delayDelta += 8;
    newDelayReasons.push({
      type: 'weather_fog',
      severity: 'warning',
      icon: 'CloudFog',
      title: `Dense fog advisory (Visibility: ${weatherVisibility} km)`,
      description: `Loco pilot operating under mandatory foggy weather safety speed limits (max 60 km/h).`,
      plainText: `Dense fog along the corridor requires cautious, reduced speeds for passenger safety.`
    });
  }

  // 4. Station dwell extra
  if (stationDwellExtraMin > 0) {
    delayDelta += stationDwellExtraMin;
    newDelayReasons.push({
      type: 'station_dwell',
      severity: 'info',
      icon: 'Clock',
      title: `Extra boarding dwell (+${stationDwellExtraMin} min at ${nextStn})`,
      description: `High passenger boarding volume and parcel loading added extra dwell time.`,
      plainText: `Extended passenger boarding of ${stationDwellExtraMin} extra minutes.`
    });
  }

  // If no simulation overrides added extra delay, fall back to train's native delay reasons or on-time status
  if (newDelayReasons.length === 0) {
    if (Array.isArray(train.delayReasons) && train.delayReasons.length > 0) {
      newDelayReasons = [...train.delayReasons];
    } else if (train.baseDelayMin > 0) {
      newDelayReasons.push({
        type: 'sectional_regulation',
        severity: 'warning',
        icon: 'Clock',
        title: `Sectional regulation delay (+${train.baseDelayMin} min)`,
        description: `Operational headway clearance in progress along ${train.activeSection || 'corridor'}.`,
        plainText: `Train is operating with an accumulated running delay of ${train.baseDelayMin} minutes.`
      });
    } else {
      newDelayReasons.push({
        type: 'on_time',
        severity: 'success',
        icon: 'CheckCircle',
        title: `Clear track ahead — #${train.number} cruising smoothly`,
        description: `Automatic Block Signals are all clear (Green aspects) into ${nextStn}.`,
        plainText: `Track ahead is clear and ${trainName} is running right on schedule.`
      });
    }
  }

  const totalDelayMin = train.baseDelayMin + delayDelta;

  // Parse base scheduled time into minutes since midnight (guard against
  // missing/malformed values instead of producing NaN).
  const parseClockMinutes = (value) => {
    if (typeof value === 'string' && value.includes(':')) {
      const [h, m] = value.split(':').map(Number);
      if (Number.isFinite(h) && Number.isFinite(m)) return h * 60 + m;
    }
    return null;
  };

  const baseMins = parseClockMinutes(train.scheduledNextArrival) ?? parseClockMinutes(train.dynamicEta) ?? 0;
  const totalMins = baseMins + totalDelayMin;
  const newH = Math.floor(totalMins / 60) % 24;
  const newM = totalMins % 60;
  const newEtaStr = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;

  const lowMins = (totalMins - 3) % (24 * 60);
  const highMins = (totalMins + 4) % (24 * 60);
  const lowStr = `${String(Math.floor(lowMins / 60)).padStart(2, '0')}:${String(lowMins % 60).padStart(2, '0')}`;
  const highStr = `${String(Math.floor(highMins / 60)).padStart(2, '0')}:${String(highMins % 60).padStart(2, '0')}`;

  return {
    newEta: newEtaStr,
    expectedRange: `${lowStr} – ${highStr}`,
    totalDelayMin,
    delayDelta,
    reasons: newDelayReasons,
    speedEstimated: Math.max(35, Math.min(train.maxSpeed ?? train.currentSpeed ?? 85, (train.currentSpeed ?? 85) - (delayDelta * 4)))
  };
}
