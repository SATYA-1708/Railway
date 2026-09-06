import React, { useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Map,
  Train,
  Sliders,
  ShieldAlert,
  Monitor,
  Sparkles,
  BarChart3,
  User,
  LogOut,
  Shield,
  AlertTriangle,
  Menu,
  X,
  MapPin
} from 'lucide-react';

const ALL_NAV_ITEMS = [
  { key: 'dashboard', label: 'Operations', icon: LayoutDashboard },
  { key: 'live-map', label: 'Fleet Map', icon: Map },
  { key: 'trains', label: 'Trains', icon: Train },
  { key: 'what-if', label: 'What-If AI', icon: Sliders },
  { key: 'tsr', label: 'TSR & Impacts', icon: AlertTriangle },
  { key: 'platforms', label: 'Platforms', icon: ShieldAlert },
  { key: 'signals', label: 'Signals', icon: Monitor },
  { key: 'eta', label: 'Explainable ETA', icon: Sparkles },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'profile', label: 'Profile', icon: User },
];

const ROLE_TAB_KEYS = {
  station_master: ['dashboard', 'live-map', 'trains', 'platforms', 'signals', 'eta', 'what-if', 'profile'],
  section_controller: ['dashboard', 'live-map', 'trains', 'signals', 'what-if', 'tsr', 'platforms', 'eta', 'analytics', 'profile'],
  divisional_hq: ['dashboard', 'live-map', 'trains', 'signals', 'tsr', 'platforms', 'eta', 'analytics', 'profile'],
};

const ROLE_LABELS = {
  station_master: 'Station Master',
  section_controller: 'Section Controller',
  divisional_hq: 'HQ Operations'
};

