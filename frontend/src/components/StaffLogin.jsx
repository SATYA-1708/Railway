import React, { useState } from 'react';
import { Shield, Lock, User, Train, AlertCircle, ArrowRight, CheckCircle, Key } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import { API_BASE_URL } from '../config';

const DEMO_ACCOUNTS = [
  {
    label: 'Station Master (BZA)',
    id: 'sm_bza',
    division: 'Vijayawada Division (SCR)',
    role: 'station_master',
    station: 'BZA'
  },
  {
    label: 'Section Controller (SCR)',
    id: 'controller_scr',
    division: 'South Central Railway Mainline',
    role: 'section_controller',
    station: 'BZA'
  },
  {
    label: 'Divisional HQ (NDLS)',
    id: 'hq_delhi',
    division: 'Delhi Division (Northern Railway)',
    role: 'divisional_hq',
    station: 'NDLS'
  }
];

export default function StaffLogin({ onLoginSuccess, onCancel }) {
  const [operatorId, setOperatorId] = useState('sm_bza');
  const [division, setDivision] = useState('Vijayawada Division (SCR)');
  const [password, setPassword] = useState('railway123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  const selectDemoAccount = (acc) => {
    setOperatorId(acc.id);
    setDivision(acc.division);
    setPassword('railway123');
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
        headers: {
          'Content-Type': 'application/json'
        },
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
    <div className="max-w-md mx-auto px-4 py-12 fade-up">
      <Card className="relative overflow-hidden glow-soft">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500 to-transparent" />

        <div className="text-center mb-6 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center mx-auto text-brand-400 glow-soft">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white font-display">Railway Staff & Dispatch Login</h2>
          <p className="text-xs text-slate-400">JWT Token Security & Role-Based Access Control (RBAC)</p>
        </div>

        {/* 1-Click Demo Accounts */}
        <div className="mb-5 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><Key className="w-3.5 h-3.5 text-cyan-400" /> Quick Demo Credentials</span>
            <span className="text-[10px] text-emerald-400 font-mono">1-Click Auto Fill</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.id}
                type="button"
                onClick={() => selectDemoAccount(acc)}
                className={`p-2 rounded-xl text-left border transition-all text-xs ${
                  operatorId === acc.id
                    ? 'bg-cyan-500/15 border-cyan-500/60 text-cyan-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <p className="font-bold truncate text-[11px]">{acc.label}</p>
                <p className="text-[10px] font-mono text-slate-500 truncate">{acc.id}</p>
              </button>
            ))}
          </div>
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
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.12em]">Operator Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                required
                placeholder="e.g. sm_bza or controller_scr"
                className="w-full glass-input rounded-xl pl-9 pr-3 py-2.5 text-sm text-white font-mono outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.12em]">Division / Zone</label>
            <div className="relative">
              <Train className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                required
                className="w-full glass-input rounded-xl pl-9 pr-3 py-2.5 text-sm text-white outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.12em]">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter operator password"
                className="w-full glass-input rounded-xl pl-9 pr-3 py-2.5 text-sm text-white outline-none"
              />
            </div>
          </div>

          <div className="glass-subtle rounded-xl p-3 flex items-start gap-2 text-xs text-slate-400">
            <AlertCircle className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
            <span>
              <strong className="text-slate-300">Backend Verified:</strong> Authenticates via secure SHA-256 salted hash against backend <code className="text-cyan-300 font-mono">/api/auth/token</code> with 8-hour JWT token expiration.
            </span>
          </div>

          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? 'Authenticating with Backend...' : <><span>Authenticate & Enter Portal</span><ArrowRight className="w-4 h-4" /></>}
          </Button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full text-xs text-slate-400 hover:text-slate-200 transition-colors py-1 text-center"
          >
            &larr; Back to Passenger Portal
          </button>
        </form>
      </Card>
    </div>
  );
}
