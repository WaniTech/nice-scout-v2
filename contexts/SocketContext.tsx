import { useAuth } from '@/contexts/AuthContext';
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';

export type SocketConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export type SocketMessage = {
  type: string;
  [key: string]: any;
};

export type SocketEventHandler = (payload: any) => void;

type SocketContextValue = {
  status: SocketConnectionState;
  isConnected: boolean;
  clientId: string | null;
  serverTime: string | null;
  sendMessage: (message: SocketMessage) => boolean;
  sendChatMessage: (conversationId: string, text: string, attachments?: any[], recipientId?: string) => boolean;
  sendTyping: (conversationId: string, isTyping: boolean) => void;
  subscribe: (room: string) => void;
  unsubscribe: (room: string) => void;
  on: (event: string, handler: SocketEventHandler) => () => void;
  reconnect: () => void;
};

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

function getWebSocketUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const host = window.location.hostname || 'localhost';
    const port = window.location.port === '8081' ? '5000' : '5000';
    return `ws://${host}:${port}/ws`;
  }
  // Android emulator or local mobile dev default
  return 'ws://localhost:5000/ws';
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [status, setStatus] = useState<SocketConnectionState>('disconnected');
  const [clientId, setClientId] = useState<string | null>(null);
  const [serverTime, setServerTime] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventListenersRef = useRef<Map<string, Set<SocketEventHandler>>>(new Map());
  const activeRoomsRef = useRef<Set<string>>(new Set());
  const maxReconnectAttempts = 10;

  const emitLocalEvent = useCallback((event: string, payload: any) => {
    const handlers = eventListenersRef.current.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (err) {
          console.warn(`[Socket] Error executing handler for event: ${event}`, err);
        }
      });
    }
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    setStatus(reconnectAttemptsRef.current > 0 ? 'reconnecting' : 'connecting');

    try {
      const url = getWebSocketUrl();
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        reconnectAttemptsRef.current = 0;

        // Perform authentication if user is signed in
        if (currentUser) {
          const authPayload: SocketMessage = {
            type: 'auth',
            userId: currentUser.id,
            user: {
              id: currentUser.id,
              name: currentUser.name,
              email: currentUser.email,
              position: currentUser.position,
              role: currentUser.role,
            },
          };
          ws.send(JSON.stringify(authPayload));
        }

        // Resubscribe to previously active rooms
        activeRoomsRef.current.forEach((room) => {
          ws.send(JSON.stringify({ type: 'subscribe', room }));
        });

        emitLocalEvent('connection_open', { timestamp: new Date().toISOString() });
      };

      ws.onmessage = (event) => {
        try {
          const data: SocketMessage = JSON.parse(event.data);
          const { type, ...payload } = data;

          if (type === 'connection_established') {
            setClientId(payload.clientId || null);
            setServerTime(payload.serverTime || null);
          } else if (type === 'auth_success') {
            setServerTime(payload.serverTime || null);
          }

          emitLocalEvent(type, payload);
          emitLocalEvent('*', data);
        } catch (parseErr) {
          console.warn('[Socket] Failed to parse incoming WebSocket frame:', parseErr);
        }
      };

      ws.onerror = (err) => {
        setStatus('error');
        emitLocalEvent('error', err);
      };

      ws.onclose = (event) => {
        socketRef.current = null;
        setStatus('disconnected');
        emitLocalEvent('connection_closed', { code: event.code, reason: event.reason });

        // Schedule auto-reconnect with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(1.5, reconnectAttemptsRef.current), 15000);
          reconnectAttemptsRef.current += 1;
          reconnectTimerRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch (err) {
      console.warn('[Socket] Connection attempt failed:', err);
      setStatus('error');
    }
  }, [currentUser, emitLocalEvent]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    reconnectAttemptsRef.current = 0;
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setStatus('disconnected');
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect, disconnect]);

  const sendMessage = useCallback((message: SocketMessage): boolean => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  const sendChatMessage = useCallback(
    (conversationId: string, text: string, attachments: any[] = [], recipientId?: string): boolean => {
      return sendMessage({
        type: 'chat_message',
        conversationId,
        text,
        attachments,
        recipientId,
        senderId: currentUser?.id,
      });
    },
    [currentUser?.id, sendMessage]
  );

  const sendTyping = useCallback(
    (conversationId: string, isTyping: boolean) => {
      sendMessage({
        type: 'typing',
        conversationId,
        isTyping,
      });
    },
    [sendMessage]
  );

  const subscribe = useCallback(
    (room: string) => {
      activeRoomsRef.current.add(room);
      sendMessage({ type: 'subscribe', room });
    },
    [sendMessage]
  );

  const unsubscribe = useCallback(
    (room: string) => {
      activeRoomsRef.current.delete(room);
      sendMessage({ type: 'unsubscribe', room });
    },
    [sendMessage]
  );

  const on = useCallback((event: string, handler: SocketEventHandler) => {
    if (!eventListenersRef.current.has(event)) {
      eventListenersRef.current.set(event, new Set());
    }
    eventListenersRef.current.get(event)!.add(handler);

    return () => {
      const handlers = eventListenersRef.current.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          eventListenersRef.current.delete(event);
        }
      }
    };
  }, []);

  // Connect on mount & handle user authentication state changes
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Handle app foreground / background transitions
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        if (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED) {
          reconnect();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [reconnect]);

  const isConnected = status === 'connected';

  return (
    <SocketContext.Provider
      value={{
        status,
        isConnected,
        clientId,
        serverTime,
        sendMessage,
        sendChatMessage,
        sendTyping,
        subscribe,
        unsubscribe,
        on,
        reconnect,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextValue {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
