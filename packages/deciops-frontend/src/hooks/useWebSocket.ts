import { useEffect, useCallback } from 'react';
import { useWSStore } from '../stores/wsStore';
import type { WSMessage } from '../services/types';

export function useWebSocket() {
  const { connected, connect, disconnect, onMessage } = useWSStore();

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  const subscribe = useCallback(
    (event: string, handler: (data: unknown) => void) => {
      const wrappedHandler = (msg: WSMessage) => {
        handler(msg.data);
      };
      onMessage(wrappedHandler);
    },
    [onMessage]
  );

  return { connected, subscribe };
}

export default useWebSocket;