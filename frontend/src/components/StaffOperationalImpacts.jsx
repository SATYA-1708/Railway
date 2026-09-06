import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Clock,
  ShieldAlert,
  UserCheck,
  Wrench,
  Users,
  CheckCircle2,
  AlertCircle,
  Zap,
  Info,
  ChevronRight,
  Filter,
  Check
} from 'lucide-react';
import Card from './ui/Card';
import Badge from './ui/Badge';
import SectionHeader from './ui/SectionHeader';
import RailwayLoader from './ui/RailwayLoader';
import { API_BASE_URL } from '../config';
import { authService } from '../services/authService';
import { useStationTrains } from '../hooks/useStationTrains';

// Static fallback Caution Orders registry aligned with corridor_engine.py
const FALLBACK_TSRS = [
  {
    id: 'TSR-2026-SCR-108',
    section: 'RJY - BZA (Rajahmundry - Vijayawada)',
    station_from: 'RJY',
    station_to: 'BZA',
    location_km_start: 148,
    location_km_end: 154,
    length_km: 6.0,
    normal_speed_kmh: 110,
    restricted_speed_kmh: 45,
    reason: 'Electronic Interlocking Signal Cable Laying & Curve Tamping',
    imposed_by: 'Sr. DSTE (Signal/BZA)',
    expected_delay_penalty_min: 4.1,
    severity: 'MODERATE',
    status: 'ACTIVE'
  },
  {
    id: 'TSR-2026-SCR-042',
    section: 'BZA - TEL (Vijayawada - Tenali Bridge)',
    station_from: 'BZA',
    station_to: 'TEL',
    location_km_start: 12,
    location_km_end: 16,
    length_km: 4.0,
    normal_speed_kmh: 130,
    restricted_speed_kmh: 30,
    reason: 'Krishna River Bridge Sleeper Fastener Replacement & Ballast Cleaning',
    imposed_by: 'Senior Divisional Engineer (BZA)',
    expected_delay_penalty_min: 6.5,
    severity: 'CRITICAL',
    status: 'ACTIVE'
  },
  {
    id: 'TSR-2026-NR-019',
    section: 'AGC - NDLS (Agra - New Delhi High-Speed Chord)',
    station_from: 'AGC',
    station_to: 'NDLS',
    location_km_start: 182,
    location_km_end: 186,
    length_km: 4.0,
    normal_speed_kmh: 130,
    restricted_speed_kmh: 50,
    reason: 'Automatic Block Signaling Upgrade & Level Crossing Elimination',
    imposed_by: 'Divisional Railway Manager (DLI)',
    expected_delay_penalty_min: 3.4,
    severity: 'LOW',
    status: 'ACTIVE'
  },
  {
    id: 'TSR-2026-WCR-071',
    section: 'BPL - ET (Bhopal - Itarsi Ghat Section)',
    station_from: 'BPL',
    station_to: 'ET',
    location_km_start: 62,
    location_km_end: 69,
    length_km: 7.0,
    normal_speed_kmh: 110,
    restricted_speed_kmh: 40,
    reason: 'Mid-ghat Rockfall Protection Catchment Screen Installation',
    imposed_by: 'Sr. DEN (BPL)',
    expected_delay_penalty_min: 5.0,
    severity: 'MODERATE',
    status: 'ACTIVE'
  }
];

