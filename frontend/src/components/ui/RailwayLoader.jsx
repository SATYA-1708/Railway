import React from 'react';
import { Train, Radio, Sparkles, Activity } from 'lucide-react';

/**
 * RailwayLoader — High-fidelity Indian Railways & AI ETA Loading Animation
 * 
 * Supports:
 * - fullPage: Centers in view with backdrop blur and pulsing telemetry badge
 * - inline: Clean card/container loader
 * - dark/light themes
 */
export default function RailwayLoader({
  message = "Syncing Live Telemetry & AI ETA Predictions...",
  submessage = "Connecting to Indian Railways CRIS & NTES real-time network",
  fullPage = false,
  dark = false,
  size = "md", // 'sm' | 'md' | 'lg'
}) {
  const isDark = dark;

  const content = (
    <div className={`flex flex-col items-center justify-center text-center p-6 space-y-4 ${fullPage ? 'min-h-[360px]' : ''}`}>
      {/* Animated Train Track & Signal Ring */}
      <div className="relative flex items-center justify-center">
        {/* Glowing Radar Pulse Effect */}
        <div className={`absolute w-20 h-20 rounded-full animate-ping opacity-25 ${isDark ? 'bg-cyan-500' : 'bg-[#1b56a0]'}`} />
        <div className={`absolute w-28 h-28 rounded-full animate-pulse opacity-15 ${isDark ? 'bg-emerald-500' : 'bg-[#0d7a56]'}`} />

        {/* Outer Rotating Dashed Ring */}
        <div className={`w-16 h-16 rounded-full border-2 border-dashed animate-spin ${
          isDark ? 'border-cyan-400/40 border-t-cyan-300' : 'border-[#1b56a0]/30 border-t-[#1b56a0]'
        }`} style={{ animationDuration: '3s' }} />

        {/* Center Train Badge with Light Beam */}
        <div className={`absolute w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 ${
          isDark ? 'bg-gradient-to-br from-cyan-600 to-blue-800 text-white' : 'bg-gradient-to-br from-[#1b56a0] to-[#0b7da8] text-white'
        }`}>
          <Train className="w-6 h-6 animate-bounce" style={{ animationDuration: '1.8s' }} />
        </div>
      </div>

      {/* Animated Railway Track Line */}
      <div className="w-48 h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 relative">
        <div className="h-full w-24 rounded-full bg-gradient-to-r from-transparent via-[#0d7a56] to-[#1b56a0] animate-pulse"
             style={{
               animation: 'rail-slide 1.5s infinite linear',
             }} />
      </div>

      {/* Message & Status Subtitle */}
      <div className="space-y-1.5 max-w-sm">
        <h4 className={`text-sm md:text-base font-black tracking-wide flex items-center justify-center gap-2 ${
          isDark ? 'text-white' : 'text-[#14253d]'
        }`}>
          <span>{message}</span>
        </h4>
        {submessage && (
          <p className={`text-xs flex items-center justify-center gap-1.5 ${
            isDark ? 'text-slate-400' : 'text-[#6b7f99]'
          }`}>
            <Radio className={`w-3 h-3 animate-pulse ${isDark ? 'text-cyan-400' : 'text-[#0d7a56]'}`} />
            <span>{submessage}</span>
          </p>
        )}
      </div>

      <style>{`
        @keyframes rail-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );

  if (fullPage) {
    return (
      <div className={`w-full py-16 flex items-center justify-center ${isDark ? 'bg-transparent text-white' : 'bg-transparent'}`}>
        {content}
      </div>
    );
  }

  return content;
}

/**
 * SkeletonCard — Modern placeholder shimmer effect for list items and cards
 */
export function SkeletonCard({ count = 3, dark = false }) {
  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`p-4 rounded-xl border animate-pulse space-y-3 ${
            dark ? 'bg-white/[0.04] border-white/10' : 'bg-white border-[#d9e2ed]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg ${dark ? 'bg-white/10' : 'bg-slate-200'}`} />
              <div className="space-y-1.5">
                <div className={`h-3.5 w-24 rounded ${dark ? 'bg-white/15' : 'bg-slate-200'}`} />
                <div className={`h-2.5 w-36 rounded ${dark ? 'bg-white/10' : 'bg-slate-100'}`} />
              </div>
            </div>
            <div className={`h-6 w-16 rounded-full ${dark ? 'bg-white/10' : 'bg-slate-100'}`} />
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-dashed border-slate-200 dark:border-white/10">
            <div className={`h-8 rounded ${dark ? 'bg-white/5' : 'bg-slate-100'}`} />
            <div className={`h-8 rounded ${dark ? 'bg-white/5' : 'bg-slate-100'}`} />
            <div className={`h-8 rounded ${dark ? 'bg-white/5' : 'bg-slate-100'}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
