import React, { useState } from 'react';
import {
  Train, Shield, LogOut, Menu, X, Home, MapPin, Bell,
  User, Navigation, Ticket, Compass
} from 'lucide-react';

function IndiaFlag({ className = "w-7 h-4.5" }) {
  return (
    <svg viewBox="0 0 900 600" className={`${className} shrink-0 rounded-[3px] shadow-sm border border-slate-300/80 overflow-hidden inline-block`} aria-label="Flag of India">
      <rect width="900" height="200" fill="#FF9933" />
      <rect y="200" width="900" height="200" fill="#FFFFFF" />
      <rect y="400" width="900" height="200" fill="#138808" />
      <circle cx="450" cy="300" r="80" fill="none" stroke="#000080" strokeWidth="7" />
      <circle cx="450" cy="300" r="16" fill="#000080" />
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i * 360) / 24;
        const rad = (angle * Math.PI) / 180;
        const x2 = 450 + 80 * Math.cos(rad);
        const y2 = 300 + 80 * Math.sin(rad);
        return (
          <line
            key={i}
            x1="450"
            y1="300"
            x2={x2}
            y2={y2}
            stroke="#000080"
            strokeWidth="3.8"
          />
        );
      })}
    </svg>
  );
}

export default function Navbar({
  currentView = 'landing',
  onNavigate = () => {},
  isStaffLoggedIn = false,
  onStaffLogout = () => {},
  alertCount = 0,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (views) => views.includes(currentView);
  const isStaffPortal = currentView === 'staff-portal';
  const isStaffArea = ['staff-login', 'staff-portal'].includes(currentView);

  const btn = (active) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
      active
        ? 'text-[#1b56a0] bg-[#e9f1fa] border border-[#c7dbf1]'
        : 'text-[#3f5380] border border-transparent hover:text-[#1b56a0] hover:bg-[#f2f7fd]'
    }`;

  /* ── Passenger nav (default for every user) ── */
  const passengerNav = (
    <>
      <button onClick={() => { onNavigate('landing'); setMobileOpen(false); }} className={btn(isActive(['landing']))}>
        <Home className="w-4 h-4 text-[#1b56a0]" /> Home
      </button>
      <button onClick={() => { onNavigate('passenger-search'); setMobileOpen(false); }} className={btn(isActive(['passenger-search']))}>
        <Navigation className="w-4 h-4 text-[#1b56a0]" /> Search Trains
      </button>
      <button onClick={() => { onNavigate('live-map'); setMobileOpen(false); }} className={btn(isActive(['live-map']))}>
        <Compass className="w-4 h-4 text-[#0d7a56]" /> Live Map
      </button>
      <button onClick={() => { onNavigate('my-journeys'); setMobileOpen(false); }} className={btn(isActive(['my-journeys', 'passenger-mytrain']))}>
        <Ticket className="w-4 h-4 text-[#1b56a0]" /> My Journeys
      </button>
      <button onClick={() => { onNavigate('station-board'); setMobileOpen(false); }} className={btn(isActive(['station-board']))}>
        <MapPin className="w-4 h-4 text-[#1b56a0]" /> Live Station
      </button>
      <button onClick={() => { onNavigate('pnr-tracker'); setMobileOpen(false); }} className={btn(isActive(['pnr-tracker']))}>
        <Train className="w-4 h-4 text-[#1b56a0]" /> PNR Status
      </button>
      <button onClick={() => { onNavigate('passenger-alerts'); setMobileOpen(false); }} className={`relative ${btn(isActive(['passenger-alerts']))}`}>
        <Bell className="w-4 h-4 text-[#d97706]" /> Alerts
        {alertCount > 0 && (
          <span className="w-2 h-2 rounded-full bg-[#d97706] animate-pulse" />
        )}
      </button>
    </>
  );

  /* ── Staff side link (always visible) ── */
  const staffSideLink = (
    <button
      onClick={() => { onNavigate(isStaffLoggedIn ? 'staff-portal' : 'staff-login'); setMobileOpen(false); }}
      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 border ${
        isActive(['staff-login', 'staff-portal'])
          ? 'bg-[#1b56a0] text-white border-[#1b56a0]'
          : 'bg-white text-[#1b56a0] border-[#c7dbf1] hover:bg-[#e9f1fa]'
      }`}
    >
      <Shield className="w-4 h-4" /> Staff
      {isStaffLoggedIn && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
    </button>
  );

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#dce5f0] shadow-[0_1px_0_rgba(24,46,82,0.04)]">
      {/* Government top band */}
      <div className="gov-band px-3 sm:px-6 py-1.5 overflow-hidden flex items-center gap-3">
        <IndiaFlag className="w-7 h-4.5" />
        
        {/* Continuous Smooth Scrolling Marquee */}
        <div className="gov-marquee-container flex-1">
          <div className="gov-marquee-content text-[11px] font-medium text-[#51678a] tracking-wide items-center gap-8">
            <span className="inline-flex items-center gap-2">
              <span className="font-bold text-[#14253d]">RailFlow AI Portal</span>
              <span>—</span>
              <span className="font-semibold text-[#1b56a0]">Smart India Hackathon 2026</span>
              <span>·</span>
              <strong className="text-[#0d7a56]">Problem Statement 26028:</strong>
              <span>Dynamic Forecast of Expected Time of Arrival (ETA) for Coaching Trains</span>
              <span className="text-[#93a6bf]">|</span>
              <span>Ministry of Railways, Government of India</span>
              <span className="text-[#93a6bf]">|</span>
              <span className="text-emerald-700 font-bold">● Live NTES & EPIS Satellite Telemetry Engine Active</span>
            </span>

            <span className="inline-flex items-center gap-2">
              <span className="font-bold text-[#14253d]">RailFlow AI Portal</span>
              <span>—</span>
              <span className="font-semibold text-[#1b56a0]">Smart India Hackathon 2026</span>
              <span>·</span>
              <strong className="text-[#0d7a56]">Problem Statement 26028:</strong>
              <span>Dynamic Forecast of Expected Time of Arrival (ETA) for Coaching Trains</span>
              <span className="text-[#93a6bf]">|</span>
              <span>Ministry of Railways, Government of India</span>
              <span className="text-[#93a6bf]">|</span>
              <span className="text-emerald-700 font-bold">● Live NTES & EPIS Satellite Telemetry Engine Active</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* High-Fidelity Custom Brand Emblem & Typography */}
          <button
            onClick={() => onNavigate(isStaffLoggedIn && isStaffPortal ? 'staff-portal' : 'landing')}
            className="flex items-center gap-3.5 select-none shrink-0 group transition-all text-left cursor-pointer"
          >
            {/* Minimalist Modern Logo Emblem */}
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#1b56a0] via-[#16498a] to-[#0c2e59] shadow-sm flex items-center justify-center border border-white/20 group-hover:scale-105 group-hover:shadow-md transition-all duration-200">
              <svg viewBox="0 0 32 32" className="w-6 h-6 text-white" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Modern Geometric Locomotive Body */}
                <rect x="7" y="4" width="18" height="20" rx="5" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.08)" />
                <path d="M7 13 H25" stroke="white" strokeWidth="1.8" />
                <path d="M16 4 V13" stroke="white" strokeWidth="1.5" strokeOpacity="0.6" />
                <circle cx="11.5" cy="18.5" r="1.5" fill="#38bdf8" />
                <circle cx="20.5" cy="18.5" r="1.5" fill="#38bdf8" />
                <path d="M11 24 L8 28" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <path d="M21 24 L24 28" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 28 H20" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
              </svg>

              {/* Live Satellite Pulsing Dot */}
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-white" />
              </span>
            </div>

            {/* Typography with uniform letter size */}
            <div className="flex flex-col justify-center">
              <div className="flex items-baseline gap-1.5 leading-none">
                <span className="font-display font-black text-[22px] tracking-tight text-[#0a192f] group-hover:text-[#1b56a0] transition-colors">
                  Rail<span className="text-[#1b56a0]">Flow</span> <span className="text-[#1b56a0] font-black">AI</span>
                </span>
              </div>
              <p className="text-[10px] font-semibold text-[#576f8f] tracking-[0.05em] mt-1 leading-none font-sans">
                Dynamic Train ETA Portal
              </p>
            </div>
          </button>

          {/* Desktop nav — hidden when in staff portal (tabs live below) */}
          {!isStaffPortal && (
            <nav className="hidden xl:flex items-center gap-1">
              {passengerNav}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {!isStaffPortal && (
              <button
                onClick={() => onNavigate('profile')}
                className={`hidden sm:flex items-center justify-center w-9 h-9 rounded-lg transition-colors border ${
                  isActive(['profile'])
                    ? 'bg-[#e9f1fa] text-[#1b56a0] border-[#c7dbf1]'
                    : 'bg-white text-[#52688a] hover:text-[#1b56a0] hover:bg-[#f2f7fd] border-[#d9e2ed]'
                }`}
                title="My Profile"
              >
                <User className="w-4 h-4" />
              </button>
            )}

            {!isStaffPortal && (
              <div className="hidden sm:block">{staffSideLink}</div>
            )}

            {isStaffPortal && isStaffLoggedIn ? (
              <div className="hidden sm:flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#d9e2ed] rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-medium text-[#51678a]">Operations Control</span>
                  <span className="text-xs font-mono text-[#93a6bf]">IR-CTR-8842</span>
                </div>
                <button
                  onClick={onStaffLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#b02a2a] hover:bg-[#fdeceb] border border-transparent hover:border-[#f2c6c4] rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            ) : (
              isStaffLoggedIn && (
                <button
                  onClick={onStaffLogout}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#b02a2a] hover:bg-[#fdeceb] rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )
            )}

            {/* Mobile hamburger — only when not in staff portal */}
            {!isStaffPortal && (
              <button onClick={() => setMobileOpen(!mobileOpen)} className="xl:hidden p-1.5 text-[#52688a] hover:text-[#1b56a0]">
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile dropdown — not shown in staff portal */}
      {mobileOpen && !isStaffPortal && (
        <div className="xl:hidden border-t border-[#e3ebf4] bg-white px-4 py-3 space-y-1">
          {passengerNav}
          <button
            onClick={() => { onNavigate('profile'); setMobileOpen(false); }}
            className="w-full text-left px-3 py-2 text-sm text-[#3f5380] hover:bg-[#f2f7fd] hover:text-[#1b56a0] rounded-lg flex items-center gap-2"
          >
            <User className="w-4 h-4" /> Profile
          </button>
          <div className="pt-1">
            {staffSideLink}
          </div>
          {isStaffLoggedIn && (
            <button
              onClick={() => { onStaffLogout(); setMobileOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-[#b02a2a] hover:bg-[#fdeceb] rounded-lg flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          )}
        </div>
      )}
    </header>
  );
}