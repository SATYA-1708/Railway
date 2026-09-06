import React, { useState } from 'react';
import {
  Shield, ShieldCheck, Lock, User, Train, AlertCircle,
  ArrowRight, CheckCircle, Key, Eye, EyeOff,
} from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import { API_BASE_URL } from '../config';

const DEMO_ACCOUNTS = [
  { label: 'Station Master', station: 'BZA', zone: 'SCR', id: 'sm_bza', division: 'Vijayawada Division (SCR)', role: 'station_master' },
  { label: 'Section Controller', station: 'BZA', zone: 'SCR', id: 'controller_scr', division: 'South Central Railway Mainline', role: 'section_controller' },
  { label: 'Divisional HQ', station: 'NDLS', zone: 'NR', id: 'hq_delhi', division: 'Delhi Division (Northern Railway)', role: 'divisional_hq' },
];

const ROLE_META = {
  station_master: { dot: 'bg-cyan-400' },
  section_controller: { dot: 'bg-violet-400' },
  divisional_hq: { dot: 'bg-amber-400' },
};

const DEMO_PASSWORD = 'railway123';

export default function StaffLogin({ onLoginSuccess, onCancel }) {
  const [operatorId, setOperatorId] = useState('sm_bza');
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  const activeAccount = DEMO_ACCOUNTS.find(a => a.id === operatorId.trim().toLowerCase());

  const selectDemoAccount = (acc) => {
    setOperatorId(acc.id);
    setPassword(DEMO_PASSWORD);
    setErrorMessage('');
  };

  const handleUsernameChange = (value) => {
    setOperatorId(value);
    const match = DEMO_ACCOUNTS.find(a => a.id === value.trim().toLowerCase());
    if (match) setPassword(DEMO_PASSWORD);
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessInfo(null);

    try {
      const payload = {
        username: operatorId.trim().toLowerCase(),
        password: password
      };

      const targetUrl = `${API_BASE_URL}/api/auth/token`;

      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Server returned non-JSON response (HTTP ${res.status}). Verify VITE_API_BASE_URL in Vercel.`);
      }

      if (res.ok && data.access_token) {
        localStorage.setItem('railflow_token', data.access_token);
        if (data.user) {
          localStorage.setItem('railflow_user', JSON.stringify(data.user));
        }
        setSuccessInfo(`Authenticated as ${data.user?.fullName || operatorId}`);
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 300);
      } else {
        setErrorMessage(data.detail || 'Authentication failed: Invalid operator credentials');
      }
    } catch (err) {
      setErrorMessage(`Backend connection error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10 fade-up">
      <Card className="relative overflow-hidden glow-soft">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500 to-transparent" />

        {/* Header */}
        <div className="text-center mb-6 space-y-2.5">
          <div className="w-11 h-11 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center mx-auto text-brand-400 glow-soft">
            <Shield className="w-[22px] h-[22px]" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-400">RailFlow AI · Indian Railways</p>
            <h2 className="text-xl font-bold text-white font-display mt-1">Railway Staff &amp; Dispatch Login</h2>
            <p className="text-[13px] text-slate-400 mt-1">JWT-secured sign-in · Role-Based Access Control (RBAC)</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {['SHA-256 Salted', 'JWT · 8h Expiry', '3 Role Tiers'].map((chip) => (
              <span key={chip} className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">
                {chip}
              </span>
            ))}
          </div>
        </div>

        {/* 1-Click Demo Credentials */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em]">
              <Key className="w-3.5 h-3.5 text-cyan-400" /> Quick Demo Credentials
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">password: {DEMO_PASSWORD}</span>
          </div>

          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((acc) => {
              const active = operatorId.trim().toLowerCase() === acc.id;
              const meta = ROLE_META[acc.role];
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => selectDemoAccount(acc)}
                  className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl border text-left transition-all duration-200 ${
                    active
                      ? 'bg-cyan-500/15 border-cyan-500/60 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot} ${active ? '' : 'opacity-50'}`} />
                  <span className="text-xs font-semibold truncate flex-1">{acc.label}</span>
                  <span className="text-[11px] font-mono text-slate-500 truncate">{acc.zone} · {acc.station}</span>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-md ${active ? 'bg-cyan-500/20 text-cyan-200' : 'bg-slate-800 text-slate-300'}`}>
                    {acc.id}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-600">or sign in manually</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-700/60 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successInfo && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successInfo}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="operator-id" className="block text-[11px] font-semibold text-slate-400 uppercase tracking-[0.12em]">Operator Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <input
                id="operator-id"
                value={operatorId}
                onChange={(e) => handleUsernameChange(e.target.value)}
                required
                autoComplete="username"
                placeholder="e.g. sm_bza or controller_scr"
                className="w-full glass-input rounded-xl pl-11 pr-4 py-3 text-sm text-white font-mono outline-none"
              />
            </div>
          </div>

          {activeAccount && (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-[0.12em]">Division / Zone</label>
              <div className="relative glass-subtle rounded-xl pl-11 pr-4 py-3 text-sm text-slate-300 flex items-center overflow-hidden">
                <Train className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <span className="flex items-center gap-2 truncate">
                  {activeAccount.division}
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 shrink-0">{activeAccount.station}</span>
                </span>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="operator-password" className="block text-[11px] font-semibold text-slate-400 uppercase tracking-[0.12em]">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <input
                id="operator-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter operator password"
                className="w-full glass-input rounded-xl pl-11 pr-11 py-3 text-sm text-white font-mono outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? 'Authenticating with Backend...' : <><span>Authenticate &amp; Enter Portal</span><ArrowRight className="w-4 h-4" /></>}
          </Button>

          <div className="py-1 flex items-center justify-between gap-2 text-[11px] text-slate-500 border-t border-slate-800/80">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              SHA-256 salted hash · JWT 8h session
            </span>
            <code className="font-mono text-slate-600">/api/auth/token</code>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="w-full text-xs text-slate-400 hover:text-slate-200 transition-colors py-1 text-center"
          >
            &larr; Back to Passenger Portal
          </button>
        </form>
      </Card>

      <p className="text-center text-[11px] text-slate-600 mt-4">Authorised staff only · Session expires automatically after 8 hours</p>
    </div>
  );
}