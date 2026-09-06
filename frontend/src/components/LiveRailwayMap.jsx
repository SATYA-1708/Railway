import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, Tooltip, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Train, Maximize2, Minimize2 } from 'lucide-react';
import { STATION_COORDINATES, RAIL_CORRIDOR_LINES, getTrainGeoLocation } from '../data/geoRailData';

// Fix default leaflet icon URLs in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function createTrainIcon(train, isSelected = false) {
  const delay = typeof train?.baseDelayMin === 'number' ? train.baseDelayMin : 0;
  const color = delay > 15 ? '#ef4444' : delay > 0 ? '#f59e0b' : '#10b981';
  const num = train?.number || 'TRAIN';
  const html = `
    <div style="position:relative;width:42px;height:42px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
      ${isSelected ? `<div style="position:absolute;inset:0;border-radius:50%;border:2px solid ${color};opacity:0.6;animation:ping 1.2s cubic-bezier(0,0,0.2,1) infinite;"></div>` : ''}
      <div style="width:30px;height:30px;border-radius:50%;background:#0f172a;border:2.5px solid ${color};box-shadow:0 0 14px ${color}80;display:flex;align-items:center;justify-content:center;font-size:14px;z-index:2;">🚆</div>
      <div style="position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:#020617;color:#f8fafc;font-family:monospace;font-size:10px;font-weight:800;padding:1px 5px;border-radius:4px;border:1px solid ${color};white-space:nowrap;box-shadow:0 2px 5px rgba(0,0,0,0.6);">#${num}</div>
    </div>
  `;
  return L.divIcon({ html, className: '', iconSize: [42, 42], iconAnchor: [21, 21], popupAnchor: [0, -20] });
}

// Resolve a station (code or name) to its known coordinate. Falls back to null.
function matchCoord(codeOrName) {
  const s = String(codeOrName || '').trim().toUpperCase();
  if (!s) return null;
  if (STATION_COORDINATES[s]) return STATION_COORDINATES[s];
  for (const stn of Object.values(STATION_COORDINATES)) {
    if (stn.name.toUpperCase().includes(s) || s.includes(stn.name.toUpperCase())) return stn;
  }
  return null;
}

function MapFlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && typeof center[0] === 'number' && typeof center[1] === 'number') {
      map.flyTo(center, zoom || map.getZoom(), { duration: 1.0 });
    }
  }, [center, zoom, map]);
  return null;
}

// Fit map bounds to the selected train's full route (origin ➔ destination)
function RouteBounder({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (!positions || positions.length < 2) return;
    try {
      map.fitBounds(L.latLngBounds(positions), { padding: [45, 45], animate: true });
    } catch {
      // Safe catch
    }
  }, [positions, map]);
  return null;
}

// Invalidate Leaflet map size on mount/tab change so it never renders blank
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const handleResize = () => {
      try {
        map.invalidateSize();
      } catch {
        // Safe catch
      }
    };
    handleResize();
    const t1 = setTimeout(handleResize, 150);
    const t2 = setTimeout(handleResize, 600);
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);
  return null;
}

