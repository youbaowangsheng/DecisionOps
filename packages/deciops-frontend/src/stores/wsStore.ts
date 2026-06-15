import { create } from 'zustand';
import type { WSMessage } from '../services/types';
import wsService from '../services/websocket';
import * as jose from 'jose';

const JWT_SECRET = 'deciops-secret-key-2026';

interface WSState {
  connected: boolean;
  messages: WSMessage[];
  messageHandlers: Map<string, (msg: WSMessage) => void>;

  connect: () => void;
  disconnect: () => void;
  onMessage: (handler: (msg: WSMessage) => void) => void;
  clearMessages: () => void;
}

async function generateToken(): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  const token = await new jose.SignJWT({ user_id: 'test_user', tenant_id: 'tenant_001' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(secret);
  return token;
}

export const useWSStore = create<WSState>((set, get) => ({
  connected: false,
  messages: [],
  messageHandlers: new Map(),

  connect: () => {
    const wsUrl = (import.meta as any).env?.VITE_WS_URL || 'ws://localhost:8080/ws';

    // Get or generate JWT token
    let token = localStorage.getItem('ws_token');
    if (!token) {
      generateToken().then(t => {
        token = t;
        localStorage.setItem('ws_token', t);
        const urlWithToken = `${wsUrl}?token=${encodeURIComponent(t)}`;
        wsService.connect(urlWithToken);
      });
    } else {
      const urlWithToken = `${wsUrl}?token=${encodeURIComponent(token)}`;
      wsService.connect(urlWithToken);
    }

    wsService.on('open', () => set({ connected: true }));
    wsService.on('close', () => set({ connected: false }));

    wsService.on('new_decision', (data) => {
      const msg: WSMessage = { event: 'new_decision', data, timestamp: new Date().toISOString() };
      set((state) => ({ messages: [...state.messages, msg] }));
      get().messageHandlers.get('new_decision')?.(msg);
    });

    wsService.on('decision_audited', (data) => {
      const msg: WSMessage = { event: 'decision_audited', data, timestamp: new Date().toISOString() };
      set((state) => ({ messages: [...state.messages, msg] }));
      get().messageHandlers.get('decision_audited')?.(msg);
    });

    wsService.on('task_progress', (data) => {
      const msg: WSMessage = { event: 'task_progress', data, timestamp: new Date().toISOString() };
      set((state) => ({ messages: [...state.messages, msg] }));
      get().messageHandlers.get('task_progress')?.(msg);
    });

    set({ connected: true });
  },

  disconnect: () => {
    wsService.disconnect();
    set({ connected: false });
  },

  onMessage: (handler) => {
    const handlers = get().messageHandlers;
    const key = 'global';
    if (!handlers.has(key)) {
      handlers.set(key, handler);
    }
  },

  clearMessages: () => set({ messages: [] }),
}));