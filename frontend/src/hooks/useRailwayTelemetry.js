import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WS_URL) || 'ws://127.0.0.1:8000/ws/telemetry';

export function useRailwayTelemetry() {
  const [isConnected, setIsConnected] = useState(false);
  const [telemetryPulse, setTelemetryPulse] = useState(null);
  const [pulseCount, setPulseCount] = useState(0);
  const [lastPulseTime, setLastPulseTime] = useState(null);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const errorLoggedRef = useRef(false);

  const connect = useCallback(() => {
    try {
      if (socketRef.current) {
        socketRef.current.close();
      }

      errorLoggedRef.current = false;
      const ws = new WebSocket(WS_URL);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log('[WebSocket Telemetry] Connected to real-time train feed');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setTelemetryPulse(data);
          setPulseCount(prev => prev + 1);
          setLastPulseTime(new Date().toLocaleTimeString());
        } catch (err) {
          console.warn('[WebSocket Telemetry] Parse error:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Automatic exponential reconnect
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        if (!errorLoggedRef.current) {
          console.warn('[WebSocket Telemetry] Socket error:', err);
          errorLoggedRef.current = true;
        }
        ws.close();
      };
    } catch (e) {
      console.warn('[WebSocket Telemetry] Init error:', e);
      reconnectTimeoutRef.current = setTimeout(connect, 4000);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) socketRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connect]);

  return {
    isConnected,
    telemetryPulse,
    pulseCount,
    lastPulseTime,
    reconnect: connect
  };
}
