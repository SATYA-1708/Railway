import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config';

export function useTrainWebSocket(trainNumber, fallbackData = null) {
  const [data, setData] = useState(fallbackData);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [lastMessageTime, setLastMessageTime] = useState(null);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    if (!trainNumber) return;
    const cleanNum = String(trainNumber).replace('#', '').trim();

    // Determine WS URL
    const wsBase = API_BASE_URL.replace(/^http/, 'ws');
    const wsUrl = `${wsBase}/ws/train/${cleanNum}`;

    function connect() {
      try {
        setConnectionStatus('Connecting...');
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          setConnectionStatus('Live (4s)');
        };

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload && !payload.error) {
              setData(payload);
              setLastMessageTime(new Date().toLocaleTimeString('en-IN'));
            }
          } catch (e) {
            console.warn('[useTrainWebSocket] Parse error:', e);
          }
        };

        ws.onerror = () => {
          setIsConnected(false);
          setConnectionStatus('Reconnecting...');
        };

        ws.onclose = () => {
          setIsConnected(false);
          setConnectionStatus('Disconnected');
          // Reconnect after 3.5s
          reconnectTimeoutRef.current = setTimeout(connect, 3500);
        };
      } catch (err) {
        setIsConnected(false);
        setConnectionStatus('Offline');
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      }
    }

    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [trainNumber]);

  return {
    data: data || fallbackData,
    isConnected,
    connectionStatus,
    lastMessageTime
  };
}
