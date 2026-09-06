import React, { useState } from 'react';
import { Search, Train, MapPin, Calendar, ArrowRight, Navigation, Clock } from 'lucide-react';
import { fetchLiveTrainFromInternet, fetchTrainsBetweenStations } from '../services/liveRailwayService';
import AutocompleteInput from './ui/AutocompleteInput';
import RailwayLoader from './ui/RailwayLoader';

export default function PassengerSearch({ trains = [], onSelectTrain = () => {}, onAddTrackedTrain = () => {}, recentSearches = [] }) {
  const todayIso = new Date().toISOString().split('T')[0];
  const [searchMode, setSearchMode] = useState('station');
  const [trainQuery, setTrainQuery] = useState('');
  const [trainDate, setTrainDate] = useState(todayIso);
  const [fromStation, setFromStation] = useState('TADEPALLIGUDEM');
  const [toStation, setToStation] = useState('BHIMAVARAM');
  const [travelDate, setTravelDate] = useState(todayIso);
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [betweenResults, setBetweenResults] = useState(null);

  const getRelativeDate = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  const handleTrainSearch = async (e) => {
    if (e) e.preventDefault();
    setSearchError('');
    setBetweenResults(null);
    const query = trainQuery.trim();
    if (!query) { setSearchError('Enter a train number or name to search.'); return; }
    setIsSearching(true);
    try {
      const liveResult = await fetchLiveTrainFromInternet(query, trainDate);
      setIsSearching(false);
      if (liveResult) { onSelectTrain({ ...liveResult, searchDate: trainDate }); return; }
      setSearchError(`No live feed for "${query}" right now. Only trains with genuine real-time telemetry are shown — nothing is simulated.`);
    } catch {
      setIsSearching(false);
      setSearchError('Search failed. Please try again.');
    }
  };

  const handleStationSearch = async (e) => {
    if (e) e.preventDefault();
    setSearchError('');
    setBetweenResults(null);
    const from = fromStation.trim();
    const to = toStation.trim();
    if (!from || !to) { setSearchError('Enter both From and To stations.'); return; }
    setIsSearching(true);
    try {
      const res = await fetchTrainsBetweenStations(from, to);
      setIsSearching(false);
      if (res?.trains?.length > 0) {
        setBetweenResults(res);
        res.trains.forEach(t => onAddTrackedTrain(t));
      } else {
        setSearchError(`No direct trains found between ${from} and ${to}.`);
      }
    } catch {
      setIsSearching(false);
      setSearchError('Could not query trains. Please try again.');
    }
  };

  const handleQuickSelect = async (trainNum) => {
    setIsSearching(true);
    try {
      const liveResult = await fetchLiveTrainFromInternet(trainNum);
      if (liveResult) { setIsSearching(false); onSelectTrain(liveResult); return; }
    } catch {
      // fall through to honest "no live feed" state below
    }
    setIsSearching(false);
    setSearchError(`No live feed for train ${trainNum} right now. Only trains with genuine real-time telemetry are shown — nothing is simulated.`);
  };

  const quickRoutes = [
    { from: 'NEW DELHI', to: 'KANPUR', label: 'Delhi → Kanpur' },
    { from: 'MUMBAI', to: 'SURAT', label: 'Mumbai → Surat' },
    { from: 'VIJAYAWADA', to: 'VISAKHAPATNAM', label: 'Vijayawada → Vizag' },
    { from: 'TADEPALLIGUDEM', to: 'BHIMAVARAM', label: 'TDD → Bhimavaram' },
  ];

  return (
    <div className="portal-page space-y-6">
      {/* Page header */}
      <div>
        <h1 className="portal-head-title">Track a Train</h1>
        <p className="portal-head-sub">Search by train number or find trains between stations. Only genuine live NTES telemetry is shown.</p>
      </div>

      {/* Main Search */}
      <div className="portal-card p-6 sm:p-7 space-y-6">
        {/* Mode switcher */}
        <div className="portal-tabbar w-full sm:w-auto">
          <button
            onClick={() => { setSearchMode('station'); setSearchError(''); setBetweenResults(null); }}
            className={`portal-tab flex-1 sm:flex-none flex items-center justify-center gap-2 ${searchMode === 'station' ? 'portal-tab-active' : ''}`}
          >
            <Navigation className="w-4 h-4" /> Between Stations
          </button>
          <button
            onClick={() => { setSearchMode('train'); setSearchError(''); setBetweenResults(null); }}
            className={`portal-tab flex-1 sm:flex-none flex items-center justify-center gap-2 ${searchMode === 'train' ? 'portal-tab-active' : ''}`}
          >
            <Train className="w-4 h-4" /> By Train No / Name
          </button>
        </div>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="portal-label mb-0">Recent Searches</p>
              <span className="text-[10px] text-[#93a6bf]">Last {recentSearches.length} viewed</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.slice(0, 3).map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => { setTrainQuery(String(s.number || '')); setSearchMode('train'); }}
                  className="portal-chip"
                >
                  <Train className="w-3 h-3" />
                  <span className="font-mono font-bold text-[#1b56a0]">#{s.number}</span>
                  {s.name || ''}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Station-to-Station */}
        {searchMode === 'station' && (
          <form onSubmit={handleStationSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="portal-label">From Station</label>
                <AutocompleteInput
                  type="station"
                  value={fromStation}
                  onChange={setFromStation}
                  onSelect={(code, item) => setFromStation(`${item.name} (${code})`)}
                  placeholder="e.g. Kharar or New Delhi"
                  icon={MapPin}
                  iconColor="text-[#1b56a0]"
                  light
                />
              </div>
              <div>
                <label className="portal-label">To Station</label>
                <AutocompleteInput
                  type="station"
                  value={toStation}
                  onChange={setToStation}
                  onSelect={(code, item) => setToStation(`${item.name} (${code})`)}
                  placeholder="e.g. Delhi or Kanpur"
                  icon={MapPin}
                  iconColor="text-[#2f6db3]"
                  light
                />
              </div>
              <div>
                <label className="portal-label">Date</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[#6b7f99] absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="date"
                    value={travelDate}
                    onChange={e => setTravelDate(e.target.value)}
                    className="portal-input pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <span className="text-[11px] text-[#6b7f99] self-center font-medium">Popular:</span>
              {quickRoutes.map((qr, i) => (
                <button key={i} type="button"
                  onClick={() => { setFromStation(qr.from); setToStation(qr.to); }}
                  className="portal-chip"
                >
                  {qr.label}
                </button>
              ))}
            </div>

            {searchError && <p className="text-xs text-[#8a6208] bg-[#fdf3dd] px-3 py-2.5 rounded-lg border border-[#efd9a8]">{searchError}</p>}

            <button type="submit" disabled={isSearching} className="portal-btn portal-btn-primary w-full">
              {isSearching
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Searching...</>
                : <><Search className="w-4 h-4" /> Find Trains</>
              }
            </button>
          </form>
        )}

        {/* Train Number Search */}
        {searchMode === 'train' && (
          <form onSubmit={handleTrainSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="portal-label">Train Number or Name</label>
                <AutocompleteInput
                  type="train"
                  value={trainQuery}
                  onChange={setTrainQuery}
                  onSelect={(num) => setTrainQuery(num)}
                  placeholder="e.g. 12058, 20805, 12951, Janshatabdi"
                  icon={Train}
                  iconColor="text-[#1b56a0]"
                  light
                />
              </div>
              <div>
                <label className="portal-label">Date</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[#6b7f99] absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="date"
                    value={trainDate}
                    onChange={e => setTrainDate(e.target.value)}
                    className="portal-input pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {[
                { label: 'Yesterday', val: getRelativeDate(-1) },
                { label: 'Today', val: getRelativeDate(0) },
                { label: 'Tomorrow', val: getRelativeDate(1) },
              ].map(d => (
                <button key={d.label} type="button" onClick={() => setTrainDate(d.val)}
                  className={`portal-chip ${trainDate === d.val ? 'portal-chip-active' : ''}`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {searchError && <p className="text-xs text-[#8a6208] bg-[#fdf3dd] px-3 py-2.5 rounded-lg border border-[#efd9a8]">{searchError}</p>}

            <button type="submit" disabled={isSearching} className="portal-btn portal-btn-primary w-full">
              {isSearching
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Fetching live status...</>
                : <><Search className="w-4 h-4" /> Track Train</>
              }
            </button>
          </form>
        )}
      </div>

      {/* Searching Loader Animation */}
      {isSearching && (
        <div className="portal-card p-8 bg-white border border-[#c7dbf1] shadow-sm">
          <RailwayLoader
            message="Querying Live Train Schedule & Telemetry..."
            submessage="Connecting to NTES satellite tracking & interlocking stations"
          />
        </div>
      )}

      {/* Between Stations Results */}
      {!isSearching && betweenResults?.trains && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="portal-section-title">{betweenResults.fromStation} → {betweenResults.toStation}</p>
              <p className="portal-section-sub">{betweenResults.count} trains found · {travelDate}</p>
            </div>
          </div>

          {betweenResults.routeNote && (
            <div className="portal-tint-blue px-4 py-2.5 rounded-lg text-xs text-[#1b56a0] flex items-center gap-2">
              <Navigation className="w-4 h-4 shrink-0" />
              <span>{betweenResults.routeNote}</span>
            </div>
          )}
          <div className="space-y-2">
            {betweenResults.trains.map((t, idx) => (
              <div key={idx} className="portal-card p-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="portal-tag tnum">#{t.number}</span>
                    <span className="text-sm font-bold text-[#14253d]">{t.name}</span>
                    {t.trainType && <span className="portal-pill portal-pill-slate">{t.trainType}</span>}
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-[#0d7a56] font-bold">{t.departureTime}</span>
                    <span className="text-[#93a6bf]">→</span>
                    <span className="text-[#1b56a0] font-bold">{t.arrivalTime}</span>
                    <span className="text-[#6b7f99] flex items-center gap-1"><Clock className="w-3 h-3" />{t.travelTime}</span>
                  </div>
                  {t.daysOfRun && <p className="text-[11px] text-[#6b7f99] mt-1">Runs: {t.daysOfRun}</p>}
                </div>
                <button onClick={() => handleQuickSelect(t.number)}
                  className="portal-btn portal-btn-primary text-xs py-2 px-3 shrink-0"
                >
                  Track <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick fleet */}
      {!betweenResults && (
        <div className="space-y-3">
          <p className="portal-label mb-0">Popular Trains</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(trains.length ? trains.filter(tr => tr && (tr.available !== false) && tr.isLiveNTES === true) : []).slice(0, 6).map(tr => (
              <button key={tr.number} onClick={() => handleQuickSelect(tr.number)}
                className="portal-card portal-card-hover p-4 text-left flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="portal-tag tnum">#{tr.number}</span>
                    <span className="text-sm font-semibold text-[#14253d]">{tr.name}</span>
                    {tr.isLiveNTES === true && (
                      <span className="portal-pill portal-pill-green">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6b7f99]">{tr.from?.split('(')?.[0] ?? '—'} → {tr.to?.split('(')?.[0] ?? '—'} · {tr.zone}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#93a6bf] group-hover:text-[#1b56a0] shrink-0" />
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[#6b7f99]">Trains fetching live NTES telemetry every 60 s — untagged trains show official schedules.</p>
        </div>
      )}
    </div>
  );
}