import React, { useMemo, useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import { Search, X, Activity, ArrowRight, Train, Navigation, Clock, MapPin, ChevronRight } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import RailwayLoader from './ui/RailwayLoader';
import { REAL_TRAINS_DATABASE } from '../data/realTrainsData';
import { fetchLiveTrainFromInternet } from '../services/liveRailwayService';

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'http://localhost:8000';

function MapPanController({ targetCenter, targetZoom }) {
  const map = useMap();
  useEffect(() => {
    if (targetCenter && targetCenter[0] && targetCenter[1]) {
      map.flyTo(targetCenter, targetZoom || 7, { duration: 1.2 });
    }
  }, [targetCenter, targetZoom, map]);
  return null;
}

// Fix for default Leaflet marker icon asset URLs in Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Minimal fallback for major junctions if backend coords are unavailable
const KNOWN_STATIONS_FALLBACK = {
  "VSKP": { name: "Visakhapatnam Jn", lat: 17.7215, lon: 83.2876 },
  "BZA": { name: "Vijayawada Jn", lat: 16.5186, lon: 80.6200 },
  "NDLS": { name: "New Delhi", lat: 28.6139, lon: 77.2090 },
  "MMCT": { name: "Mumbai Central", lat: 18.9696, lon: 72.8194 },
  "MAS": { name: "Chennai Central", lat: 13.0827, lon: 80.2707 },
  "HWH": { name: "Howrah Jn", lat: 22.5850, lon: 88.3426 },
  "SC": { name: "Secunderabad Jn", lat: 17.4334, lon: 78.5042 },
  "NGP": { name: "Nagpur Jn", lat: 21.1528, lon: 79.0882 },
  "BPL": { name: "Bhopal Jn", lat: 23.2599, lon: 77.4126 },
  "KOTA": { name: "Kota Jn", lat: 25.1761, lon: 75.8361 },
  "RTM": { name: "Ratlam Jn", lat: 23.3315, lon: 75.0367 },
};

// Create pulsating custom Leaflet HTML Marker Icon
function createTrainIcon(train) {
  const delay = train.delayMin ?? train.baseDelayMin ?? 0;
  const isGreen = delay <= 5;
  const isAmber = delay > 5 && delay <= 20;
  const color = isGreen ? '#10b981' : isAmber ? '#f59e0b' : '#ef4444';
  const pulseColor = isGreen ? 'rgba(16, 185, 129, 0.4)' : isAmber ? 'rgba(245, 158, 11, 0.4)' : 'rgba(239, 68, 68, 0.4)';

  const html = `
    <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
      <div style="
        position: absolute;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: ${pulseColor};
        animation: leaflet-pulse 2s infinite ease-out;
      "></div>
      <div style="
        position: relative;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: ${color};
        border: 2.5px solid #ffffff;
        box-shadow: 0 0 10px ${color}, 0 2px 4px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-size: 10px;
        font-weight: bold;
      ">
        🚆
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-train-leaflet-icon',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18]
  });
}

function createStationIcon(isMajor = false) {
  const html = `
    <div style="
      width: ${isMajor ? '12px' : '8px'};
      height: ${isMajor ? '12px' : '8px'};
      border-radius: 50%;
      background: ${isMajor ? '#38bdf8' : '#94a3b8'};
      border: 2px solid #0f172a;
      box-shadow: 0 0 6px rgba(56, 189, 248, 0.6);
    "></div>
  `;
  return L.divIcon({
    html,
    className: 'custom-station-leaflet-icon',
    iconSize: [isMajor ? 12 : 8, isMajor ? 12 : 8],
    iconAnchor: [isMajor ? 6 : 4, isMajor ? 6 : 4]
  });
}

export default function LiveTrainMap({ trains = [], selectedTrainNumber = null, height = "520px", stationCode = null, onSelectTrain = null, loading = false }) {
  const [allStationCoords, setAllStationCoords] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [delayFilter, setDelayFilter] = useState('all'); // 'all' | 'ontime' | 'moderate' | 'delayed'
  const [selectedMapTrain, setSelectedMapTrain] = useState(null);
  const [extraTrains, setExtraTrains] = useState([]);
  const [mapTarget, setMapTarget] = useState(null);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const searchBoxRef = useRef(null);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setIsSuggestOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Merge provided trains with authentic catalog and dynamic search additions
  const activeTrains = useMemo(() => {
    const combined = [];
    const seen = new Set();
    
    (trains || []).forEach(t => {
      const n = String(t.number || '').replace('#', '').trim();
      if (n && !seen.has(n)) {
        seen.add(n);
        combined.push(t);
      }
    });

    extraTrains.forEach(t => {
      const n = String(t.number || '').replace('#', '').trim();
      if (n && !seen.has(n)) {
        seen.add(n);
        combined.push(t);
      }
    });

    REAL_TRAINS_DATABASE.forEach(t => {
      const n = String(t.number || '').replace('#', '').trim();
      if (n && !seen.has(n)) {
        seen.add(n);
        combined.push(t);
      }
    });

    return combined;
  }, [trains, extraTrains]);

  // Fetch full station coordinate database from backend
  useEffect(() => {
    let cancelled = false;
    const fetchCoords = async () => {
      try {
        const resp = await fetch(`${API_BASE_URL}/api/stations/coords`);
        if (resp.ok) {
          const data = await resp.json();
          if (!cancelled && data && data.stations) {
            const normalized = {};
            Object.entries(data.stations).forEach(([code, coord]) => {
              if (code && coord && typeof coord.lat === 'number' && typeof coord.lon === 'number') {
                normalized[code.toUpperCase()] = {
                  name: coord.name || code,
                  lat: coord.lat,
                  lon: coord.lon
                };
              }
            });
            setAllStationCoords(normalized);
          }
        }
      } catch (e) {
        console.warn('LiveTrainMap: failed to fetch station coords, using fallback', e);
      }
    };
    fetchCoords();
    return () => { cancelled = true; };
  }, []);

  const STATIONS = useMemo(() => ({ ...KNOWN_STATIONS_FALLBACK, ...allStationCoords }), [allStationCoords]);

  const getStation = (code, name) => {
    const codeUpper = String(code || '').toUpperCase();
    if (STATIONS[codeUpper]) return STATIONS[codeUpper];
    if (name && typeof name === 'string') {
      const found = Object.values(STATIONS).find(s => s.name.toUpperCase().includes(name.toUpperCase()));
      if (found) return found;
    }
    return null;
  };

  // Derive accurate train positions along route
  const trainMarkers = useMemo(() => {
    const positionCounts = {};
    return activeTrains.map((t, idx) => {
      const num = String(t.number || '').replace('#', '');
      const timeline = t.routeTimeline || [];
      const statusStr = String(t.status || '').toLowerCase();
      const isYetToStart = statusStr.includes('origin') || statusStr.includes('yet to start') || t.isYetToStart;

      let lat = 20.5937;
      let lon = 78.9629;
      let locName = t.nextStation || t.currentStation || 'In Section';

      // 1. If train is still at origin / yet to start
      if (isYetToStart) {
        const originCode = String(t.fromStationCode || t.from || 'VSKP').toUpperCase().split('(')[0].trim();
        const foundStn = getStation(originCode, t.from) || STATIONS["VSKP"];
        lat = foundStn.lat;
        lon = foundStn.lon;
        locName = `At Origin: ${t.from || foundStn.name}`;
      } else if (t.liveCoordinates && typeof t.liveCoordinates.lat === 'number') {
        lat = t.liveCoordinates.lat;
        lon = t.liveCoordinates.lon;
        locName = t.livePositionSummary || t.currentStation || 'In Transit';
      } else if (timeline.length > 0) {
        const activeStn = timeline.find(s => s.status === 'NEXT' || s.status === 'ARRIVING') || timeline.find(s => s.status === 'DEPARTED') || timeline[0];
        const scode = (activeStn?.code || '').toUpperCase();
        const sname = activeStn?.name || '';
        const found = getStation(scode, sname);
        if (found) {
          lat = found.lat;
          lon = found.lon;
          locName = found.name;
        }
      } else {
        const originCode = String(t.fromStationCode || 'VSKP').toUpperCase();
        const found = getStation(originCode, t.from);
        if (found) {
          lat = found.lat;
          lon = found.lon;
          locName = t.from || found.name;
        }
      }

      const delay = t.delayMin ?? t.baseDelayMin ?? 0;
      const speed = isYetToStart ? 0 : (t.currentSpeed ?? (delay <= 5 ? 110 : 85));
      const eta = isYetToStart ? (t.scheduledDeparture || t.scheduledArrival || '22:00') : (t.dynamicEta || t.scheduledNextArrival || '18:45');

      // Offset trains that share the same position so they don't stack
      const posKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
      const count = positionCounts[posKey] || 0;
      positionCounts[posKey] = count + 1;
      if (count > 0) {
        const angle = (count * 137.5) * (Math.PI / 180);
        const radius = 0.008 + count * 0.006;
        lat = Math.round((lat + Math.cos(angle) * radius) * 1000) / 1000;
        lon = Math.round((lon + Math.sin(angle) * radius) * 1000) / 1000;
      }

      return {
        ...t,
        cleanNum: num,
        lat,
        lon,
        locName,
        delay,
        speed,
        eta,
        isYetToStart
      };
    });
  }, [activeTrains]);

  // Route Polylines for trains
  const routePolylines = useMemo(() => {
    return activeTrains.map((t) => {
      const timeline = t.routeTimeline || [];
      const latlngs = [];
      timeline.forEach(s => {
        const code = (s.code || '').toUpperCase();
        const found = getStation(code, s.name);
        if (found) {
          latlngs.push([found.lat, found.lon]);
        }
      });
      // Fallback default trunk routes
      if (latlngs.length < 2) {
        if (String(t.number).includes('20805')) {
          const routeCodes = ['VSKP', 'SLO', 'RJY', 'TDD', 'EE', 'BZA', 'WL', 'RDM', 'BPQ', 'CD', 'SEGM', 'NGP', 'BPL', 'VGLJ', 'GWL', 'AGC', 'NDLS'];
          routeCodes.forEach(c => {
            const found = STATIONS[c];
            if (found) latlngs.push([found.lat, found.lon]);
          });
        } else if (String(t.number).includes('12951')) {
          const routeCodes = ['MMCT', 'BCT', 'ST', 'BRC', 'RTM', 'KOTA', 'MTJ', 'PWL', 'FDB', 'NZM', 'NDLS'];
          routeCodes.forEach(c => {
            const found = STATIONS[c];
            if (found) latlngs.push([found.lat, found.lon]);
          });
        }
      }

      const delay = t.delayMin ?? t.baseDelayMin ?? 0;
      const color = delay <= 5 ? '#10b981' : delay <= 20 ? '#f59e0b' : '#ef4444';
      return { trainNum: t.number, latlngs, color };
    }).filter(r => r.latlngs.length >= 2);
  }, [activeTrains]);

  // Filter stations to only show upcoming halts around the active trains' routes
  const stationsToDisplay = useMemo(() => {
    const routeCodes = new Set();
    activeTrains.forEach(t => {
      const timeline = t.routeTimeline || [];
      // Upcoming halts only (full-route feeds can be hundreds of stops)
      timeline.filter(s => s.status !== 'DEPARTED').slice(0, 10).forEach(s => {
        const c = (s.code || '').toUpperCase();
        if (c) routeCodes.add(c);
      });
      // Always keep last-departed and next markers visible
      [t.lastStation, t.nextStation].forEach(label => {
        const m = String(label || '').match(/\(([^)]+)\)/);
        if (m) routeCodes.add(m[1].toUpperCase());
      });
    });

    const entries = Object.entries(STATIONS).filter(([code]) => routeCodes.has(code)).slice(0, 28);
    if (entries.length === 0) {
      if (stationCode) {
        const stn = getStation(stationCode);
        if (stn) {
          const nearby = Object.entries(STATIONS).filter(([code, s]) => {
            const dLat = Math.abs(s.lat - stn.lat);
            const dLon = Math.abs(s.lon - stn.lon);
            return dLat < 1.5 && dLon < 1.5;
          });
          if (nearby.length > 0) return nearby;
        }
      }
      return Object.entries(STATIONS).filter(([code]) => ['BZA', 'NDLS', 'NGP', 'BPL', 'VSKP', 'MAS', 'MMCT'].includes(code));
    }
    return entries;
  }, [activeTrains, stationCode]);

  // Center map on the train marker or route
  const mapCenter = useMemo(() => {
    if (stationCode) {
      const stn = getStation(stationCode);
      if (stn) return [stn.lat, stn.lon];
    }
    if (trainMarkers.length > 0 && trainMarkers[0].lat && trainMarkers[0].lon) {
      return [trainMarkers[0].lat, trainMarkers[0].lon];
    }
    return [21.5937, 80.9629];
  }, [stationCode, trainMarkers]);

  const mapZoom = useMemo(() => {
    if (stationCode) {
      const stn = getStation(stationCode);
      if (stn) return 13;
    }
    return activeTrains.length === 1 ? 6 : 5;
  }, [stationCode, activeTrains]);

  // Filter train markers based on passenger search and delay category
  const filteredTrainMarkers = useMemo(() => {
    return trainMarkers.filter(t => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const numMatch = String(t.number || '').toLowerCase().includes(q);
        const nameMatch = String(t.name || '').toLowerCase().includes(q);
        const locMatch = String(t.locName || '').toLowerCase().includes(q);
        const nextMatch = String(t.nextStation || '').toLowerCase().includes(q);
        if (!numMatch && !nameMatch && !locMatch && !nextMatch) return false;
      }
      if (delayFilter === 'ontime') return t.delay <= 5;
      if (delayFilter === 'moderate') return t.delay > 5 && t.delay <= 20;
      if (delayFilter === 'delayed') return t.delay > 20;
      return true;
    });
  }, [trainMarkers, searchQuery, delayFilter]);

  const searchSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return trainMarkers.filter(t => 
      String(t.number || '').toLowerCase().includes(q) ||
      String(t.name || '').toLowerCase().includes(q)
    ).slice(0, 6);
  }, [searchQuery, trainMarkers]);

  const handleSelectSearchedTrain = (train) => {
    setSelectedMapTrain(train);
    if (train.lat && train.lon) {
      setMapTarget([train.lat, train.lon]);
    }
    setSearchQuery(train.name || train.number);
    setIsSuggestOpen(false);
  };

  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    // First check in active train markers
    const found = trainMarkers.find(t => 
      String(t.number || '').toLowerCase().includes(q.toLowerCase()) ||
      String(t.name || '').toLowerCase().includes(q.toLowerCase())
    );

    if (found) {
      handleSelectSearchedTrain(found);
      return;
    }

    // Otherwise fetch live/roster train
    try {
      const live = await fetchLiveTrainFromInternet(q);
      if (live) {
        setExtraTrains(prev => [live, ...prev]);
        setSelectedMapTrain(live);
        if (live.lat && live.lon) {
          setMapTarget([live.lat, live.lon]);
        }
        setIsSuggestOpen(false);
      }
    } catch {
      // Ignore
    }
  };

  // Floating map HUD & Controls
  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0b1524]">
      <style>{`
        @keyframes leaflet-pulse {
          0% { transform: scale(0.6); opacity: 0.9; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .leaflet-container {
          background: #090d16 !important;
          font-family: inherit;
        }
        .leaflet-tile-pane {
          filter: invert(1) hue-rotate(180deg) brightness(0.82) contrast(0.92) saturate(0.35);
        }
        .leaflet-control-zoom a {
          background: #0f172a !important;
          color: #e2e8f0 !important;
          border-color: #334155 !important;
        }
        .leaflet-control-zoom a:hover {
          background: #1e293b !important;
        }
        .leaflet-control-attribution {
          background: rgba(9, 13, 22, 0.75) !important;
          color: #475569 !important;
        }
        .leaflet-control-attribution a {
          color: #64748b !important;
        }
        .leaflet-popup-content-wrapper {
          background: #0f172a !important;
          color: #e2e8f0 !important;
          border: 1px solid #334155;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.7);
        }
        .leaflet-popup-tip {
          background: #0f172a !important;
        }
      `}</style>

      {/* Floating Map HUD overlay */}
      <div className="absolute top-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-700/80 shadow-lg flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-slate-200">Live Indian Railways Telemetry</span>
        </div>
        <div className="h-4 w-px bg-slate-700"></div>
        <span className="text-xs font-mono text-cyan-400">{filteredTrainMarkers.length} Active Train{filteredTrainMarkers.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Floating Search & Filters Control Bar */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col sm:flex-row items-end sm:items-center gap-2 max-w-[calc(100%-2rem)]">
        {/* Search Input with Autocomplete Dropdown */}
        <div ref={searchBoxRef} className="relative">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5">
            <div className="relative w-44 sm:w-56 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700/80 shadow-lg flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSuggestOpen(e.target.value.trim().length > 0);
                }}
                onFocus={() => {
                  if (searchQuery.trim().length > 0) setIsSuggestOpen(true);
                }}
                placeholder="Search train no. or name..."
                className="w-full bg-transparent text-xs text-white placeholder-slate-400 pl-9 pr-7 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-cyan-400"
                style={{ paddingLeft: '2.25rem' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setIsSuggestOpen(false); }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-2.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1 shrink-0"
            >
              <Search className="w-3.5 h-3.5" /> Search
            </button>
          </form>

          {/* Autocomplete Dropdown */}
          {isSuggestOpen && searchSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#0b1524] border border-cyan-500/30 rounded-xl shadow-2xl z-[1200] overflow-hidden max-h-56 overflow-y-auto divide-y divide-white/10">
              {searchSuggestions.map((st, idx) => (
                <button
                  key={st.number || idx}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectSearchedTrain(st);
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-cyan-500/15 hover:text-white transition-colors flex items-center justify-between group"
                >
                  <div className="truncate pr-2">
                    <span className="font-mono font-bold text-cyan-400 mr-2">#{st.number}</span>
                    <span className="font-medium text-white">{st.name}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Delay Filters */}
        <div className="bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-lg flex items-center gap-1 text-[11px]">
          {[
            { key: 'all', label: 'All' },
            { key: 'ontime', label: 'On Time (≤5m)', dot: 'bg-emerald-500' },
            { key: 'moderate', label: 'Moderate (6-20m)', dot: 'bg-amber-500' },
            { key: 'delayed', label: 'Delayed (>20m)', dot: 'bg-rose-500' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setDelayFilter(f.key)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                delayFilter === f.key
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {f.dot && <span className={`w-1.5 h-1.5 rounded-full ${f.dot}`} />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Train Detail Floating Panel */}
      {selectedMapTrain && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/95 backdrop-blur-md p-4 rounded-xl border border-cyan-500/40 shadow-2xl max-w-sm w-[calc(100%-2rem)] sm:w-80 text-white space-y-3">
          <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
                  #{selectedMapTrain.number}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  selectedMapTrain.delay <= 5 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {selectedMapTrain.delay <= 0 ? 'ON TIME' : `+${selectedMapTrain.delay}m LATE`}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-100 mt-1 truncate">{selectedMapTrain.name}</h3>
            </div>
            <button
              onClick={() => setSelectedMapTrain(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Current Location</span>
              <span className="font-semibold text-slate-200 truncate block">{selectedMapTrain.locName || 'In Transit'}</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Speed</span>
              <span className="font-mono font-bold text-emerald-400">{selectedMapTrain.speed} km/h</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Next Stop</span>
              <span className="font-semibold text-slate-200 truncate block">{selectedMapTrain.nextStation || '—'}</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Dynamic ETA</span>
              <span className="font-mono font-bold text-amber-400">{selectedMapTrain.eta}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400">Berthing: <strong className="text-cyan-300 font-mono font-bold">PF {selectedMapTrain.assignedPlatform || 1}</strong></span>
            <button
              type="button"
              onClick={() => {
                if (onSelectTrain) onSelectTrain(selectedMapTrain);
              }}
              className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-lg text-xs transition-all shadow flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5" /> Track This Train <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/80 text-[11px] flex items-center gap-3 text-slate-300">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> On Time (≤5m)</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Moderate (6-20m)</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Delayed (&gt;20m)</div>
      </div>

      {loading && (
        <div className="absolute inset-0 z-[1100] bg-[#090d16]/80 backdrop-blur-sm flex items-center justify-center">
          <RailwayLoader
            dark
            fullPage
            message="Rendering Live GIS Rail Network..."
            submessage="Syncing GPS coordinates and block signal status across corridors"
          />
        </div>
      )}

      <MapContainer
        key={stationCode || 'india-view'}
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={true}
        style={{ height, width: '100%' }}
      >
        <MapPanController targetCenter={mapTarget} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Station Markers (Filtered to Route Only) */}
        {stationsToDisplay.map(([code, s]) => (
          <Marker
            key={code}
            position={[s.lat, s.lon]}
            icon={createStationIcon(['BZA', 'NDLS', 'NGP', 'BPL', 'VSKP', 'MAS', 'MMCT'].includes(code))}
          >
            <Tooltip direction="top" offset={[0, -6]} opacity={0.9}>
              <span className="font-semibold text-xs">{s.name} ({code})</span>
            </Tooltip>
          </Marker>
        ))}

        {/* Route Polylines */}
        {routePolylines.map((route, i) => (
          <Polyline
            key={i}
            positions={route.latlngs}
            pathOptions={{
              color: route.color,
              weight: 3.5,
              opacity: 0.75,
              dashArray: '6, 6'
            }}
          />
        ))}

        {/* Train Markers */}
        {filteredTrainMarkers.map((t) => (
          <Marker
            key={t.cleanNum || t.number}
            position={[t.lat, t.lon]}
            icon={createTrainIcon(t)}
            eventHandlers={{
              click: () => {
                setSelectedMapTrain(t);
              }
            }}
          >
            <Popup>
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-1.5 mb-2">
                  <span className="font-bold text-sm text-cyan-400">#{t.number} {t.name}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${t.delay <= 5 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                    {t.delay <= 5 ? 'ON TIME' : `+${t.delay}m`}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Speed:</span>
                    <span className="font-mono text-emerald-400 font-semibold">{t.speed} km/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Next Station:</span>
                    <span className="font-semibold text-slate-200">{t.nextStation || t.locName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dynamic ETA:</span>
                    <span className="font-mono text-amber-400 font-semibold">{t.eta}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Platform:</span>
                    <span className="font-mono text-cyan-300 font-bold">PF {t.assignedPlatform || 1}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectTrain) onSelectTrain(t);
                  }}
                  className="w-full mt-2 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded text-xs transition-colors flex items-center justify-center gap-1"
                >
                  <Activity className="w-3 h-3" /> Track This Train
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
