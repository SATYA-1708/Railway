import React, { useState, useMemo } from 'react';
import { ChevronRight, Activity, Search, Sparkles, MapPin, Gauge, Clock, ShieldAlert, ArrowRight, TrendingUp, TrendingDown, Minus, CheckCircle2 } from 'lucide-react';
import Card from './ui/Card';
import Badge from './ui/Badge';
import LiveTrainMap from './LiveTrainMap';
import RailwayLoader from './ui/RailwayLoader';
import { useStationTrains } from '../hooks/useStationTrains';

const routeProgress = (t) => {
  const timeline = t?.routeTimeline || [];
  const departed = timeline.filter(s => s.status === 'DEPARTED').length;
  return timeline.length > 0 ? Math.round((departed / timeline.length) * 100) : 0;
};

function computeP10P90(etaStr, delayMin = 0) {
  if (!etaStr || !etaStr.includes(':')) return { p10: '--:--', p90: '--:--' };
  const parts = etaStr.split(':');
  let h = parseInt(parts[0], 10);
  let m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return { p10: etaStr, p90: etaStr };

  const totalMin = h * 60 + m;
  const spread = delayMin > 15 ? 5 : delayMin > 5 ? 3 : 2;

  const min10 = Math.max(0, totalMin - spread);
  const min90 = totalMin + spread + (delayMin > 15 ? 2 : 1);

  const h10 = Math.floor(min10 / 60) % 24;
  const m10 = min10 % 60;
  const h90 = Math.floor(min90 / 60) % 24;
  const m90 = min90 % 60;

  const pad = (n) => String(n).padStart(2, '0');
  return {
    p10: `${pad(h10)}:${pad(m10)}`,
    p90: `${pad(h90)}:${pad(m90)}`
  };
}

