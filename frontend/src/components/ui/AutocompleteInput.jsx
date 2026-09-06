import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
import ALL_STATIONS from '../../data/allStations.json';
import { REAL_TRAINS_DATABASE } from '../../data/realTrainsData';

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'http://localhost:8000';

export default function AutocompleteInput({
  value = '',
  onChange = () => {},
  onSelect = () => {},
  placeholder = 'Type station or code...',
  type = 'station', // 'station' | 'train'
  icon: Icon = MapPin,
  iconColor = 'text-emerald-400',
  className = '',
  inputClassName = '',
  autoFocus = false,
  required = false,
  light = false
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter local & remote suggestions
  useEffect(() => {
    const q = (value || '').trim();
    if (q.length < 1) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const qUpper = q.toUpperCase();

    if (type === 'station') {
      const localMatches = [];
      const seen = new Set();
      const stationMap = ALL_STATIONS && typeof ALL_STATIONS === 'object' ? ALL_STATIONS : {};

      // 1. Direct code prefix match
      for (const [code, name] of Object.entries(stationMap)) {
        if (code && code.toUpperCase().startsWith(qUpper)) {
          seen.add(code);
          localMatches.push({ code, name: String(name || code), label: `${name} (${code})` });
          if (localMatches.length >= 6) break;
        }
      }

      // 2. Name match
      if (localMatches.length < 6) {
        for (const [code, name] of Object.entries(stationMap)) {
          const sNameStr = String(name || '').toUpperCase();
          if (code && !seen.has(code) && sNameStr.includes(qUpper)) {
            seen.add(code);
            localMatches.push({ code, name: String(name || code), label: `${name} (${code})` });
            if (localMatches.length >= 6) break;
          }
        }
      }

      setSuggestions(localMatches);
      setIsOpen(localMatches.length > 0);

      // Async fetch from backend to get full live database coverage
      const timer = setTimeout(async () => {
        try {
          const resp = await fetch(`${API_BASE_URL}/api/stations/suggest?q=${encodeURIComponent(q)}&limit=8`);
          if (resp.ok) {
            const data = await resp.json();
            if (data?.results?.length > 0) {
              setSuggestions(data.results);
              setIsOpen(true);
            }
          }
        } catch {
          // Fallback to local matches
        }
      }, 150);

      return () => clearTimeout(timer);
    } else if (type === 'train') {
      const localMatches = [];
      const seen = new Set();
      const trainList = Array.isArray(REAL_TRAINS_DATABASE) ? REAL_TRAINS_DATABASE : [];

      for (const tr of trainList) {
        if (!tr) continue;
        const num = String(tr.number || '');
        const name = String(tr.name || '').toUpperCase();
        if (num.startsWith(qUpper) || name.includes(qUpper)) {
          seen.add(num);
          localMatches.push({
            number: num,
            name: tr.name || `Train #${num}`,
            from: tr.from || '',
            to: tr.to || '',
            label: `#${num} ${tr.name || ''}`
          });
          if (localMatches.length >= 6) break;
        }
      }

      setSuggestions(localMatches);
      setIsOpen(localMatches.length > 0);

      const timer = setTimeout(async () => {
        try {
          const resp = await fetch(`${API_BASE_URL}/api/trains/suggest?q=${encodeURIComponent(q)}&limit=8`);
          if (resp.ok) {
            const data = await resp.json();
            if (data?.results?.length > 0) {
              setSuggestions(data.results);
              setIsOpen(true);
            }
          }
        } catch {
          // Fallback
        }
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [value, type]);

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        e.preventDefault();
        handleItemClick(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleItemClick = (item) => {
    if (type === 'station') {
      const formatted = `${item.name} (${item.code})`;
      onChange(formatted);
      onSelect(item.code, item);
    } else {
      const formatted = item.number || item.name;
      onChange(formatted);
      onSelect(item.number, item);
    }
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        {Icon && <Icon className={`w-4 h-4 ${iconColor} absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10`} />}
        {light ? (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus={autoFocus}
            required={required}
            className={`portal-input pl-11 ${inputClassName}`}
            style={{ paddingLeft: '2.75rem' }}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus={autoFocus}
            required={required}
            className={`w-full glass-input rounded-xl pl-11 pr-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none ${inputClassName}`}
            style={{ paddingLeft: '2.75rem' }}
          />
        )}
      </div>

      {/* Dropdown Suggestions */}
      {isOpen && suggestions.length > 0 && (
        light ? (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#c9d6e5] rounded-xl z-50 overflow-hidden max-h-60 overflow-y-auto shadow-lg">
            <div className="px-3 py-1.5 bg-[#f7f9fc] border-b border-[#dbe2ec] text-[10px] font-bold text-[#6b7f99] uppercase tracking-[0.12em] flex items-center justify-between">
              <span>Suggestions</span>
              <span className="text-[#93a6bf] font-normal">Use ↑↓ & Enter</span>
            </div>
            <div className="divide-y divide-[#edf2f8]">
              {suggestions.map((item, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={item.code || item.number || idx}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleItemClick(item); }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full px-3.5 py-2.5 text-left text-xs transition-colors flex items-center justify-between group ${
                      isSelected ? 'bg-[#e9f1fa] text-[#14253d]' : 'text-[#33475f] hover:bg-[#f2f7fd] hover:text-[#14253d]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {type === 'station' ? (
                        <>
                          <span className="portal-tag">
                            {item.code}
                          </span>
                          <span className="font-semibold text-[#14253d]">{item.name}</span>
                        </>
                      ) : (
                        <>
                          <span className="portal-tag">
                            #{item.number}
                          </span>
                          <div>
                            <p className="font-semibold text-[#14253d]">{item.name}</p>
                            {item.from && item.to && (
                              <p className="text-[10px] text-[#6b7f99] font-mono">{item.from} → {item.to}</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#93a6bf] group-hover:text-[#1b56a0] shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="absolute left-0 right-0 top-full mt-1.5 glass-panel rounded-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
            <div className="px-3 py-1.5 bg-slate-950/80 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] flex items-center justify-between">
              <span>Suggestions</span>
              <span className="text-slate-600 font-normal">Use ↑↓ & Enter</span>
            </div>
            <div className="divide-y divide-slate-800/60">
              {suggestions.map((item, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={item.code || item.number || idx}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleItemClick(item); }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full px-3.5 py-2.5 text-left text-xs transition-colors flex items-center justify-between group ${
                      isSelected ? 'bg-brand-500/15 text-white' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {type === 'station' ? (
                        <>
                          <span className="font-mono font-bold text-emerald-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-[11px]">
                            {item.code}
                          </span>
                          <span className="font-semibold text-white">{item.name}</span>
                        </>
                      ) : (
                        <>
                          <span className="font-mono font-bold text-emerald-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-[11px]">
                            #{item.number}
                          </span>
                          <div>
                            <p className="font-semibold text-white">{item.name}</p>
                            {item.from && item.to && (
                              <p className="text-[10px] text-slate-500 font-mono">{item.from} → {item.to}</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )
      )}
    </div>
  );
}
