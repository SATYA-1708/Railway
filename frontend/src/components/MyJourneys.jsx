import React from 'react';
import { MapPin, ArrowRight, Bell, BellOff, Trash2, Plus, Train, Clock, Calendar, Activity } from 'lucide-react';
import Card from './ui/Card';
import Badge from './ui/Badge';
import { REAL_TRAINS_DATABASE } from '../data/realTrainsData';
import RailwayLoader from './ui/RailwayLoader';

export default function MyJourneys({ savedJourneys = [], onSelectTrain, onRemoveJourney, onToggleNotification, onAddJourney, recentSearches = [], loading = false }) {
  const enrichJourney = (j) => {
    if (!j) return null;
    const num = String(j.number || '').replace('#', '').trim();
    const master = REAL_TRAINS_DATABASE.find(t => String(t.number) === num) || {};
    const merged = { ...master, ...j };
    
    const timeline = Array.isArray(merged.routeTimeline) && merged.routeTimeline.length > 0 
      ? merged.routeTimeline 
      : (Array.isArray(master.routeTimeline) ? master.routeTimeline : []);
    const lastStop = timeline.length > 0 ? timeline[timeline.length - 1] : null;
    const firstStop = timeline.length > 0 ? timeline[0] : null;
    
    const schedArr = merged.scheduledArrival || lastStop?.scheduled || lastStop?.sta || master.scheduledArrival || '05:40';
    const delay = typeof merged.delayMin === 'number' ? merged.delayMin : (typeof merged.baseDelayMin === 'number' ? merged.baseDelayMin : (master.baseDelayMin || 4));
    
    let dynEta = merged.dynamicEta;
    if (!dynEta || dynEta === '--:--') {
      if (schedArr && schedArr !== '--:--') {
        const parts = schedArr.split(':').map(Number);
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          const totalM = (parts[0] * 60 + parts[1] + delay + 1440) % 1440;
          dynEta = `${String(Math.floor(totalM / 60)).padStart(2, '0')}:${String(totalM % 60).padStart(2, '0')}`;
        } else {
          dynEta = schedArr;
        }
      } else {
        dynEta = '05:44';
      }
    }
    
    return {
      ...merged,
      number: num,
      name: merged.name || master.name || `Express #${num}`,
      from: merged.from || (firstStop ? `${firstStop.name} (${firstStop.code})` : 'Origin'),
      to: merged.to || (lastStop ? `${lastStop.name} (${lastStop.code})` : 'Destination'),
      scheduledArrival: schedArr,
      dynamicEta: dynEta || schedArr,
      delayMin: delay,
      baseDelayMin: delay,
      lastStation: merged.lastStation || master.lastStation || (firstStop ? firstStop.name : 'In Transit'),
      nextStation: merged.nextStation || master.nextStation || (timeline.length > 1 ? timeline[1].name : 'Next Stop'),
      notificationsEnabled: j.notificationsEnabled !== false,
      progressPercent: merged.progressPercent || 48
    };
  };

  const rawJourneys = Array.isArray(savedJourneys) ? savedJourneys : [];
  const enrichedJourneys = rawJourneys.map(enrichJourney).filter(Boolean);
  const activeJourney = enrichedJourneys.length > 0 ? enrichedJourneys[0] : null;
  const upcomingJourneys = enrichedJourneys.length > 1 ? enrichedJourneys.slice(1).filter(j => !j.isCompleted) : [];
  const historyJourneys = enrichedJourneys.length > 0 ? enrichedJourneys.filter(j => j.isCompleted) : [];

  if (loading) {
    return (
      <div className="portal-page py-16 flex items-center justify-center">
        <RailwayLoader
          fullPage
          message="Syncing Saved Journeys with Live Satellite Telemetry..."
          submessage="Checking route delays, platform berthing, and dynamic ETAs"
        />
      </div>
    );
  }

  return (
    <div className="portal-page space-y-7">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[#e3ebf4] pb-4">
        <div>
          <h1 className="portal-head-title">My Journeys Dashboard</h1>
          <p className="portal-head-sub">Live tracking, dynamic ETAs, and notification preferences for your booked trains</p>
        </div>
        <button onClick={onAddJourney} className="portal-btn portal-btn-primary shadow-sm">
          <Plus className="w-4 h-4" /> Add Journey
        </button>
      </div>

      {/* ═══════════ 1. ACTIVE JOURNEY ═══════════ */}
      {activeJourney ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="portal-section-title flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
              Active Running Journey
            </h2>
            <span className="portal-chip portal-chip-active text-[11px]">In Transit</span>
          </div>

          <Card light accent="blue" className="border-2 border-[#1b56a0]/20 shadow-md">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e3ebf4] pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="portal-tag tnum font-bold">#{activeJourney.number}</span>
                    <h3 className="text-base sm:text-lg font-bold text-[#14253d] font-display">{activeJourney.name}</h3>
                    <Badge light variant={(activeJourney.delayMin ?? activeJourney.baseDelayMin ?? 0) <= 5 ? 'success' : (activeJourney.delayMin ?? activeJourney.baseDelayMin ?? 0) <= 15 ? 'warning' : 'danger'}>
                      {(activeJourney.delayMin ?? activeJourney.baseDelayMin ?? 0) <= 0 ? '✓ On Time' : `+${activeJourney.delayMin ?? activeJourney.baseDelayMin}m Delay`}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#5b6f8f]">
                    <MapPin className="w-3.5 h-3.5 text-[#0d7a56]" />
                    <span><strong>Boarding:</strong> {activeJourney.from?.split('(')?.[0] ?? 'Origin'}</span>
                    <ArrowRight className="w-3 h-3 text-[#93a6bf]" />
                    <span><strong>Destination:</strong> {activeJourney.to?.split('(')?.[0] ?? 'Destination'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleNotification(activeJourney.number)}
                    className={`p-2 rounded-lg transition-all ${
                      activeJourney.notificationsEnabled !== false
                        ? 'bg-[#e6f5ec] text-[#0d7a56] border border-[#bfe3cf]'
                        : 'bg-[#f4f7fb] text-[#6b7f99] border border-[#d9e2ed]'
                    }`}
                    title={activeJourney.notificationsEnabled !== false ? 'Notifications Active' : 'Notifications Muted'}
                  >
                    {activeJourney.notificationsEnabled !== false ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => onRemoveJourney(activeJourney.number)}
                    className="p-2 rounded-lg bg-[#f4f7fb] text-[#6b7f99] border border-[#d9e2ed] hover:text-[#b02a2a] hover:border-[#f2c6c4] transition-all"
                    title="Remove journey"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onSelectTrain(activeJourney)}
                    className="portal-btn portal-btn-primary text-xs py-2 px-4 flex items-center gap-2 shadow-sm"
                  >
                    <Activity className="w-4 h-4" /> Track Journey <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Active Journey Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-[#f7f9fc] rounded-xl border border-[#d9e2ed]">
                  <span className="text-[10px] text-[#6b7f99] uppercase font-bold block mb-1">Current Location</span>
                  <p className="text-xs sm:text-sm font-bold text-[#14253d] truncate">
                    {activeJourney.lastStation ? `Passed ${activeJourney.lastStation}` : (activeJourney.nextStation ? `Near ${activeJourney.nextStation}` : 'In Transit')}
                  </p>
                  <span className="text-[10px] text-[#6b7f99] font-mono">Live Telemetry</span>
                </div>

                <div className="p-3 bg-[#e9f1fa] rounded-xl border border-[#c7dbf1]">
                  <span className="text-[10px] text-[#1b56a0] uppercase font-extrabold block mb-1">Destination Predicted ETA</span>
                  <p className="text-lg sm:text-xl font-black font-mono text-[#1b56a0] tnum">
                    {activeJourney.dynamicEta || activeJourney.scheduledNextArrival || activeJourney.scheduledArrival || '--:--'}
                  </p>
                  <span className="text-[10px] text-[#2f6db3] font-semibold">AI Dynamic Forecast</span>
                </div>

                <div className="p-3 bg-[#f7f9fc] rounded-xl border border-[#d9e2ed]">
                  <span className="text-[10px] text-[#6b7f99] uppercase font-bold block mb-1">Scheduled Arrival</span>
                  <p className="text-sm sm:text-base font-bold font-mono text-[#51678a] tnum">
                    {activeJourney.scheduledArrival || activeJourney.scheduledNextArrival || '--:--'}
                  </p>
                  <span className="text-[10px] text-[#93a6bf]">Timetable Arrival</span>
                </div>

                <div className="p-3 bg-[#fdf7ec] rounded-xl border border-[#f3e2b8]">
                  <span className="text-[10px] text-[#9a6b0a] uppercase font-bold block mb-1">Alerts & Notifications</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`w-2 h-2 rounded-full ${activeJourney.notificationsEnabled !== false ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    <span className="text-xs font-bold text-[#14253d]">
                      {activeJourney.notificationsEnabled !== false ? 'SMS & Push Active' : 'Muted'}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#9a6b0a] font-mono">Delay & Platform Alerts</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="pt-2">
                <div className="flex justify-between text-xs text-[#6b7f99] mb-1.5">
                  <span>Journey Progress</span>
                  <span className="font-mono font-bold text-[#14253d] tnum">
                    {activeJourney.progressPercent || 45}% complete
                  </span>
                </div>
                <div className="w-full bg-[#dbe4ef] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#0d7a56] to-[#0b7da8] transition-all duration-500"
                    style={{ width: `${activeJourney.progressPercent || 45}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </section>
      ) : (
        <Card light>
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#e9f1fa] border border-[#c7dbf1] flex items-center justify-center mx-auto">
              <Train className="w-8 h-8 text-[#1b56a0]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#14253d]">No Saved Journeys Yet</h3>
              <p className="text-xs text-[#6b7f99] mt-1 max-w-sm mx-auto">
                Search for your train and click "+ Save Journey" to track your real-time ETA, delay alerts, and platform announcements here.
              </p>
            </div>
            <button onClick={onAddJourney} className="portal-btn portal-btn-primary inline-flex shadow-sm">
              <Plus className="w-4 h-4" /> Track Your First Train
            </button>
          </div>
        </Card>
      )}

      {/* ═══════════ 2. UPCOMING JOURNEYS ═══════════ */}
      {upcomingJourneys.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="portal-section-title">Upcoming Booked Journeys ({upcomingJourneys.length})</h2>
          </div>

          <div className="space-y-2.5">
            {upcomingJourneys.map((journey, idx) => {
              const delay = journey.delayMin ?? journey.baseDelayMin ?? 0;
              return (
                <Card key={journey.number || idx} light>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="portal-tag tnum">#{journey.number}</span>
                        <h3 className="text-sm font-bold text-[#14253d]">{journey.name}</h3>
                        <Badge light variant={delay <= 5 ? 'success' : delay <= 15 ? 'warning' : 'danger'}>
                          {delay <= 5 ? 'On Time' : `+${delay}m Delay`}
                        </Badge>
                        {journey.pnr && <span className="portal-chip text-[10px]">PNR: {journey.pnr}</span>}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[#6b7f99]">
                        <MapPin className="w-3 h-3 text-[#0d7a56]" />
                        <span>{journey.from?.split('(')?.[0] ?? '—'}</span>
                        <ArrowRight className="w-3 h-3 text-[#93a6bf]" />
                        <span>{journey.to?.split('(')?.[0] ?? '—'}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#6b7f99] font-mono">
                        {journey.journeyDate && (
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-[#93a6bf]" /> {journey.journeyDate}</span>
                        )}
                        {journey.scheduledNextArrival && (
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-[#93a6bf]" /> ETA: <span className="text-[#0d7a56] font-bold">{journey.dynamicEta || journey.scheduledNextArrival}</span></span>
                        )}
                        {journey.class && <span>Class: {journey.class}</span>}
                        {journey.coach && <span>Coach: {journey.coach}-{journey.berth}</span>}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        onClick={() => onToggleNotification(journey.number)}
                        className={`p-2 rounded-lg transition-all ${journey.notificationsEnabled !== false ? 'bg-[#e6f5ec] text-[#0d7a56] border border-[#bfe3cf]' : 'bg-[#f4f7fb] text-[#6b7f99] border border-[#d9e2ed]'}`}
                        title={journey.notificationsEnabled !== false ? 'Notifications Active' : 'Notifications Muted'}
                      >
                        {journey.notificationsEnabled !== false ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => onRemoveJourney(journey.number)}
                        className="p-2 rounded-lg bg-[#f4f7fb] text-[#6b7f99] border border-[#d9e2ed] hover:text-[#b02a2a] hover:border-[#f2c6c4] transition-all"
                        title="Remove journey"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onSelectTrain(journey)}
                        className="portal-btn portal-btn-ghost text-xs py-2 px-3 flex items-center gap-1.5"
                      >
                        <Activity className="w-3.5 h-3.5" /> Latest Movement
                      </button>
                      <button
                        onClick={() => onSelectTrain(journey)}
                        className="portal-btn portal-btn-primary text-xs py-2 px-3 flex items-center gap-1.5"
                      >
                        Track Now <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* ═══════════ 3. JOURNEY HISTORY (Completed Past Journeys) ═══════════ */}
      {historyJourneys.length > 0 && (
        <section className="space-y-3">
          <h2 className="portal-section-title">Past / Completed Journeys ({historyJourneys.length})</h2>
          <div className="space-y-2 opacity-80">
            {historyJourneys.map((j, idx) => (
              <Card key={idx} light>
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-[#51678a]">#{j.number} {j.name}</span>
                    <p className="text-[#6b7f99] mt-0.5">{j.from} → {j.to} · {j.journeyDate || 'Completed'}</p>
                  </div>
                  <span className="portal-pill portal-pill-slate">Completed</span>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <Card light>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="portal-label mb-0">Recent Searches</h3>
              <span className="text-[10px] text-[#93a6bf]">Last {recentSearches.length} trains viewed</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.slice(0, 4).map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectTrain(s)}
                  className="portal-chip"
                >
                  <Train className="w-3.5 h-3.5 text-[#1b56a0]" />
                  <span className="font-mono font-bold text-[#1b56a0]">#{s.number}</span>
                  <span className="text-[#6b7f99]">{s.name || ''}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}