'use client';

import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChat } from '@/hooks/useChat';
import { useAuthStore } from '@/store/authStore';
import { formatTimeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import type { ChatMessage } from '@/types';

interface ChatWindowProps {
  teamId: number;
}

export function ChatWindow({ teamId }: ChatWindowProps) {
  const { user } = useAuthStore();
  const { messages, sendMessage, connected } = useChat(teamId);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get<ChatMessage[]>(`/chat/${teamId}/history`) as any;
        setHistory(Array.isArray(data) ? data : []);
      } catch {
        setHistory([]);
      }
    };
    load();
  }, [teamId]);

  const allMessages = [...history, ...messages];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages.length]);

  const handleSend = () => {
    if (!input.trim() || !user) return;
    sendMessage(input.trim(), user.id, user.name);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-lg bg-background">
      {/* Status bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b">
        <span className={cn('h-2 w-2 rounded-full', connected ? 'bg-green-500' : 'bg-red-500')} />
        <span className="text-xs text-muted-foreground">{connected ? 'Connected' : 'Reconnecting...'}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {allMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p className="text-2xl mb-2">👋</p>
            <p className="text-sm">No messages yet. Say hello!</p>
          </div>
        )}
        {allMessages.map((msg, i) => {
          const isOwn = msg.senderId === user?.id;
          return (
            <div key={msg.id ?? i} className={cn('flex flex-col', isOwn ? 'items-end' : 'items-start')}>
              <div
                className={cn(
                  'max-w-xs lg:max-w-md px-3 py-2 rounded-lg text-sm',
                  isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                )}
              >
                {msg.content}
              </div>
              <span className="text-xs text-muted-foreground mt-0.5">
                {isOwn ? 'You' : msg.senderName}
                {msg.timestamp ? ` · ${formatTimeAgo(msg.timestamp)}` : ''}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3 flex gap-2">
        <textarea
          className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[40px] max-h-[120px]"
          placeholder="Type a message... (Enter to send)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <Button size="icon" onClick={handleSend} disabled={!input.trim() || !connected}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
