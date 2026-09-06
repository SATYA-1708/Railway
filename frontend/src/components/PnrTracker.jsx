import React, { useState, useEffect } from 'react';
import {
  Ticket, Search, CheckCircle2, Layers, Sparkles, Navigation
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import Card from './ui/Card';
import Badge from './ui/Badge';
import RailwayLoader from './ui/RailwayLoader';

const SAMPLE_PNRS = [
  { pnr: '4523918472', train: '20805 AP Express', label: 'Confirmed (CNF/B4/34)' },
  { pnr: '8219401823', train: '12951 Mumbai Rajdhani', label: 'Tatkal CNF (A2/18)' },
  { pnr: '2418592019', train: '22436 Vande Bharat', label: 'RAC 2 (96.4% Prob)' },
];

export default function PnrTracker({ onTrackTrain = () => {}, onSaveJourney = () => {}, savedJourneys = [] }) {
  const [pnrInput, setPnrInput] = useState('4523918472');
  const [loading, setLoading] = useState(false);
  const [pnrResult, setPnrResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchPnr = async (pnrNum) => {
    const clean = pnrNum.trim().replace(/\D/g, '');
    if (clean.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit IRCTC PNR number.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const resp = await fetch(`${API_BASE_URL}/api/pnr/${clean}`);
      const data = await resp.json();
      setLoading(false);
      if (data && data.success && data.pnr) {
        setPnrResult(data.pnr);
      } else {
        setErrorMsg('PNR not found or invalid format.');
      }
    } catch {
      setLoading(false);
      setErrorMsg('Could not fetch PNR details. Please try again.');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPnr(pnrInput);
  };

  const handleQuickSelect = (pnr) => {
    setPnrInput(pnr);
    fetchPnr(pnr);
  };

  // Initial load
  React.useEffect(() => {
    fetchPnr('4523918472');
  }, []);

  return (
    <div className="portal-page space-y-6">
      {/* 1. HEADER & SEARCH BAR */}
      <div className="portal-card p-6 sm:p-7 space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#e9f1fa] border border-[#c7dbf1] flex items-center justify-center text-[#1b56a0]">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h1 className="portal-head-title flex items-center gap-2.5">
              IRCTC PNR Status
              <span className="portal-chip portal-chip-active text-[10px] px-2 py-0.5">PRS Sandbox Demo</span>
            </h1>
            <p className="portal-head-sub">Indian Railways booking confirmation prediction and dynamic ETA linking</p>
          </div>
        </div>

        <div className="portal-tint-amber rounded-lg p-3 text-xs text-[#8a6208] flex items-center gap-2">
          <span>ℹ️</span>
          <span>
            <strong>PRS Gateway Architecture:</strong> Live 10-digit PNR lookup uses simulated PRS Sandbox records for evaluation. Production deployment connects to IRCTC / CRIS PRS gateway.
          </span>
        </div>

        {/* Search input form */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Ticket className="w-4 h-4 text-[#6b7f99] absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={pnrInput}
              onChange={(e) => setPnrInput(e.target.value)}
              placeholder="Enter 10-digit PNR Number (e.g. 4523918472)"
              maxLength={10}
              className="portal-input pl-10 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="portal-btn portal-btn-primary shrink-0"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Search className="w-4 h-4" /> Get Live Status</>}
          </button>
        </form>

        {/* Quick Sample Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="portal-label mb-0">Try Sample PNRs:</span>
          {SAMPLE_PNRS.map((s) => (
            <button
              key={s.pnr}
              onClick={() => handleQuickSelect(s.pnr)}
              className="portal-chip"
            >
              <strong className="text-[#1b56a0] font-mono">{s.pnr}</strong>
              <span className="text-[#93a6bf]">•</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {errorMsg && (
          <p className="text-xs text-[#b02a2a] bg-[#fdeceb] p-2.5 rounded-lg border border-[#f2c6c4]">
            {errorMsg}
          </p>
        )}
      </div>

      {/* Loading Animation */}
      {loading && (
        <div className="portal-card p-8 bg-white border border-[#c7dbf1] shadow-sm">
          <RailwayLoader
            message="Querying IRCTC PNR Database..."
            submessage="Retrieving passenger charting, confirmation status & dynamic ETA"
          />
        </div>
      )}

      {/* 2. PNR DETAILS CARD */}
      {!loading && pnrResult && (
        <div className="space-y-6">
          <Card light accent="cyan">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e3ebf4] pb-5">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="info" light>PNR: {pnrResult.pnr}</Badge>
                  <h2 className="text-lg font-extrabold text-[#14253d]">{pnrResult.trainName} (#{pnrResult.trainNumber})</h2>
                </div>
                <p className="text-xs text-[#6b7f99]">
                  {pnrResult.fromStation} ➔ {pnrResult.toStation} • Date: <strong className="text-[#14253d]">{pnrResult.doj}</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSaveJourney({
                      number: pnrResult.trainNumber,
                      name: pnrResult.trainName,
                      from: pnrResult.fromStation,
                      to: pnrResult.toStation,
                      journeyDate: pnrResult.doj,
                      class: pnrResult.class,
                      pnr: pnrResult.pnr,
                      coach: pnrResult.coach,
                      berth: pnrResult.berth
                    });
                  }}
                  disabled={savedJourneys.some(j => String(j.number) === String(pnrResult.trainNumber) || j.pnr === pnrResult.pnr)}
                  className={`portal-btn text-xs py-2 px-3 ${
                    savedJourneys.some(j => String(j.number) === String(pnrResult.trainNumber) || j.pnr === pnrResult.pnr)
                      ? 'bg-[#e6f5ec] text-[#0d7a56] border border-[#bfe3cf]'
                      : 'portal-btn-ghost border-[#1b56a0] text-[#1b56a0] hover:bg-[#e9f1fa]'
                  }`}
                >
                  {savedJourneys.some(j => String(j.number) === String(pnrResult.trainNumber) || j.pnr === pnrResult.pnr)
                    ? '✓ Saved to My Journeys'
                    : '+ Save to My Journeys'}
                </button>
                <button
                  onClick={() => onTrackTrain(pnrResult.trainNumber)}
                  className="portal-btn portal-btn-primary text-xs py-2 px-3"
                >
                  <Navigation className="w-4 h-4" /> Track Live Dynamic ETA
                </button>
              </div>
            </div>

            {/* Passenger Booking Grid */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="portal-tint-blue rounded-xl p-4 space-y-1">
                <span className="portal-kv-label">Class & Quota</span>
                <p className="text-base font-extrabold text-[#14253d] font-mono">{pnrResult.class}</p>
                <p className="text-[11px] text-[#6b7f99]">Quota: {pnrResult.quota}</p>
              </div>

              <div className="portal-tint-blue rounded-xl p-4 space-y-1">
                <span className="portal-kv-label">Current Status</span>
                <div className="flex items-center gap-2">
                  <Badge variant={pnrResult.currentStatus.includes('CNF') ? 'success' : 'warning'} light>
                    {pnrResult.currentStatus}
                  </Badge>
                  {pnrResult.coach && (
                    <span className="font-mono font-bold text-[#1b56a0] text-sm">{pnrResult.coach} - {pnrResult.berth}</span>
                  )}
                </div>
                <p className="text-[11px] text-[#6b7f99]">{pnrResult.berthType || 'Berth allocation pending chart'}</p>
              </div>

              <div className="portal-tint-blue rounded-xl p-4 space-y-1">
                <span className="portal-kv-label flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#1b56a0]" /> AI Confirmation Score
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold font-mono text-[#0d7a56]">{pnrResult.confirmationProbability}%</span>
                  <Badge variant="success" light>High Certainty</Badge>
                </div>
                <p className="text-[10px] text-[#6b7f99]">Based on historical clearance trends</p>
              </div>
            </div>

            {/* 3. COACH RAKE POSITION VISUALIZER */}
            <div className="mt-6 pt-5 border-t border-[#e3ebf4] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="portal-section-title flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#1b56a0]" />
                  Train Coach Composition & Rake Sequence
                </h4>
                <span className="text-[11px] text-[#6b7f99] font-mono">Engine ➔ Rear Guard</span>
              </div>

              {/* Coach sequence horizontal strip */}
              <div className="p-3 bg-[#f7f9fc] rounded-xl border border-[#d9e2ed] overflow-x-auto flex items-center gap-1.5 select-none">
                {pnrResult.coachSequence?.map((cCode, idx) => {
                  const isYourCoach = cCode === pnrResult.coach;

                  return (
                    <div
                      key={idx}
                      className={`px-3 py-2 rounded-lg text-center border font-mono transition-all shrink-0 ${
                        isYourCoach
                          ? 'bg-[#1b56a0] text-white border-[#1b56a0] font-black shadow-md'
                          : 'bg-white border-[#d9e2ed] text-[#6b7f99] hover:border-[#a9c6eb]'
                      }`}
                    >
                      <div className="text-[10px] uppercase font-bold">{cCode}</div>
                      <div className="text-[8px] opacity-75">{isYourCoach ? 'YOUR SEAT' : `${idx + 1}`}</div>
                    </div>
                  );
                })}
              </div>

              {pnrResult.coach && (
                <div className="portal-tint-blue rounded-xl p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[#1b56a0]">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Your seat is in Coach <strong>{pnrResult.coach}</strong>, Berth <strong>{pnrResult.berth} ({pnrResult.berthType})</strong>.</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-[#1b56a0]">Platform Display Ready</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}