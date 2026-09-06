import React, { useState } from 'react';
import {
  Train, Shield, LogOut, Menu, X, Home, MapPin, Bell,
  User, Navigation, Ticket, Compass
} from 'lucide-react';

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
        <Home className="w-4 h-4" /> Home
      </button>
      <button onClick={() => { onNavigate('passenger-search'); setMobileOpen(false); }} className={btn(isActive(['passenger-search', 'passenger-mytrain']))}>
        <Navigation className="w-4 h-4" /> Track Train
      </button>
      <button onClick={() => { onNavigate('live-map'); setMobileOpen(false); }} className={btn(isActive(['live-map']))}>
        <Compass className="w-4 h-4" /> Live Map
      </button>
      <button onClick={() => { onNavigate('pnr-tracker'); setMobileOpen(false); }} className={btn(isActive(['pnr-tracker']))}>
        <Ticket className="w-4 h-4" /> PNR
      </button>
      <button onClick={() => { onNavigate('my-journeys'); setMobileOpen(false); }} className={btn(isActive(['my-journeys']))}>
        <MapPin className="w-4 h-4" /> My Journeys
      </button>
      <button onClick={() => { onNavigate('passenger-alerts'); setMobileOpen(false); }} className={`${btn(isActive(['passenger-alerts']))} relative`}>
        <Bell className="w-4 h-4" /> Alerts
        {alertCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">
            {alertCount > 9 ? '9+' : alertCount}
          </span>
        )}
      </button>
      <button onClick={() => { onNavigate('station-display'); setMobileOpen(false); }} className={btn(isActive(['station-display']))}>
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block mr-1"></span> TV Display
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
      <div className="gov-band px-4 sm:px-6 lg:px-8 py-1.5">
        <div className="relative gov-band-tricolor">
          <span></span><span></span><span></span>
        </div>
        <span className="text-[11px] font-medium text-[#51678a] tracking-wide">
          RailFlow Portal — Smart India Hackathon 2026 · Problem Statement 26028
        </span>
      </div>

      {/* Main bar */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <button
            onClick={() => onNavigate(isStaffLoggedIn && isStaffPortal ? 'staff-portal' : 'landing')}
            className="flex items-center gap-2.5 select-none shrink-0 group"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#1b56a0] to-[#2f6db3] flex items-center justify-center shadow-sm">
              <Train className="w-4 h-4 text-white" />
            </div>
            <div className="text-left leading-none">
              <span className="font-display font-bold text-[17px] text-[#14253d] tracking-tight block">
                Rail<span className="text-[#1b56a0]">Flow</span>
                <span className="text-[#93a6bf] font-light mx-1">|</span>
                <span className="text-[11px] text-[#51678a] font-semibold tracking-normal">AI</span>
              </span>
              <span className="block text-[9px] text-[#93a6bf] font-medium tracking-[0.14em] uppercase mt-1">
                Passenger Services Portal
              </span>
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