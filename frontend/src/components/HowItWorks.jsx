import React from 'react';
import { Cpu, GitMerge, Radio, Sparkles, Layers, Code, Database, ShieldCheck } from 'lucide-react';
import Card from './ui/Card';
import Badge from './ui/Badge';
import SectionHeader from './ui/SectionHeader';
import { COLOR_TEXT, COLOR_BG_SOFT, COLOR_ICON_BOX } from '../utils/colorClasses';

export default function HowItWorks() {
  const steps = [
    {
      num: '01', color: 'blue', icon: Radio, title: 'Input Data Feeds',
      items: ['NTES Live Status: official train position, delay & running state', 'Static Roster: full timetable of ~5,000+ coaching trains', 'Open-Meteo Weather: visibility / fog / rain at train coordinates', 'Ground-Truth Log: observed delays captured for evaluation']
    },
    {
      num: '02', color: 'cyan', icon: Cpu, title: 'Dynamic AI Engine',
      items: ['Gradient-Boosted Regression: 9-feature delay model', 'Persistence Baseline: every forecast measured against it', 'Confidence Windows: ETA range, wider early in journey', 'Explainability Layer: human-friendly delay reasons']
    },
    {
      num: '03', color: 'indigo', icon: GitMerge, title: 'Tailored Experiences',
      items: ['Passengers: arrival ranges + plain why-delayed text', 'Controllers: multi-train matrix & platform alerts', 'What-If Sandbox: reassign platforms before acting']
    },
  ];

  const comparison = [
    ['ETA Calculation', 'Static timetable + built-in recovery', 'ML forecast with confidence window vs baseline'],
    ['Traffic Ahead', 'Blind to slower trains', 'Congestion & rake factors in the feature set'],
    ['Delay Reasons', 'Vague "Operational Reasons"', 'Plain-language cause stated'],
    ['Platform Conflicts', 'Discovered at outer signal', 'Alerts with What-If reassignment sandbox'],
    ['Role Segregation', 'One-size-fits-all UI', 'Passenger vs Staff Portal separation'],
  ];

  const stack = [
    { label: 'Frontend', value: 'React 19 + Vite', desc: 'Fast reactive client', color: 'blue' },
    { label: 'Styling', value: 'Tailwind CSS', desc: 'Accessible responsive design', color: 'cyan' },
    { label: 'Backend API', value: 'Python / FastAPI', desc: 'Async REST endpoints', color: 'indigo' },
    { label: 'Icons', value: 'Lucide React', desc: 'Open-source icon family', color: 'emerald' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4">
      {/* Hero */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <Badge variant="info"><Sparkles className="w-3.5 h-3.5 inline mr-1" /> SIH 2026 • PS 26028</Badge>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          How <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">RailFlow AI</span> Works
        </h1>
        <p className="text-slate-300 text-sm leading-relaxed">
          Transforming raw RTIS GPS, signal telemetry, and track block data into high-precision forecasts and proactive dispatch recommendations.
        </p>
      </div>

      {/* 3 Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map(s => (
          <Card key={s.num} accent={s.color}>
            <div className={`w-10 h-10 rounded-lg ${COLOR_ICON_BOX[s.color] || COLOR_ICON_BOX.blue} flex items-center justify-center font-bold text-sm mb-3`}>{s.num}</div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2">
              <s.icon className={`w-4 h-4 ${COLOR_TEXT[s.color] || COLOR_TEXT.blue}`} /> {s.title}
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {s.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${COLOR_BG_SOFT[s.color] || COLOR_BG_SOFT.blue} mt-1.5 shrink-0`} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      {/* Comparison Table */}
      <Card>
        <SectionHeader icon={Layers} iconColor="cyan" title="RailFlow AI vs Legacy Timetables" description="Why traditional apps fail during congestion" />
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">Capability</th>
                <th className="py-2.5 px-3">Legacy Apps (NTES)</th>
                <th className="py-2.5 px-3 text-cyan-400 bg-cyan-950/20 rounded-t-lg">RailFlow AI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {comparison.map(([cap, legacy, ai], i) => (
                <tr key={i}>
                  <td className="py-2.5 px-3 font-semibold text-white">{cap}</td>
                  <td className="py-2.5 px-3 text-red-400/80">{legacy}</td>
                  <td className="py-2.5 px-3 bg-cyan-950/10 font-semibold text-cyan-300">{ai}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Tech Stack */}
      <Card>
        <SectionHeader icon={Code} iconColor="emerald" title="100% Free & Open-Source Stack" description="Zero proprietary paywalls" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {stack.map(s => (
            <div key={s.label} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <p className={`text-[11px] font-bold ${COLOR_TEXT[s.color] || COLOR_TEXT.blue} uppercase`}>{s.label}</p>
              <p className="text-sm font-bold text-white">{s.value}</p>
              <p className="text-[11px] text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </Card>
    {/* Data Sources, Model & Honest Limitations */}
      <Card accent="violet">
        <SectionHeader icon={Database} iconColor="violet" title="Data Sources, Model & Honest Limitations" description="Every number you see is traceable to a named feed" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5"><Radio className="w-3.5 h-3.5 text-cyan-400" /> Live Data Sources</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" /><span><strong className="text-white">Indian Railways NTES</strong> — official live running status & schedule (train position, delays, platform).</span></li>
              <li className="flex items-start gap-2"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" /><span><strong className="text-white">Open-Meteo</strong> — satellite weather (visibility / fog / rain) at the train's current coordinates.</span></li>
              <li className="flex items-start gap-2"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" /><span><strong className="text-white">Trained ETA Model</strong> — gradient-boosted regression on telemetry + weather + timetable features.</span></li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Honest Data Policy</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" /><span><strong className="text-white">LIVE vs SIMULATED is labelled.</strong> When the NTES feed is unreachable the app clearly badges the view as SIMULATED — it never quietly claims live data.</span></li>
              <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" /><span><strong className="text-white">Predictions beat a transparent baseline.</strong> The AI forecast is always shown against persistence (current delay carried forward), so improvement is measurable, never self-claimed.</span></li>
              <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" /><span><strong className="text-white">Ground-truth feedback loop.</strong> Every forecast is logged and reconciled with the observed delay at that station; the Analytics panel reports honest MAE vs baseline.</span></li>
              <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" /><span><strong className="text-white">Model card transparency.</strong> Library, training data provenance and held-out validation metrics are exposed via <code className="text-cyan-300">/api/model/card</code>.</span></li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