export default function LiveRailwayMap({
  trains = [],
  selectedTrain = null,
  onSelectTrain = () => {},
  onViewEta = () => {},
  height = '500px',
}) {
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Only genuinely live train positions are plotted on the map — never synthetic ones.
  const activeTrainList = useMemo(() => {
    if (selectedTrain) return [selectedTrain].filter(t => t);
    if (Array.isArray(trains) && trains.length > 0) {
      return trains.filter(t => t && (t.available !== false) && t.isLiveNTES === true);
    }
    return [];
  }, [trains, selectedTrain]);

  const mapCenter = useMemo(() => {
    if (selectedTrain) {
      const geo = getTrainGeoLocation(selectedTrain);
      if (geo && typeof geo.lat === 'number' && typeof geo.lng === 'number') {
        return [geo.lat, geo.lng];
      }
    }
    if (activeTrainList.length > 0) {
      const geo = getTrainGeoLocation(activeTrainList[0]);
      if (geo && typeof geo.lat === 'number' && typeof geo.lng === 'number') {
        return [geo.lat, geo.lng];
      }
    }
    return [22.8, 79.5];
  }, [selectedTrain, activeTrainList]);

  const mapZoom = selectedTrain ? 8 : 5;

  // Build the complete route polyline for the selected train (origin ➔ destination).
  // Points are threaded along the real corridor station geometry (not straight lines)
  // so the track follows the railway path between halts. The route is then split into
  // the portion already COVERED (origin ➔ last passed station) and the portion still
  // REMAINING (last passed station ➔ destination).
  const trainRoute = useMemo(() => {
    if (!selectedTrain) return null;
    const route = Array.isArray(selectedTrain.routeTimeline) ? selectedTrain.routeTimeline : [];
    const resolved = route
      .map(stn => {
        const code = String(stn?.code || stn?.name || '').trim().toUpperCase();
        const coord = matchCoord(code) || matchCoord(stn?.name);
        return coord ? { code, coord } : null;
      })
      .filter(Boolean);
    if (resolved.length < 2) return null;

    const corridors = RAIL_CORRIDOR_LINES;

    const traceSegment = (a, b) => {
      for (const corr of corridors) {
        const codes = corr.stations || [];
        const ai = codes.indexOf(a.code);
        const bi = codes.indexOf(b.code);
        if (ai >= 0 && bi >= 0) {
          const step = ai <= bi ? 1 : -1;
          const seg = [];
          for (let j = ai; step > 0 ? j <= bi : j >= bi; j += step) {
            const c = STATION_COORDINATES[codes[j]];
            if (c) seg.push([c.lat, c.lng]);
          }
          if (seg.length >= 2) return seg;
        }
      }
      // No shared corridor — fall back to a straight segment
      if (a.coord && b.coord) {
        const seg = [[a.coord.lat, a.coord.lng], [b.coord.lat, b.coord.lng]];
        if (seg[0][0] !== seg[1][0] || seg[0][1] !== seg[1][1]) return seg;
      }
      return null;
    };

    // Build the full path while recording, for every timeline station, its index in pts
    const pts = [];
    const boundaries = [0];
    for (let i = 0; i < resolved.length - 1; i++) {
      const seg = traceSegment(resolved[i], resolved[i + 1]);
      if (!seg || seg.length < 2) {
        boundaries.push(pts.length ? pts.length - 1 : 0);
        continue;
      }
      if (pts.length === 0) pts.push(...seg);
      else pts.push(...seg.slice(1));
      boundaries.push(pts.length - 1);
    }
    if (pts.length < 2) return null;

    // How many stations the train has already passed?
    const departedCount = route.filter(s => s?.status === 'DEPARTED').length;
    const lastCode = String(selectedTrain.lastStationCode || '').trim().toUpperCase();
    let splitIdx = 0;
    if (selectedTrain.isYetToStart || departedCount === 0) {
      splitIdx = 0;
    } else if (lastCode) {
      const f = resolved.findIndex(r => r.code === lastCode);
      splitIdx = f >= 0 ? f + 1 : departedCount;
    } else {
      splitIdx = departedCount;
    }
    splitIdx = Math.max(0, Math.min(splitIdx, resolved.length - 1));

    const boundary = boundaries[splitIdx] ?? 0;
    const covered = splitIdx > 0 ? pts.slice(0, boundary + 1) : null;
    const remaining = boundary < pts.length - 1 ? pts.slice(boundary) : null;
    if (!covered && !remaining) return null;

    return { full: pts, covered, remaining, splitIdx };
  }, [selectedTrain]);

  const trainRoutePositions = trainRoute ? trainRoute.full : null;
  const trainCoveredPositions = trainRoute ? trainRoute.covered : null;
  const trainRemainingPositions = trainRoute ? trainRoute.remaining : null;

  const tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

  const containerHeight = isFullScreen ? 'calc(100vh - 50px)' : (height || '500px');

  return (
    <div className={`flex flex-col rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-lg ${isFullScreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>

      {/* Clean Slim Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <Train className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-bold text-white">Live Network Map</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
          {selectedTrain && (
            <div className="hidden sm:flex items-center gap-2 ml-1 pl-3 border-l border-slate-700">
              {trainCoveredPositions && (
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-300">
                  <span className="w-4 h-[3px] rounded-full bg-emerald-400 inline-block" /> Covered
                </span>
              )}
              {trainRemainingPositions && (
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-300">
                  <span className="w-4 h-[3px] rounded-full bg-red-400 inline-block" /> Remaining
                </span>
              )}
              {trainRoute && (
                <span className="text-[10px] font-mono text-slate-500">
                  {trainRoute.splitIdx}/{selectedTrain.routeTimeline?.length || 0} passed
                </span>
              )}
            </div>
          )}
        </div>

        {/* Fullscreen Button */}
        <button
          type="button"
          onClick={() => setIsFullScreen(!isFullScreen)}
          className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Map Canvas */}
      <div className="relative w-full" style={{ height: containerHeight, minHeight: '400px' }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          zoomControl={true}
          attributionControl={false}
          className="w-full h-full"
          style={{ background: '#0f172a', width: '100%', height: '100%', minHeight: '400px' }}
        >
          <TileLayer
            url={tileUrl}
            maxZoom={18}
          />
          <MapFlyTo center={mapCenter} zoom={mapZoom} />
          <MapResizer />
          {trainRoutePositions && <RouteBounder positions={trainRoutePositions} />}

          {/* Corridor Track Polylines (static national network — dimmed when a train is selected) */}
          {RAIL_CORRIDOR_LINES.map(corr => {
            const positions = (corr.stations || [])
              .map(code => STATION_COORDINATES[code])
              .filter(Boolean)
              .map(c => [c.lat, c.lng]);
            if (positions.length < 2) return null;
            const dimmed = Boolean(selectedTrain);
            return (
              <React.Fragment key={corr.id}>
                <Polyline positions={positions} pathOptions={{ color: corr.color, weight: corr.weight + 2, opacity: dimmed ? 0.06 : 0.2, lineCap: 'round' }} />
                <Polyline positions={positions} pathOptions={{ color: corr.color, weight: corr.weight, opacity: dimmed ? 0.16 : 0.85, dashArray: corr.dashArray, lineCap: 'round' }}>
                  <Tooltip sticky direction="top"><span className="text-xs font-bold">{corr.name}</span></Tooltip>
                </Polyline>
              </React.Fragment>
            );
          })}

          {/* Selected Train Route: COVERED portion (origin ➔ last passed station) */}
          {trainCoveredPositions && (
            <React.Fragment>
              <Polyline positions={trainCoveredPositions} pathOptions={{ color: '#10b981', weight: 8, opacity: 0.22, lineCap: 'round' }} />
              <Polyline positions={trainCoveredPositions} pathOptions={{ color: '#34d399', weight: 3.5, opacity: 1, dashArray: '1 7', lineCap: 'round' }}>
                <Tooltip sticky direction="top" opacity={0.95}>
                  <span className="text-xs font-bold text-slate-900">✓ Covered — {selectedTrain.name}</span>
                </Tooltip>
              </Polyline>
            </React.Fragment>
          )}

          {/* Selected Train Route: REMAINING portion (last passed station ➔ destination) */}
          {trainRemainingPositions && (
            <React.Fragment>
              <Polyline positions={trainRemainingPositions} pathOptions={{ color: '#ef4444', weight: 9, opacity: 0.25, lineCap: 'round' }} />
              <Polyline positions={trainRemainingPositions} pathOptions={{ color: '#f87171', weight: 3.5, opacity: 1, lineCap: 'round' }}>
                <Tooltip sticky direction="top" opacity={0.95}>
                  <span className="text-xs font-bold text-slate-900">Remaining route — {selectedTrain.name}</span>
                </Tooltip>
              </Polyline>
            </React.Fragment>
          )}

          {/* Station Nodes */}
          {Object.entries(STATION_COORDINATES).map(([code, stn]) => (
            <CircleMarker
              key={code}
              center={[stn.lat, stn.lng]}
              radius={stn.platforms >= 10 ? 4.5 : 3}
              pathOptions={{ color: '#38bdf8', fillColor: selectedTrain ? '#1e293b' : '#0f172a', fillOpacity: 1, weight: selectedTrain ? 0.8 : 1.5, opacity: selectedTrain ? 0.4 : 1 }}
            >
              <Tooltip direction="top" offset={[0, -5]} opacity={0.95}>
                <span className="text-xs font-bold">{stn.name}</span>
                <span className="text-[10px] text-slate-400 ml-1">({code})</span>
              </Tooltip>
              <Popup>
                <div className="text-xs space-y-1 min-w-[150px]">
                  <div className="font-bold text-sm text-slate-900">{stn.name}</div>
                  <div className="text-slate-600">{code} · {stn.zone || 'IR'} · {stn.platforms || 2} Platforms</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Train Markers */}
          {activeTrainList.map(t => {
            if (!t) return null;
            const geo = getTrainGeoLocation(t);
            const isSel = selectedTrain?.number === t.number;
            const delay = typeof t.baseDelayMin === 'number' ? t.baseDelayMin : 0;
            return (
              <Marker
                key={t.number || Math.random()}
                position={[geo.lat, geo.lng]}
                icon={createTrainIcon(t, isSel)}
                eventHandlers={{ click: () => onSelectTrain(t) }}
              >
                <Popup>
                  <div className="text-xs space-y-2 min-w-[210px] p-1">
                    <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-2">
                      <div>
                        <div className="font-mono font-black text-sm text-blue-600">#{t.number}</div>
                        <div className="font-bold text-slate-900">{t.name}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${delay <= 0 ? 'bg-green-100 text-green-700' : delay <= 15 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {delay <= 0 ? 'On Time' : `+${delay}m late`}
                      </span>
                    </div>
                    <div className="space-y-1 text-slate-600">
                      <div className="flex justify-between"><span>Speed:</span><strong className="text-slate-900 font-mono">{t.currentSpeed ?? 0} km/h</strong></div>
                      <div className="flex justify-between"><span>Next stop:</span><strong className="text-slate-900">{t.nextStation?.split('(')?.[0] ?? '—'}</strong></div>
                      <div className="flex justify-between"><span>Section:</span><strong className="text-slate-900 text-right max-w-[120px] truncate">{geo.section}</strong></div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onViewEta(t)}
                      className="w-full py-1.5 mt-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1 shadow"
                    >
                      ⚡ View Live ETA Forecast
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
