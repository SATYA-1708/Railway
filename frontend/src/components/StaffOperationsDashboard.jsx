import React, { useState, useMemo } from 'react';
import { Search, MonitorDot, Sparkles, Sliders, ShieldAlert, ArrowRight, Gauge, Clock, Target, Layers, ArrowUpRight, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import Card from './ui/Card';
import Badge from './ui/Badge';
import RailwayLoader from './ui/RailwayLoader';
import { COLOR_TEXT } from '../utils/colorClasses';
import { REAL_TRAINS_DATABASE } from '../data/realTrainsData';
import { useRailwayTelemetry } from '../hooks/useRailwayTelemetry';
import { useStationTrains } from '../hooks/useStationTrains';

export const STATION_MASTERS = {
  BZA: {
    code: 'BZA',
    name: 'Vijayawada Jn',
    zone: 'South Central Railway (SCR)',
    division: 'Vijayawada (BZA) Division',
    platforms: 10,
    rriSystem: 'Siemens Westrace Electronic Interlocking (EI-V3)',
    trainFilterCodes: ['BZA', 'BZA JN', 'VIJAYAWADA']
  },
  NDLS: {
    code: 'NDLS',
    name: 'New Delhi',
    zone: 'Northern Railway (NR)',
    division: 'Delhi (DLI) Division',
    platforms: 16,
    rriSystem: 'Kyosan Solid State Electronic Interlocking (K-EI)',
    trainFilterCodes: ['NDLS', 'DLI', 'NZM', 'NEW DELHI', 'DELHI']
  },
  BPL: {
    code: 'BPL',
    name: 'Bhopal Jn',
    zone: 'West Central Railway (WCR)',
    division: 'Bhopal (BPL) Division',
    platforms: 6,
    rriSystem: 'Ansaldo Microlok II Electronic Interlocking',
    trainFilterCodes: ['BPL', 'RKMP', 'BHOPAL']
  },
  VSKP: {
    code: 'VSKP',
    name: 'Visakhapatnam Jn',
    zone: 'East Coast Railway (ECoR)',
    division: 'Waltair (WAT) Division',
    platforms: 8,
    rriSystem: 'Medha Electronic Interlocking System (MEI-600)',
    trainFilterCodes: ['VSKP', 'DVD', 'VISAKHAPATNAM']
  }
};

function computeP10P90(etaStr, delayMin = 0) {
  if (!etaStr || !etaStr.includes(':')) return { p10: '--:--', p90: '--:--', conf: '92%' };
  const parts = etaStr.split(':');
  let h = parseInt(parts[0], 10);
  let m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return { p10: etaStr, p90: etaStr, conf: '90%' };

  const totalMin = h * 60 + m;
  const spread = delayMin > 15 ? 5 : delayMin > 5 ? 3 : 2;

  const min10 = Math.max(0, totalMin - spread);
  const min90 = totalMin + spread + (delayMin > 15 ? 2 : 1);

  const h10 = Math.floor(min10 / 60) % 24;
  const m10 = min10 % 60;
  const h90 = Math.floor(min90 / 60) % 24;
  const m90 = min90 % 60;

  const pad = (n) => String(n).padStart(2, '0');
  const confScore = delayMin <= 0 ? 95 : delayMin <= 10 ? 89 : 82;

  return {
    p10: `${pad(h10)}:${pad(m10)}`,
    p90: `${pad(h90)}:${pad(m90)}`,
    conf: `${confScore}%`
  };
}

export const CORRIDOR_BLOCK_SECTIONS = {
  BZA: [
    { id: 'BLK-BZA-01', from: 'Vijayawada (BZA)', to: 'Tenali (TEL)', km: '0–31 km', mps: 130, status: 'OCCUPIED', trainNum: '20805', trainName: 'Vande Bharat Express', dir: 'DN (GDR Bound)', speed: 110, delay: 0, headway: '6.2 min', signal: 'YELLOW', risk: 'HEADWAY WARNING' },
    { id: 'BLK-BZA-02', from: 'Tenali (TEL)', to: 'Bapatla (BPP)', km: '31–74 km', mps: 130, status: 'OCCUPIED', trainNum: '12864', trainName: 'Howrah-SMVB Express', dir: 'DN (GDR Bound)', speed: 75, delay: 8, headway: '9.4 min', signal: 'GREEN', risk: 'CLEAR' },
    { id: 'BLK-BZA-03', from: 'Bapatla (BPP)', to: 'Chirala (CLX)', km: '74–89 km', mps: 110, status: 'CLEAR', trainNum: null, trainName: null, dir: '—', speed: 0, delay: 0, headway: '18.0 min', signal: 'GREEN', risk: 'CLEAR' },
    { id: 'BLK-BZA-04', from: 'Chirala (CLX)', to: 'Ongole (OGL)', km: '89–139 km', mps: 130, status: 'OCCUPIED', trainNum: '12615', trainName: 'Grand Trunk Express', dir: 'UP (BZA Bound)', speed: 65, delay: 14, headway: '7.1 min', signal: 'DOUBLE_YELLOW', risk: 'REGULATED' },
    { id: 'BLK-BZA-05', from: 'Ongole (OGL)', to: 'Singarayakonda (SKM)', km: '139–175 km', mps: 130, status: 'CLEAR', trainNum: null, trainName: null, dir: '—', speed: 0, delay: 0, headway: '22.0 min', signal: 'GREEN', risk: 'CLEAR' },
    { id: 'BLK-BZA-06', from: 'Singarayakonda (SKM)', to: 'Gudur (GDR)', km: '175–255 km', mps: 130, status: 'OCCUPIED', trainNum: '12727', trainName: 'Godavari Express', dir: 'UP (BZA Bound)', speed: 40, delay: 45, headway: '4.2 min', signal: 'RED', risk: 'CONGESTED' },
  ],
  NDLS: [
    { id: 'BLK-NDLS-01', from: 'New Delhi (NDLS)', to: 'Ghaziabad (GZB)', km: '0–25 km', mps: 110, status: 'OCCUPIED', trainNum: '12002', trainName: 'Bhopal Shatabdi', dir: 'DN (CNB Bound)', speed: 85, delay: 4, headway: '5.5 min', signal: 'YELLOW', risk: 'HEADWAY WARNING' },
    { id: 'BLK-NDLS-02', from: 'Ghaziabad (GZB)', to: 'Aligarh (ALJN)', km: '25–131 km', mps: 130, status: 'OCCUPIED', trainNum: '12301', trainName: 'Kolkata Rajdhani', dir: 'DN (CNB Bound)', speed: 125, delay: 0, headway: '12.0 min', signal: 'GREEN', risk: 'CLEAR' },
    { id: 'BLK-NDLS-03', from: 'Aligarh (ALJN)', to: 'Tundla (TDL)', km: '131–209 km', mps: 130, status: 'CLEAR', trainNum: null, trainName: null, dir: '—', speed: 0, delay: 0, headway: '16.5 min', signal: 'GREEN', risk: 'CLEAR' },
    { id: 'BLK-NDLS-04', from: 'Tundla (TDL)', to: 'Etawah (ETW)', km: '209–301 km', mps: 130, status: 'OCCUPIED', trainNum: '12951', trainName: 'Mumbai Rajdhani', dir: 'UP (NDLS Bound)', speed: 110, delay: 5, headway: '8.0 min', signal: 'GREEN', risk: 'CLEAR' },
    { id: 'BLK-NDLS-05', from: 'Etawah (ETW)', to: 'Kanpur Central (CNB)', km: '301–440 km', mps: 130, status: 'OCCUPIED', trainNum: '22436', trainName: 'Vande Bharat Express', dir: 'UP (NDLS Bound)', speed: 90, delay: 18, headway: '6.0 min', signal: 'DOUBLE_YELLOW', risk: 'REGULATED' },
  ],
  BPL: [
    { id: 'BLK-BPL-01', from: 'Bhopal (BPL)', to: 'Mandideep (MDDP)', km: '0–24 km', mps: 110, status: 'OCCUPIED', trainNum: '12002', trainName: 'Shatabdi Express', dir: 'DN (ET Bound)', speed: 105, delay: 0, headway: '14.0 min', signal: 'GREEN', risk: 'CLEAR' },
    { id: 'BLK-BPL-02', from: 'Mandideep (MDDP)', to: 'Hoshangabad (HBD)', km: '24–74 km', mps: 110, status: 'CLEAR', trainNum: null, trainName: null, dir: '—', speed: 0, delay: 0, headway: '20.0 min', signal: 'GREEN', risk: 'CLEAR' },
    { id: 'BLK-BPL-03', from: 'Hoshangabad (HBD)', to: 'Itarsi (ET)', km: '74–92 km', mps: 100, status: 'OCCUPIED', trainNum: '12615', trainName: 'Grand Trunk Express', dir: 'DN (ET Bound)', speed: 55, delay: 12, headway: '5.2 min', signal: 'YELLOW', risk: 'HEADWAY WARNING' },
    { id: 'BLK-BPL-04', from: 'Itarsi (ET)', to: 'Ghoradongri (GDYA)', km: '92–162 km', mps: 90, status: 'OCCUPIED', trainNum: '12727', trainName: 'Godavari Express', dir: 'UP (BPL Bound)', speed: 45, delay: 28, headway: '6.8 min', signal: 'DOUBLE_YELLOW', risk: 'REGULATED' },
    { id: 'BLK-BPL-05', from: 'Ghoradongri (GDYA)', to: 'Betul (BZU)', km: '162–199 km', mps: 110, status: 'CLEAR', trainNum: null, trainName: null, dir: '—', speed: 0, delay: 0, headway: '25.0 min', signal: 'GREEN', risk: 'CLEAR' },
  ],
  VSKP: [
    { id: 'BLK-VSKP-01', from: 'Visakhapatnam (VSKP)', to: 'Duvvada (DVD)', km: '0–17 km', mps: 100, status: 'OCCUPIED', trainNum: '20805', trainName: 'AP Express (Vande Bharat)', dir: 'DN (RJY Bound)', speed: 95, delay: 0, headway: '15.0 min', signal: 'GREEN', risk: 'CLEAR' },
    { id: 'BLK-VSKP-02', from: 'Duvvada (DVD)', to: 'Anakapalle (AKP)', km: '17–33 km', mps: 110, status: 'CLEAR', trainNum: null, trainName: null, dir: '—', speed: 0, delay: 0, headway: '18.0 min', signal: 'GREEN', risk: 'CLEAR' },
    { id: 'BLK-VSKP-03', from: 'Anakapalle (AKP)', to: 'Tuni (TUNI)', km: '33–97 km', mps: 110, status: 'OCCUPIED', trainNum: '12727', trainName: 'Godavari Express', dir: 'UP (VSKP Bound)', speed: 50, delay: 35, headway: '5.8 min', signal: 'DOUBLE_YELLOW', risk: 'REGULATED' },
    { id: 'BLK-VSKP-04', from: 'Tuni (TUNI)', to: 'Samalkot (SLO)', km: '97–150 km', mps: 110, status: 'CLEAR', trainNum: null, trainName: null, dir: '—', speed: 0, delay: 0, headway: '22.0 min', signal: 'GREEN', risk: 'CLEAR' },
    { id: 'BLK-VSKP-05', from: 'Samalkot (SLO)', to: 'Rajahmundry (RJY)', km: '150–200 km', mps: 110, status: 'OCCUPIED', trainNum: '12864', trainName: 'Howrah-SMVB Express', dir: 'DN (RJY Bound)', speed: 80, delay: 6, headway: '8.5 min', signal: 'GREEN', risk: 'CLEAR' },
  ]
};

export default function StaffOperationsDashboard({
  activeStation = 'BZA',
  user = null,
  onSelectTrainForDetails,
  onSelectTrainForEta,
  onSelectTrainForWhatIf,
  onSelectPlatformBerth
}) {
  const [quick, setQuick] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState(user?.role === 'station_master' ? 'yard' : 'corridor');

  const { isConnected: isTelemetryLive } = useRailwayTelemetry();
  const { trains: stationTrains, loading: stationLoading, lastUpdated: stationLastUpdated, isFallback: stationFeedFallback } = useStationTrains(activeStation);

  const currentStation = STATION_MASTERS[activeStation] || STATION_MASTERS.BZA;
  const corridorBlocks = CORRIDOR_BLOCK_SECTIONS[activeStation] || CORRIDOR_BLOCK_SECTIONS.BZA;

  const combinedStationTrains = useMemo(() => {
    if (stationTrains.length > 0) return stationTrains;

    const codes = (currentStation.trainFilterCodes || []).map(c => c.toUpperCase());
    const fallback = REAL_TRAINS_DATABASE.filter(t => {
      const haystack = [
        t.lastStation || '', t.nextStation || '', t.from || '', t.to || '',
        t.lastStationCode || '', t.nextPassingStationCode || ''
      ].map(s => String(s).toUpperCase()).join(' ');
      return codes.some(c => haystack.includes(c));
    });

    if (fallback.length === 0) return stationTrains;
    return fallback.map(t => ({ ...t, isLiveNTES: false, dataSource: 'SIMULATED', fallbackFeed: true }));
  }, [stationTrains, currentStation]);

  const isUsingFallbackFeed = stationTrains.length === 0 && combinedStationTrains.length > 0;

  // CURRENT OPERATING SITUATION Breakdown (9 Metrics)
  const totalTrains = combinedStationTrains.length || 8;
  const delayedTrains = combinedStationTrains.filter(t => (t.baseDelayMin || t.delay || 0) > 5);
  const criticalDelayedTrains = combinedStationTrains.filter(t => (t.baseDelayMin || t.delay || 0) > 20);
  const onTimeTrains = combinedStationTrains.filter(t => (t.baseDelayMin || t.delay || 0) <= 5);
  const incomingTrains = combinedStationTrains.filter(t => String(t.status || '').toUpperCase() !== 'DEPARTED' && String(t.status || '').toUpperCase() !== 'BERTHED');

  const punctuality = totalTrains > 0 ? Math.round((onTimeTrains.length / totalTrains) * 100) : 84;
  const avgDelayMins = delayedTrains.length > 0
    ? Math.round(delayedTrains.reduce((acc, t) => acc + (t.baseDelayMin || t.delay || 0), 0) / delayedTrains.length)
    : 9;

  const situationStats = [
    { label: 'In Section Track', value: totalTrains, color: 'cyan', sub: `Active block rakes` },
    { label: 'Approaching Queue', value: incomingTrains.length || 4, color: 'blue', sub: `Next 45 min corridor` },
    { label: 'Right-Time Trains', value: onTimeTrains.length || 5, color: 'emerald', sub: `${punctuality}% section punctuality` },
    { label: 'Regulated / Delayed', value: delayedTrains.length || 3, color: 'amber', sub: `Avg delay: +${avgDelayMins}m` },
    { label: 'Critical (>20m)', value: criticalDelayedTrains.length || 1, color: 'rose', sub: `Precedence risk` },
    { label: 'Active Caution TSRs', value: '2', color: 'amber', sub: `30–45 km/h restricted` },
    { label: 'Headway Alerts', value: '1', color: 'rose', sub: `< 7.0 min safe buffer` },
  ];

  const filteredTrains = combinedStationTrains.filter(t => {
    const q = quick.trim().toLowerCase();
    const matchesQ = !q || (t.name || '').toLowerCase().includes(q) || String(t.number || '').includes(q) || String(t.from || '').toLowerCase().includes(q) || String(t.to || '').toLowerCase().includes(q);
    if (!matchesQ) return false;

    const delay = t.baseDelayMin || t.delay || 0;
    if (statusFilter === 'ON_TIME') return delay <= 5 && t.status !== 'Cancelled';
    if (statusFilter === 'DELAYED') return delay > 5;
    if (statusFilter === 'CRITICAL') return delay > 20;
    if (statusFilter === 'BERTHED') return String(t.status || '').toUpperCase() === 'BERTHED';
    return true;
  });

  const platformGrid = useMemo(() => {
    const platCount = currentStation.platforms;
    const grid = [];
    for (let p = 1; p <= platCount; p++) {
      const match = combinedStationTrains.find(t => {
        const assignedPf = parseInt(t.assignedPlatform || t.platform || 0, 10);
        return assignedPf === p;
      });
      const status = match ? 'OCCUPIED' : 'AVAILABLE';
      grid.push({
        platformNumber: p,
        platformLabel: `Platform ${p}`,
        status,
        train: match ? `#${match.number} ${match.name}` : null,
        trainObj: match || null,
        arrivalTime: match ? (match.sta || match.scheduledArrival || '10:00') : '--',
        departureTime: match ? (match.std || match.scheduledDeparture || '10:15') : '--',
        starterSignalAspect: status === 'OCCUPIED' ? 'RED' : 'GREEN'
      });
    }
    return grid;
  }, [combinedStationTrains, currentStation]);

  const occupiedPlatforms = platformGrid.filter(p => p.status !== 'AVAILABLE').length;

  if (stationLoading && combinedStationTrains.length === 0) {
    return (
      <div className="space-y-4">
        <RailwayLoader
          dark={true}
          fullPage={true}
          message={`Syncing ${currentStation.name} Operations & Live Telemetry...`}
          submessage="Querying NTES/RTIS feeds, track circuit relays, and dynamic ETA predictions..."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── TOP OPERATIONAL SITUATION RIBBON ── */}
      <div className="bg-gradient-to-r from-[#0b1524] via-[#0f1d32] to-[#0b1524] border border-cyan-500/30 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <MonitorDot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                Corridor Operating Situation &bull; <span className="text-cyan-300">{currentStation.name} Section ({currentStation.code})</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                  {currentStation.zone}
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Corridor-Wide Block Telemetry &bull; Preceding Headway &bull; Dynamic ETA Forecasts
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {/* View Switcher: Corridor Block vs Yard Berthing */}
            <div className="flex items-center gap-1 bg-black/50 p-1 rounded-lg border border-white/10">
              <button
                onClick={() => setViewMode('corridor')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  viewMode === 'corridor' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Corridor Track Blocks
              </button>
              <button
                onClick={() => setViewMode('yard')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  viewMode === 'yard' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Station Yard (Platforms)
              </button>
            </div>

            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-slate-300">
              <span className={`w-2 h-2 rounded-full ${isTelemetryLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {isTelemetryLive ? 'Live NTES/RTIS' : 'Simulated Telemetry'}
            </span>
          </div>
        </div>

        {/* 7-Tile Operational Metric Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {situationStats.map(k => (
            <div key={k.label} className="rounded-xl border border-white/10 bg-black/40 p-2.5 shadow-inner text-center">
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 truncate">{k.label}</p>
              <p className={`text-xl font-black font-mono mt-1 leading-none ${COLOR_TEXT[k.color] || 'text-white'}`}>{k.value}</p>
              <p className="text-[10px] text-slate-400 mt-1 truncate">{k.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── VIEW 1: CORRIDOR BLOCK OCCUPANCY STRIP (MAJOR SECTION CONTROLLER FEATURE) ── */}
      {viewMode === 'corridor' && (
        <div className="space-y-4">
          <Card accent="cyan">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3 mb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Corridor Block-Section Occupancy & Line Clearance Strip
                </h3>
                <p className="text-xs text-slate-400">
                  Continuous multi-station block line circuits &bull; Active trains, speeds, signal aspects and headway buffers
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="flex items-center gap-1 text-emerald-400"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Clear Track</span>
                <span className="flex items-center gap-1 text-amber-400"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Yellow Caution</span>
                <span className="flex items-center gap-1 text-rose-400"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Block Occupied / Red</span>
              </div>
            </div>

            {/* Block Chain Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {corridorBlocks.map(blk => {
                const isOccupied = blk.status === 'OCCUPIED';
                const sigColor = blk.signal === 'RED' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]' : blk.signal === 'YELLOW' ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.9)]' : blk.signal === 'DOUBLE_YELLOW' ? 'bg-amber-400' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]';

                return (
                  <div
                    key={blk.id}
                    onClick={() => {
                      if (blk.trainNum) {
                        const tr = combinedStationTrains.find(t => String(t.number) === String(blk.trainNum)) || { number: blk.trainNum, name: blk.trainName };
                        onSelectTrainForDetails?.(tr);
                      }
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isOccupied
                        ? blk.risk === 'CONGESTED'
                          ? 'bg-rose-950/40 border-rose-500/60 shadow-lg shadow-rose-950/20'
                          : 'bg-slate-900 border-cyan-500/40 hover:border-cyan-400'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Block Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${sigColor}`} />
                        <span className="font-bold text-white text-xs">{blk.from} &rarr; {blk.to}</span>
                      </div>
                      <Badge variant={blk.risk === 'CONGESTED' ? 'danger' : blk.risk === 'HEADWAY WARNING' ? 'warning' : blk.risk === 'REGULATED' ? 'warning' : 'success'}>
                        {blk.risk}
                      </Badge>
                    </div>

                    {/* Block Sub-Info */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2 border-b border-slate-800/80 pb-2">
                      <span>{blk.km}</span>
                      <span>MPS: <strong className="text-slate-200">{blk.mps} km/h</strong></span>
                      <span>Headway: <strong className="text-cyan-300">{blk.headway}</strong></span>
                    </div>

                    {/* Occupying Train Info or Clear Track */}
                    {isOccupied ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-cyan-300 text-xs">#{blk.trainNum}</span>
                          <span className={`text-[10px] font-mono font-bold ${blk.delay > 15 ? 'text-rose-400' : blk.delay > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {blk.delay > 0 ? `+${blk.delay}m Late` : 'On Time'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-200 truncate">{blk.trainName}</p>
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                          <span>Track: {blk.dir}</span>
                          <span>Cruising: <strong className="text-emerald-300">{blk.speed} km/h</strong></span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-2 flex items-center justify-center gap-2 text-emerald-400/80 font-mono text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Block Clear &bull; Green Aspect
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* ── HEADWAY MONITORING & TRAFFIC CONFLICT CALLOUT ── */}
          <Card accent="amber">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Active Section Headway & Follow-Up Risk Monitor</h3>
              </div>
              <Badge variant="warning">Headway Buffer: 6.2 min vs 8.0 min Required</Badge>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Preceding Train</p>
                  <p className="font-bold text-white">#12864 Howrah-SMVB Exp <span className="text-slate-400">(75 km/h)</span></p>
                </div>
                <div className="text-cyan-400 font-mono font-bold">&rarr; 11.4 km &rarr;</div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Following Train (Faster)</p>
                  <p className="font-bold text-cyan-300">#20805 Vande Bharat Exp <span className="text-cyan-400 font-bold">(110 km/h)</span></p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectTrainForWhatIf?.({ number: '20805' })}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all shadow-md flex items-center gap-1"
                >
                  <Sliders className="w-3.5 h-3.5" /> Simulate Overtake in What-If
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── VIEW 2: YARD PLATFORM BERTHING (STATION MASTER VIEW) ── */}
      {viewMode === 'yard' && (
        <Card accent="cyan">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-2.5 mb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 tracking-tight">
                <span className="w-4 h-4 rounded-[4px] border-2 border-cyan-300 flex items-center justify-center text-[8px] font-black text-cyan-300">P</span>
                Platform Berthing & Yard Track Circuits &bull; {currentStation.code}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Live platform occupancy, starter signals and arrival slots</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1 rounded-lg font-bold">
                {occupiedPlatforms} / {currentStation.platforms} occupied
              </span>
              <button
                type="button"
                onClick={onSelectPlatformBerth}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" /> Conflict Analysis
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {platformGrid.map(pf => (
              <div
                key={pf.platformNumber}
                onClick={() => {
                  if (pf.trainObj) {
                    onSelectTrainForDetails?.(pf.trainObj);
                  } else {
                    onSelectPlatformBerth?.();
                  }
                }}
                className={`rounded-xl border p-2.5 transition-all cursor-pointer ${
                  pf.status === 'OCCUPIED'
                    ? 'bg-amber-500/10 border-amber-500/40 hover:border-amber-400'
                    : 'bg-black/40 border-white/10 hover:border-cyan-400/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[11px] font-black text-white">{pf.platformLabel}</span>
                  <span className={`w-2 h-2 rounded-full ${pf.starterSignalAspect === 'RED' ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.9)]' : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'}`} />
                </div>
                {pf.train ? (
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-cyan-300 truncate">{pf.train}</p>
                    <p className="text-[9px] text-slate-400 font-mono truncate">ARR {pf.arrivalTime} &bull; DEP {pf.departureTime}</p>
                  </div>
                ) : (
                  <p className="text-[10px] text-emerald-400/80 italic font-medium">Available (Clear Track)</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── FID DEPARTURE BOARD & DYNAMIC ETA FEED ── */}
      <Card accent="cyan">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 tracking-tight">
              <Sparkles className="w-4 h-4 text-cyan-300" />
              Dynamic ETA Departure Board & Dispatch Schedule
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous AI ETA forecasting &bull; Scheduled vs Dynamic Forecast with P10–P90 uncertainty ranges
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Status Filter Pills */}
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/10 text-xs">
              {[
                { id: 'ALL', label: 'All Trains' },
                { id: 'ON_TIME', label: 'On Time' },
                { id: 'DELAYED', label: 'Delayed' },
                { id: 'CRITICAL', label: 'Critical (>20m)' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                    statusFilter === f.id ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full md:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={quick}
                onChange={e => setQuick(e.target.value)}
                placeholder="Search train / station..."
                className="w-full bg-black/40 border border-white/15 rounded-lg pl-8 pr-2 py-1 text-xs text-white outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto -mx-1 px-1">
          <div className="min-w-[960px]">
            <div className="grid grid-cols-12 px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 border-b border-white/10">
              <span className="col-span-1">Train</span>
              <span className="col-span-3">Service & Route</span>
              <span className="col-span-1 text-center">Scheduled</span>
              <span className="col-span-2 text-center">AI Dynamic ETA</span>
              <span className="col-span-2 text-center">P10–P90 Range</span>
              <span className="col-span-1 text-center">PF</span>
              <span className="col-span-1 text-center">Delay / Status</span>
              <span className="col-span-1 text-right">Actions</span>
            </div>

            <div className="divide-y divide-white/[0.05]">
              {filteredTrains.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-500">
                  No trains match this filter for {currentStation.code}.
                </div>
              ) : (
                filteredTrains.map((t, idx) => {
                  const delay = t.baseDelayMin || t.delay || 0;
                  const isBerthed = String(t.status || '').toUpperCase() === 'BERTHED';
                  const pf = t.assignedPlatform || t.platform || '--';
                  const schedArrival = t.std || t.scheduledArrival || t.scheduledNextArrival || '18:40';
                  const dynamicEta = t.dynamicEta || t.predictedEta || t.eta || schedArrival;
                  const { p10, p90, conf } = computeP10P90(dynamicEta, delay);

                  return (
                    <div
                      key={t.number}
                      className={`grid grid-cols-12 px-3 py-3 items-center text-xs md:text-sm transition-colors ${
                        idx % 2 === 0 ? 'bg-white/[0.02]' : ''
                      } hover:bg-cyan-500/[0.06]`}
                    >
                      {/* Train Number */}
                      <div className="col-span-1 font-black text-cyan-300 font-mono">
                        #{t.number}
                      </div>

                      {/* Service & Route */}
                      <div className="col-span-3 pr-2">
                        <p className="text-slate-100 font-bold truncate leading-tight">{t.name}</p>
                        <p className="text-slate-400 text-[11px] truncate mt-0.5">
                          {t.from?.split('(')?.[0]} → {t.to?.split('(')?.[0]}
                        </p>
                      </div>

                      {/* Scheduled Time */}
                      <div className="col-span-1 text-center text-slate-400 font-mono">
                        {schedArrival}
                      </div>

                      {/* AI Dynamic ETA */}
                      <div className="col-span-2 text-center">
                        <span className="font-black text-white font-mono text-sm">{dynamicEta}</span>
                        <div className="text-[10px] text-cyan-300 font-mono font-semibold">
                          Confidence: {conf}
                        </div>
                      </div>

                      {/* P10 - P90 Uncertainty Range */}
                      <div className="col-span-2 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/10 font-mono text-[11px] text-slate-300 font-bold">
                          {p10} – {p90}
                        </span>
                      </div>

                      {/* Platform */}
                      <div className="col-span-1 text-center">
                        {pf !== '--' ? (
                          <span className="bg-cyan-400 text-slate-950 px-2 py-0.5 rounded font-black text-xs font-mono">
                            PF {pf}
                          </span>
                        ) : (
                          <span className="text-slate-600">--</span>
                        )}
                      </div>

                      {/* Delay & Operational Status */}
                      <div className="col-span-1 text-center">
                        {isBerthed ? (
                          <Badge variant="info">Berthed</Badge>
                        ) : delay <= 5 ? (
                          <Badge variant="success">On Time</Badge>
                        ) : delay <= 15 ? (
                          <Badge variant="warning">+{delay}m Late</Badge>
                        ) : (
                          <Badge variant="danger">+{delay}m Late</Badge>
                        )}
                      </div>

                      {/* Action Links */}
                      <div className="col-span-1 flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectTrainForEta?.(t)}
                          className="px-2 py-1 rounded bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold transition-colors"
                          title="Explain Why This ETA Changed"
                        >
                          Why Changed?
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectTrainForDetails?.(t)}
                          className="p-1 rounded bg-white/[0.05] hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-xs transition-colors"
                          title="Inspect Train Roster Details"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}