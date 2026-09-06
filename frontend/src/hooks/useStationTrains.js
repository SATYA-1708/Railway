import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../config';

const CACHE_TTL_MS = 30000;

const isLive = (t) => t && (t.available !== false) && (t.isLiveNTES === true || t.dataSource === 'SIMULATED' || !!t.predictionSource || (t.number && t.name));

const STATION_DATA_CACHE = new Map();

export function useStationTrains(stationCode = 'BZA', pollIntervalMs = 30000) {
  const cached = STATION_DATA_CACHE.get(stationCode);

  const [trains, setTrains] = useState(() => cached?.trains || []);
  const [throughTrains, setThroughTrains] = useState(() => cached?.throughTrains || []);
  const [movementConflicts, setMovementConflicts] = useState(() => cached?.movementConflicts || []);
  const [platforms, setPlatforms] = useState(() => cached?.platforms || []);
  const [loading, setLoading] = useState(() => !cached);
  const [error, setError] = useState(null);
  const [isFallback, setIsFallback] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(() => cached?.lastUpdated || null);

  const fetchStationTrains = useCallback(async (isManualRefresh = false) => {
    if (!stationCode) {
      setTrains([]);
      setLoading(false);
      return;
    }

    if (!STATION_DATA_CACHE.has(stationCode) || isManualRefresh) {
      setLoading(true);
    }

    try {
      const url = `${API_BASE_URL}/api/station-live/${encodeURIComponent(stationCode)}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      const stationTrains = (data.liveTrains || []).filter(isLive);
      const plats = data.platforms || [];
      const thru = data.throughTrains || [];
      const conf = data.movementConflicts || [];
      const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      STATION_DATA_CACHE.set(stationCode, {
        trains: stationTrains,
        platforms: plats,
        throughTrains: thru,
        movementConflicts: conf,
        lastUpdated: timestamp
      });

      setPlatforms(plats);
      setThroughTrains(thru);
      setMovementConflicts(conf);
      setTrains(stationTrains);
      setIsFallback(false);
      setError(null);
      setLastUpdated(timestamp);
    } catch (err) {
      console.warn('[useStationTrains] Station feed fallback:', err);
      setIsFallback(true);
      setError(err.message || 'Station feed unavailable');
      setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } finally {
      setLoading(false);
    }
  }, [stationCode]);

  useEffect(() => {
    fetchStationTrains();
    if (pollIntervalMs > 0) {
      const interval = setInterval(() => fetchStationTrains(false), pollIntervalMs);
      return () => clearInterval(interval);
    }
  }, [fetchStationTrains, pollIntervalMs]);

  const refresh = useCallback(() => fetchStationTrains(true), [fetchStationTrains]);

  return {
    trains,
    throughTrains,
    movementConflicts,
    platforms,
    loading,
    error,
    isFallback,
    lastUpdated,
    refresh
  };
}
