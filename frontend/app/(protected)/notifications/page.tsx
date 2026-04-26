'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatTimeAgo } from '@/lib/utils';
import api from '@/lib/api';
import type { Notification } from '@/types';

const TYPE_ICONS: Record<string, string> = {
  TEAM_INVITE: '👥',
  INVITE_ACCEPTED: '✅',
  INVITE_DECLINED: '❌',
  MEMBER_DROPPED: '🚪',
  DISPUTE_RAISED: '⚠️',
  DISPUTE_ACCEPTED: '🤝',
  DISPUTE_REJECTED: '🚫',
  DELIVERABLE_SUBMITTED: '📎',
  DELIVERABLE_FEEDBACK: '💬',
  COMMENT: '💬',
  GENERAL: '🔔',
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await api.get('/notifications') as unknown as Notification[];
      setNotifications(Array.isArray(data) ? data : (data as any)?.content ?? []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    } catch {
      // silent
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => markRead(n.id)));
    toast.success('All marked as read');
  };

  const handleClick = (n: Notification) => {
    markRead(n.id);
    if (n.type === 'TEAM_INVITE' && n.referenceId) router.push('/notifications');
    else if (n.type === 'COMMENT' && n.referenceId) router.push(`/posts/${n.referenceId}`);
    else if (['DISPUTE_RAISED', 'DISPUTE_ACCEPTED'].includes(n.type) && n.referenceId)
      router.push(`/teams/${n.referenceId}/disputes`);
  };

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  if (loading) {
    return (
      <div className="max-w-2xl space-y-3">
        <Skeleton className="h-8 w-48" />
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {unread.length > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4 mr-1" /> Mark All Read
          </Button>
        )}
      </div>

      {notifications.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
          <Bell className="h-10 w-10 opacity-40" />
          <p className="text-lg font-medium">No notifications</p>
          <p className="text-sm">You&apos;re all caught up!</p>
        </div>
      )}

      {unread.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Unread ({unread.length})
          </h2>
          {unread.map((n) => (
            <Card
              key={n.id}
              className="cursor-pointer hover:shadow-md transition-shadow border-primary/20 bg-primary/5"
              onClick={() => handleClick(n)}
            >
              <CardContent className="p-3 flex items-start gap-3">
                <span className="text-xl shrink-0">{TYPE_ICONS[n.type] ?? '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatTimeAgo(n.createdAt)}</p>
                </div>
                <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {read.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Read</h2>
          {read.map((n) => (
            <Card
              key={n.id}
              className="cursor-pointer hover:shadow-sm transition-shadow opacity-70"
              onClick={() => handleClick(n)}
            >
              <CardContent className="p-3 flex items-start gap-3">
                <span className="text-xl shrink-0">{TYPE_ICONS[n.type] ?? '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatTimeAgo(n.createdAt)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
