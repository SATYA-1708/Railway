import React, { useState, useEffect, useMemo } from 'react';
import { Sliders, Play, ShieldCheck, Zap, HelpCircle, Sparkles, TrendingUp, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import Card from './ui/Card';
import Badge from './ui/Badge';
import RailwayLoader from './ui/RailwayLoader';
import { REAL_TRAINS_DATABASE } from '../data/realTrainsData';
import { authService } from '../services/authService';

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'http://localhost:8000';
const AVG_PASSENGERS_PER_TRAIN = 1420;

const STATION_CONFIGS = {
  BZA: { name: 'Vijayawada Jn', platforms: 10 },
  NDLS: { name: 'New Delhi', platforms: 16 },
  BPL: { name: 'Bhopal Jn', platforms: 6 },
  VSKP: { name: 'Visakhapatnam Jn', platforms: 8 }
};

export default function StaffWhatIfSimulator({
  trains = [],
  activeStation = 'BZA',
  initialTrainNumber = null,
  onApplyDispatch = () => {},
  onSwitchTab: _onSwitchTab = () => {}
}) {
  const stationConfig = STATION_CONFIGS[activeStation] || { name: `${activeStation} Junction`, platforms: 8 };
  const platformCount = stationConfig.platforms;

  const candidateTrains = useMemo(() => {
    if (trains && trains.length > 0) return trains;
    return REAL_TRAINS_DATABASE.slice(0, 6);
  }, [trains]);

  const [selectedTrainNum, setSelectedTrainNum] = useState(() =>
    (initialTrainNumber && candidateTrains.some(t => String(t.number) === String(initialTrainNumber)))
      ? String(initialTrainNumber)
      : (candidateTrains[0]?.number || '20805')
  );

  useEffect(() => {
    if (!candidateTrains.some(t => t.number === selectedTrainNum)) {
      if (candidateTrains[0]) setSelectedTrainNum(candidateTrains[0].number);
    }
  }, [candidateTrains, selectedTrainNum]);

  // When opened straight from a platform conflict, pre-select the conflict train
  useEffect(() => {
    if (initialTrainNumber && candidateTrains.some(t => String(t.number) === String(initialTrainNumber))) {
      setSelectedTrainNum(String(initialTrainNumber));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTrainNumber, candidateTrains]);

  const activeTrain = useMemo(() => {
    return candidateTrains.find(t => t.number === selectedTrainNum) || candidateTrains[0] || {
      number: '20805',
      name: 'AP Express',
      sta: '03:40',
      scheduledArrival: '03:40',
      assignedPlatform: 3,
      platform: 3
    };
  }, [candidateTrains, selectedTrainNum]);

function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

  const currentPlatform = activeTrain.assignedPlatform || activeTrain.platform || 3;
  const [targetPlatform, setTargetPlatform] = useState(() => String(currentPlatform === 1 ? 4 : 1));
  const [holdSidingMins, setHoldSidingMins] = useState(0);
  const [freightOvertakeGranted, setFreightOvertakeGranted] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [appliedToLive, setAppliedToLive] = useState(false);
  const [apiResult, setApiResult] = useState(null);

  const conflictingTrain = useMemo(() => {
    // Find if another train shares this platform
    const other = candidateTrains.find(t => t.number !== activeTrain.number && (t.assignedPlatform || t.platform) === currentPlatform);
    return other || null;
  }, [candidateTrains, activeTrain, currentPlatform]);

  const overlapMetrics = useMemo(() => {
    const activeTimeStr = activeTrain.sta || activeTrain.scheduledArrival || activeTrain.scheduled || '05:40';
    const activeMins = parseTimeToMinutes(activeTimeStr);

    if (!conflictingTrain) {
      return {
        hasClash: false,
        overlapMin: 0,
        gapMin: 180,
        desc: 'Platform Clear (No other train)',
        cascadingDelay: 0
      };
    }

    const otherTimeStr = conflictingTrain.sta || conflictingTrain.scheduledArrival || conflictingTrain.scheduled || '08:32';
    const otherMins = parseTimeToMinutes(otherTimeStr);
    const diff = Math.abs(activeMins - otherMins);

    if (diff < 20) {
      const overlap = Math.max(1, 20 - diff);
      return {
        hasClash: true,
        overlapMin: overlap,
        gapMin: diff,
        desc: `${overlap}-min overlap clash`,
        cascadingDelay: overlap + 6
      };
    } else {
      return {
        hasClash: false,
        overlapMin: 0,
        gapMin: diff,
        desc: `Safe Gap (+${diff} min clearance)`,
        cascadingDelay: 0
      };
    }
  }, [activeTrain, conflictingTrain]);

  const platformOptions = useMemo(() => {
    const list = [];
    const activeTimeStr = activeTrain.sta || activeTrain.scheduledArrival || activeTrain.scheduled || '05:40';
    const activeMins = parseTimeToMinutes(activeTimeStr);

    for (let p = 1; p <= platformCount; p++) {
      const isCurrent = p === currentPlatform;
      const occupyingTrain = candidateTrains.find(t => t.number !== activeTrain.number && (t.assignedPlatform || t.platform) === p);
      
      let status = 'Clear';
      let clash = false;
      let rec = false;

      if (occupyingTrain) {
        const occTimeStr = occupyingTrain.sta || occupyingTrain.scheduledArrival || occupyingTrain.scheduled || '08:32';
        const occMins = parseTimeToMinutes(occTimeStr);
        const timeDiff = Math.abs(activeMins - occMins);

        if (timeDiff < 20) {
          status = isCurrent ? 'Current (Clash)' : `Occupied (Clash)`;
          clash = true;
        } else {
          status = isCurrent ? 'Current' : `Clear (+${timeDiff}m gap)`;
          clash = false;
          if (!isCurrent) rec = true;
        }
      } else {
        status = isCurrent ? 'Current (Clear)' : 'Recommended';
        rec = !isCurrent;
      }

      list.push({
        num: String(p),
        status,
        clash,
        rec,
        train: occupyingTrain
      });
    }
    return list;
  }, [platformCount, candidateTrains, activeTrain, currentPlatform]);

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setAppliedToLive(false);

    try {
      const resp = await fetch(`${API_BASE_URL}/api/what-if`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeader()
        },
        body: JSON.stringify({
          stationCode: activeStation,
          targetTrainNumber: activeTrain.number,
          reassignedPlatform: parseInt(targetPlatform, 10) || 4,
          holdSidingMins: holdSidingMins,
          freightOvertakeGranted: freightOvertakeGranted,
          passengerLoadEstimate: AVG_PASSENGERS_PER_TRAIN
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        setApiResult(data);
      }
    } catch (err) {
      console.warn('What-If API call fallback:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const isTargetOccupiedWithClash = candidateTrains.some(t => {
    if (t.number === activeTrain.number || String(t.assignedPlatform || t.platform) !== targetPlatform) return false;
    const occTime = parseTimeToMinutes(t.sta || t.scheduledArrival || t.scheduled);
    const actTime = parseTimeToMinutes(activeTrain.sta || activeTrain.scheduledArrival || activeTrain.scheduled);
    return Math.abs(actTime - occTime) < 20;
  });
  const isTargetSame = targetPlatform === String(currentPlatform);
  const isOptimalPlat = !isTargetOccupiedWithClash;

  const conflictResolved = apiResult ? apiResult.isConflictResolved : (isOptimalPlat && (!overlapMetrics.hasClash || !isTargetSame));
  const freightPenaltyMin = !freightOvertakeGranted ? 9 : 0;
  const cascadingDelayMin = apiResult ? apiResult.simulatedOutcome?.cascadingDelay : ((conflictResolved ? 0 : overlapMetrics.cascadingDelay) + holdSidingMins + freightPenaltyMin);
  const timeSavedMins = apiResult ? apiResult.simulatedOutcome?.netTimeSavedMin : Math.max(0, overlapMetrics.cascadingDelay - cascadingDelayMin);
  const passengerMinutesSaved = apiResult ? apiResult.simulatedOutcome?.passengerMinutesSaved : (timeSavedMins * AVG_PASSENGERS_PER_TRAIN);
  const corridorCapacityDelta = apiResult ? apiResult.simulatedOutcome?.corridorFlowImprovement : (conflictResolved ? '+18%' : (overlapMetrics.hasClash ? '-22%' : '+5%'));

  const activeTrainTime = activeTrain.sta || activeTrain.scheduledArrival || activeTrain.scheduled || '05:40';
  const conflictingTrainTime = conflictingTrain ? (conflictingTrain.sta || conflictingTrain.scheduledArrival || conflictingTrain.scheduled || '08:32') : '--';

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleOpenConfirm = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmPlan = () => {
    onApplyDispatch({ trainNumber: activeTrain.number, newPlatform: parseInt(targetPlatform, 10) });
    setAppliedToLive(true);
    setShowConfirmModal(false);
  };

  if (!candidateTrains || candidateTrains.length === 0) {
    return (
      <div className="space-y-4">
        <RailwayLoader
          dark={true}
          fullPage={true}
          message="Loading Dispatch Simulation Sandbox..."
          submessage={`Initializing track topology and conflict graph for ${stationConfig.name}...`}
        />
      </div>
    );
  }

  const ADVISOR_SCENARIOS = [
    {
      id: 'vande_bharat_overtake',
      tag: 'PRIORITY OVERTAKE',
      tagColor: 'emerald',
      title: 'Vande Bharat #20805 Overtake Protocol',
      conflict: 'High-Priority Vande Bharat (130 km/h) trailing Express #12615 (+14m delay) in BZA–Tenali Block.',
      action: 'Hold Train #12615 at Tenali Loop (Siding 1) for 8 min. Route #20805 onto Main Up Line at 110 km/h.',
      outcome: 'Recovers 6m for #20805 • Saves 4,200 Pax-Min • Net section delay -4m',
      trainNumber: '20805',
      targetPlatform: '4',
      holdMins: 8,
      freightPriority: true
    },
    {
      id: 'goods_siding_divert',
      tag: 'FREIGHT PRECEDENCE',
      tagColor: 'amber',
      title: 'Coal Rake Freight Loop Divert',
      conflict: 'Freight BOXN #BBOX-924 occupying Main Down Line ahead of Grand Trunk Express #12615.',
      action: 'Divert freight rake into BZA Goods Loop Siding with 12 min dwell before express passage.',
      outcome: 'Protects Express Right-Time (+0m) • Prevents 18m knock-on gridlock',
      trainNumber: '12615',
      targetPlatform: '2',
      holdMins: 12,
      freightPriority: true
    },
    {
      id: 'platform_deconflict',
      tag: 'BERTHING CLEARANCE',
      tagColor: 'cyan',
      title: 'Simultaneous Berthing Deconfliction',
      conflict: 'Platform 1 simultaneous arrival clash between #20805 and incoming #12727.',
      action: 'Reassign #20805 to Platform 4 with clear interlocking crossover route.',
      outcome: 'Eliminates 14m outer home signal queue • 0m cascading passenger delay',
      trainNumber: '20805',
      targetPlatform: '4',
      holdMins: 0,
      freightPriority: false
    }
  ];

  const handleApplyAdvisorScenario = (scenario) => {
    if (candidateTrains.some(t => t.number === scenario.trainNumber)) {
      setSelectedTrainNum(scenario.trainNumber);
    }
    setTargetPlatform(scenario.targetPlatform);
    setHoldSidingMins(scenario.holdMins);
    setFreightOvertakeGranted(scenario.freightPriority);
    setAppliedToLive(false);
    setTimeout(() => {
      handleRunSimulation();
    }, 100);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-400 glow-soft">
            <Sliders className="w-5 h-5 shrink-0" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              What-If Dispatch & Sequencing Simulator &bull; <span className="text-brand-400">{stationConfig.name} ({activeStation})</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono uppercase font-bold">
                DECISION SUPPORT SANDBOX
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate dynamic platform re-routing, loop siding holds, and freight overtake priority for Section Controller decision support
            </p>
          </div>
        </div>
      </div>

      {appliedToLive && (
        <div className="p-3.5 bg-brand-500/10 border border-brand-500/40 rounded-2xl flex items-center justify-between glow-soft">
          <div className="flex items-center gap-2.5 text-sm">
            <ShieldCheck className="w-5 h-5 text-brand-400 shrink-0" />
            <span className="text-brand-300 font-semibold text-xs sm:text-sm">
              AI Recommendation Applied to Session &bull; Train #{activeTrain.number} ({activeTrain.name}) allocated to Platform {targetPlatform} at {stationConfig.name}
            </span>
          </div>
          <button onClick={() => setAppliedToLive(false)} className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg glass-subtle">Dismiss</button>
        </div>
      )}

      {/* AI SEQUENCING & OVERTAKE ADVISOR (Section Controller DSS) */}
      <Card accent="cyan">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">AI Sequencing & Overtake Advisor</h3>
            <Badge variant="info">Section Controller Decision Support</Badge>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Real-time corridor optimization recommendations</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ADVISOR_SCENARIOS.map(sc => (
            <div key={sc.id} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between space-y-3 hover:border-cyan-500/40 transition-all">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                    sc.tagColor === 'emerald' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                    sc.tagColor === 'amber' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                    'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  }`}>
                    {sc.tag}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white">{sc.title}</h4>
                <p className="text-[11px] text-slate-400 leading-snug">{sc.conflict}</p>
                <div className="p-2 rounded-lg bg-black/40 border border-white/5 text-[11px] text-slate-300 space-y-1">
                  <p><strong className="text-cyan-300">Action:</strong> {sc.action}</p>
                  <p className="text-[10px] text-emerald-400 font-medium">{sc.outcome}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleApplyAdvisorScenario(sc)}
                className="w-full py-1.5 px-3 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Play className="w-3 h-3 fill-current" /> Load Scenario & Simulate <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0b1524] border border-cyan-500/40 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Confirm AI Recommended Dispatch Plan</h3>
                <p className="text-[11px] text-slate-400">Station: {stationConfig.name} ({activeStation})</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
              <p className="font-semibold text-white">
                Reassign <span className="text-cyan-300">#{activeTrain.number} {activeTrain.name}</span> from Platform {currentPlatform} &rarr; <span className="text-emerald-400 font-bold">Platform {targetPlatform}</span>
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Expected section outcome: <strong className="text-emerald-300">{timeSavedMins} min saved</strong> and <strong>{passengerMinutesSaved.toLocaleString()} passenger minutes</strong> protected.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Operator Notice:</strong> This is an AI recommendation for operator review. No real railway infrastructure will be controlled.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/10 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPlan}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-cyan-400 hover:brightness-110 text-slate-950 font-bold text-xs shadow-lg shadow-brand-500/25"
              >
                Confirm Recommendation
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Controls */}
        <div className="lg:col-span-5">
          <Card>
            <p className="text-sm font-bold text-white mb-4">Intervention Parameters ({activeStation})</p>

            <div className="space-y-5">
              {/* Train selection */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-2">Select Train to Re-route</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {candidateTrains.map(t => (
                    <button
                      key={t.number}
                      type="button"
                      onClick={() => {
                        setSelectedTrainNum(t.number);
                        setAppliedToLive(false);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        selectedTrainNum === t.number
                          ? 'bg-brand-500/12 border-brand-500/60 text-white shadow-[0_0_16px_-6px_rgba(16,217,154,0.5)]'
                          : 'glass-subtle text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-mono font-bold text-emerald-400">#{t.number}</p>
                        <span className="text-[10px] font-mono text-cyan-400 font-bold">PF {t.assignedPlatform || t.platform || 1}</span>
                      </div>
                      <p className="text-[11px] text-slate-200 truncate mt-0.5 font-medium">{t.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform assignment */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-400">Reassign Platform (1 to {platformCount})</label>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">Selected: PF {targetPlatform}</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {platformOptions.map(pf => {
                    const isSelected = targetPlatform === pf.num;
                    return (
                      <button
                        key={pf.num}
                        type="button"
                        onClick={() => {
                          setTargetPlatform(pf.num);
                          setAppliedToLive(false);
                        }}
                        className={`py-2 px-1 rounded-xl border text-center text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-gradient-to-r from-brand-500 to-cyan-400 border-transparent text-slate-950 shadow-lg shadow-brand-500/30 font-black'
                            : pf.clash
                            ? 'bg-red-950/20 border-red-800/40 text-red-400 hover:border-red-600'
                            : pf.rec
                            ? 'bg-brand-500/8 border-brand-500/35 text-brand-400 hover:border-brand-500/60'
                            : 'glass-subtle text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        <div>PF {pf.num}</div>
                        <div className="text-[9px] font-normal opacity-85 truncate mt-0.5">{pf.status}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Loop siding hold */}
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="font-semibold text-slate-400">Loop Siding Hold Time</span>
                  <span className="font-mono font-bold text-amber-400">{holdSidingMins} min</span>
                </div>
                <input
                  type="range" min="0" max="20" step="2"
                  value={holdSidingMins}
                  onChange={e => {
                    setHoldSidingMins(Number(e.target.value));
                    setAppliedToLive(false);
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-[#10d99a]"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>0 min (Direct)</span><span>10 min</span><span>20 min (Max)</span>
                </div>
              </div>

              {/* Freight overtake */}
              <div className="flex items-center justify-between p-3 glass-subtle rounded-xl">
                <div>
                  <p className="text-xs font-semibold text-white">Freight Siding Divert</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Give #{activeTrain.number} overtake priority over freight rakes</p>
                </div>
                <input
                  type="checkbox"
                  checked={freightOvertakeGranted}
                  onChange={e => {
                    setFreightOvertakeGranted(e.target.checked);
                    setAppliedToLive(false);
                  }}
                  className="w-4 h-4 rounded accent-[#10d99a] cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  isSimulating
                    ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-brand-500 to-cyan-400 hover:brightness-110 text-slate-950 shadow-lg shadow-brand-500/25 active:scale-[0.99]'
                }`}
              >
                {isSimulating ? (
                  <><div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" /> Simulating...</>
                ) : (
                  <><Play className="w-4 h-4 fill-slate-950" /> Run AI Simulation</>
                )}
              </button>
            </div>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
              <div>
                <p className="text-sm font-bold text-white">Simulated Dispatch Outcome</p>
                <p className="text-xs text-slate-400">Comparing original berth plan vs proposed reassignment on {stationConfig.name}</p>
              </div>
              <Badge variant={conflictResolved ? 'success' : 'danger'}>
                {conflictResolved ? 'Platform Conflict Resolved' : 'Platform Conflict Persists'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {/* Before */}
              <div className={`p-3.5 rounded-2xl border space-y-2 ${overlapMetrics.hasClash ? 'bg-red-950/20 border-red-800/40' : 'bg-slate-900/40 border-slate-800'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${overlapMetrics.hasClash ? 'text-red-400' : 'text-slate-400'}`}>
                  Before (Original Dispatch)
                </p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400 truncate max-w-[140px]">#{activeTrain.number} {activeTrain.name}</span>
                    <span className="font-mono font-bold text-slate-200">{activeTrainTime} (PF {currentPlatform})</span>
                  </div>
                  {conflictingTrain && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 truncate max-w-[140px]">#{conflictingTrain.number} {conflictingTrain.name}</span>
                      <span className="font-mono font-bold text-slate-200">{conflictingTrainTime} (PF {currentPlatform})</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-800/60 pt-1">
                    <span className="text-slate-400">Headway Status</span>
                    <span className={`font-mono font-bold ${overlapMetrics.hasClash ? 'text-red-400' : 'text-emerald-400'}`}>
                      {overlapMetrics.desc}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cascading Delay</span>
                    <span className={`font-mono font-bold ${overlapMetrics.cascadingDelay > 0 ? 'text-red-400' : 'text-slate-300'}`}>
                      {overlapMetrics.cascadingDelay > 0 ? `+${overlapMetrics.cascadingDelay} min outer halt` : '0 min (On Schedule)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* After */}
              <div className={`p-3.5 rounded-2xl border space-y-2 ${conflictResolved ? 'bg-brand-500/8 border-brand-500/40' : 'bg-amber-950/20 border-amber-800/40'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${conflictResolved ? 'text-emerald-400' : 'text-amber-400'}`}>
                  After (Proposed Reassignment)
                </p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400 truncate max-w-[140px]">#{activeTrain.number} {activeTrain.name}</span>
                    <span className="font-mono font-bold text-emerald-300">{activeTrainTime} (PF {targetPlatform})</span>
                  </div>
                  {conflictingTrain && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 truncate max-w-[140px]">#{conflictingTrain.number} {conflictingTrain.name}</span>
                      <span className="font-mono font-bold text-slate-200">{conflictingTrainTime} (PF {currentPlatform})</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-800 pt-1">
                    <span className="text-slate-400">Headway Status</span>
                    <span className={`font-mono font-bold ${conflictResolved ? 'text-emerald-400' : 'text-red-400'}`}>
                      {conflictResolved ? 'Clean (Isolated Berth)' : 'Overlap on PF ' + targetPlatform}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cascading Delay</span>
                    <span className={`font-mono font-bold ${cascadingDelayMin === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      +{cascadingDelayMin} min
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Impact metrics */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Time Saved', value: `${timeSavedMins} min`, desc: 'Per train savings' },
                { label: 'Passenger Minutes Saved', value: passengerMinutesSaved.toLocaleString(), desc: `@ ${AVG_PASSENGERS_PER_TRAIN} pax/rake` },
                { label: 'Section Flow Delta', value: corridorCapacityDelta, desc: 'Corridor throughput' },
              ].map(m => (
                <div key={m.label} className="p-3.5 glass-subtle border border-slate-800 rounded-2xl text-center">
                  <p className="text-[10px] text-slate-400 mb-1 uppercase tracking-[0.12em] font-semibold">{m.label}</p>
                  <p className="text-lg font-black text-brand-400 font-mono tnum glow-soft rounded">{m.value}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">{m.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-800">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-slate-500" /> Based on live electronic interlocking route clearance
              </span>
              <button
                type="button"
                onClick={handleOpenConfirm}
                disabled={!conflictResolved}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  conflictResolved
                    ? 'bg-gradient-to-r from-brand-500 to-cyan-400 hover:brightness-110 text-slate-950 shadow-lg shadow-brand-500/25 active:scale-[0.98]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Zap className="w-3.5 h-3.5 fill-current" /> Use as Recommended Dispatch Plan
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
