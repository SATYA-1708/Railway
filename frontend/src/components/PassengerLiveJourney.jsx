import React from 'react';
import { Radio, CheckCircle2 } from 'lucide-react';
import Card from './ui/Card';
import SectionHeader from './ui/SectionHeader';
import LiveRailwayMap from './LiveRailwayMap';

export default function PassengerLiveJourney({ train }) {
  if (!train) return null;

  const statusStr = typeof train?.status === 'string' ? train.status.toLowerCase() : '';
  const isYetToStart = Boolean(
    train?.isYetToStart || 
    (train?.currentSpeed === 0 && (statusStr.includes('yet') || statusStr.includes('start') || statusStr.includes('origin') || !train?.lastStation))
  );
  const originStationName = typeof train?.originStation === 'string' ? train.originStation : (typeof train?.from === 'string' ? train.from.split('(')[0].trim() : 'Origin Station');

  const timeline = Array.isArray(train?.routeTimeline) ? train.routeTimeline : [];
  const nextStationObj = isYetToStart
    ? (timeline[1] || timeline[0] || {})
    : (timeline.find(s => s?.status === 'NEXT') ||
       timeline.find(s => s?.status === 'UPCOMING') ||
       timeline[1] ||
       timeline[0] || {});
  const precedingTrain = train?.precedingTrainAhead;

  return (
    <div className="space-y-6">
      {/* 1. Real Leaflet Geospatial Map focused on this train */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-bold text-[#14253d] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Live Geospatial GPS Map — #{train.number} {train.name}
            </h3>
            <p className="text-xs text-[#6b7f99]">
              {isYetToStart ? `Stationary at Origin: ${originStationName} (Platform ${train.assignedPlatform || 1})` : `In-transit toward ${nextStationObj.name || train.nextStation}`}
            </p>
          </div>
          <span className="portal-pill portal-pill-blue font-mono">
            {train.currentSpeed} km/h
          </span>
        </div>

        <LiveRailwayMap
          trains={[train]}
          selectedTrain={train}
          height="450px"
        />
      </div>

      {/* 2. Block Section Headway & Track Clearance */}
      <Card light accent="cyan">
        <SectionHeader 
          light
          icon={Radio} 
          iconColor="text-[#0b7da8]" 
          title={isYetToStart ? "Origin Platform Line & Route Clearance Ahead" : "Live Track Headway & Signal Telemetry"} 
          description={isYetToStart ? `Station: ${originStationName} • Platform ${train.assignedPlatform || 1}` : `Active Section: ${train.activeSection || 'Automatic Block Signalling Corridor'}`} 
          badge={<span className="portal-chip">{train.currentSpeed} km/h {isYetToStart ? '(At Platform)' : ''}</span>} 
        />

        <div className="bg-[#f7f9fc] rounded-xl p-4 border border-[#d9e2ed] mt-4 space-y-4">
          <div className="flex items-center justify-between text-xs text-[#6b7f99] flex-wrap gap-2">
            {isYetToStart ? (
              <span className="text-[#9a6b0a] font-bold">Locomotive at Origin: {originStationName} (Boarding)</span>
            ) : (
              <span>← Last Station: <strong className="text-[#14253d]">{train.lastStation || originStationName}</strong></span>
            )}
            <span>{isYetToStart ? 'First Route Stop' : 'Next Stop'}: <strong className="text-[#0d7a56]">{nextStationObj.name || train.nextStation}</strong> →</span>
          </div>

          {/* Headway & Safety Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#e3ebf4]">
            <div className="p-3 bg-white rounded-lg border border-[#d9e2ed]">
              <span className="portal-label mb-0">TRACK OCCUPANCY AHEAD</span>
              <p className="text-xs font-bold text-[#0d7a56] mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {precedingTrain ? `Freight Rake at ${precedingTrain.distanceKm} km` : 'Track Block Clear'}
              </p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-[#d9e2ed]">
              <span className="portal-label mb-0">NEXT SIGNAL ASPECT</span>
              <p className="text-xs font-mono font-bold text-[#0d7a56] mt-1 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                S-782 (Proceed / Green)
              </p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-[#d9e2ed]">
              <span className="portal-label mb-0">DYNAMIC ETA RECALIBRATION</span>
              <p className="text-xs font-bold text-[#0b7da8] mt-1">
                ±0 min delay adjustment
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}