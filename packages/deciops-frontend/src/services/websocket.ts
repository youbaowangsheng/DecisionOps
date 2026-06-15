type MessageHandler = (data: unknown) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectInterval = 3000;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private url: string | null = null;

  connect(url: string): void {
    this.url = url;
    this.doConnect();
  }

  private doConnect(): void {
    if (!this.url) return;
    try {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = () => {
        console.log('[WS] Connected');
        this.startHeartbeat();
      };
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { event: eventName, data } = message;
          const handlers = this.handlers.get(eventName);
          if (handlers) {
            handlers.forEach((handler) => handler(data));
          }
        } catch (e) {
          console.error('[WS] Parse error:', e);
        }
      };
      this.ws.onclose = () => {
        console.log('[WS] Disconnected');
        this.stopHeartbeat();
        this.reconnect();
      };
      this.ws.onerror = (error) => {
        console.error('[WS] Error:', error);
      };
    } catch (e) {
      console.error('[WS] Connection error:', e);
      this.reconnect();
    }
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.handlers.clear();
  }

  on(event: string, handler: MessageHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  off(event: string, handler: MessageHandler): void {
    this.handlers.get(event)?.delete(handler);
  }

  emit(event: string, data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, data }));
    }
  }

  private heartbeat(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event: 'ping', data: {} }));
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => this.heartbeat(), 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private reconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      console.log('[WS] Reconnecting...');
      this.doConnect();
    }, this.reconnectInterval);
  }
}

export const wsService = new WebSocketService();
export default wsService;