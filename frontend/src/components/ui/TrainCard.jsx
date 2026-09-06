import { ArrowRight } from 'lucide-react';

export default function TrainCard({ train, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(train)}
      className="w-full p-4 rounded-2xl glass-panel card-lift text-left flex items-center justify-between group"
    >
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/30 tnum shrink-0">
            #{train.number}
          </span>
          <span className="font-semibold text-sm text-white truncate group-hover:text-brand-400 transition-colors">
            {train.name}
          </span>
        </div>
        <p className="text-xs text-slate-400 truncate">
          {train.from?.split('(')?.[0] ?? '—'} <span className="text-slate-600 mx-0.5">→</span> {train.to?.split('(')?.[0] ?? '—'}
        </p>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          {train.totalDistanceKm && <span className="tnum">{train.totalDistanceKm} km</span>}
          {train.zone && <span>{train.zone}</span>}
          {train.status && (
            <span className="flex items-center gap-1.5">
              <span className={`pulse-dot ${train.status === 'Running' ? 'bg-brand-500 text-brand-500' : 'bg-amber-500 text-amber-500'}`} />
              <span className={train.status === 'Running' ? 'text-brand-400' : 'text-amber-400'}>
                {train.status}
              </span>
            </span>
          )}
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 group-hover:translate-x-1 shrink-0 ml-3 transition-all" />
    </button>
  );
}