export default function StaffOperationalImpacts({ activeStation = 'BZA', user = null }) {
  const { trains: stationTrains, loading: trainsLoading } = useStationTrains(activeStation);
  const [tsrs, setTsrs] = useState(FALLBACK_TSRS);
  const [selectedTrainNum, setSelectedTrainNum] = useState(null);
  const [impactData, setImpactData] = useState(null);
  const [loadingImpacts, setLoadingImpacts] = useState(false);

  // Control Room Alerts with Interactive Acknowledgment
  const [alerts, setAlerts] = useState([
    {
      id: 'ALT-901',
      level: 'CRITICAL',
      title: 'Headway Buffer Violation: #20805 closing on #12864',
      section: `${activeStation} North Corridor Block 3`,
      time: '12:02',
      details: 'Current headway is 4.8 min (Required: 7.0 min). Vande Bharat experiencing yellow caution signal.',
      acknowledged: false,
      acknowledgedBy: null,
      acknowledgedAt: null
    },
    {
      id: 'ALT-902',
      level: 'HIGH',
      title: 'TSR Imposed: 30 km/h Restriction at Km 12–16',
      section: `${activeStation} Outbound Mainline`,
      time: '11:45',
      details: 'Caution order TSR-2026-SCR-042 adding estimated +6.5m delay drift to following express rakes.',
      acknowledged: false,
      acknowledgedBy: null,
      acknowledgedAt: null
    },
    {
      id: 'ALT-903',
      level: 'MEDIUM',
      title: 'Loco Pilot HOER Duty Limit Approaching (8.6 hrs)',
      section: 'Train #12615 Grand Trunk Express',
      time: '11:30',
      details: 'Projected total duty time 9.2 hrs. CCC notified for relief crew arrangement at next major junction.',
      acknowledged: true,
      acknowledgedBy: 'Arjun Sharma (Section Controller)',
      acknowledgedAt: '11:34:10'
    },
    {
      id: 'ALT-904',
      level: 'INFO',
      title: 'Automatic Block Signaling Normalization',
      section: `${activeStation} South Down Line`,
      time: '11:15',
      details: 'Track circuit TC_DN_MAIN verified clear. Normal MPS of 130 km/h restored.',
      acknowledged: true,
      acknowledgedBy: 'Arjun Sharma (Section Controller)',
      acknowledgedAt: '11:18:22'
    }
  ]);

  const activeTrains = stationTrains.length > 0 ? stationTrains : [
    { number: '20805', name: 'Andhra Pradesh Express (Vande Bharat)', delayMin: 0, from: 'Visakhapatnam', to: 'New Delhi', sta: '18:40', currentSpeed: 110 },
    { number: '12615', name: 'Grand Trunk Express', delayMin: 14, from: 'Chennai Central', to: 'New Delhi', sta: '19:15', currentSpeed: 65 },
    { number: '12727', name: 'Godavari Express', delayMin: 45, from: 'Visakhapatnam', to: 'Hyderabad', sta: '20:10', currentSpeed: 40 },
    { number: '12864', name: 'Howrah - SMVB Express', delayMin: 8, from: 'Howrah', to: 'Bengaluru', sta: '18:55', currentSpeed: 75 }
  ];

  const selectedTrain = activeTrains.find(t => String(t.number) === String(selectedTrainNum)) || activeTrains[0];

  // Fetch TSRs from backend
  useEffect(() => {
    const fetchTsrs = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/tsr/active`, {
          headers: { ...authService.getAuthHeader() }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setTsrs(data);
          }
        }
      } catch (e) {
        console.warn('TSR API offline, using cached caution orders:', e);
      }
    };
    fetchTsrs();
  }, [activeStation]);

  // Fetch Operational Impacts for selected train
  useEffect(() => {
    if (!selectedTrain) return;
    const fetchImpacts = async () => {
      setLoadingImpacts(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/operational-impacts/${selectedTrain.number}`, {
          headers: { ...authService.getAuthHeader() }
        });
        if (res.ok) {
          const data = await res.json();
          const parsed = data?.operationalImpact || data;
          if (parsed && (parsed.crewDutyStatus || parsed.rakeCleaningTurnaround || parsed.connectingTrainRisk)) {
            setImpactData(parsed);
          } else {
            throw new Error('Invalid impact structure');
          }
        } else {
          throw new Error('Impact API status ' + res.status);
        }
      } catch {
        // Fallback
        const delay = selectedTrain.delayMin || selectedTrain.baseDelayMin || 0;
        const elapsedHours = 6.2;
        const projHours = Math.round((elapsedHours + (delay / 60)) * 10) / 10;
        setImpactData({
          crewDutyStatus: {
            elapsedDutyHours: elapsedHours,
            projectedDutyHours: projHours,
            maxStatutoryLimitHours: 10.0,
            status: projHours >= 10.0 ? 'CRITICAL_BREACH' : projHours >= 8.5 ? 'WARNING_NEAR_LIMIT' : 'NOMINAL_SAFE',
            severity: projHours >= 10.0 ? 'danger' : projHours >= 8.5 ? 'warning' : 'success',
            title: `Crew Duty (HOER): ${projHours} hrs / 10.0 hrs`,
            action: projHours >= 8.5 ? 'Alert Chief Crew Controller (CCC) for relief crew at next junction.' : 'Crew duty within statutory HOER parameters.'
          },
          rakeCleaningTurnaround: {
            standardTurnaroundBufferMin: 360,
            availableMaintenanceWindowMin: Math.max(0, 360 - delay),
            minimumRequiredCleaningMin: 240,
            status: (360 - delay) < 180 ? 'PIT_LINE_CRITICAL' : (360 - delay) < 240 ? 'CLEANING_COMPRESSED' : 'ADEQUATE_TURNAROUND',
            severity: (360 - delay) < 180 ? 'danger' : (360 - delay) < 240 ? 'warning' : 'success',
            title: `Pit-Line Buffer: ${Math.max(0, 360 - delay)} mins remaining`,
            action: (360 - delay) < 240 ? 'Expedite quick-turnaround cleaning team at destination pit-line.' : 'Full scheduled primary maintenance window available.'
          },
          connectingTrainRisk: {
            status: delay > 40 ? 'HIGH_MISSED_CONNECTION_RISK' : delay > 20 ? 'MODERATE_BUFFER_LOSS' : 'LOW_CONNECTION_RISK',
            severity: delay > 40 ? 'danger' : delay > 20 ? 'warning' : 'success',
            delayedArrivalDeltaMin: delay,
            title: 'Downstream Passenger Connection Risk',
            action: delay > 20 ? 'Coordinate with connecting junction controller to hold connecting feeder rake if <= 10m.' : 'Connecting passenger transfers protected.'
          }
        });
      } finally {
        setLoadingImpacts(false);
      }
    };
    fetchImpacts();
  }, [selectedTrain]);

  const handleAcknowledgeAlert = (alertId) => {
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const officer = user?.name || user?.username || 'Section Controller';
    setAlerts(prev => prev.map(a => {
      if (a.id === alertId) {
        return {
          ...a,
          acknowledged: true,
          acknowledgedBy: `${officer} (Control Room)`,
          acknowledgedAt: now
        };
      }
      return a;
    }));
  };

  const getAlertBadge = (level) => {
    switch (level) {
      case 'CRITICAL': return <Badge variant="danger">CRITICAL</Badge>;
      case 'HIGH': return <Badge variant="warning">HIGH PRIORITY</Badge>;
      case 'MEDIUM': return <Badge variant="info">MEDIUM</Badge>;
      default: return <Badge variant="neutral">INFO</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            Temporary Speed Restrictions (TSR) & Operational Stakeholder Impacts
          </h1>
          <p className="text-xs text-slate-400">
            Real-time Caution Orders, Locopilot HOER statutory limits, Pit-Line turnarounds, and Control Room Alert Dispatch
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            Active TSRs: <strong className="text-amber-400 font-bold">{tsrs.length}</strong>
          </span>
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            Pending Alerts: <strong className="text-rose-400 font-bold">{alerts.filter(a => !a.acknowledged).length}</strong>
          </span>
        </div>
      </div>

      {/* ── SECTION 1: ACTIVE TSR / CAUTION ORDERS REGISTRY ── */}
      <Card accent="amber">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Active Section Caution Orders (TSR Registry)</h2>
            <Badge variant="warning">{tsrs.length} Active Speed Restrictions</Badge>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Enforced by Engineering & S&T Divisions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] bg-slate-950/60">
                <th className="py-2.5 px-3">TSR ID & Section</th>
                <th className="py-2.5 px-3">Location (Km)</th>
                <th className="py-2.5 px-3">Normal MPS</th>
                <th className="py-2.5 px-3">Restricted Speed</th>
                <th className="py-2.5 px-3">Delay Penalty</th>
                <th className="py-2.5 px-3">Reason & Authority</th>
                <th className="py-2.5 px-3 text-right">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {tsrs.map(t => (
                <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3">
                    <span className="font-mono font-bold text-amber-300 block">{t.id}</span>
                    <span className="text-slate-300 font-medium text-[11px]">{t.section}</span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">
                    Km {t.location_km_start} – {t.location_km_end} <span className="text-slate-500">({t.length_km} km)</span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                    {t.normal_speed_kmh} km/h
                  </td>
                  <td className="py-3 px-3 font-mono font-black text-rose-400">
                    {t.restricted_speed_kmh} km/h
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-amber-300">
                    +{t.expected_delay_penalty_min} min
                  </td>
                  <td className="py-3 px-3 text-slate-400 text-[11px] max-w-xs">
                    <p className="text-slate-200 line-clamp-1">{t.reason}</p>
                    <span className="text-slate-500 font-mono text-[10px]">Issued by: {t.imposed_by}</span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Badge variant={t.severity === 'CRITICAL' ? 'danger' : t.severity === 'MODERATE' ? 'warning' : 'info'}>
                      {t.severity}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── SECTION 2: OPERATIONAL STAKEHOLDER IMPACTS ── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Operational Stakeholder Impacts (Rule-Based Evaluation)</h2>
          </div>
          {/* Train Selector Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-400 font-mono">Select Train:</span>
            {activeTrains.slice(0, 5).map(t => (
              <button
                key={t.number}
                onClick={() => setSelectedTrainNum(t.number)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  (selectedTrain?.number === t.number)
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                #{t.number}
              </button>
            ))}
          </div>
        </div>

        {selectedTrain && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-mono text-cyan-300 font-black text-sm">#{selectedTrain.number}</span>
              <span className="text-white font-bold">{selectedTrain.name}</span>
              <Badge variant={(selectedTrain.delayMin || selectedTrain.baseDelayMin || 0) > 15 ? 'danger' : (selectedTrain.delayMin || selectedTrain.baseDelayMin || 0) > 0 ? 'warning' : 'success'}>
                {(selectedTrain.delayMin || selectedTrain.baseDelayMin || 0) > 0 ? `+${selectedTrain.delayMin || selectedTrain.baseDelayMin}m Delayed` : 'On Time'}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
              <span>Route: <strong className="text-slate-200">{selectedTrain.from} → {selectedTrain.to}</strong></span>
              <span>Speed: <strong className="text-cyan-300">{selectedTrain.currentSpeed || 85} km/h</strong></span>
            </div>
          </div>
        )}

        {/* 3 Impact Cards */}
        {impactData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Crew HOER Card */}
            <Card accent={impactData?.crewDutyStatus?.severity || 'info'}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Crew HOER Duty Hours</h3>
                </div>
                <Badge variant={impactData?.crewDutyStatus?.severity || 'info'}>
                  {impactData?.crewDutyStatus?.status || 'NOMINAL_SAFE'}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-xl font-black font-mono text-white">
                  {impactData?.crewDutyStatus?.projectedDutyHours ?? 6.2} <span className="text-xs text-slate-400 font-normal">/ 10.0 hrs max</span>
                </p>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      (impactData?.crewDutyStatus?.projectedDutyHours ?? 6.2) >= 10.0 ? 'bg-rose-500' : (impactData?.crewDutyStatus?.projectedDutyHours ?? 6.2) >= 8.5 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, ((impactData?.crewDutyStatus?.projectedDutyHours ?? 6.2) / 10.0) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                  {impactData?.crewDutyStatus?.action || 'Crew duty within statutory HOER parameters.'}
                </p>
              </div>
            </Card>

            {/* 2. Pit-Line Turnaround Buffer */}
            <Card accent={impactData?.rakeCleaningTurnaround?.severity || 'info'}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Pit-Line Maintenance Buffer</h3>
                </div>
                <Badge variant={impactData?.rakeCleaningTurnaround?.severity || 'info'}>
                  {impactData?.rakeCleaningTurnaround?.status || 'ADEQUATE_TURNAROUND'}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-xl font-black font-mono text-white">
                  {impactData?.rakeCleaningTurnaround?.availableMaintenanceWindowMin ?? 360} <span className="text-xs text-slate-400 font-normal">min remaining</span>
                </p>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      (impactData?.rakeCleaningTurnaround?.availableMaintenanceWindowMin ?? 360) < 180 ? 'bg-rose-500' : (impactData?.rakeCleaningTurnaround?.availableMaintenanceWindowMin ?? 360) < 240 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, ((impactData?.rakeCleaningTurnaround?.availableMaintenanceWindowMin ?? 360) / 360) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                  {impactData?.rakeCleaningTurnaround?.action || 'Full scheduled primary maintenance window available.'}
                </p>
              </div>
            </Card>

            {/* 3. Passenger Connections Risk */}
            <Card accent={impactData?.connectingTrainRisk?.severity || 'info'}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Passenger Missed Transfers</h3>
                </div>
                <Badge variant={impactData?.connectingTrainRisk?.severity || 'info'}>
                  {impactData?.connectingTrainRisk?.status || 'LOW_CONNECTION_RISK'}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-xl font-black font-mono text-white">
                  +{impactData?.connectingTrainRisk?.delayedArrivalDeltaMin ?? 0}m <span className="text-xs text-slate-400 font-normal">arrival drift</span>
                </p>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      (impactData?.connectingTrainRisk?.delayedArrivalDeltaMin ?? 0) > 40 ? 'bg-rose-500' : (impactData?.connectingTrainRisk?.delayedArrivalDeltaMin ?? 0) > 20 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, ((impactData?.connectingTrainRisk?.delayedArrivalDeltaMin ?? 0) / 60) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                  {impactData?.connectingTrainRisk?.action || 'Connecting passenger transfers protected.'}
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* ── SECTION 3: CONTROL ROOM ALERT CENTER WITH ACKNOWLEDGMENT ── */}
      <Card accent="cyan">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Section Control Room Operational Alerts Dispatch</h2>
            <Badge variant="info">Protocol RDSO-SC-2026</Badge>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {alerts.filter(a => !a.acknowledged).length} Unacknowledged Action Items
          </span>
        </div>

        <div className="space-y-3">
          {alerts.map(a => (
            <div
              key={a.id}
              className={`p-3.5 rounded-xl border transition-all ${
                !a.acknowledged
                  ? 'bg-slate-950 border-rose-500/40 shadow-lg shadow-rose-950/20'
                  : 'bg-slate-950/60 border-slate-800 opacity-80'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {getAlertBadge(a.level)}
                  <span className="text-xs font-bold text-white">{a.title}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                  <span>{a.section}</span>
                  <span>&bull;</span>
                  <span>{a.time} IST</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 mb-3">{a.details}</p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                {a.acknowledged ? (
                  <span className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Acknowledged by {a.acknowledgedBy} at {a.acknowledgedAt}
                  </span>
                ) : (
                  <span className="text-amber-400 font-mono flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
                    Pending Section Controller Acknowledgment
                  </span>
                )}

                {!a.acknowledged && (
                  <button
                    onClick={() => handleAcknowledgeAlert(a.id)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all shadow-sm active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    ACKNOWLEDGE
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}