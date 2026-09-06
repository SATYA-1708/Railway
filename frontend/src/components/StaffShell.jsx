import React, { useMemo } from 'react';
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
  Radio,
  RefreshCw,
  LogOut,
  LocateFixed,
  ArrowUpRight,
  Shield,
  Activity,
  Layers,
  AlertTriangle
} from 'lucide-react';

const ALL_NAV_ITEMS = [
  { key: 'dashboard', label: 'Operations', icon: LayoutDashboard },
  { key: 'live-map', label: 'Fleet Map', icon: Map },
  { key: 'trains', label: 'Trains', icon: Train },
  { key: 'what-if', label: 'What-If AI', icon: Sliders },
  { key: 'tsr', label: 'TSR & Operational Impact', icon: AlertTriangle },
  { key: 'platforms', label: 'Platform Berthing', icon: ShieldAlert },
  { key: 'signals', label: 'Interlocking', icon: Monitor },
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

const CORRIDOR_JURISDICTIONS = {
  BZA: 'South Central Railway • BZA–GDR Mainline Section (255 km)',
  NDLS: 'Northern Railway • NDLS–CNB High-Density Corridor (440 km)',
  BPL: 'West Central Railway • BPL–ET Central Ghat Section (92 km)',
  VSKP: 'East Coast Railway • VSKP–RJY Coastal Corridor (200 km)'
};

const STATION_NAMES = {
  BZA: 'Vijayawada Jn (BZA)',
  NDLS: 'New Delhi (NDLS)',
  BPL: 'Bhopal Jn (BPL)',
  VSKP: 'Visakhapatnam Jn (VSKP)'
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
  const userRole = user?.role || 'station_master';
  const roleLabel = user?.roleLabel || ROLE_LABELS[userRole] || 'Station Master';

  // Role-filtered and role-labeled navigation items
  const navItems = useMemo(() => {
    const allowedKeys = ROLE_TAB_KEYS[userRole] || ROLE_TAB_KEYS.station_master;
    return ALL_NAV_ITEMS
      .filter(item => allowedKeys.includes(item.key) || item.key === activeTab)
      .map(item => {
        if (userRole === 'section_controller') {
          if (item.key === 'dashboard') return { ...item, label: 'Corridor Overview' };
          if (item.key === 'trains') return { ...item, label: 'Train Roster' };
          if (item.key === 'what-if') return { ...item, label: 'Sequencing & What-If' };
          if (item.key === 'tsr') return { ...item, label: 'TSR & Impacts' };
        }
        return item;
      });
  }, [userRole, activeTab]);

  return (
    <div className="space-y-4">
      {/* ── Operational Top Header Bar ── */}
      <header className="sticky top-0 z-40 -mx-4 sm:-mx-6 lg:-mx-8 bg-[#0b1524] border-b border-white/10 shadow-lg">
        {/* Main Nav Strip */}
        <div className="flex items-center gap-1 h-14 px-4 sm:px-6 lg:px-8 overflow-x-auto">
          {/* Brand */}
          <button
            type="button"
            onClick={onLogout}
            title="Back to RailFlow"
            className="flex items-center gap-2 shrink-0 pr-3 mr-1 border-r border-white/10"
          >
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-md">
              <LocateFixed className="w-4 h-4 text-slate-950 font-black" />
            </div>
            <span className="hidden md:block text-sm font-bold tracking-tight text-white font-display whitespace-nowrap">
              Rail<span className="text-cyan-300">Flow</span>
              <span className="text-slate-600 mx-1">/</span>
              <span className="text-emerald-400 font-semibold">Ops Control</span>
            </span>
          </button>

          {/* Role-Filtered Nav Items Inline */}
          <nav className="flex items-center gap-0.5 flex-1 min-w-0">
            {navItems.map(item => {
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onTabChange(item.key)}
                  className={`flex items-center gap-1.5 px-2.5 h-9 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-cyan-400/15 text-cyan-300 border border-cyan-400/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <item.icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-300' : 'text-slate-500'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Top Controls: Station, Refresh, Logout */}
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {/* Passenger View Portal Switcher (Hidden for Section Controller) */}
            {userRole !== 'section_controller' && (
              <button
                type="button"
                onClick={onSwitchToPassenger}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/10 border border-white/15 text-[11px] font-bold text-slate-300 hover:text-white transition-all"
                title="Switch to Passenger Portal"
              >
                Passenger View <ArrowUpRight className="w-3 h-3 text-cyan-300" />
              </button>
            )}

            {/* Station Selector */}
            <select
              value={stationCode}
              onChange={e => onStationChange(e.target.value)}
              className="bg-black/40 border border-white/15 focus:border-cyan-400 rounded-md px-2.5 py-1.5 text-xs font-bold text-white outline-none cursor-pointer"
            >
              <option value="BZA">BZA · Vijayawada</option>
              <option value="NDLS">NDLS · New Delhi</option>
              <option value="BPL">BPL · Bhopal</option>
              <option value="VSKP">VSKP · Visakhapatnam</option>
            </select>

            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              title="Refresh Live Feeds"
              className="p-2 rounded-md bg-black/40 border border-white/15 hover:border-cyan-400 text-slate-300 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onLogout}
              title="Sign out of Staff Portal"
              className="p-2 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Operational Context Sub-Bar */}
        <div className="bg-[#070e1a] border-t border-white/5 px-4 sm:px-6 lg:px-8 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Shield className="w-3 h-3 text-cyan-400" />
              <strong className="text-white uppercase font-sans font-bold">ROLE:</strong>
              <span className="text-cyan-300 font-bold">{roleLabel}</span>
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <strong className="text-white uppercase font-sans font-bold">
                {userRole === 'section_controller' ? 'CORRIDOR JURISDICTION:' : 'STATION LOCATION:'}
              </strong>
              <span className="text-slate-200">
                {userRole === 'section_controller'
                  ? (CORRIDOR_JURISDICTIONS[stationCode] || CORRIDOR_JURISDICTIONS.BZA)
                  : (STATION_NAMES[stationCode] || stationCode)
                }
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isLive ? (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold tracking-wide uppercase text-[10px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                LIVE OPERATIONS (NTES Telemetry)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold tracking-wide uppercase text-[10px]">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                SIMULATION MODE (AI Decision Sandbox)
              </span>
            )}
            {lastUpdated && (
              <span className="text-slate-500 hidden md:inline">
                Synced: {lastUpdated}
              </span>
            )}
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}