export default function StaffLiveMonitoring({ trains = [], onSelectTrainForDetails, onSelectTrainForEta, stationCode = 'BZA' }) {
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const { trains: stationTrains, loading } = useStationTrains(stationCode);

  const rawTrains = stationTrains.length > 0 ? stationTrains : trains;

  const filteredTrains = useMemo(() => {
    return rawTrains.filter(t => {
      const q = query.trim().toLowerCase();
      const matchQ = !q || String(t.number || '').includes(q) || String(t.name || '').toLowerCase().includes(q) || String(t.from || '').toLowerCase().includes(q) || String(t.to || '').toLowerCase().includes(q) || String(t.nextStation || '').toLowerCase().includes(q);
      if (!matchQ) return false;

      const delay = t.baseDelayMin || t.delay || 0;
      if (statusFilter === 'ON_TIME') return delay <= 5;
      if (statusFilter === 'DELAYED') return delay > 5;
      if (statusFilter === 'CRITICAL') return delay > 20;
      if (statusFilter === 'ARRIVING') return String(t.status || '').toUpperCase() !== 'DEPARTED';
      if (statusFilter === 'DEPARTING') return (t.currentSpeed || 0) > 0;
      return true;
    });
  }, [rawTrains, query, statusFilter]);

  const active = selectedTrain && filteredTrains.some(t => t.number === selectedTrain.number)
    ? selectedTrain
    : (filteredTrains[0] || rawTrains[0] || null);

  const progress = active ? routeProgress(active) : 0;
  const delay = active ? (active.baseDelayMin || active.delay || 0) : 0;
  const schedTime = active ? (active.scheduledArrival || active.sta || active.scheduledNextArrival || '18:40') : '--';
  const dynamicEta = active ? (active.dynamicEta || active.predictedEta || active.eta || schedTime) : '--';
  const { p10, p90 } = computeP10P90(dynamicEta, delay);

  // Delay trend
  const speed = active?.currentSpeed || 0;
  const delayTrend = delay === 0
    ? { label: 'Stable (Punctual)', color: 'text-emerald-400', icon: CheckCircle2 }
    : speed < 40
    ? { label: 'Accumulating Delay (Slow Preceding Track)', color: 'text-rose-400', icon: TrendingUp }
    : speed > 70
    ? { label: 'Recovering (+1.5m / 30km)', color: 'text-cyan-400', icon: TrendingDown }
    : { label: 'Consistent Delay (+0m / 30km)', color: 'text-amber-400', icon: Minus };

  if (loading && rawTrains.length === 0) {
    return (
      <div className="space-y-4">
        <RailwayLoader
          dark={true}
          fullPage={true}
          message="Streaming Live Fleet Telemetry & Geographic Coordinates..."
          submessage={`Tracking active coaching trains across ${stationCode} corridor...`}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map Filter & Search Header */}
      <div className="glass-panel rounded-2xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1">
          {[
            { id: 'ALL', label: `All (${rawTrains.length})` },
            { id: 'ON_TIME', label: 'On Time' },
            { id: 'DELAYED', label: 'Delayed' },
            { id: 'CRITICAL', label: 'Critical (>20m)' },
            { id: 'ARRIVING', label: 'Approaching' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                statusFilter === f.id
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white bg-black/30'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64 flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search train / station on map..."
            className="w-full bg-black/40 border border-white/15 focus:border-cyan-400 rounded-xl pl-10 pr-3 py-2 text-xs text-white outline-none"
            style={{ paddingLeft: '2.4rem' }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Map Area */}
        <div className="lg:col-span-8">
          {rawTrains.length > 0 ? (
            <LiveTrainMap
              trains={filteredTrains.length > 0 ? filteredTrains : rawTrains}
              selectedTrainNumber={active?.number}
              height="calc(100vh - 230px)"
              stationCode={stationCode}
              onSelectTrain={setSelectedTrain}
            />
          ) : (
            <div className="rounded-2xl border border-white/10 bg-[#0b1524] h-[460px] flex items-center justify-center">
              <div className="text-center space-y-2">
                <Activity className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">No live telemetry available for {stationCode}</p>
                <p className="text-[10px] text-slate-500">Waiting for NTES feed or WebSocket connection</p>
              </div>
            </div>
          )}
        </div>

        {/* Details Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          {active && (
            <Card accent="cyan">
              {/* Train Title & Delay Status */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-300">#{active.number}</span>
                    <Badge variant="neutral">{active.type || 'Express'}</Badge>
                  </div>
                  <h3 className="text-sm font-bold text-white leading-tight mt-0.5">{active.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {active.from?.split('(')?.[0]} → {active.to?.split('(')?.[0]}
                  </p>
                </div>
                <Badge variant={delay <= 5 ? 'success' : delay <= 15 ? 'warning' : 'danger'}>
                  {delay <= 5 ? 'On Time' : `+${delay}m Late`}
                </Badge>
              </div>

              {/* Dynamic ETA Hero Strip */}
              <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-500/30 mb-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" /> Scheduled:
                  </span>
                  <span className="font-mono text-slate-300 font-bold">{schedTime}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-cyan-300 font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> AI Dynamic ETA:
                  </span>
                  <span className="font-mono font-black text-white text-sm">{dynamicEta}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">P10–P90 Range:</span>
                  <span className="font-mono font-bold text-cyan-300">{p10} – {p90}</span>
                </div>
              </div>

              {/* Telemetry rows */}
              <div className="space-y-1.5">
                {[
                  { label: 'Current Location', value: active.lastStation?.split('(')?.[0] ?? active.from?.split('(')?.[0] ?? '—' },
                  { label: 'Next Station', value: active.nextStation?.split('(')?.[0] ?? active.to?.split('(')?.[0] ?? '—', accent: true },
                  { label: 'Live GPS Speed', value: `${active.currentSpeed ?? 0} km/h` },
                  { label: 'Corridor Progress', value: `${progress}% Completed` },
                ].map(r => (
                  <div key={r.label} className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 flex items-center justify-between text-xs">
                    <span className="text-slate-400">{r.label}</span>
                    <span className={`font-mono font-bold ${r.accent ? 'text-cyan-300' : 'text-white'}`}>{r.value}</span>
                  </div>
                ))}
              </div>

              {/* Delay Trend Indicator */}
              <div className="mt-3 p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Delay Trend:</span>
                <span className={`font-bold flex items-center gap-1 text-[11px] ${delayTrend.color}`}>
                  <delayTrend.icon className="w-3.5 h-3.5" /> {delayTrend.label}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 mt-3 border-t border-slate-800 flex gap-2">
                <button
                  type="button"
                  onClick={() => onSelectTrainForEta?.(active)}
                  className="flex-1 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Explain ETA
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTrainForDetails?.(active)}
                  className="flex-1 py-2 rounded-lg bg-white/[0.06] hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                >
                  Inspect Train <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          )}

          {/* Upcoming Halts */}
          {active && (
            <Card>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 mb-2.5">
                Downstream Upcoming Halts & Propagation
              </p>
              <div className="space-y-1.5">
                {(active.routeTimeline || []).filter(s => s.status !== 'DEPARTED').slice(0, 4).map((stn, idx) => (
                  <div
                    key={stn.code || idx}
                    className={`px-3 py-2 rounded-lg border flex items-center justify-between text-xs ${
                      stn.status === 'NEXT' ? 'bg-cyan-500/[0.06] border-cyan-500/30' : 'bg-black/40 border-white/10'
                    }`}
                  >
                    <span className={`${stn.status === 'NEXT' ? 'text-cyan-300 font-bold' : 'text-slate-300'}`}>
                      {stn.name} <span className="font-mono text-slate-500 text-[10px]">({stn.code})</span>
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {stn.sta || stn.scheduled || '--'}
                      {stn.predicted && <span className="text-cyan-300 font-bold"> → {stn.predicted}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

