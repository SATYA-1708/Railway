import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../config';

const CACHE_TTL_MS = 30000;

const isLive = (t) => t && (t.available !== false) && (t.isLiveNTES === true || t.dataSource === 'SIMULATED');

export function useTrackedTrains(trainNumbers = [], pollIntervalMs = 30000) {
  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFallback, setIsFallback] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const cacheRef = useRef({});

  const numbersToTrack = Array.isArray(trainNumbers)
    ? [...new Set(trainNumbers.map(n => String(n).replace('#', '').trim()).filter(Boolean))]
    : [];

  const fetchTrains = useCallback(async (isManualRefresh = false) => {
    if (numbersToTrack.length === 0) {
      setTrains([]);
      setLoading(false);
      return;
    }

    if (isManualRefresh) {
      setLoading(true);
    }

    try {
      const now = Date.now();
      const promises = numbersToTrack.map(async (num) => {
        const cached = cacheRef.current[num];
        if (!isManualRefresh && cached && (now - cached.timestamp < CACHE_TTL_MS)) {
          return cached.data;
        }

        try {
          const res = await fetch(`${API_BASE_URL}/api/live-ntes-train/${encodeURIComponent(num)}`, {
            headers: { 'Accept': 'application/json' }
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const liveData = await res.json();
          cacheRef.current[num] = { data: liveData, timestamp: now };
          return liveData;
        } catch (fetchErr) {
          if (isLive(cacheRef.current[num]?.data)) {
            return cacheRef.current[num].data;
          }
          return null;
        }
      });

      const results = await Promise.allSettled(promises);
      const successfulTrains = results
        .filter(r => r.status === 'fulfilled' && isLive(r.value))
        .map(r => r.value);

      if (successfulTrains.length > 0) {
        setTrains(successfulTrains);
        setIsFallback(false);
        setError(null);
        setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } else {
        throw new Error('No live train feed available');
      }
    } catch (err) {
      console.warn('[useTrackedTrains] Live train feed unavailable:', err);
      setIsFallback(true);
      setError(err.message || 'Live train feed unavailable');
      const cached = Object.values(cacheRef.current)
        .map(c => c.data)
        .filter(isLive);
      setTrains(cached.length > 0 ? cached : []);
      setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } finally {
      setLoading(false);
    }
  }, [numbersToTrack.join(',')]);

  useEffect(() => {
    fetchTrains();
    if (pollIntervalMs > 0 && numbersToTrack.length > 0) {
      const interval = setInterval(() => fetchTrains(false), pollIntervalMs);
      return () => clearInterval(interval);
    }
  }, [fetchTrains, pollIntervalMs, numbersToTrack.join(',')]);

  const refresh = useCallback(() => fetchTrains(true), [fetchTrains]);

  return {
    trains,
    loading,
    error,
    isFallback,
    lastUpdated,
    refresh,
    trackedCount: numbersToTrack.length
  };
}
