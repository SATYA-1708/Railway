import React, { useState, useEffect, useMemo } from 'react';
import { Sliders, Gauge, CloudFog, Sun, Clock, Sparkles, AlertTriangle, CheckCircle2, Shield, Train, ArrowRight, Wind, History, Milestone } from 'lucide-react';
import { recalculateDynamicEta } from '../data/railwayData';
import Card from './ui/Card';
import Badge from './ui/Badge';
import SectionHeader from './ui/SectionHeader';

export default function StaffConditionChangeDemo({ initialTrain = null, trains = [] }) {
  const [selectedTrainNumber, setSelectedTrainNumber] = useState(() => initialTrain?.number || (trains[0]?.number) || '20805');

  const availableTrains = Array.isArray(trains) && trains.length > 0 ? trains : [];

  const baseTrain =
    availableTrains.find(t => String(t.number) === String(selectedTrainNumber)) ||
    (initialTrain?.number
      ? (availableTrains.find(t => String(t.number) === String(initialTrain.number)) || initialTrain)
      : availableTrains[0]) ||
    null;

  const fallbackTrain = useMemo(() => ({
    number: selectedTrainNumber,
    name: 'Express Train',
    scheduledNextArrival: '18:40',
    nextStation: 'Vijayawada Jn',
    baseDelayMin: 0,
    delayMin: 0,
    precedingTrainAhead: { speedKm: 50 },
    weather: { visibilityKm: 8 },
    routeTimeline: [
      { name: 'Warangal', code: 'WL', scheduled: '17:20', predicted: '17:22', status: 'DEPARTED', km: 210 },
      { name: 'Khammam', code: 'KMT', scheduled: '18:10', predicted: '18:14', status: 'NEXT', km: 318 },
      { name: 'Vijayawada', code: 'BZA', scheduled: '19:30', predicted: '19:39', status: 'UPCOMING', km: 450 },
      { name: 'Rajahmundry', code: 'RJY', scheduled: '21:50', predicted: '22:04', status: 'UPCOMING', km: 598 }
    ]
  }), [selectedTrainNumber]);

  const train = baseTrain || fallbackTrain;

  const getInitialForTrain = (t) => {
    const isDelay = (t.baseDelayMin || t.delay || 0) > 0;
    return {
      speed: isDelay ? (t.precedingTrainAhead?.speedKm || (t.baseDelayMin > 8 ? 35 : 50)) : 75,
      weather: t.weather?.visibilityKm || 8,
      traffic: isDelay ? (t.baseDelayMin > 6 ? 'HEAVY' : 'MODERATE') : 'LOW',
      dwell: 0
    };
  };

  const init = getInitialForTrain(train);
  const [precedingSpeed, setPrecedingSpeed] = useState(init.speed);
  const [weatherVisibility, setWeatherVisibility] = useState(init.weather);
  const [trafficDensity, setTrafficDensity] = useState(init.traffic);
  const [stationDwellExtra, setStationDwellExtra] = useState(init.dwell);

  // Sync state when selected train changes
  const handleTrainChange = (num) => {
    setSelectedTrainNumber(num);
    const target = availableTrains.find(t => String(t.number) === String(num)) || availableTrains[0] || {};
    const targetInit = getInitialForTrain(target);
    setPrecedingSpeed(targetInit.speed);
    setWeatherVisibility(targetInit.weather);
    setTrafficDensity(targetInit.traffic);
    setStationDwellExtra(targetInit.dwell);
  };

  useEffect(() => {
    if (initialTrain && initialTrain.number) {
      handleTrainChange(initialTrain.number);
    }
  }, [initialTrain]);

  const dynamicResult = recalculateDynamicEta(train, {
    precedingSpeedKm: precedingSpeed,
    trafficDensity,
    weatherVisibility,
    stationDwellExtraMin: stationDwellExtra
  });

  const applyPreset = (type) => {
    const presets = {
      CLEAR: [75, 10, 'LOW', 0],
      FOG: [45, 1.2, 'MODERATE', 2],
      FREIGHT_CRAWL: [25, 8, 'MODERATE', 0],
      JUNCTION_RUSH: [40, 8, 'HEAVY', 6],
    };
    const [s, v, d, w] = presets[type] || presets.CLEAR;
    setPrecedingSpeed(s);
    setWeatherVisibility(v);
    setTrafficDensity(d);
    setStationDwellExtra(w);
  };

  const speedTone = precedingSpeed < 40 ? 'danger' : precedingSpeed < 60 ? 'warning' : 'success';
  const delta = dynamicResult.totalDelayMin;
  const confidenceScore = delta <= 0 ? 95 : delta <= 10 ? 89 : 82;

  // Ranked Delay Factors (Total equals dynamicResult.totalDelayMin)
  const rankedFactors = useMemo(() => {
    const factors = [];
    let dynamicSum = 0;

    if (trafficDensity === 'HEAVY') {
      const minVal = 4;
      dynamicSum += minVal;
      factors.push({ name: 'Junction / Corridor Queue Congestion', min: minVal, severity: 'danger', desc: 'Heavy rake headway queuing at approach signal' });
    } else if (trafficDensity === 'MODERATE') {
      const minVal = 2;
      dynamicSum += minVal;
      factors.push({ name: 'Junction Headway Spacing', min: minVal, severity: 'warning', desc: 'Regulated block section spacing' });
    }

    if (precedingSpeed < 40) {
      const minVal = Math.max(1, Math.round((45 - precedingSpeed) / 5));
      dynamicSum += minVal;
      factors.push({ name: 'Preceding Rake Speed Restriction', min: minVal, severity: 'danger', desc: `Preceding rake travelling at restricted ${precedingSpeed} km/h` });
    } else if (precedingSpeed < 65) {
      const minVal = 2;
      dynamicSum += minVal;
      factors.push({ name: 'Headway Differential', min: minVal, severity: 'warning', desc: `Speed capped at ${precedingSpeed} km/h by automatic section block` });
    }

    if (weatherVisibility < 2.0) {
      const minVal = 3;
      dynamicSum += minVal;
      factors.push({ name: 'Dense Fog Visibility Advisory', min: minVal, severity: 'danger', desc: `Visibility < ${weatherVisibility} km requires loco pilot caution order` });
    } else if (weatherVisibility < 5.0) {
      const minVal = 1;
      dynamicSum += minVal;
      factors.push({ name: 'Reduced Visibility Caution', min: minVal, severity: 'warning', desc: `Visibility at ${weatherVisibility} km with mild speed restriction` });
    }

    if (stationDwellExtra > 0) {
      dynamicSum += stationDwellExtra;
      factors.push({ name: 'Extended Platform Dwell / Boarding', min: stationDwellExtra, severity: 'warning', desc: `Passenger boarding dwell extension at previous junction` });
    }

    // Account for prior accumulated base delay from previous sections/origin
    const baseRemaining = Math.max(0, delta - dynamicSum);
    if (baseRemaining > 0) {
      const originStation = train.from?.split('(')?.[0] || 'Origin';
      const lastStation = train.lastStation?.split('(')?.[0] || 'Prior Section';
      factors.push({
        name: 'Upstream Run & Prior Section Delay Accumulation',
        min: baseRemaining,
        severity: baseRemaining > 15 ? 'danger' : 'warning',
        desc: `Accumulated running delay inherited from prior junctions (${originStation} → ${lastStation}) before entering current section`
      });
    }

    if (factors.length === 0) {
      factors.push({ name: 'Clear Track Section', min: 0, severity: 'success', desc: 'Corridor operating under optimal green block clearance' });
    }

    return factors.sort((a, b) => b.min - a.min);
  }, [trafficDensity, precedingSpeed, weatherVisibility, stationDwellExtra, delta, train]);

  // ETA Change History (Chronological snapshot simulation)
  const etaHistory = useMemo(() => {
    const sched = train.scheduledNextArrival || train.sta || '18:40';
    return [
      { time: '18:00', eta: sched, diff: '0m', cause: 'Timetable Baseline Entry', type: 'base' },
      { time: '18:10', eta: dynamicResult.newEta, diff: `+${Math.max(0, delta - 3)}m`, cause: 'Preceding Freight Speed Deceleration', type: 'update' },
      { time: '18:20', eta: dynamicResult.newEta, diff: `+${Math.max(0, delta - 1)}m`, cause: 'Corridor Visibility & Speed Order Sync', type: 'update' },
      { time: '18:30 (Now)', eta: dynamicResult.newEta, diff: `+${delta}m`, cause: 'Live GBDT Quantile Forecast', type: 'live' },
    ];
  }, [train, dynamicResult, delta]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-400 glow-soft">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              Explainable ETA Prediction Engine <Badge variant="info">Live XAI Sandbox</Badge>
            </h1>
            <p className="text-xs text-slate-400">
              Explore dynamic condition shifts &bull; Understand why ETA changes with continuous P10–P90 uncertainty modeling
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Select Train:</span>
          <select
            value={selectedTrainNumber}
            onChange={(e) => handleTrainChange(e.target.value)}
            className="glass-input rounded-xl px-3 py-2 text-xs font-bold text-white cursor-pointer outline-none [&>option]:bg-slate-900 border border-white/15"
          >
            {availableTrains.map(t => (
              <option key={t.number} value={t.number}>
                #{t.number} — {t.name} ({((t.baseDelayMin || t.delay || 0) <= 0 ? 'On Time' : `+${t.baseDelayMin || t.delay}m`)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scenario Presets */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-semibold shrink-0 text-[11px] uppercase tracking-[0.12em]">Scenario Presets:</span>
        {[
          { type: 'CLEAR', label: 'Clear Green Track', icon: Sun },
          { type: 'FREIGHT_CRAWL', label: 'Slow Freight Ahead (25 km/h)', icon: Train },
          { type: 'FOG', label: 'Dense Fog Advisory (1.2 km)', icon: CloudFog },
          { type: 'JUNCTION_RUSH', label: 'Junction Congestion Queue', icon: Clock },
        ].map(p => (
          <button
            key={p.type}
            type="button"
            onClick={() => applyPreset(p.type)}
            className="px-3 py-1.5 rounded-xl glass-subtle text-slate-300 hover:text-brand-400 hover:border-brand-500/40 font-medium shrink-0 flex items-center gap-1.5 transition-all"
          >
            <p.icon className="w-3.5 h-3.5 text-brand-400" /> {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* ── Controls (Left 5 Cols) ── */}
        <div className="md:col-span-5 space-y-5">
          <Card>
            <SectionHeader icon={Sliders} iconColor="text-brand-400" title="Corridor Conditions" description="Adjust parameters to test model response" />
            <div className="space-y-5 mt-5">
              {/* Preceding Train Speed */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-300">Preceding Train Speed</span>
                  <Badge variant={speedTone}>{precedingSpeed} km/h</Badge>
                </div>
                <input type="range" min="15" max="85" step="5" value={precedingSpeed} onChange={(e) => setPrecedingSpeed(Number(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-[#10d99a]" />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono tnum"><span>15 km/h (Restricted)</span><span>50</span><span>85 km/h (Clear)</span></div>
              </div>

              {/* Weather Visibility */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Corridor Visibility</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{ label: 'Clear 8km', val: 8, icon: Sun }, { label: 'Mist 3km', val: 3, icon: CloudFog }, { label: 'Dense Fog 1.2km', val: 1.2, icon: CloudFog }].map(w => (
                    <button key={w.label} onClick={() => setWeatherVisibility(w.val)} className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${weatherVisibility === w.val ? 'bg-cyan-500/15 border-cyan-400/60 text-white shadow-[0_0_16px_-6px_rgba(34,211,238,0.6)]' : 'glass-subtle text-slate-400 hover:text-white'}`}>
                      <w.icon className={`w-4 h-4 ${weatherVisibility === w.val ? 'text-cyan-300' : 'text-slate-500'}`} />
                      <span className="text-[11px] font-medium">{w.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Junction Traffic Density */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Junction Queue Density</label>
                <div className="grid grid-cols-3 gap-2">
                  {['LOW', 'MODERATE', 'HEAVY'].map(d => (
                    <button key={d} onClick={() => setTrafficDensity(d)} className={`py-2 rounded-xl border text-xs font-bold transition-all ${trafficDensity === d ? 'bg-brand-500/15 border-brand-500/60 text-brand-400 shadow-[0_0_16px_-6px_rgba(16,217,154,0.6)]' : 'glass-subtle text-slate-400 hover:text-white'}`}>{d}</button>
                  ))}
                </div>
              </div>

              {/* Extra Boarding Dwell */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-300">Extra Boarding Dwell</span>
                  <span className="font-mono font-bold text-amber-400 tnum">+{stationDwellExtra} min</span>
                </div>
                <input type="range" min="0" max="12" step="2" value={stationDwellExtra} onChange={(e) => setStationDwellExtra(Number(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-[#f59e0b]" />
              </div>
            </div>
          </Card>

          {/* ETA Change History Timeline Card */}
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-300 flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" /> Continuous ETA Revision History
              </h4>
              <Badge variant="info">Live Feed</Badge>
            </div>
            <div className="mt-3 space-y-2 text-xs">
              {etaHistory.map((h, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-mono text-cyan-300 font-bold">{h.time}</span>
                    <p className="text-[11px] text-slate-400">{h.cause}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-black text-white">{h.eta}</p>
                    <span className="text-[10px] font-mono text-amber-400">{h.diff}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Results & Explainability (Right 7 Cols) ── */}
        <div className="md:col-span-7 space-y-5">
          {/* Dynamic Forecast Hero Card */}
          <Card accent="emerald">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> AI Dynamic Forecast
                </p>
                <h3 className="text-base font-bold text-white mt-0.5">#{train.number} {train.name}</h3>
              </div>
              <Badge variant={delta === 0 ? 'success' : delta < 6 ? 'warning' : 'danger'}>
                {delta === 0 ? 'Punctual' : `+${delta} min Delay`}
              </Badge>
            </div>

            {/* Timetable vs Live Forecast Flow */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-3 mt-4">
              <div className="p-4 rounded-2xl glass-subtle space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.14em]">Timetable (Static)</p>
                <div className="text-3xl font-mono font-black text-slate-300 tnum">{train.scheduledNextArrival || train.sta || '18:40'}</div>
                <p className="text-[11px] text-slate-500">At {train.nextStation || 'Vijayawada Jn'}</p>
              </div>

              <div className="flex flex-col items-center gap-1 py-1">
                <div className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold tnum ${delta === 0 ? 'text-brand-400 bg-brand-500/10 border border-brand-500/30' : 'text-amber-400 bg-amber-500/10 border border-amber-500/30'}`}>
                  {delta === 0 ? 'on time' : `+${delta}m`}
                </div>
                <ArrowRight className="w-4 h-4 text-brand-400 rotate-90 sm:rotate-0" />
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-500/12 to-cyan-500/8 border border-brand-500/40 space-y-1 relative shadow-[0_0_30px_-10px_rgba(16,217,154,0.45)]">
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-brand-500/15 text-brand-400 font-mono text-[9px] font-bold uppercase tracking-wider border border-brand-500/30">
                  CONF {confidenceScore}%
                </div>
                <p className="text-[10px] font-bold text-brand-400 uppercase tracking-[0.14em]">Dynamic ETA</p>
                <div className="text-3xl font-mono font-black text-white tnum">{dynamicResult.newEta}</div>
                <p className="text-[11px] text-slate-300">Range: <span className="font-mono text-white font-bold tnum">{dynamicResult.expectedRange}</span></p>
              </div>
            </div>

            {/* Telemetry footer */}
            <div className="mt-4 glass-subtle rounded-xl px-4 py-2.5 flex items-center justify-between text-xs font-mono tnum">
              <span className="text-slate-400">Section Speed: <strong className="text-white">{dynamicResult.speedEstimated} km/h</strong></span>
              <span className="text-slate-400">Calculated Delay: <strong className="text-amber-400">+{dynamicResult.totalDelayMin} min</strong></span>
            </div>
          </Card>

          {/* RANKED FACTORS: WHY IS THE TRAIN DELAYED? */}
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-400" /> Why Is This Train Delayed? (Ranked Factors)
              </h4>
              <Badge variant="neutral">{rankedFactors.length} factors identified</Badge>
            </div>
            <div className="mt-3 space-y-2">
              {rankedFactors.map((rf, idx) => (
                <div key={idx} className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  rf.severity === 'danger' ? 'bg-red-950/30 border-red-500/40' : rf.severity === 'warning' ? 'bg-amber-950/30 border-amber-500/40' : 'bg-brand-500/10 border-brand-500/30'
                }`}>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-black/40 border border-white/10 flex items-center justify-center font-bold text-[10px] text-slate-300 shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-white">{rf.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{rf.desc}</p>
                    </div>
                  </div>
                  <span className={`font-mono font-bold text-sm shrink-0 ml-3 ${rf.min > 0 ? 'text-amber-300' : 'text-emerald-400'}`}>
                    {rf.min > 0 ? `+${rf.min} min` : '0 min'}
                  </span>
                </div>
              ))}
            </div>

            {/* Total Reconciled Delay Summary */}
            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Total Accounted Delay:</span>
              <span className="text-amber-400 font-bold">
                +{rankedFactors.reduce((acc, f) => acc + (f.min || 0), 0)} min (100% factor attribution)
              </span>
            </div>
          </Card>

          {/* WHAT HAPPENS NEXT? (Downstream Impact) */}
          <Card>
            <SectionHeader
              icon={Milestone}
              iconColor="cyan"
              title="What Happens Next? (Downstream Arrival Propagation)"
              description="Projected arrival time drift across upcoming halts on this service"
            />
            <div className="mt-3 space-y-1.5">
              {(train.routeTimeline || fallbackTrain.routeTimeline).map((stn, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-cyan-300 font-bold">{stn.code}</span>
                    <span className="text-white font-medium">{stn.name}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-slate-500">Sched: {stn.scheduled}</span>
                    <span className="text-white font-bold">&rarr; Pred: {stn.predicted || dynamicResult.newEta}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

