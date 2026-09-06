import React, { useState } from 'react';
import { Sparkles, Sliders } from 'lucide-react';
import StaffConditionChangeDemo from './StaffConditionChangeDemo';
import StaffWhatIfSimulator from './StaffWhatIfSimulator';
import RailwayLoader from './ui/RailwayLoader';
import { useStationTrains } from '../hooks/useStationTrains';

export default function StaffEtaPrediction({ initialTrain = null, activeStation = 'BZA', onOpenWhatIf }) {
  const { trains: stationTrains, loading } = useStationTrains(activeStation);
  const [mode, setMode] = useState('eta');

  const subBtn = (key) =>
    `px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${mode === key ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`;

  if (loading && (!stationTrains || stationTrains.length === 0) && !initialTrain) {
    return (
      <div className="space-y-4">
        <RailwayLoader
          dark={true}
          fullPage={true}
          message="Synthesizing Dynamic AI Forecasts & Quantile Bounds..."
          submessage={`Correlating physical track velocity, weather visibility, and precedence for ${activeStation}...`}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-toggle: ETA Prediction (main SIH feature) vs What-If Simulator */}
      <div className="flex flex-wrap items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg w-fit">
        <button onClick={() => setMode('eta')} className={subBtn('eta')}>
          <Sparkles className="w-3.5 h-3.5" /> ETA Prediction
        </button>
        <button onClick={() => { setMode('whatif'); onOpenWhatIf?.(); }} className={subBtn('whatif')}>
          <Sliders className="w-3.5 h-3.5 text-cyan-400" /> What-If Simulator
        </button>
      </div>

      {mode === 'eta'
        ? <StaffConditionChangeDemo initialTrain={initialTrain} trains={stationTrains} />
        : <StaffWhatIfSimulator trains={stationTrains} />
      }
    </div>
  );
}
