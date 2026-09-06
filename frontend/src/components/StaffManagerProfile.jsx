import React, { useState } from 'react';
import { User, Mail, Phone, Bell, BellRing, Shield, Lock, MapPin, LogOut, Building2, Smartphone, Volume2, Home, CheckCircle2 } from 'lucide-react';
import Card from './ui/Card';
import Badge from './ui/Badge';
import SectionHeader from './ui/SectionHeader';

function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} className={`relative w-11 h-6 rounded-full transition-colors ${on ? 'bg-emerald-500' : 'bg-slate-700'}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

export default function StaffManagerProfile({ user, stationCode = 'BZA', onLogout }) {
  const roleName = user?.role === 'station_master'
    ? 'Station Master (Operations)'
    : user?.role === 'section_controller'
    ? 'Section Controller (SCR Mainline)'
    : user?.role === 'divisional_hq'
    ? 'Divisional Operating HQ Officer'
    : 'Railway Operations Officer';

  const officerName = user?.username === 'sm_bza'
    ? 'R. K. Verma'
    : user?.username === 'controller_scr'
    ? 'Arjun Sharma'
    : user?.username === 'hq_delhi'
    ? 'S. N. Mukhopadhyay'
    : 'Railway Officer';

  const [settings, setSettings] = useState({
    email: user?.username ? `${user.username}@railflow.indianrailways.gov.in` : 'demo.controller@railflow.example',
    phone: '+91 94450 88210',
    role: roleName,
    division: user?.division || 'Vijayawada Division (SCR)',
    operatorId: user?.username ? user.username.toUpperCase() : 'IR-OPS-8842',
    alerts: true,
    criticalOnly: false,
    emailNotif: true,
    smsNotif: false,
    sound: true,
    language: 'English',
  });

  const set = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));

  const initials = officerName.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><User className="w-5 h-5 text-cyan-400" /> Operating Officer Profile</h1>
          <p className="text-xs text-slate-400 mt-0.5">Control-room credentials, active role delegation, and notification preferences</p>
        </div>
        <button onClick={onLogout} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/40 text-red-300 hover:bg-red-500/20 text-xs font-bold transition-all">
          <LogOut className="w-3.5 h-3.5" /> Logout
        </button>
      </div>

      {/* Header Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/40 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-2xl font-black text-slate-950 shrink-0 shadow-lg">
          {initials}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-white">{officerName}</h2>
            <Badge variant="info"><Shield className="w-3 h-3 inline mr-1" /> {settings.role}</Badge>
            <Badge variant="success">Authenticated</Badge>
            <Badge variant="warning">Decision-Support Sandbox</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-cyan-400" /> {settings.email}</span>
            <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-emerald-400" /> {settings.phone}</span>
            <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-amber-400" /> {settings.division}</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-indigo-400" /> Station Hub: {stationCode}</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">Operator ID: {settings.operatorId} • Verified Digital Control Credential</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <Card accent="cyan">
          <SectionHeader icon={Bell} iconColor="cyan" title="Operational Notifications" description="Real-time alert dispatch preferences" />
          <div className="space-y-3 mt-4">
            {[
              { key: 'alerts', label: 'Real-Time AI Delay & Dynamic ETA Alerts', sub: 'Broadcast telemetry triggers on >10m drift', icon: BellRing },
              { key: 'emailNotif', label: 'Section Operating Shift Summaries', sub: 'Automated 8-hour handover digests', icon: Mail },
              { key: 'smsNotif', label: 'SMS High-Priority Dispatch Broadcast', sub: 'Direct SMS for critical berthing deadlocks', icon: Smartphone },
              { key: 'sound', label: 'Audible Control Room Chime', sub: 'Audible chime on predicted platform conflicts', icon: Volume2 },
            ].map(n => (
              <div key={n.key} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <n.icon className="w-4 h-4 text-cyan-400" />
                  <div>
                    <p className="text-xs font-bold text-white">{n.label}</p>
                    <p className="text-[11px] text-slate-500">{n.sub}</p>
                  </div>
                </div>
                <Toggle on={settings[n.key]} onChange={(v) => set(n.key, v)} />
              </div>
            ))}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-red-400" />
                <div>
                  <p className="text-xs font-bold text-white">Critical Platform Conflicts Only</p>
                  <p className="text-[11px] text-slate-500">Suppress routine variance; alert on critical berthing overlap</p>
                </div>
              </div>
              <Toggle on={settings.criticalOnly} onChange={(v) => set('criticalOnly', v)} />
            </div>
          </div>
        </Card>

        {/* Account Settings */}
        <Card accent="emerald">
          <SectionHeader icon={Lock} iconColor="emerald" title="Operational Authorization & Security" description="Role delegation and security credentials" />
          <div className="space-y-3 mt-4">
            {/* Personal info */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Officer Credentials</p>
              {[
                { icon: User, label: 'Designated Officer', value: officerName },
                { icon: Mail, label: 'Official Network ID', value: settings.email },
                { icon: Phone, label: 'Hotline Contact', value: settings.phone },
                { icon: MapPin, label: 'Operating Division', value: settings.division },
              ].map(f => (
                <div key={f.label} className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5"><f.icon className="w-3 h-3 text-slate-500" /> {f.label}</span>
                  <span className="text-slate-200 font-medium">{f.value}</span>
                </div>
              ))}
            </div>

            {/* Preferences */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Console Preferences</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Display Language</span>
                <select value={settings.language} onChange={(e) => set('language', e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500">
                  {['English', 'Hindi', 'Telugu'].map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            {/* Security */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5"><Shield className="w-3 h-3 text-emerald-400" /> Role-Based Access Control</span>
                <Badge variant="success">CAC / Token 2FA Active</Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Account actions */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Operational logs encrypted and synchronized with Section Master Server.</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => set('email', `${user?.username || 'sm_bza'}@railflow.indianrailways.gov.in`)} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 transition-all flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5" /> Reset Preferences
            </button>
            <button onClick={onLogout} className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-bold transition-all flex items-center gap-1.5">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
