import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../config';

const CACHE_TTL_MS = 30000;

const isLive = (t) => t && (t.available !== false) && (t.isLiveNTES === true || t.dataSource === 'SIMULATED' || !!t.predictionSource || (t.number && t.name));

export function useStationTrains(stationCode = 'BZA', pollIntervalMs = 30000) {
  const [trains, setTrains] = useState([]);
  const [throughTrains, setThroughTrains] = useState([]);
  const [movementConflicts, setMovementConflicts] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFallback, setIsFallback] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const cacheRef = useRef({});

  const fetchStationTrains = useCallback(async (isManualRefresh = false) => {
    if (!stationCode) {
      setTrains([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const url = `${API_BASE_URL}/api/station-live/${encodeURIComponent(stationCode)}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      const stationTrains = (data.liveTrains || []).filter(isLive);
      setPlatforms(data.platforms || []);
      setThroughTrains(data.throughTrains || []);
      setMovementConflicts(data.movementConflicts || []);
      if (stationTrains.length > 0) {
        setTrains(stationTrains);
        setIsFallback(false);
        setError(null);
        setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } else {
        setTrains([]);
        setIsFallback(false);
        setError(null);
        setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err) {
      console.warn('[useStationTrains] Station feed unavailable:', err);
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