export default function StaffShell({
  activeTab = 'dashboard',
  onTabChange = () => {},
  stationCode = 'BZA',
  onStationChange = () => {},
  isLive = false,
  lastUpdated = null,
  onRefresh = () => {},
  loading = false,
  userName = 'Station Manager',
  user = null,
  onLogout = () => {},
  onSwitchToPassenger = () => {},
  children
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userRole = user?.role || 'station_master';
  const roleLabel = user?.roleLabel || ROLE_LABELS[userRole] || 'Station Master';

  // Role-filtered navigation items
  const navItems = useMemo(() => {
    const allowedKeys = ROLE_TAB_KEYS[userRole] || ROLE_TAB_KEYS.station_master;
    return ALL_NAV_ITEMS
      .filter(item => allowedKeys.includes(item.key) || item.key === activeTab)
      .map(item => {
        if (userRole === 'section_controller') {
          if (item.key === 'dashboard') return { ...item, label: 'Overview' };
          if (item.key === 'trains') return { ...item, label: 'Train Roster' };
          if (item.key === 'what-if') return { ...item, label: 'Sequencing' };
          if (item.key === 'tsr') return { ...item, label: 'TSR Alerts' };
        }
        return item;
      });
  }, [userRole, activeTab]);

  return (
    <div className="space-y-4">
      {/* ── Single Unified Navigation Bar ── */}
      <header className="sticky top-0 z-50 -mx-4 sm:-mx-6 lg:-mx-8 bg-[#0b1524] border-b border-white/10 shadow-xl">
        <div className="max-w-[1720px] mx-auto px-3 sm:px-5 lg:px-6">
          <div className="flex items-center justify-between h-16 gap-3">
            
            {/* Left: Logo + Title */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={onLogout}
                title="Back to Passenger Portal"
                className="flex items-center gap-2.5 select-none shrink-0 group transition-all text-left cursor-pointer"
              >
                {/* 3D Indian Railways Locomotive Icon */}
                <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-[#1b56a0] via-[#154684] to-[#0f2342] shadow-md shadow-blue-950/50 flex items-center justify-center p-1 border border-[#c7dbf1]/30 group-hover:border-[#38bdf8]/60 group-hover:scale-105 transition-all duration-200 shrink-0 overflow-hidden">
                  <svg viewBox="0 0 120 120" className="w-full h-full relative z-10 drop-shadow" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Tracks */}
                    <path d="M15 110 L48 65 L52 65 L30 110" fill="#38bdf8" opacity="0.8" />
                    <path d="M105 110 L72 65 L68 65 L90 110" fill="#38bdf8" opacity="0.8" />
                    <line x1="22" y1="104" x2="98" y2="104" stroke="#334e68" strokeWidth="3" strokeLinecap="round" />
                    <line x1="30" y1="92" x2="90" y2="92" stroke="#334e68" strokeWidth="2.5" strokeLinecap="round" />
                    {/* Pantograph */}
                    <path d="M50 14 L55 22 L65 22 L70 14" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="48" y1="14" x2="72" y2="14" stroke="#e0f2fe" strokeWidth="2" strokeLinecap="round" />
                    {/* Main Body */}
                    <path
                      d="M60 18 C44 18 36 28 35 48 L32 82 C32 87 36 90 42 90 L78 90 C84 90 88 87 88 82 L85 48 C84 28 76 18 60 18 Z"
                      fill="url(#locoStaffGradSingle)"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    {/* Windscreen */}
                    <path
                      d="M38 40 C40 32 48 27 60 27 C72 27 80 32 82 40 L81 52 C75 54 68 55 60 55 C52 55 45 54 39 52 Z"
                      fill="#0a1d37"
                      stroke="#38bdf8"
                      strokeWidth="1.2"
                    />
                    {/* Stripes */}
                    <path d="M33 60 L87 60 L86 66 L34 66 Z" fill="#ff9933" />
                    <path d="M33.5 67 L86.5 67 L86 71 L34 71 Z" fill="#00d2ff" />
                    {/* Headlights */}
                    <circle cx="43" cy="77" r="4" fill="#fef08a" stroke="#f59e0b" strokeWidth="1" />
                    <circle cx="77" cy="77" r="4" fill="#fef08a" stroke="#f59e0b" strokeWidth="1" />
                    <defs>
                      <linearGradient id="locoStaffGradSingle" x1="60" y1="18" x2="60" y2="90" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#ffffff" />
                        <stop offset="0.4" stopColor="#e9f1fa" />
                        <stop offset="1" stopColor="#cbd5e1" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* Typography */}
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1 leading-none">
                    <span className="font-display font-extrabold text-[18px] tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                      Rail<span className="text-[#38bdf8]">Flow</span> <span className="text-cyan-400 font-extrabold text-[15px]">AI</span>
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono mt-0.5">
                    Ops Portal
                  </span>
                </div>
              </button>
            </div>

            {/* Center: Navigation Bar Tabs */}
            <nav className="hidden xl:flex items-center gap-1 flex-1 justify-center min-w-0 px-2 overflow-x-auto no-scrollbar">
              {navItems.map(item => {
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onTabChange(item.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-sm shadow-cyan-950/40'
                        : 'text-slate-300 hover:text-white hover:bg-white/[0.08] border border-transparent'
                    }`}
                  >
                    <item.icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-300' : 'text-slate-400'}`} />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Right Side Controls */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Station Control Selector */}
              <div className="flex items-center gap-1.5 bg-black/40 border border-white/15 rounded-lg px-2.5 py-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <select
                  value={stationCode}
                  onChange={e => onStationChange(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer pr-1"
                >
                  <option value="BZA" className="bg-[#0b1524] text-white">BZA (Vijayawada)</option>
                  <option value="NDLS" className="bg-[#0b1524] text-white">NDLS (New Delhi)</option>
                  <option value="BPL" className="bg-[#0b1524] text-white">BPL (Bhopal)</option>
                  <option value="VSKP" className="bg-[#0b1524] text-white">VSKP (Vizag)</option>
                </select>
              </div>

              {/* Role Badge */}
              <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/15 text-slate-200 text-xs font-medium">
                <Shield className="w-3 h-3 text-cyan-400" />
                <span className="text-cyan-300 font-semibold">{roleLabel}</span>
              </div>

              {/* Sign Out Button (Symbol Only) */}
              <button
                type="button"
                onClick={onLogout}
                title="Sign Out"
                className="p-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 hover:text-rose-100 transition-all shadow-sm flex items-center justify-center"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>

              {/* Mobile Hamburger Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="xl:hidden p-2 rounded-lg bg-white/10 text-slate-200 hover:text-white"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile / Tablet Slide-Down Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-white/10 bg-[#070e1a] px-4 py-3 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {navItems.map(item => {
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      onTabChange(item.key);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                        : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 ${isActive ? 'text-cyan-300' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-white/10 gap-2">
              <button
                type="button"
                onClick={onLogout}
                title="Sign Out"
                className="p-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 transition-colors flex items-center justify-center"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="min-w-0">
        {children}
      </main>
    </div>
  );
}