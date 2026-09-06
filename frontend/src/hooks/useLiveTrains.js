import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../config';

const DEFAULT_TRAIN_NUMBERS = [
  '20805', // AP Express
  '12615', // GT Express
  '12727', // Godavari Express
  '12951', // Mumbai Rajdhani
  '12952', // NDLS MMCT Rajdhani
  '22436', // Vande Bharat Express
  '12002'  // Bhopal Shatabdi
];

const CACHE_TTL_MS = 30000; // 30 seconds

const isLive = (t) => t && (t.available !== false) && (t.isLiveNTES === true || t.dataSource === 'SIMULATED');

export function useLiveTrains(trainNumbers = DEFAULT_TRAIN_NUMBERS, pollIntervalMs = 30000) {
  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFallback, setIsFallback] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const cacheRef = useRef({});

  const fetchTrains = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setLoading(true);
    }

    try {
      const now = Date.now();
      const numbersToFetch = Array.isArray(trainNumbers) && trainNumbers.length > 0 
        ? trainNumbers 
        : DEFAULT_TRAIN_NUMBERS;

      const promises = numbersToFetch.map(async (num) => {
        const cleanNum = String(num).replace('#', '').trim();
        const cached = cacheRef.current[cleanNum];
        if (!isManualRefresh && cached && (now - cached.timestamp < CACHE_TTL_MS)) {
          return cached.data;
        }

        try {
          const res = await fetch(`${API_BASE_URL}/api/live-ntes-train/${cleanNum}`, {
            headers: { 'Accept': 'application/json' }
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const liveData = await res.json();
          cacheRef.current[cleanNum] = { data: liveData, timestamp: now };
          return liveData;
        } catch (fetchErr) {
          // If a genuine live observation was cached, keep showing it (honestly cached)
          if (isLive(cacheRef.current[cleanNum]?.data)) {
            return cacheRef.current[cleanNum].data;
          }
          // No live data at all -> never substitute fabricated statuses
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
      console.warn('[useLiveTrains] Live train feed unavailable:', err);
      setIsFallback(true);
      setError(err.message || 'Live train feed unavailable');
      // Show nothing fabricated: keep genuine cached observations only
      const cached = Object.values(cacheRef.current)
        .map(c => c.data)
        .filter(isLive);
      setTrains(cached.length > 0 ? cached : []);
      setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } finally {
      setLoading(false);
    }
  }, [trainNumbers]);

  useEffect(() => {
    fetchTrains();
    if (pollIntervalMs > 0) {
      const interval = setInterval(() => fetchTrains(false), pollIntervalMs);
      return () => clearInterval(interval);
    }
  }, [fetchTrains, pollIntervalMs]);

  return {
    trains,
    loading,
    error,
    isFallback,
    lastUpdated,
    refresh: () => fetchTrains(true)
  };
}
