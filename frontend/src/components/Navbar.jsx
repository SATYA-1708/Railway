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
            {/* Realistic 3D Indian Railways Locomotive Icon */}
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-[#1b56a0] via-[#154684] to-[#0f2342] shadow-md shadow-[#1b56a0]/25 flex items-center justify-center p-1 border border-[#c7dbf1]/40 group-hover:border-[#38bdf8]/60 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-[#1b56a0]/35 transition-all duration-200 shrink-0 overflow-hidden">
              <svg viewBox="0 0 120 120" className="w-full h-full relative z-10 drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Converging Polished Steel Tracks */}
                <path d="M15 110 L48 65 L52 65 L30 110" fill="url(#trackSteelL)" opacity="0.85" />
                <path d="M105 110 L72 65 L68 65 L90 110" fill="url(#trackSteelR)" opacity="0.85" />
                <line x1="22" y1="104" x2="98" y2="104" stroke="#334e68" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
                <line x1="30" y1="92" x2="90" y2="92" stroke="#334e68" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
                <line x1="38" y1="80" x2="82" y2="80" stroke="#334e68" strokeWidth="2" strokeLinecap="round" opacity="0.8" />

                {/* Roof Pantograph Gear */}
                <path d="M50 14 L55 22 L65 22 L70 14" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="48" y1="14" x2="72" y2="14" stroke="#e0f2fe" strokeWidth="2" strokeLinecap="round" />

                {/* Main Aerodynamic Locomotive Body */}
                <path
                  d="M60 18 C44 18 36 28 35 48 L32 82 C32 87 36 90 42 90 L78 90 C84 90 88 87 88 82 L85 48 C84 28 76 18 60 18 Z"
                  fill="url(#locoBodyGrad)"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />

                {/* Aerodynamic Fluted Side Panels */}
                <path d="M35 50 L33 82 L38 84 L40 50 Z" fill="#0f2342" opacity="0.7" />
                <path d="M85 50 L87 82 L82 84 L80 50 Z" fill="#0a192f" opacity="0.85" />

                {/* Dark Tinted Panoramic Windscreen */}
                <path
                  d="M38 40 C40 32 48 27 60 27 C72 27 80 32 82 40 L81 52 C75 54 68 55 60 55 C52 55 45 54 39 52 Z"
                  fill="url(#windshieldGrad)"
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                />
                
                {/* Windscreen Reflection Glare */}
                <path
                  d="M42 34 C48 30 54 29 60 29 L56 50 C50 50 45 49 42 47 Z"
                  fill="url(#glareGrad)"
                />

                {/* Saffron & Cyan Speed Stripes */}
                <path d="M33 60 L87 60 L86 66 L34 66 Z" fill="url(#saffronGrad)" />
                <path d="M33.5 67 L86.5 67 L86 71 L34 71 Z" fill="#00d2ff" />

                {/* Cattle Guard Deflector */}
                <path
                  d="M38 84 L82 84 L76 94 L44 94 Z"
                  fill="#0a192f"
                  stroke="#1b56a0"
                  strokeWidth="1.5"
                />
                <line x1="52" y1="85" x2="50" y2="93" stroke="#64748b" strokeWidth="1.5" />
                <line x1="60" y1="85" x2="60" y2="93" stroke="#64748b" strokeWidth="1.5" />
                <line x1="68" y1="85" x2="70" y2="93" stroke="#64748b" strokeWidth="1.5" />

                {/* Dual Projector Headlights with Optical Glow */}
                <circle cx="43" cy="77" r="5.5" fill="#fef08a" fillOpacity="0.35" />
                <circle cx="43" cy="77" r="4" fill="url(#headlightGrad)" stroke="#f59e0b" strokeWidth="1.2" />
                <circle cx="43" cy="77" r="2" fill="#ffffff" />
                <circle cx="41.5" cy="75.5" r="0.8" fill="#ffffff" />

                <circle cx="77" cy="77" r="5.5" fill="#fef08a" fillOpacity="0.35" />
                <circle cx="77" cy="77" r="4" fill="url(#headlightGrad)" stroke="#f59e0b" strokeWidth="1.2" />
                <circle cx="77" cy="77" r="2" fill="#ffffff" />
                <circle cx="75.5" cy="75.5" r="0.8" fill="#ffffff" />

                {/* Top Spotlight */}
                <circle cx="60" cy="24" r="3.5" fill="#38bdf8" fillOpacity="0.6" />
                <circle cx="60" cy="24" r="2.5" fill="#ffffff" stroke="#0284c7" strokeWidth="1" />
                <circle cx="60" cy="24" r="1.2" fill="#e0f2fe" />

                {/* Realistic Gradients */}
                <defs>
                  <linearGradient id="locoBodyGrad" x1="60" y1="18" x2="60" y2="90" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ffffff" />
                    <stop offset="0.35" stopColor="#e9f1fa" />
                    <stop offset="0.75" stopColor="#cbd5e1" />
                    <stop offset="1" stopColor="#94a3b8" />
                  </linearGradient>
                  <linearGradient id="windshieldGrad" x1="60" y1="27" x2="60" y2="55" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#0f2342" />
                    <stop offset="0.6" stopColor="#0a192f" />
                    <stop offset="1" stopColor="#050e1c" />
                  </linearGradient>
                  <linearGradient id="glareGrad" x1="42" y1="34" x2="56" y2="50" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ffffff" stopOpacity="0.45" />
                    <stop offset="1" stopColor="#38bdf8" stopOpacity="0.08" />
                  </linearGradient>
                  <linearGradient id="saffronGrad" x1="33" y1="60" x2="87" y2="66" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ff9933" />
                    <stop offset="0.5" stopColor="#fb923c" />
                    <stop offset="1" stopColor="#ea580c" />
                  </linearGradient>
                  <radialGradient id="headlightGrad" cx="50%" cy="50%" r="50%">
                    <stop stopColor="#ffffff" />
                    <stop offset="0.6" stopColor="#fef08a" />
                    <stop offset="1" stopColor="#f59e0b" />
                  </radialGradient>
                  <linearGradient id="trackSteelL" x1="15" y1="110" x2="52" y2="65" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#38bdf8" />
                    <stop offset="1" stopColor="#c7dbf1" />
                  </linearGradient>
                  <linearGradient id="trackSteelR" x1="105" y1="110" x2="68" y2="65" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#38bdf8" />
                    <stop offset="1" stopColor="#c7dbf1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Typography with uniform letter size */}
            <div className="flex flex-col justify-center">
              <div className="flex items-baseline gap-1.5 leading-none">
                <span className="font-display font-extrabold text-[22px] tracking-tight text-[#0a192f] group-hover:text-[#1b56a0] transition-colors">
                  Rail<span className="text-[#1b56a0]">Flow</span> <span className="text-[#1b56a0] font-extrabold">AI</span>
                </span>
              </div>
              <p className="text-[10px] font-semibold text-[#576f8f] tracking-[0.05em] mt-1 leading-none font-sans">
                Indian Railways Live ETA
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