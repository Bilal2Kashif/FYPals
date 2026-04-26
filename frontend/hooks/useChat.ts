'use client';

import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api from '@/lib/api';
import type { ChatMessage } from '@/types';

export function useChat(teamId: number) {
  const [messages, setMessages]   = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const clientRef = useRef<Client | null>(null);

  // ── Load persisted history once on mount ────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const loadHistory = async () => {
      try {
        const data = await api.get(`/teams/${teamId}/chat/history?limit=50`) as any;
        if (cancelled) return;
        // Backend returns { success, data: [...] } — api.ts unwraps to data directly
        const history: ChatMessage[] = Array.isArray(data)
            ? data
            : (data?.data ?? data ?? []);
        setMessages(history);
      } catch {
        // History endpoint missing or empty — start with no messages
        setMessages([]);
      } finally {
        if (!cancelled) setHistoryLoaded(true);
      }
    };
    loadHistory();
    return () => { cancelled = true; };
  }, [teamId]);

  // ── Connect WebSocket after history is loaded ────────────────────────────
  useEffect(() => {
    const token =
        typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const client = new Client({
      webSocketFactory: () =>
          new SockJS(`${process.env.NEXT_PUBLIC_API_URL}/ws`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/team/${teamId}`, (msg) => {
          try {
            const incoming: ChatMessage = JSON.parse(msg.body);
            setMessages((prev) => {
              // Deduplicate: if the message was already added optimistically, skip
              const isDuplicate = prev.some(
                  (m) =>
                      m.senderId === incoming.senderId &&
                      m.content   === incoming.content &&
                      m.timestamp === incoming.timestamp
              );
              return isDuplicate ? prev : [...prev, incoming];
            });
          } catch {
            // Ignore malformed messages
          }
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError:  () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [teamId]);

  const sendMessage = (
      content: string,
      senderId: number,
      senderName: string
  ) => {
    clientRef.current?.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({
        teamId,
        senderId,
        senderName,
        content,
        messageType: 'TEXT',
      }),
    });
  };

  return { messages, sendMessage, connected, historyLoaded };
}